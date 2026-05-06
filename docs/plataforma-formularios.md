# Plataforma de formularios dinamicos SIEEJ

**Estado:** implementada y en operacion.
**Ultima version SIEEJ:** 1.8.4. **Ultima version mariachi:** 0.40.2.
**Fecha:** 2026-05-06.

Este documento describe la **arquitectura final** de la plataforma de
formularios dinamicos. Reemplaza al wizard hardcodeado original. La
historia de la migracion vive en los CHANGELOGs de ambos repos.

## Vision general

SIEEJ es una plataforma multi-formulario donde:
- Personal del IIEG (`tetlamamakani`/`editora`) construye formularios
  desde `mariachi/admin` con un editor visual drag-n-drop o JSON crudo.
- Respondents (usuarios `externo` con membresia en el proyecto SIEEJ)
  los contestan en `iieg-app/sieej/`.

El formulario `sieej-levantamiento` (seed) replica el wizard original
y mantiene el PDF custom; cualquier formulario nuevo usa renderer y
PDF genericos.

## Modelo de datos (mariachi/api, schema `sieej`)

8 tablas + 3 enums Postgres + 8 catalogos preexistentes:

```
sieej.formulario
  slug UNIQUE, nombre, descripcion, definicion JSONB, estado, version,
  vigencia_inicio/fin, publico, creado_por_id, creado_en, actualizado_en

sieej.grupo
  nombre UNIQUE, descripcion, creado_en

sieej.usuario_grupo                    N:M usuario <-> grupo
sieej.formulario_grupo                 asignacion por grupo
sieej.formulario_usuario               asignacion individual

sieej.envio_formulario
  formulario_id, formulario_version, definicion_snapshot JSONB,
  usuario_id, estado (en_proceso/enviado/expirado), datos JSONB,
  paso_actual, iniciado_en/enviado_en/expirado_en, actualizado_en
  UNIQUE (formulario_id, usuario_id)

sieej.envio_archivo
  envio_id, field_path, bucket, object_key, url_publica,
  filename_original, mime, size_bytes, subido_en

sieej.envio_evento                     auditoria append-only
  envio_id, tipo (iniciado/guardado/enviado/expirado/reabierto),
  payload JSONB, actor_usuario_id, ocurrido_en
```

Enums: `sieej_formulario_estado`, `sieej_envio_estado`,
`sieej_evento_tipo`.

Catalogos (sin cambios): `catalogo_unidad_admin`, `categoria_datos`,
`herramientas_gestion`, `calidad_datos`, `periodicidad`,
`objetivo_uso`, `usuarios_datos`, `ejes_estrategicos`.

## Schema JSONB de la `definicion`

```jsonc
{
  "version": 1,
  "steps": [
    {
      "id": "general",
      "type": "form" | "repeater" | "summary",
      "title": "...",
      "icon": "<opcional>",
      "fields": [
        {
          "name": "razon_social",
          "label": "Razon social",
          "type": "text|textarea|number|email|tel|date|select|select_multiple|radio|checkbox|file|info",
          "required": true,
          "placeholder": "...",
          "tooltip": "...",
          "tab": "<id-tab>",                          // si el step es repeater con tabs
          "options": [{"value":"true","label":"Si"}], // o "catalog": "unidades_admin"
          "showWhen": {"field":"otro","equals":"true"},
          "validation": {"minLength":1,"maxLength":255,"pattern":"^...$","min":0,"max":100},
          "bucket": "sieej-uploads",                  // type=file
          "accept": [".pdf",".csv"],                  // type=file
          "maxSizeMB": 10                             // type=file (cap absoluto 100)
        }
      ],
      // Solo repeater:
      "minItems": 1,
      "maxItems": null,
      "itemLabel": "Item {{index}}",
      "tabs": [{"id":"datos","title":"Datos"}],

      // Solo summary:
      "exportPdf": true,
      "pdfTemplate": "sieej-levantamiento"            // opcional, custom PDF
    }
  ]
}
```

