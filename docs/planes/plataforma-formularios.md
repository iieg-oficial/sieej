# Plan: Plataforma de formularios dinamicos (SIEEJ + mariachi)

**Estado:** Diseno acordado, en fase 0 (pre-implementacion).
**Fecha del plan:** 2026-04-25
**Ultima revision:** 2026-05-06 (audit contra estado real de los repos).
**Autor del diseno:** sesion de discusion con Edgar.

Este documento describe el rediseno completo para convertir SIEEJ de un
wizard hardcodeado a una **plataforma de formularios** donde personal del
IIEG construye formularios desde mariachi (admin) y respondents los
contestan en SIEEJ. Incluye decisiones, modelo de datos, endpoints,
estructura del frontend, plan de migracion del wizard actual y orden de
ejecucion por fases.

Lectura recomendada antes de implementar:
`docs/context.md`, `docs/arquitectura.md`, `docs/frontend.md`.

## Estado de implementacion (2026-05-06)

- **Fase 1 (backend respondent):** ✅ Completa.
  - Migration `a4b5c6d7e8f9_add_sieej_formularios_dinamicos.py`
    aplicada sobre Postgres prod local. 8 tablas + 3 enums creados.
  - Modelos, schemas, services, validators, endpoints respondent
    bajo `/formularios/...` (coexiste con el wizard viejo).
  - 47 tests OK; mariachi-api corriendo en prod local.
- **Fase 2 (backend admin):** ✅ Completa.
  - `app/api/routes/sieej_admin/` convertido a paquete con
    subrouters: `stats` (existente) + `formularios` + `grupos`.
  - Services: `formularios_admin_service.py` (CRUD, publicar,
    cerrar, asignaciones, listar envios, bump version cuando hay
    envios) + `grupos_service.py` (CRUD + miembros).
  - 17 endpoints nuevos bajo `/sieej/...`. 19 tests admin OK.
  - **Nota de namespace**: el plan original decia `/admin/sieej/...`
    pero el prefix real es `/sieej/...` (heredado del
    `sieej_admin.router` existente). Plan actualizado en seccion 5.2.
- **Fase 3 (frontend SIEEJ):** Sin iniciar. Sigue todo el wizard
  hardcodeado. `GlobalContext` aun contiene el array `STEPS`,
  `HomeContext` sigue siendo el unico submission state, no existe
  `forms/`, ni `WizardContext`, ni `SubmissionContext`, ni
  `FormsContext`, ni `formulariosServices.js`, ni rutas `/`/`:slug`.
- **Fase 4 (constructor mariachi/admin):** Esqueleto en
  `mariachi/admin/src/features/sieej-formularios/` con
  `FormulariosPage.jsx` apuntando a `/sieej/formularios` (alineado
  ya con el backend admin de Fase 2). Falta toda la UI del editor
  (StepsList, FieldEditor, AsignacionesEditor, EnviosTable, etc.).
- **Fase 5 (migracion del wizard):** Sin iniciar.
- **Gateway-hub:** Sin cambios necesarios.
- **Documentacion vecina:** `docs/context.md`, `docs/arquitectura.md`
  y `docs/frontend.md` siguen describiendo el estado actual
  (wizard). Habra que actualizarlas a partir de la Fase 3.

## Decisiones cerradas en este audit (2026-05-06)

Items que la version original del plan dejo abiertos y que aqui se
cierran (detalles en cada seccion correspondiente):

- **Auditoria de envios**: SI se incluye tabla `envio_evento`. Costo
  marginal en la migration inicial; backfill posterior es caro.
  Detalles en seccion 3.1.
- **Estado de envio "abandonado"**: el enum se amplia a
  `en_proceso | enviado | expirado`. Un envio pasa a `expirado`
  cuando el formulario asociado tiene `vigencia_fin < now()` y el
  envio sigue en `en_proceso`. Detalles en seccion 3.1.
- **PDF del summary**: opcion (a) — generar PDF en el frontend
  desde `definicion_snapshot` + `datos`, sin html2canvas y sin
  backend. Reutiliza la libreria que ya existe (`@react-pdf/renderer`
  esta en `package.json` del frontend SIEEJ). Detalles en seccion 15.
- **Validacion compartida frontend/backend**: opcion (b) — el
  backend expone `GET /formularios/:slug/schema` con un set de reglas
  declarativas planas (no JSON Schema), derivadas del mismo
  `definicion_validator` que valida en backend. El frontend solo lo
  usa para mensajes UX; la verdad sigue en el backend. Detalles en
  seccion 16.
- **Preview en el constructor (mariachi/admin)**: opcion (c) — un
  componente preview *aparte* del FieldRenderer de SIEEJ, escrito en
  AntD, que cubre los mismos campos y usa el mismo motor de
  `showWhen`/validacion. No se intenta paridad pixel-perfect.
  Detalles en seccion 17.
- **Politica de archivos en Acervo**: limites por campo
  (`maxSizeMB` por field, default 10 MB), bucket por campo via
  `field.bucket`, creacion de buckets manual via `MediaBucket` (no
  on-the-fly). Detalles en seccion 18.
- **Estrategia de tests**: minimo aceptable definido en seccion 14
  (renombrada a "Estrategia de tests" — ver mas abajo).

---

## 1. Resumen ejecutivo

### Objetivo de negocio

SIEEJ debe convertirse en la **pagina oficial de formularios del
instituto**. Personal del IIEG construye formularios desde el admin de
mariachi (sin deploy), los asigna a usuarios o grupos, y los respondents
los contestan en SIEEJ. Inicialmente sustituye al levantamiento actual y
crece para hospedar todos los formularios del instituto.

### Cambio de paradigma

| Hoy | Manana |
|---|---|
| Un solo wizard hardcodeado en React + endpoints fijos | N formularios definidos en BD (JSONB) |
| Backend con tablas fisicas por entidad (`general`, `enlaces`, `bases_datos`) | Una sola tabla `envio_formulario.datos JSONB` |
| Acceso global a `/formularios/*` para todo usuario con `require_project_access('sieej')` | Acceso por formulario via grupos + asignacion individual |
| Sin estado por usuario explicito | `envio_formulario` con estado `en_proceso` / `enviado` |
| Constructor: ninguno (pasa por commit + deploy) | Constructor visual en `mariachi/admin` |

### Decisiones cerradas (confirmadas con Edgar)

1. **Constructor visual en mariachi/admin**, no en SIEEJ. Reusa Ant
   Design + auth + roles + `@dnd-kit` ya instalados.
2. **JSONB en `envio_formulario.datos`** como almacenamiento unico. La
   unica via realista para formularios definidos en runtime.
3. **Los formularios soportan campos planos + repeaters + uploads**
   desde el dia 1 (sin esto el wizard SIEEJ actual no se puede
   representar y queda como excepcion).
4. **Migrar el wizard SIEEJ actual** a definicion JSON. Las tablas
   `general`, `enlaces`, `bases_datos`, `bd_ejes_estrategicos` se
   eliminan al final de la fase 4.
5. **Solo formularios privados (login)** en v1. Publicos quedan para v2
   (requieren captcha, throttling per-IP, repensar `usuario_id` opcional
   en `envio_formulario`, etc.).
6. **Grupos N:M**: un usuario puede pertenecer a varios grupos. Tabla
   `usuario_grupo`, no columna unica en `Usuario`.
