# Plataforma de formularios dinamicos SIEEJ

**Estado:** implementada y en operacion.
**Ultima version SIEEJ:** 1.9.0. **Ultima version mariachi:** 0.40.2.
**Fecha:** 2026-05-07.

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

8 tablas + 3 enums Postgres + catalogos globales genericos:

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

Catalogos: par generico `sieej.catalogo` (`clave` UNIQUE + `label`) +
`sieej.catalogo_opcion` (`value` UNIQUE por catalogo). CRUD completo
desde el admin (crear/renombrar/eliminar catalogos y opciones;
requiere la migracion `d4e5f6a7b8c9` de mariachi). Las claves historicas
(`unidades_admin`, `categoria_datos`, `herramientas_gestion`,
`calidad_datos`, `periodicidad`, `objetivo_uso`, `usuarios_datos`,
`ejes_estrategicos`) se conservaron al migrar las 8 tablas fijas.

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
      "tooltip": "<opcional, icono de ayuda junto al titulo del paso>",
      "fields": [
        {
          "name": "razon_social",
          "label": "Razon social",
          "type": "text|textarea|number|date|date_range|select|select_multiple|radio|checkbox|file|info",
          "required": true,
          "placeholder": "...",
          "tooltip": "...",
          "tab": "<id-tab>",                          // si el step es repeater con tabs
          "options": [{"value":"true","label":"Si"}], // o "catalog": "unidades_admin"
          "showWhen": {"field":"otro","equals":"true"},   // equals string o lista (OR): ["a","b"]
          "validation": {"minLength":1,"maxLength":255,"pattern":"^...$","patternMessage":"...","min":0,"max":100},
          "bucket": "sieej",                          // type=file
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
| GET | `/formularios/mis-envios` | Listado paginado del histórico del usuario (filtros `estado`, `q`, `page`, `page_size`, `sort`). Item ligero sin `datos` ni `definicion_snapshot`. |
| GET | `/formularios/mis-envios/:id` | Detalle del envio: `definicion_snapshot` + `datos` + `archivos[]` + `eventos[]`. 404 si no existe; 403 si pertenece a otro usuario. No expone `actor_usuario_id`. |
| GET | `/formularios/catalogos` | Bundle dinamico `{clave: [{id, value}]}` con todos los catalogos |

#### Upload de archivos por campo (`POST /formularios/:slug/envio/upload`)

Los campos `type=file` (p. ej. el diccionario de datos en CSV/XLSX/PDF) no
viajan dentro del JSON del envio: se suben **al instante de seleccionarlos**,
de forma independiente al `PUT .../envio`.

Flujo end-to-end:

1. **UI** — `components/Dragger.jsx` (click o drag&drop). Valida tamano
   contra `field.maxSizeMB`; el filtro de extension lo hace `accept` del
   schema (`field.accept`).
2. **Frontend service** — `services/formulariosServices.js#uploadArchivo`
   arma un `FormData` con `field_path` (`paso.campo` o `paso[idx].campo` en
   repeaters) + `file`, y hace `POST` con cookie HttpOnly + `X-CSRF-Token`.
3. **Backend** — `EnviosService.upload_archivo` (mariachi/api):
   - Resuelve el bucket con `_bucket_para_field` leyendo `field.bucket` del
     `definicion_snapshot` del envio (no del schema vivo).
   - Sube a **Acervo** (SeaweedFS S3-compatible) via `AcervoClient.upload_file`
     con `object_key = envio{envio_id}/{uuid}.{ext}`.
   - Persiste un registro en `sieej.envio_archivo` (bucket, object_key,
     url_publica, filename_original, mime, size_bytes).
   - Inserta el valor del campo en `envio.datos[field_path]` server-side.
4. **Respuesta** (`EnvioUploadResponse`):
   `{ field_path, url_publica, filename_original, mime, size_bytes }`. El
   frontend guarda este objeto como valor del campo (lo consume `SummaryStep`
   y el PDF); el `PUT .../envio` posterior lo reenvia tal cual.

**Donde queda el archivo:** en Acervo, en el bucket que declare
`field.bucket` (actualmente `sieej`), bajo la ruta
`envio{id}/{uuid}.{ext}`. La URL publica y los metadatos quedan en
`sieej.envio_archivo` y referenciados en `sieej.envio_formulario.datos`.

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
- `/mis-envios` — `MisEnvios` (histórico paginado con filtros).
- `/mis-envios/:id` — `EnvioDetalle` (vista de revisión read-only con
  `definicion_snapshot`, timeline y adjuntos).
- Reservadas: `/inicio-sesion`, `/exencion`, `/cambiar-contrasena`,
  `/error`. Declaradas literal antes de `/:slug` para precedencia (igual
  que `/mis-envios` y `/mis-envios/:id`).

### Estructura
```
src/
├── pages/{FormList,FormPage,MisEnvios,EnvioDetalle,Login,...}.jsx
├── forms/
│   ├── components/
│   │   ├── wizard/{StepIndicator,NavigateStep,Tabs}.jsx
│   │   ├── EventTimeline.jsx                     (1.11.0)
│   │   └── EnvioAdjuntos.jsx                     (1.11.0)
│   ├── context/
│   │   ├── {FormsContext,SubmissionContext,WizardContext}.jsx + hooks
│   │   └── CatalogosContext.jsx + useCatalogos.js   (movido en 1.9.0)
│   ├── renderer/
│   │   ├── {FormRenderer,StepRenderer,FormStep,RepeaterStep,SummaryStep,FieldRenderer}.jsx
│   │   ├── {conditional,catalogResolver}.js
│   │   └── pdf/
│   │       ├── SummaryPdfButton.jsx              (dynamic-import del template)
│   │       ├── genericPdf.jsx                    (cualquier formulario)
│   │       └── templates/sieej-levantamiento/    (excepcion documentada)
│   │           ├── index.jsx                     (downloadSieejLevantamientoPdf)
│   │           └── PdfForm.jsx                   (245 LOC custom)
│   └── ...
├── services/{authServices,formulariosServices}.js   (incluye listMisEnvios y getMiEnvioDetalle desde 1.11.0)
├── components/{Input,Select,Radio,DatePicker,Checkbox,Dragger,...,IncompleteBadge}.jsx
├── helpers/{normalizeUser,DynamicDiv,FieldLayout,ErrorsRequired,...}.{js,jsx}
└── context/{Auth,Global}Context.jsx + hooks       (provider tree raiz)
```

### Provider tree (1.9.0)
```
<BrowserRouter basename={VITE_BASE_PATH}>
  <GlobalProvider>
    <AuthProvider>                      // cookie+CSRF, normalizeUser
      <Routes>
        <ProtectedRoute>                // valida cookie
          <MainLayout>                  // header + body
            <CatalogosProvider>         // GET /formularios/catalogos
              <FormsProvider>           // lista global de formularios
                ...rutas
                <FormPage>
                  <SubmissionProvider slug={slug}>
                    <WizardProvider totalSteps={steps.length}>
                      <FormRenderer />
                    </WizardProvider>
                  </SubmissionProvider>
                </FormPage>
              </FormsProvider>
            </CatalogosProvider>
          </MainLayout>
        </ProtectedRoute>
      </Routes>
```

`CatalogosProvider` y `FormsProvider` se montan **dentro** de
`MainLayout` (es decir, solo cuando `ProtectedRoute` resuelve sesion)
para evitar fetches y providers innecesarios en `/inicio-sesion` o
`/exencion`. El antiguo `UserContext` se elimino: el header consume
`useAuth().user.{nombre,apellido,email}` directo.

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
  (`forms/renderer/pdf/templates/sieej-levantamiento/index.jsx`) que
  reusa `PdfForm.jsx` (245 LOC, custom para el formulario seed) con un
  adapter que mapea `general/enlaces/bases_datos` ↔
  `informacion_general/_enlaces/_basesdatos`.
- `exportPdf: true` (sin `pdfTemplate`) → PDF generico
  (`forms/renderer/pdf/genericPdf.jsx`) que itera la definicion.

Desde 1.9.0 ambos modulos se cargan por **dynamic import** dentro de
`SummaryPdfButton.handleClick`. El chunk `vendor-pdf` (~1.4 MB
gzip 491 KB) **no esta en el initial bundle del FormPage**; solo se
descarga cuando el usuario hace click en "Descargar PDF".

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

## Calendario propio y campo date_range (1.31.0)

Los campos `type=date` y `type=date_range` usan un calendario hecho en
React (`components/Calendar.jsx`) en lugar de `<input type=date>` nativo.
Motivacion: el input nativo no se puede estilizar de forma cross-browser
y no armoniza con el design system de SIEEJ.

- **`Calendar.jsx`**: grilla de dias con navegacion por chevrons SVG
  (`stroke=#5C2472` fijo), selector rapido de mes/año mediante chips,
  y vista de años con scroll automatico al año actual. Soporta `min`
  y `max` (los valores fuera de rango aparecen deshabilitados). El dia
  actual se marca con borde morado; el dia seleccionado, con fondo solido.

- **Comportamiento responsive**: en desktop, el calendario se abre como
  dropdown absoluto bajo el input. En mobile (<768px), se despliega como
  **bottom-sheet** de ancho completo con overlay semi-transparente y
  bloqueo de scroll del body.

- **`DateRangePicker.jsx`**: renderiza dos `DatePicker` en grilla
  responsive. Los sub-inputs no tienen label: usan `placeholder` fijos
  `Fecha inicial` / `Fecha final`, no personalizables desde la
  definicion. La validacion cruzada exige ambos extremos cuando
  `required: true`.

- **CSS reset workaround**: el reset global `button { padding: 0.6em 1.2em }`
  en `index.css` aplasta los iconos SVG dentro de botones, por lo que
  todos los botones del calendario usan `!p-0` para anular ese reset y
  preservar el area clickable de los iconos.

- **Apertura dentro del viewport** (1.32.0): en desktop el panel mide el
  espacio real bajo el input (`useLayoutEffect` + `getBoundingClientRect`
  del wrapper posicionado) y se ancla con `bottom-full` cuando no cabe
  abajo y hay mas espacio arriba. Re-mide en `scroll`, `resize` y al
  cambiar de vista dias/meses/años, porque la altura del panel cambia.

### Fechas abiertas (1.32.0)

Cuando la definicion marca un extremo del `date_range` como abierto
(`openStart` / `openEnd`), ese extremo acepta una opcion de catalogo en
vez de una fecha: `10/02/1992 – NO DETERMINADO`. Las opciones salen de
`openCatalog` o, si no se especifica, del catalogo del sistema
`estatus_fecha` (`catalogResolver.js::openRangeOptions`).

- **El selector vive dentro del calendario** (`CalendarOptions.jsx`), no
  como control aparte: un trigger de una linea al pie del panel que
  despliega la lista **hacia arriba**, superpuesta sobre la grilla de
  dias. Se abre hacia arriba a proposito — el panel ya puede estar cerca
  del borde inferior, y un menu hacia abajo reintroduciria el problema de
  scroll que resuelve la apertura dentro del viewport.

- **Un solo control**: elegir una opcion limpia la fecha de ese extremo y
  cierra el calendario; el input muestra el texto de la opcion en morado.
  Elegir un dia limpia la opcion. Cuando hay opcion activa, el menu
  ofrece "Usar una fecha del calendario", que la quita y **deja el panel
  abierto** para elegir el dia enseguida.

- **Persistencia**: el valor se guarda en `${name}.startOption` /
  `${name}.endOption` (hermanas de `.start` / `.end`), que es el contrato
  que valida mariachi-api. El extremo abierto registra un
  `<input type="hidden">` para que react-hook-form lo incluya en el envio
  sin depender de un componente visible; no afecta el grid porque los
  hidden traen `display:none` del navegador.

- **Obligatoriedad**: la resuelve el `validate` del `DateRangePicker`
  (que da por satisfecho el extremo si hay opcion), no el `required` de
  react-hook-form, que exigiria la fecha aunque haya estatus elegido.

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