## Endpoints

### Respondent — `/formularios/...`
Gateado por `Depends(require_project_access('sieej'))`. Coexiste con
catalogos del wizard original.

| Verbo | Path | |
|---|---|---|
| GET | `/formularios/` | Lista visible para el user |
| GET | `/formularios/:slug` | Definicion + estado del envio |
| GET | `/formularios/:slug/schema` | Definicion + `validation_rules` planos |
| GET | `/formularios/:slug/envio` | Datos del envio (lazy init) |
| PUT | `/formularios/:slug/envio` | Guardar parcial (`enviar:false`) o enviar (`enviar:true`) |
| POST | `/formularios/:slug/envio/upload` | Multipart con `field_path` + `file` |
| GET | `/formularios/catalogos` | 8 catalogos SIEEJ (sin cambios) |

### Admin — `/sieej/...`
Gateado por `staff_dep` (`tetlamamakani` + `editora`).

| Verbo | Path | |
|---|---|---|
| GET | `/sieej/stats` | Metricas de envios |
| GET/POST | `/sieej/formularios` | Lista (filtros estado/slug) / Crea |
| GET/PUT/DELETE | `/sieej/formularios/:id` | CRUD completo |
| POST | `/sieej/formularios/:id/publicar` | estado=activo |
| POST | `/sieej/formularios/:id/cerrar` | estado=cerrado |
| PUT | `/sieej/formularios/:id/asignaciones` | Reemplazo de grupos+usuarios |
| GET | `/sieej/formularios/:id/envios` | Lista paginada con filtro estado |
| GET | `/sieej/formularios/:id/envios/:envio_id` | Detalle + archivos |
| GET/POST | `/sieej/grupos` | Lista / Crea |
| GET/PUT/DELETE | `/sieej/grupos/:id` | CRUD |
| GET/PUT | `/sieej/grupos/:id/usuarios` | Lista miembros / Reemplazo |

**Slugs reservados** (rechazados al crear formulario): `inicio-sesion`,
`exencion`, `cambiar-contrasena`, `error`, `regisño`, `catalogos`,
`schema`, `envio`.

## Frontend SIEEJ

### Routing
- `/` — `FormList` (lista de formularios visibles, modo grid o lista
  con toggle, persistencia `localStorage.sieej_form_list_view`).
- `/:slug` — `FormPage` (renderer dinamico).
- Reservadas: `/inicio-sesion`, `/exencion`, `/cambiar-contrasena`,
  `/error`. Declaradas literal antes de `/:slug` para precedencia.

### Estructura
```
src/
├── pages/{FormList,FormPage,Login,...}.jsx
├── forms/
│   ├── components/wizard/{StepIndicator,NavigateStep,Tabs}.jsx
│   ├── context/{FormsContext,SubmissionContext,WizardContext}.jsx + hooks
│   ├── renderer/
│   │   ├── {FormRenderer,StepRenderer,FormStep,RepeaterStep,SummaryStep,FieldRenderer}.jsx
│   │   ├── {conditional,catalogResolver}.js
│   │   └── pdf/{SummaryPdfButton,sieejLevantamiento,genericPdf}.jsx
│   └── ...
├── services/{authServices,formulariosServices}.js
├── components/{Input,Select,Radio,...,IncompleteBadge}.jsx (primitivas)
└── context/{Auth,Global,Catalog,User}Context.jsx + hooks
```

### Provider tree
```
<BrowserRouter basename={VITE_BASE_PATH}>
  <GlobalProvider>
    <AuthProvider>
      <CatalogProvider>
        <UserProvider>
          <Routes>
            <ProtectedRoute>           // valida cookie
              <MainLayout>             // header + body
                <FormsProvider>        // lista global de formularios
                  ...rutas
                  <FormPage>
                    <SubmissionProvider slug={slug}>
                      <WizardProvider totalSteps={steps.length}>
                        <FormRenderer />
                      </WizardProvider>
                    </SubmissionProvider>
                  </FormPage>
                </FormsProvider>
              </MainLayout>
            </ProtectedRoute>
          </Routes>
```