7. **Routing del frontend**: lista en `/`, formulario en `/:slug`.
8. **Reorganizacion del frontend**: `components/ui` (primitivas) +
   `components/wizard` (StepIndicator/NavigateStep/Tabs) +
   `forms/renderer/` (genericos) + `forms/sieej-levantamiento/` queda
   solo como referencia mientras se migra, despues se elimina.
9. **Catalogos por formulario**: pospuesto. Por ahora el endpoint
   `/formularios/catalogos` sigue devolviendo los 8 catalogos globales
   del modulo SIEEJ.

---

## 2. Contexto del estado actual

### 2.1 Backend (`mariachi/api`)

**Estructura relevante:**
- `app/api/routes/formularios/__init__.py`: subrouter con
  `prefix="/formularios"` y
  `dependencies=[Depends(require_project_access("sieej"))]`.
- Subrouters: `catalogos`, `general`, `enlaces`, `bases_datos`.
- `app/models/sieej/`: 12 tablas en schema `sieej` (8 catalogos + 4
  entidades).
- `app/services/sieej/`: 3 services con la logica CRUD.
- `app/schemas/sieej/`: Pydantic con convencion `*Create / *Update /
  *Response` y `model_config = ConfigDict(from_attributes=True)`.

**Modelo de usuario y permisos:**
- `Usuario.role`: enum global `{"tetlamamakani", "editora", "externo"}`.
- `UserProject` (tabla intermedia user-proyecto) con `project_role`
  (`editor` / `viewer`).
- `tetlamamakani` siempre tiene acceso (bypass en `deps.py`).
- `require_project_access("sieej")` valida membership.
- `require_role(["tetlamamakani"])` valida rol global.
- `verify_csrf` valida header `X-CSRF-Token` en mutaciones.

**Acervo (uploads):**
- `AcervoClient.upload_file(file: UploadFile, object_name: str) -> str`
  retorna URL publica.
- `AcervoClient.for_bucket(bucket: MediaBucket)` cachea por bucket.
- Patron actual: `formularios/bases_datos.py` endpoint
  `POST /bases-datos/{id}/diccionario` recibe `UploadFile`, llama al
  service, sube a Acervo bucket `sieej-diccionarios`.

**Alembic:**
- Migrations en `api/alembic/versions/mariachi/`.
- Al 2026-05-06 la cadena en la rama mariachi es **lineal** y el
  head es `d3e4f5a6b7c8_scope_media_folders_to_bucket.py`. Esa debe
  ser la `down_revision` de la migration de la fase 1. (El plan
  original citaba `f1a2b3c4d5e6_add_role_externo.py`, que esta a la
  mitad de la cadena.) Verificar igual con `alembic heads` antes de
  generar la migration por si llegan revisiones nuevas.
- Patron: `revision`, `down_revision`, `upgrade()`, `downgrade()`.
- Importante: cualquier cambio a DataEngine va en rama
  `prod-migracion`, NO mezclar con migrations de mariachi.

### 2.2 Admin (`mariachi/admin`)

**Stack:** React 19 + Vite 7 + React Router 7 + Ant Design 6 + Axios +
`@dnd-kit/core` y `@dnd-kit/sortable`.

**Estructura:**
- `app/`: layouts + guards + providers.
- `app/guards/RoleProtectedRoute.jsx`: protege rutas por `user.role`.
- `features/<dominio>/pages/<X>Page.jsx`: una carpeta por dominio
  (users, portal-pages, portal-menu, media, mapalab-layers, revision,
  auth, sieej-formularios).
- `shared/services/api.js`: Axios con interceptores (CSRF + auto-logout
  en 401). `baseURL = '/api/administrador'`.
- `shared/contexts/AuthContext.jsx`: user + login + logout +
  refreshUser.

**Patron de pagina admin (de `users/pages/UsersPage.jsx`):**
- `useState` para data + modal abierto + record en edicion.
- `useEffect` para fetch inicial.
- Tabla Ant Design con columnas tipadas + acciones por fila.
- Modal con form de Ant Design para create/edit.
- Confirmacion de delete via `Modal.confirm`.

**Componentes utiles existentes:**
- `features/portal-menu/components/menuManager/SortableTree.jsx`:
  drag-reorder jerarquico con `@dnd-kit` (referencia para el editor de
  steps del constructor).
- `features/portal-pages/components/JsonEditorModal.jsx`: editor JSON
  (referencia para edicion avanzada de definicion).
- Existe ya un esqueleto `features/sieej-formularios/` (verificado
  2026-05-06): `index.js` + `pages/FormulariosPage.jsx`. Es un CRUD
  AntD basico (slug, nombre, descripcion, is_active) que llama
  `api.get('/formularios')`. **Atencion**: ese path choca con el
  subrouter respondent. Al implementar la fase 4 hay que migrar
  todas las llamadas a `/admin/sieej/formularios` (ver 5.2) y dejar
  esa pagina como `FormulariosListPage.jsx` segun la estructura
  propuesta en 7.1.

**Permisos en admin:**
- Constructor de formularios: `tetlamamakani` + `editora`.
- Gestion de grupos: probablemente solo `tetlamamakani`.

### 2.3 Frontend SIEEJ (`SIEEJ/frontend`)

**Stack:** React 19 + Vite 6.2 + Tailwind 4 + react-hook-form 7.54 +
react-router 7.2. Sin Ant Design.

**Componentes UI primitivos** (en `src/components/`):

| Reusable directo | Reusable con desacoplamiento | SIEEJ-especifico (eliminar/replantear) |
|---|---|---|
| Button, Input, Select, SelectMultiple, Radio, Checkbox, DatePicket, Label, Text, Typography, Divide, Tooltip, Loading, Spinner, Upload | Dragger (quitar `onFile` de HomeContext, recibir callback), Modal y Message (desacoplar de GlobalContext o aceptar context inyectado), MainLayout | EnvBadge (mantener), Pdf y PdfForm (mantener para preview/descarga), GeneralStep, LinksStep, ListDatabaseStep, DataBaseStep, ResumeStep |

**Componentes wizard (`StepIndicator`, `NavigateStep`, `Tabs`):**
- Hoy leen `currentStep`, `steps`, `activeTab` de GlobalContext.
- Refactor: deben consumir un context de "wizard activo" inyectado por
  el renderer (ver seccion 6).

**Helpers (`src/helpers/`)**

Genericos a mantener: `cleanObject`, `booleanToString`, `stringToBoolean`,
`objectsToStrings`, `objectToFormData`, `analytics`, `formatText`,
`extractFileName`, `compareObjects`, `FieldLayout`, `DynamicDiv`,
`ErrorsRequired`.

SIEEJ-especificos a mover a `forms/sieej-levantamiento/` o eliminar
post-migracion: `initDatabase` (default de la BD del wizard),
`pdfActions` (download del PDF del wizard), `textLarge` (tooltips
hardcodeados de DataBaseStep).

**Contextos:**

| Context | Estado del refactor |
|---|---|
| `AuthContext` | Sin cambios. |
| `UserContext` | Sin cambios. |
| `GlobalContext` | **Quitar `STEPS` array hardcodeado** + sacar `currentStep`/`activeTab`/`visitedTabs`/`tabLoading`/`sizeTabs` del global y moverlos a un `WizardContext` por formulario. Lo que queda en Global: hostBackend, screenSize, regex, modal global, message, analytics. |
| `CatalogContext` | Sin cambios estructurales. Mantiene los 8 catalogos SIEEJ (decision 9). En v2 se hara `/formularios/:slug/catalogos`. |
| `HomeContext` | **Reemplazar** por `SubmissionContext` generico parametrizado por `slug` (CRUD del envio actual + uploads). |

**Bloqueos a representar en JSON-schema** (visto en `DataBaseStep`):
- Multiples `showWhen` con boolean string (`"true"` / `"false"`).
- `ejes_estrategicos` como array de objetos serializado a strings.
- Upload a Acervo asociado a un campo (no a un endpoint global).
- Tabs internas dentro de un step de tipo repeater.

---

## 3. Modelo de datos (mariachi, schema `sieej`)

Todo vive en el mismo schema `sieej` para no fragmentar. Los nombres
siguen snake_case y la convencion de mariachi.

### 3.1 Tablas nuevas

```
sieej.formulario
  id                   PK
  slug                 UNIQUE NOT NULL          -- identificador en URL
  nombre               TEXT NOT NULL
  descripcion          TEXT
  definicion           JSONB NOT NULL            -- ver seccion 4
  estado               ENUM('borrador','activo','cerrado') NOT NULL DEFAULT 'borrador'
  vigencia_inicio      TIMESTAMPTZ NULL
  vigencia_fin         TIMESTAMPTZ NULL
  publico              BOOLEAN NOT NULL DEFAULT FALSE   -- v2; siempre false en v1
  version              INT NOT NULL DEFAULT 1
  creado_por_id        FK -> public.usuario.id
  creado_en            TIMESTAMPTZ NOT NULL
  actualizado_en       TIMESTAMPTZ NOT NULL

sieej.grupo
  id                   PK
  nombre               TEXT UNIQUE NOT NULL
  descripcion          TEXT
  creado_en            TIMESTAMPTZ NOT NULL

sieej.usuario_grupo                 -- N:M (usuario puede estar en varios grupos)
  usuario_id           FK -> public.usuario.id
  grupo_id             FK -> sieej.grupo.id
  PRIMARY KEY (usuario_id, grupo_id)

sieej.formulario_grupo              -- asignacion por grupo
  formulario_id        FK -> sieej.formulario.id
  grupo_id             FK -> sieej.grupo.id
  PRIMARY KEY (formulario_id, grupo_id)

sieej.formulario_usuario            -- asignacion individual (ademas de grupos)
  formulario_id        FK -> sieej.formulario.id
  usuario_id           FK -> public.usuario.id
  PRIMARY KEY (formulario_id, usuario_id)

sieej.envio_formulario
  id                       PK
  formulario_id            FK -> sieej.formulario.id
  formulario_version       INT NOT NULL                   -- snapshot al iniciar
  definicion_snapshot      JSONB NOT NULL                 -- copia de la definicion al iniciar (idempotente)
  usuario_id               FK -> public.usuario.id        -- nullable en v2 (publicos)
  estado                   ENUM('en_proceso','enviado','expirado') NOT NULL DEFAULT 'en_proceso'
  datos                    JSONB NOT NULL DEFAULT '{}'
  paso_actual              INT NOT NULL DEFAULT 0
  iniciado_en              TIMESTAMPTZ NOT NULL
  enviado_en               TIMESTAMPTZ NULL
  expirado_en              TIMESTAMPTZ NULL                -- set por job cuando vigencia_fin < now()
  actualizado_en           TIMESTAMPTZ NOT NULL
  UNIQUE (formulario_id, usuario_id)                       -- 1 envio por user/formulario v1

sieej.envio_archivo
  id                   PK
  envio_id             FK -> sieej.envio_formulario.id
  field_path           TEXT NOT NULL                     -- ej "bases_datos[2].diccionario"
  bucket               TEXT NOT NULL                     -- nombre del bucket Acervo
  object_key           TEXT NOT NULL
  url_publica          TEXT
  filename_original    TEXT NOT NULL
  mime                 TEXT NOT NULL
  size_bytes           BIGINT NOT NULL
  subido_en            TIMESTAMPTZ NOT NULL
  INDEX (envio_id, field_path)

sieej.envio_evento                  -- auditoria liviana del ciclo de vida
  id                   PK
  envio_id             FK -> sieej.envio_formulario.id
  tipo                 ENUM('iniciado','guardado','enviado','expirado','reabierto') NOT NULL
  payload              JSONB                              -- snapshot de datos diff o metadata libre
  actor_usuario_id     FK -> public.usuario.id            -- quien dispara el evento (puede ser != envio.usuario_id)
  ocurrido_en          TIMESTAMPTZ NOT NULL DEFAULT now()
  INDEX (envio_id, ocurrido_en DESC)
```

**Notas:**
- `definicion_snapshot` evita tener que mantener una tabla
  `formulario_version` aparte. El envio queda inmune a cambios futuros
  del formulario.
- `UNIQUE (formulario_id, usuario_id)` impone "un envio por usuario por
  formulario" en v1. Si en v2 queremos multi-envio (publico, encuestas
  repetibles), se cambia a un `envio_secuencia INT` con UNIQUE compuesto.
- `envio_archivo.field_path` usa notacion de path (similar a JSONPath
  ligero) para ubicar el archivo dentro de `datos`.
- `envio_formulario.estado='expirado'` lo escribe un job que corre
  diariamente: `UPDATE envio_formulario SET estado='expirado',
  expirado_en=now() WHERE estado='en_proceso' AND formulario_id IN
  (SELECT id FROM formulario WHERE vigencia_fin < now())`. Tambien
  emite un `envio_evento` por cada update.
- `envio_evento` es append-only. No se actualiza ni se borra.
  Sirve para reportes ("cuantos envios hubo el martes"), debugging
  ("cuando guardo este usuario por ultima vez") y future v2
  (workflow borrador-aprobacion).

### 3.2 Tablas a deprecar (fase 4)

Despues de la migracion del wizard SIEEJ:
- `sieej.general`
- `sieej.enlace`
- `sieej.bases_datos`
- `sieej.bd_ejes_estrategicos`

Los 8 catalogos (`catalogo_*`) se mantienen porque siguen siendo
referenciados por la definicion JSON via `field.catalog`.

---

## 4. Schema de la definicion JSONB

Esta es la estructura que el constructor visual produce y que el
renderer de SIEEJ consume. Es **el contrato central** del sistema.

### 4.1 Estructura raiz

```jsonc
{
  "version": 1,                              // version del schema, no del formulario
  "steps": [ { ... }, { ... } ]
}
```

### 4.2 Tipos de step

#### `form` - campos planos
```jsonc
{
  "id": "general",
  "type": "form",
  "title": "Informacion general",
  "icon": "info",                            // opcional, nombre de icono
  "fields": [ /* ver 4.3 */ ]
}
```

#### `repeater` - lista de N subformularios
```jsonc
{
  "id": "bases_datos",
  "type": "repeater",
  "title": "Bases de datos",
  "minItems": 1,
  "maxItems": null,                          // null = sin limite
  "itemLabel": "Base de datos {{index}}",    // template para el tab
  "tabs": [                                  // opcional; si presente, los fields se agrupan por tab
    { "id": "datos", "title": "Datos generales" },
    { "id": "diccionario", "title": "Diccionario" }
  ],
  "fields": [ /* ver 4.3, con field.tab opcional */ ]
}
```