### Auth
Cookie HttpOnly + `X-CSRF-Token` en mutaciones. `onFetch` del
`AuthContext` lo aplica automaticamente. Variable critica:
`VITE_BACKEND_API_HOST=/api/administrador` (sin sufijo).

### Header
- Logo SIEEJ → click navega a `/`.
- Avatar con badge naranja `IncompleteBadge` (corner=bottom-right) que
  muestra el count de formularios `en_proceso` del usuario.
- Dropdown del avatar: "Mis formularios" (atenuado si ya estas en `/`)
  + "Cerrar sesion".

### PDF de resumen
Si el step `summary` tiene:
- `pdfTemplate: 'sieej-levantamiento'` → PDF custom
  (`forms/renderer/pdf/sieejLevantamiento.jsx`) que reusa el `PdfForm`
  original con un adapter que mapea `general/enlaces/bases_datos`
  ↔ `informacion_general/_enlaces/_basesdatos`.
- `exportPdf: true` (sin `pdfTemplate`) → PDF generico
  (`forms/renderer/pdf/genericPdf.jsx`) que itera la definicion.

## Constructor visual (mariachi/admin)

`features/sieej-formularios/`:
- `pages/FormulariosListPage.jsx` — tabla con publicar/cerrar/eliminar.
- `pages/FormularioEditorPage.jsx` — tabs Definicion / Configuracion /
  Asignaciones / Envios.
- `pages/GruposPage.jsx` — CRUD de grupos + miembros.
- `components/DefinicionEditor.jsx` — toggle Visual / JSON.
- `components/visualEditor/` — drag-n-drop con `@dnd-kit`:
  `StepsList` → `FieldsList` → `StepDrawer`/`FieldDrawer`.
- `components/{ConfiguracionEditor,AsignacionesEditor,EnviosTable}.jsx`.

Sidebar: grupo SIEEJ con items "Formularios" y "Grupos" (habilitado
desde mariachi 0.40.2).

## Decisiones cerradas

- **Editor JSON como source of truth**: el visual transforma JSON, no
  al reves. Toggle bidireccional valida el JSON al cambiar de view.
- **Validacion compartida**: backend es la fuente. Frontend recibe
  `validation_rules` planos por `GET /formularios/:slug/schema`.
- **Upload por campo**: `field.bucket` resuelve a un `MediaBucket`
  preexistente. Cap absoluto 100 MB (alineado con
  `client_max_body_size` del gateway-hub).
- **PDF custom solo cuando hay flag**: por default los formularios
  usan el generico. `sieej-levantamiento` es la unica excepcion
  documentada.
- **Slug reservado list**: hardcoded en
  `mariachi/api/app/services/sieej/formularios_admin_service.py`.
  Si se agrega ruta literal nueva al frontend, actualizar la lista.

## Referencias

- Modelos: `mariachi/api/app/models/sieej/`
- Validators: `mariachi/api/app/services/sieej/{definicion,datos}_validator.py`
- Migration inicial: `e7f8a9b0c1d2_init_sieej_schema.py` (catalogos +
  wizard, antes del refactor).
- Migration plataforma: `a4b5c6d7e8f9_add_sieej_formularios_dinamicos.py`
- Migration seed: `b5c6d7e8f9aa_seed_sieej_levantamiento.py`
- Migration drop wizard: `c6d7e8f9ab01_drop_wizard_sieej_tables.py`
- Migration pdfTemplate: `d7e8f9a0b1c2_sieej_levantamiento_pdf_template.py`
- Tests: `mariachi/api/tests/test_sieej_*.py` (66 tests, suite total 300)
- CHANGELOGs: `sieej/docs/CHANGELOG.md` y `mariachi/docs/CHANGELOG.md`
  para la historia version-por-version.