#### `summary` - vista de resumen al final
```jsonc
{
  "id": "resumen",
  "type": "summary",
  "title": "Resumen",
  "exportPdf": true                          // opcional
}
```

### 4.3 Campos (`field`)

```jsonc
{
  "name": "razon_social",                    // path en datos
  "label": "Razon social",
  "type": "text",                            // ver 4.4
  "required": true,
  "placeholder": "...",
  "tooltip": "...",
  "tab": "datos",                            // solo si el step es repeater con tabs
  "validation": {
    "minLength": 1,
    "maxLength": 255,
    "pattern": "^[A-Z]+$",                   // regex como string
    "min": 0,
    "max": 100
  },
  "showWhen": {                              // condicional v1: igualdad simple
    "field": "responsable",
    "equals": "true"
  },
  "options": [                               // solo para radio/select/checkbox/select_multiple sin catalog
    { "value": "true", "label": "Si" },
    { "value": "false", "label": "No" }
  ],
  "catalog": "unidades_admin",               // alternativa a options: referencia catalogo de CatalogContext
  "bucket": "sieej-diccionarios",            // solo para type=file. El bucket debe existir como MediaBucket en mariachi (no se crea on-the-fly)
  "accept": [".csv", ".xlsx"],               // solo para type=file. Whitelist; backend valida MIME tambien
  "maxSizeMB": 10,                           // solo para type=file. Limite hard a 100 MB (por client_max_body_size del gateway)
  "layout": { "colSpan": 2 }                 // opcional, hint de layout
}
```

### 4.4 Tipos de campo (registry frontend)

| `type` | Componente SIEEJ | Notas |
|---|---|---|
| `text` | `<Input type="text">` | Single line. |
| `textarea` | `<Input type="textarea">` o nuevo | Multi-line. |
| `number` | `<Input type="number">` | |
| `email` | `<Input type="email">` con regex | Valida con `regexEmail`. |
| `tel` | `<Input type="tel">` | Valida con `regexTel`. |
| `date` | `<DatePicket>` | |
| `select` | `<Select>` | Si trae `catalog` resuelve via CatalogContext. |
| `select_multiple` | `<SelectMultiple>` | Persiste array de values. |
| `radio` | `<Radio>` | Booleanos como `"true"/"false"`. |
| `checkbox` | `<Checkbox>` | |
| `file` | `<Dragger>` | Sube via `POST /formularios/:slug/envio/upload` con `field_path`. |
| `info` | `<Typography>` o `<Text>` | Display only, sin valor. |

### 4.5 Validacion en backend

El backend valida la `definicion` al crearla/editarla y valida `datos`
contra `definicion_snapshot` al hacer PUT del envio:
- Tipos correctos (text vs number vs date).
- Required.
- min/max/maxLength/pattern.
- Opciones (value debe estar en options o en el catalogo).
- showWhen: si la condicion no se cumple, el campo se ignora (no se
  exige required).

Implementacion sugerida: un validador en `services/sieej/definicion_validator.py`
y otro en `services/sieej/datos_validator.py`. Pydantic dinamico es
posible pero suele ser mas claro escribir el validador a mano.

### 4.6 Ejemplo: wizard SIEEJ actual representado en JSON

Bosquejo (no exhaustivo; la migracion debe replicar todos los campos de
`GeneralStep`, `LinksStep`, `DataBaseStep`):

```jsonc
{
  "version": 1,
  "steps": [
    { "id": "general", "type": "form", "title": "Informacion general", "icon": "info_general",
      "fields": [
        { "name": "nombre_ente", "label": "Nombre del ente", "type": "text", "required": true },
        { "name": "unidad_admin_id", "label": "Unidad", "type": "select", "catalog": "unidades_admin", "required": true },
        { "name": "hay_responsable", "label": "Hay responsable?", "type": "radio",
          "options": [{"value":"true","label":"Si"},{"value":"false","label":"No"}], "required": true },
        { "name": "responsable_nombre", "label": "Nombre del responsable", "type": "text",
          "showWhen": { "field": "hay_responsable", "equals": "true" }, "required": true }
      ]
    },
    { "id": "enlaces", "type": "repeater", "title": "Enlaces", "icon": "info_enlaces", "minItems": 1,
      "fields": [
        { "name": "nombres", "type": "text", "required": true },
        { "name": "apellido1", "type": "text", "required": true },
        { "name": "email", "type": "email", "required": true },
        { "name": "telefono", "type": "tel" },
        { "name": "extension", "type": "text", "validation": { "pattern": "^\\d{1,9}$" } }
      ]
    },
    { "id": "bases_datos", "type": "repeater", "title": "Bases de datos", "icon": "info_bd", "minItems": 1,
      "tabs": [
        { "id": "datos", "title": "Datos" },
        { "id": "diccionario", "title": "Diccionario" }
      ],
      "fields": [
        { "name": "nombre_bd", "type": "text", "required": true, "tab": "datos" },
        { "name": "categoria_id", "type": "select", "catalog": "categoria_datos", "tab": "datos" },
        { "name": "ejes_estrategicos", "type": "select_multiple", "catalog": "ejes_estrategicos", "tab": "datos" },
        { "name": "tiene_diccionario", "type": "radio",
          "options": [{"value":"true","label":"Si"},{"value":"false","label":"No"}], "tab": "diccionario" },
        { "name": "diccionario", "type": "file", "bucket": "sieej-diccionarios",
          "accept": [".csv",".xlsx"], "maxSizeMB": 10,
          "showWhen": { "field": "tiene_diccionario", "equals": "true" }, "tab": "diccionario" }
      ]
    },
    { "id": "resumen", "type": "summary", "title": "Resumen", "exportPdf": true }
  ]
}
```

---

## 5. Endpoints (mariachi/api)

Todos bajo el prefijo de admin existente: `/api/administrador`.

### 5.1 Respondent (consumido por SIEEJ)

Subrouter `/formularios`, gateado por
`Depends(require_project_access('sieej'))` (mismo patron actual).

| Verbo | Path | Descripcion |
|---|---|---|
| GET | `/formularios` | Lista los formularios visibles para el user (admin global ve todos; resto: union de `formulario_usuario` y formularios cuyos grupos contengan al user; filtrado por `estado='activo'` y vigencia). Incluye estado del envio del user (en_proceso / enviado / no_iniciado). |
| GET | `/formularios/:slug` | Definicion completa + estado del envio del user. Snapshot si el envio ya existe. |
| GET | `/formularios/:slug/envio` | `datos` y `paso_actual` del envio en proceso. 404 si no existe (frontend hace POST inicial implicito o el GET crea uno vacio segun decidamos). |
| PUT | `/formularios/:slug/envio` | Guarda parcial / marca como enviado (campo `enviar: true`). Crea el `envio_formulario` si no existe (con snapshot de la definicion). |
| POST | `/formularios/:slug/envio/upload` | Multipart con `file` + `field_path`. Sube a Acervo y crea `envio_archivo`. Devuelve `{ field_path, url, filename }` para guardar en `datos`. |
| GET | `/formularios/catalogos` | Sin cambios. Mantiene los 8 catalogos SIEEJ. |

### 5.2 Admin (consumido por mariachi/admin)

Subrouter `/sieej` (no `/admin/sieej` como decia el draft original — se
alinea con el `sieej_admin.router` ya existente que expone `/sieej/stats`).
Permisos: heredados via `staff_dep` registrado a nivel de app
(`tetlamamakani` + `editora`).

| Verbo | Path | Descripcion |
|---|---|---|
| GET | `/sieej/formularios` | Lista todos (con filtros: estado, slug). |
| POST | `/sieej/formularios` | Crea (estado `borrador`). Valida `definicion`. |
| GET | `/sieej/formularios/:id` | Detalle. |
| PUT | `/sieej/formularios/:id` | Actualiza. Si tiene envios y la `definicion` cambia, hace `version++`. Los envios existentes mantienen su `definicion_snapshot`. |
| POST | `/sieej/formularios/:id/publicar` | `estado = 'activo'`. |
| POST | `/sieej/formularios/:id/cerrar` | `estado = 'cerrado'`. |
| DELETE | `/sieej/formularios/:id` | Si no tiene envios, borra. Si tiene, lo cierra en su lugar (preserva historico). |
| PUT | `/sieej/formularios/:id/asignaciones` | Body: `{ grupos: [id...], usuarios: [id...] }`. Reemplaza en bloque. |
| GET | `/sieej/formularios/:id/envios` | Lista envios paginado. Filtros: estado. Devuelve `{total, items}`. |
| GET | `/sieej/formularios/:id/envios/:envio_id` | Detalle del envio + archivos. |
| GET | `/sieej/grupos` | Lista. |
| POST | `/sieej/grupos` | Crea. |
| GET | `/sieej/grupos/:id` | Detalle. |
| PUT | `/sieej/grupos/:id` | Actualiza. |
| DELETE | `/sieej/grupos/:id` | Borra (solo si no tiene formularios asignados; si los tiene, error 400). |
| PUT | `/sieej/grupos/:id/usuarios` | Body: `{ usuarios: [id...] }`. Reemplaza miembros. |
| GET | `/sieej/grupos/:id/usuarios` | Lista miembros del grupo. |
| GET | `/sieej/stats` | Existente. Stats del wizard SIEEJ original. |

### 5.3 Convenciones a respetar (de mariachi)

- Schemas Pydantic: `*Create / *Update / *Response`,
  `model_config = ConfigDict(from_attributes=True)`.
- Services en `app/services/sieej/` con clase tipo
  `class FormulariosService: def __init__(self, db): self.db = db`.
- Routes con `Depends(get_db)`, `Depends(get_current_user)`,
  `Depends(verify_csrf)` en mutaciones.
- Errores via `HTTPException(status_code=..., detail="...")`.

---

## 6. Frontend SIEEJ

### 6.1 Estructura de carpetas objetivo

```
src/
|-- main.jsx
|-- Routes.jsx
|-- index.css
|
|-- components/
|   |-- ui/           # primitivas reusables (Button, Input, Select, Radio, ...)
|   |-- wizard/       # StepIndicator, NavigateStep, Tabs (genericos, leen WizardContext)
|   `-- upload/       # Dragger, Upload, PdfForm, Pdf
|
|-- forms/
|   |-- renderer/
|   |   |-- FormRenderer.jsx           # entrypoint del wizard (recibe definicion + envio)
|   |   |-- StepRenderer.jsx           # despacha por step.type
|   |   |-- FormStep.jsx               # step.type === 'form'
|   |   |-- RepeaterStep.jsx           # step.type === 'repeater'
|   |   |-- SummaryStep.jsx            # step.type === 'summary'
|   |   |-- FieldRenderer.jsx          # field.type -> componente via registry
|   |   |-- fieldRegistry.js           # mapeo field.type -> Component
|   |   |-- conditional.js             # evalua showWhen
|   |   |-- validation.js              # required + pattern + min/max + email/tel
|   |   `-- catalogResolver.js         # resuelve field.catalog -> options via CatalogContext
|   |
|   `-- context/
|       |-- FormsContext.jsx           # lista de formularios + cache por slug
|       |-- SubmissionContext.jsx      # CRUD del envio activo (reemplaza HomeContext)
|       `-- WizardContext.jsx          # currentStep, activeTab, visitedTabs, sizeTabs (saca esto del Global)
|
|-- pages/
|   |-- FormList.jsx                   # ruta "/"
|   |-- FormPage.jsx                   # ruta "/:slug" (carga definicion + monta FormRenderer)
|   |-- Login.jsx, ChangePassword.jsx, Disclaimer.jsx, NoMatch.jsx, ErrorPage.jsx
|
|-- context/
|   |-- GlobalContext.jsx              # ya sin STEPS array; queda hostBackend, screenSize, modal global, regex, analytics
|   |-- AuthContext.jsx, useAuth.js
|   |-- CatalogContext.jsx, useCatalog.js
|   `-- UserContext.jsx, useUser.js
|
|-- layout/MainLayout.jsx              # sin acoplamiento a wizard
|
|-- services/
|   |-- authServices.js                # ya existe
|   `-- formulariosServices.js         # nuevo: list, getDefinition, getSubmission, putSubmission, uploadField
|
|-- helpers/                           # cleanObject, booleanToString, ... (los genericos sobreviven)
`-- assets/
```

### 6.2 Provider tree nuevo

```
Sentry.ErrorBoundary
  BrowserRouter (basename = VITE_BASE_PATH)
    GlobalProvider               # sin wizard state
      AuthProvider
        CatalogProvider          # se queda; el provider arranca el fetch al loguearse
          UserProvider
            FormsProvider        # lista de formularios disponibles
              Routes
                FormPage         # adentro: SubmissionProvider + WizardProvider + FormRenderer
```

`SubmissionProvider` y `WizardProvider` viven dentro de `FormPage` (no
globales) porque su scope es el formulario activo.

### 6.3 Routing

```
/inicio-sesion          Login
/exencion               Disclaimer
/cambiar-contrasena     ChangePassword (protected)
/                       FormList (protected)
/:slug                  FormPage (protected)  -- ej /sieej-levantamiento, /encuesta-x
/error                  ErrorPage
*                       NoMatch
```

### 6.4 Renderer: contrato

`FormRenderer` recibe `{ definicion, envio, onSave, onSubmit, onUpload }`
y orquesta:
1. Inicia react-hook-form con `defaultValues = envio.datos`.
2. Renderiza `StepIndicator` leyendo `definicion.steps`.
3. Renderiza el step actual via `StepRenderer` (despacha por `type`).
4. `FormStep` itera `step.fields`, evalua `showWhen` y manda cada uno a
   `FieldRenderer`.
5. `RepeaterStep` usa `useFieldArray` con `minItems`/`maxItems`. Si tiene
   `tabs`, monta `Tabs` por item con sub-renderizado por tab.
6. `SummaryStep` lee el form value, lo pinta y maneja `enviar`.
7. `NavigateStep` llama `onSave(values)` (PUT parcial) y `onNext()` /
   `onPrev()`.

### 6.5 Componentes del wizard (refactor minimo)

`StepIndicator`, `NavigateStep`, `Tabs` deben dejar de leer
`GlobalContext.STEPS` y leer `WizardContext` (steps de la definicion del
formulario activo).

### 6.6 SubmissionContext API

```js
{
  envio,             // { id, formulario_id, datos, paso_actual, estado, ... }
  loading, error,
  saveDraft(values),         // PUT /formularios/:slug/envio (estado=en_proceso)
  submit(values),            // PUT /formularios/:slug/envio (estado=enviado)
  uploadField(file, fieldPath)  // POST /formularios/:slug/envio/upload
}
```

### 6.7 FormList (pagina `/`)

- Trae `GET /formularios` al montar.
- Pinta tarjetas por formulario con: nombre, descripcion, vigencia,
  estado del envio del user (`Sin iniciar` / `En proceso` / `Enviado`).
- Tarjeta clickable -> `navigate('/' + slug)`.
- Si lista vacia: mensaje "No tienes formularios asignados".

---

## 7. Constructor visual (mariachi/admin)

### 7.1 Estructura de feature

```
admin/src/features/sieej-formularios/
|-- pages/
|   |-- FormulariosListPage.jsx       # tabla AntD con CRUD basico + acciones (publicar, cerrar)
|   |-- FormularioEditorPage.jsx      # tabs: Definicion | Asignaciones | Envios | Configuracion
|   `-- GruposPage.jsx                # CRUD de grupos + miembros
|
|-- components/
|   |-- DefinicionEditor/
|   |   |-- StepsList.jsx             # SortableTree con steps (drag-reorder)
|   |   |-- StepEditor.jsx            # form/repeater/summary
|   |   |-- FieldsEditor.jsx          # lista sortable de fields del step
|   |   |-- FieldForm.jsx             # form para tipo, label, options, catalog, validacion, showWhen
|   |   |-- TabsEditor.jsx            # solo para step.type=repeater
|   |   `-- DefinicionPreview.jsx     # render con FieldRenderer compartido (ver 7.4)
|   |
|   |-- AsignacionesEditor.jsx        # transfer / select multiple grupos + usuarios
|   |-- EnviosTable.jsx               # tabla con filtros + drawer detalle
|   `-- JsonEditorButton.jsx          # editor JSON crudo para escape hatch
|
`-- services/
    `-- formulariosAdminApi.js
```

### 7.2 Flujo de uso

1. Admin entra a `/sieej/formularios`.
2. "Nuevo" -> dialog con slug + nombre -> crea como `borrador`.
3. Editor con tabs:
   - **Definicion**: editor visual + boton "JSON" para crudo.
   - **Asignaciones**: selecciona grupos / usuarios.
   - **Envios**: tabla de respuestas (deshabilitada hasta publicar).
   - **Config**: vigencia, estado, descripcion.
4. "Publicar" -> `estado = activo` (visible para respondents).
5. Si edita un publicado -> warning + bump de version (los envios viejos
   quedan con su snapshot).

### 7.3 Editor de campos

UI tipo lista de tarjetas, cada tarjeta es un campo. Drag para reordenar.
Click para abrir drawer con:
- Tipo (select del registry).
- Label, name (auto-slug del label, editable).
- Required, placeholder, tooltip.
- Para `select`/`radio`/`checkbox`: opciones manuales o referencia a
  catalogo (dropdown con los catalogos disponibles).
- Para `file`: bucket + accept + maxSizeMB.
- Validacion: minLength, maxLength, pattern, min, max.
- showWhen: select de field anterior + valor.
- Tab (solo si el step es repeater con tabs).

### 7.4 Compartir el `FieldRenderer` SIEEJ <-> admin

Decision pendiente: el preview en el constructor deberia renderizar
identico a SIEEJ. Dos opciones:

A. Duplicar componentes en admin con AntD (mas simple, doble
   mantenimiento).
B. Empaquetar `FieldRenderer` como modulo compartido (workspace
   monorepo o npm interno).

**Recomendacion v1: opcion A (duplicar)**, porque admin usa AntD y
SIEEJ usa Tailwind puro. El constructor solo necesita un preview
visual, no fidelidad pixel-perfect. Si el preview se vuelve un dolor de
cabeza, mover a B en v2.

---

## 8. Migracion del wizard SIEEJ actual (fase 4)

Esto es lo mas riesgoso. Plan dedicado:

1. **Seed**: migration que crea un `Formulario` con `slug =
   'sieej-levantamiento'`, `nombre`, `descripcion`, y `definicion` con la
   representacion JSON completa del wizard (basado en seccion 4.6,
   exhaustivo).
2. **Backfill**: script (script python o migration de datos) que para
   cada usuario con datos en `general` / `enlaces` / `bases_datos`:
   - Crea un `envio_formulario` con `formulario_id` del seed,
     `usuario_id` del user, `formulario_version=1`,
     `definicion_snapshot` = la definicion del seed.
   - Construye `datos` JSONB juntando los registros de las 3 tablas en la
     forma que el renderer espera.
   - Por cada `bases_datos` con `diccionario_url`, crea un
     `envio_archivo` con `field_path =
     "bases_datos[<n>].diccionario"`.
   - Estado: `enviado` si los 3 estan completos; `en_proceso` si no.
3. **Verificacion**: query que compara conteos por usuario antes/despues
   y cuenta archivos migrados.
4. **Switch frontend**: una vez validado, el frontend deja de usar las
   rutas viejas y consume solo `/formularios/sieej-levantamiento/...`.
5. **Cleanup backend**: deprecar y luego dropear `general`, `enlace`,
   `bases_datos`, `bd_ejes_estrategicos` y sus rutas/services/schemas.
6. **Cleanup frontend**: eliminar `forms/sieej-levantamiento/`,
   `HomeContext`, `initDatabase`, los step components especificos. El
   `pdfActions` se generaliza para `summary.exportPdf`.

**Punto critico**: el backfill no debe correrse si ya hay otros
formularios con envios. Hacerlo lo antes posible despues de la fase 3.

---

## 9. Plan de implementacion por fases

| Fase | Entregables | Repos | Estimacion relativa |
|---|---|---|---|
| **0** | Este documento; afinar JSON-schema; decidir nombres de tablas; escribir migration vacia con esqueleto | SIEEJ docs | 1 |
| **1** | Backend respondent: migration con tablas + modelos + schemas + endpoints `/formularios` (lista, definicion, envio GET/PUT, upload) + validador de definicion + validador de datos; tests basicos | mariachi/api | 4 |
| **2** | Backend admin: endpoints CRUD `/admin/sieej/formularios`, `/admin/sieej/grupos`, asignaciones, envios; tests | mariachi/api | 3 |
| **3** | Frontend SIEEJ: refactor de carpetas (ui/wizard/upload); FormsContext; FormList; FormRenderer + Field/Step renderers + repeater + summary; SubmissionContext + WizardContext; eliminar STEPS hardcoded de Global; mantener wizard SIEEJ vivo a traves del renderer cargando un formulario "demo" hardcodeado mientras la fase 4 no termine | SIEEJ frontend | 5 |
| **4** | Constructor visual en mariachi/admin: pages + DefinicionEditor + AsignacionesEditor + GruposPage + EnviosTable | mariachi/admin | 5 |
| **5** | Migracion del wizard SIEEJ (seccion 8): seed + backfill + cleanup backend + cleanup frontend | mariachi + SIEEJ | 3 |
| **6 (v2)** | Publicos + captcha + lighthouse + export CSV + logica condicional AND/OR + catalogos por formulario + multi-envio | ambos | 4+ |

Las fases 1, 2, 3, 4 pueden paralelizarse parcialmente: 1 desbloquea 3;
2 desbloquea 4; 3 y 4 pueden ir simultaneas si el contrato JSON esta
congelado.

---

## 10. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| El JSON-schema crece y se vuelve inmanejable | Alto | Versionar el schema (`definicion.version`); tests de roundtrip; documentar cada tipo. |
| Constructor visual se vuelve un mini-Figma | Alto | Limitar el scope (no permitir CSS libre, no permitir HTML libre, no permitir custom components). El usuario solo elige de un menu cerrado. |
| Repeaters anidados (lista dentro de lista) | Medio | Decision v1: prohibirlos. Si surge la necesidad, repensar. |
| Validacion divergente entre frontend y backend | Medio | Compartir reglas via documento + tests; idealmente validacion centralizada en backend, frontend solo UX. |
| Migracion de datos del wizard pierde info | Alto | Backfill idempotente; dry-run con conteos; mantener tablas viejas un tiempo despues del switch. |
| Performance de query de visibilidad de formularios (`UNION` por user/grupo) | Medio | Indices en `formulario_usuario`, `usuario_grupo`, `formulario_grupo`. Evaluar materializacion si `formulario` crece a miles. |
| Archivos huerfanos en Acervo cuando borran un envio | Bajo | Hard-delete en cascada de `envio_archivo`; job nocturno de limpieza de objetos sin row. |

---

## 11. Cosas pospuestas (v2)

Listadas para no perderlas:
- Formularios publicos (sin login) + captcha + throttling.
- Catalogos por formulario (`/formularios/:slug/catalogos`).
- Logica condicional con AND/OR y operadores (`!=`, `in`, `>`).
- Multi-envio por usuario (encuestas repetibles).
- Versionado historico de la definicion (hoy se resuelve con
  `definicion_snapshot` en cada envio, suficiente para v1).
- Export CSV / Excel de envios desde admin.
- Webhooks al enviar / cerrar formulario.
- i18n del constructor.
- Plantillas (clonar formulario existente como base).
- Workflows tipo borrador-aprobacion para definiciones (similar al
  patron de `borradores.py` que ya existe en mariachi).

---

## 12. Convenciones a respetar (resumen accionable)

### Backend (mariachi/api)
- Modelos en `app/models/sieej/`, schemas en `app/schemas/sieej/`,
  services en `app/services/sieej/`, routes en
  `app/api/routes/formularios/` (respondent) y nuevo
  `app/api/routes/sieej_admin/formularios/` (admin).
- Pydantic: `*Create`, `*Update`, `*Response`,
  `ConfigDict(from_attributes=True)`.
- Services: clase `XxxService` con `__init__(self, db)`.
- Auth: `get_current_user`, `verify_csrf`, `require_project_access`,
  `require_role`.
- Migrations en `alembic/versions/mariachi/`. Down_revision al ultimo
  hash actual.
- Acervo: `AcervoClient.for_bucket(bucket).upload_file(file, key)`.
  Buckets nuevos via `MediaBucket` row.

### Admin (mariachi/admin)
- Feature en `src/features/sieej-formularios/`.
- Stack: Ant Design 6 + Axios + React Router 7 + `@dnd-kit` para
  drag-reorder.
- `RoleProtectedRoute` con `allowedRoles=['tetlamamakani','editora']`.
- `api` desde `shared/services/api.js` (ya maneja CSRF y 401).
- Rutas en `src/main.jsx`.

### Frontend SIEEJ
- Vite 6 + React 19 + Tailwind 4 + react-hook-form 7. Sin Ant Design.
- ESLint: `max-lines: 300` por archivo; partir componentes grandes.
- Aliases existentes (`@components`, `@helpers`, ...) se respetan;
  agregar `@forms` apuntando a `src/forms/` cuando creemos la carpeta.
- `onFetch` desde `useAuth()` para todos los requests autenticados.
- `BrowserRouter` con `basename = VITE_BASE_PATH`.

---

## 13. Archivos clave para arrancar

**Lectura previa antes de tocar codigo:**

mariachi/api:
- `app/api/deps.py`
- `app/models/user.py`
- `app/models/project.py`
- `app/api/routes/formularios/__init__.py`
- `app/api/routes/formularios/bases_datos.py`
- `app/services/acervo.py`
- `alembic/versions/mariachi/<ultimo_hash>_*.py` (para `down_revision`)

mariachi/admin:
- `src/main.jsx`
- `src/features/users/pages/UsersPage.jsx`
- `src/features/portal-menu/components/menuManager/SortableTree.jsx`
- `src/shared/services/api.js`

SIEEJ frontend:
- `src/context/HomeContext.jsx`
- `src/context/GlobalContext.jsx`
- `src/components/DataBaseStep.jsx`
- `src/components/Dragger.jsx`
- `src/components/Modal.jsx`
- `src/helpers/initDatabase.js`

---

## 14. Estrategia de tests

Minimo aceptable para que la plataforma se pueda iterar sin miedo:

### Backend (pytest, en `mariachi/api/tests/sieej/`)
- `test_definicion_validator.py`: matriz de definiciones validas e
  invalidas — un caso por tipo de campo (text, number, email, tel,
  date, select, select_multiple, radio, checkbox, file, info), uno
  por tipo de step (form, repeater con/sin tabs, summary), uno por
  combinacion `field.catalog` vs `field.options`, uno por
  `showWhen` valido/invalido, uno por `validation` (pattern, min,
  max, minLength, maxLength).
- `test_datos_validator.py`: matriz de envios validos e invalidos
  para una definicion fija — required cumplido / faltante,
  `showWhen` que omite required, repeater con `minItems` /
  `maxItems`, file con extension fuera de `accept`, file mas grande
  que `maxSizeMB`.
- `test_endpoints_respondent.py`: GET lista filtrado por
  visibilidad (admin global ve todos, user ve solo asignados),
  GET definicion devuelve snapshot del envio existente, PUT envio
  guarda parcial, PUT envio con `enviar:true` valida obligatorios,
  POST upload escribe `envio_archivo` y devuelve URL.
- `test_endpoints_admin.py`: CRUD formularios; publicar/cerrar;
  asignaciones reemplazan en bloque; delete falla si hay envios.
- `test_seed_backfill.py` (fase 5): construye un dataset sintetico
  de `general` + `enlaces` + `bases_datos`, corre el backfill,
  verifica que cada `envio_formulario.datos` reconstruye los
  registros originales y que `envio_archivo` apunta a las mismas
  keys de Acervo.

### Frontend SIEEJ (vitest — agregar a `package.json`, no esta hoy)
- `forms/renderer/conditional.test.js`: evaluacion de `showWhen`.
- `forms/renderer/validation.test.js`: matriz por tipo de campo.
- `forms/renderer/FormRenderer.test.jsx`: render de una definicion
  completa con react-hook-form, simular cambios, verificar que
  `onSave` recibe los datos esperados.
- `forms/renderer/RepeaterStep.test.jsx`: agregar/quitar items,
  respetar `minItems`/`maxItems`, tabs internas.

### CI
- Antes de Fase 3: agregar dependencias `vitest` + `@testing-library/react`
  al `frontend/` y un step en `.github/workflows/test-frontend.yml`.
- En `mariachi/api`: los tests existentes corren con pytest; los
  nuevos van bajo `tests/sieej/`. No requiere cambio de workflow.

---

## 15. Generacion del PDF del summary

Decision: **opcion (a) — frontend, con `@react-pdf/renderer`**.

- Ya esta instalado en `frontend/package.json` (`@react-pdf/renderer`
  ^4.3.0). Hoy se usa en `components/Pdf.jsx` y `components/PdfForm.jsx`
  para el wizard. Hay que generalizarlo: crear
  `forms/renderer/SummaryPdf.jsx` que recibe
  `{ definicion, datos, catalogos }` y emite el PDF iterando los
  steps en orden.
- Un campo se pinta segun su `field.type`. Para `select`/`radio`/
  `checkbox`/`select_multiple`, se resuelve el label via
  `catalogos[field.catalog]` o `field.options`. Para `file`, se
  pinta el `filename_original` + URL si `field.showInPdf` (default
  true). Para `info`, se omite.
- En `summary.exportPdf=true`, el `SummaryStep` renderiza un boton
  "Descargar PDF" que abre `<PDFDownloadLink>`.
- El PDF actual del wizard SIEEJ se elimina en la fase 5 cleanup;
  el nuevo lo reemplaza directamente leyendo del `definicion_snapshot`
  del envio (asi mantiene la fidelidad de "lo que el usuario envio
  en su momento").

Razon de descartar otras opciones:
- (b) html2canvas+jspdf: pesa mas, depende de fonts del navegador,
  PDFs salen como imagenes (no buscables).
- (c) WeasyPrint en backend: requiere endpoint nuevo, dependencia
  Python nueva (~30 MB), latencia extra. No justificado.

---

## 16. Validacion compartida frontend/backend

Decision: **el backend es la fuente de verdad. El frontend solo replica
para UX (mensajes inline antes de hacer PUT).**

### Endpoint
`GET /formularios/:slug/schema` (gateado por
`require_project_access('sieej')`).

Respuesta: la `definicion` del envio activo (o del formulario si no hay
envio) **mas** una clave `validation_rules` con un array plano
derivado del `definicion_validator`:

```jsonc
{
  "definicion": { /* misma forma de seccion 4 */ },
  "validation_rules": [
    { "field_path": "razon_social", "rule": "required", "message": "Requerido" },
    { "field_path": "razon_social", "rule": "maxLength", "value": 255, "message": "Maximo 255" },
    { "field_path": "responsable_nombre", "rule": "required_when",
      "field": "hay_responsable", "equals": "true", "message": "Requerido" }
  ]
}
```

### Implementacion
- `services/sieej/definicion_validator.py` exporta
  `definicion_to_validation_rules(definicion) -> List[Rule]`. El
  endpoint usa esta funcion. El validador interno (que valida `datos`
  en PUT) tambien la consume para no duplicar logica.
- En el frontend, `forms/renderer/validation.js` recibe
  `validation_rules` y construye el `register(name, options)` de
  react-hook-form aplicando cada regla. Si una regla no se entiende
  (rule type futuro), se ignora silenciosamente (forward-compatible).

Razon de no usar JSON Schema: requiere libreria extra en frontend
(~70 KB), mensajes default en ingles, mas trabajo mantener equivalencia
con `definicion`.

---

## 17. Preview en el constructor (mariachi/admin)

Decision: **componente preview separado, en AntD, no compartido con
SIEEJ.**

### Estructura
```
admin/src/features/sieej-formularios/components/preview/
|-- DefinicionPreview.jsx              # entrypoint, recibe definicion
|-- StepPreview.jsx                    # form/repeater/summary
|-- FieldPreview.jsx                   # despacha por field.type
|-- previewRegistry.js                 # mapeo type -> componente AntD
|-- conditional.js                     # COPIA de la logica showWhen de SIEEJ
`-- validation.js                      # COPIA de la logica de SIEEJ
```

### Por que no compartir con el FieldRenderer de SIEEJ
- SIEEJ usa Tailwind puro y componentes custom; admin usa AntD.
- Compartirlo requiere monorepo o paquete npm interno; el costo de
  setup (workspaces, build, version) supera al de duplicar.
- El preview es para que el constructor *vea como queda*, no para
  responder el formulario. La fidelidad pixel-perfect no aporta.

### Sincronizacion de logica
- `conditional.js` y `validation.js` son los unicos archivos
  duplicados. Mantenerlos identicos via lint rule sencillo (script en
  `scripts/check-preview-sync.js` que diffea ambos archivos y falla
  si divergen). Correrlo en CI de los dos repos.

### Trade-off
Si el constructor crece (mas tipos de campo, validaciones complejas),
la duplicacion empieza a doler. En ese caso, mover a paquete npm
compartido en v2.

---

## 18. Politica de archivos en Acervo

### Limites
- Default por campo: `maxSizeMB: 10`.
- Hard cap absoluto: 100 MB (alineado con
  `client_max_body_size 100M` en `gateway-hub/nginx/templates/gateway.conf.template`).
- Si un campo declara `maxSizeMB > 100`, el validator de definicion
  rechaza la creacion del formulario.

### Buckets
- `field.bucket` debe existir como row en `media_buckets` (mariachi).
  Validacion al crear/editar formulario.
- No se crean buckets on-the-fly desde el constructor. Se gestionan
  manualmente en `/admin/buckets` (admin existente de mariachi).
- Bucket default sugerido para SIEEJ: `sieej-uploads` (general).
  Si un formulario tiene archivos sensibles, crear bucket especifico.

### Validacion de tipo
- `accept` es whitelist por extension.
- Ademas, el backend valida `magic mime` con `python-magic` (ya
  instalado para Acervo). Si MIME no coincide con la extension,
  rechaza con 415.

### Limpieza de huerfanos
- `envio_archivo` cascada delete con `envio_formulario`.
- Job nocturno: `scripts/cleanup_acervo_orphans.py` lista objetos en
  los buckets de SIEEJ, los cruza contra `envio_archivo.object_key`,
  borra los que no tienen row mas viejos de 7 dias.
- El job vive en mariachi/api `scripts/`, se programa via
  `docker-compose` (cron container) o k8s CronJob a futuro.

### Acceso a archivos
- `envio_archivo.url_publica` es URL relativa de Acervo
  (`/acervo/<bucket>/<key>`).
- Frontend la usa tal cual; el gateway-hub ya enruta `/acervo/` al
  upstream MinIO.
- Para archivos privados (futuro), agregar `envio_archivo.privado:bool`
  + endpoint `GET /formularios/:slug/envio/archivo/:id` con
  presigned URL. Pospuesto v2.

---

## 19. Apertura de la siguiente sesion

Cuando se retome esto en sesion nueva, basta abrir este doc + leer los
~15 archivos de la seccion 13. La siguiente accion recomendada es
**arrancar Fase 1**: crear migration con el esquema de seccion 3 +
modelos + schemas Pydantic + endpoints respondent. Confirmar antes:

1. Nombres finales de tablas (los aqui propuestos en `sieej.*` se
   sienten consistentes; ningun choque con tablas existentes).
2. Si el grupo tambien debe poder ver "todos los grupos" (admin) o solo
   los suyos (respondent) en alguna parte de SIEEJ. Hoy se asume que
   los grupos son invisibles para el respondent.
3. Que la cadena Alembic en mariachi siga lineal (head es
   `d3e4f5a6b7c8`). Si llegan revisiones nuevas, el head puede
   haber avanzado — usar `alembic heads`.
