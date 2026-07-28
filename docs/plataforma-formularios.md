# Plataforma de formularios dinamicos SIEEJ

**Estado:** implementada y en operacion.
**Ultima version SIEEJ:** 1.50.1. **Ultima version mariachi:** 1.94.1.
**Fecha:** 2026-07-28.

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

14 tablas + enums Postgres + catalogos globales genericos:

```
sieej.formulario
  slug UNIQUE, nombre, descripcion, definicion JSONB, estado, version,
  vigencia_inicio/fin, periodicidad JSONB, publico, creado_por_id,
  actualizado_por_id, creado_en, actualizado_en

sieej.formulario_version               definiciones archivadas
  formulario_id, version, definicion JSONB, archivado_en

sieej.formulario_periodo               ventanas de captura materializadas
  formulario_id, clave (2026-03/2026-T2/2026-S1/2026), apertura, cierre,
  estado (programado/abierto/cerrado),
  notificado_apertura_en, notificado_faltantes_en

sieej.grupo
  nombre UNIQUE, descripcion, creado_en

sieej.usuario_grupo                    N:M usuario <-> grupo
sieej.formulario_grupo                 asignacion por grupo
sieej.formulario_usuario               asignacion individual

sieej.envio_formulario
  formulario_id, formulario_version, definicion_snapshot JSONB,
  usuario_id, periodo_id, estado (en_proceso/enviado/expirado),
  datos JSONB, cambios_pendientes JSONB, paso_actual, eliminado_en,
  iniciado_en/enviado_en/expirado_en, actualizado_en
  UNIQUE parcial (formulario_id, usuario_id) WHERE periodo_id IS NULL
  UNIQUE parcial (formulario_id, usuario_id, periodo_id) WHERE periodo_id IS NOT NULL

sieej.envio_archivo
  envio_id, field_path, bucket, object_key, url_publica,
  filename_original, mime, size_bytes, subido_en

sieej.envio_evento                     auditoria append-only
  envio_id, tipo (iniciado/guardado/enviado/expirado/reabierto/actualizado),
  payload JSONB, actor_usuario_id, ocurrido_en

sieej.envio_valor_historial            versionado de valores, append-only
  envio_id, field_path, field_label, valor_anterior, valor_nuevo,
  formulario_version, actor_usuario_id, cambiado_en

sieej.notificacion                     bitacora de avisos periodicos
  formulario_id, periodo_id, tipo (apertura/faltantes), resumen,
  payload JSONB, destinatarios, creado_en
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
          "tab": "<id-tab>",                          // obligatorio si el step es repeater con tabs
          "options": [{"value":"true","label":"Si"}], // o "catalog": "unidades_admin"
          "showWhen": {"field":"otro","equals":"true"},   // equals string o lista (OR): ["a","b"]
          "validation": {"minLength":1,"maxLength":255,"pattern":"^...$","patternMessage":"...","min":0,"max":100},
          "layout": {"colSpan": 1, "col": 1, "newRow": false, "alone": false},
          "editableAfterSubmit": false,               // corregible sin reabrir el envio
          "openStart": false, "openEnd": false,       // type=date_range: extremo abierto
          "openCatalog": "estatus_fecha",             // type=date_range: catalogo del extremo abierto
          "bucket": "sieej",                          // type=file
          "accept": [".pdf",".csv"],                  // type=file
          "maxSizeMB": 10                             // type=file (cap absoluto 100)
        }
      ],
      // form y repeater:
      "incompleteNotice": {"title":"...","message":"..."},  // aviso no bloqueante al avanzar

      // Solo repeater:
      "minItems": 1,
      "maxItems": null,
      "itemLabel": "Item {{index}}",
      "tabs": [{"id":"datos","title":"Datos"}],
      // Con `tabs`, cada field pertenece a exactamente una pestaña: el backend
      // rechaza un field sin `tab`, y el renderer manda a la primera pestaña
      // los de las definiciones anteriores que no lo traen.

      // Solo summary:
      "exportPdf": true,
      "pdfTemplate": "sieej-levantamiento"            // opcional, custom PDF
    }
  ]
}
```

Los tipos `email` y `tel` **ya no existen**: se absorbieron en `text` +
`validation.pattern` (mariachi 1.79.0). El constructor visual ofrece un
catalogo de regex comunes (correo, telefono de 10 digitos, CURP, RFC, codigo
postal, CLABE, URL) o un patron propio. La migracion `a5b6c7d8e9f1` reescribio
los existentes en las tres columnas JSONB.

### Layout del grid

Cada step se renderiza en un grid de **6 columnas** (`FormStep` / `RepeaterStep`).
`layout.colSpan` mapea a columnas: `1` -> 6/6, `2` -> 3/6, `3` -> 2/6. En mobile
el grid colapsa a una sola columna y el `colSpan` se ignora.

Los campos se colocan **en orden estricto**: si uno no cabe en lo que resta de la
fila, baja a la siguiente y deja el hueco. El grid ya **no** usa
`grid-flow-row-dense`: esa opcion rellenaba huecos con campos definidos despues,
de modo que el orden visual dejaba de coincidir con el de la definicion (y con el
orden del tab), volviendo el layout impredecible.

`layout.newRow: true` **marca el inicio de una linea**: el campo abre linea aunque
su columna quepa a la derecha del anterior. Es la forma soportada de dejar espacio
libre al final de una fila; antes se lograba metiendo campos `info` con label
vacio como espaciadores, que ademas ensuciaban `datos`, el export y el PDF.

Hasta SIEEJ 1.51.x la marca se derivaba de `col === 1` y se ignoraba en cualquier
otra columna, asi que la linea era **implicita**: se deducia comparando la columna
pedida contra la ya ocupada, y el orden de los campos — no la definicion — decidia
donde cortaba cada linea. Desde **1.52.0** la linea la declara la definicion. Las
definiciones anteriores se ven igual: sin la marca, un campo cuya columna quedo
atras del cursor abre linea como siempre.

**Acomodo manual** (mariachi 1.94.0 / SIEEJ 1.49.0): el campo puede fijar su
posicion dentro de la fila y reservarse la linea entera.

- **`layout.col`** (1..6) ancla el campo a una columna concreta
  (`md:col-start-{n}`) — `newRow` es su caso particular (`col: 1`). El backend
  rechaza una `col` donde el ancho declarado no cabria; el renderer la recorta a
  la ultima posicion valida, igual que `compat.py`.
- **`layout.alone`** reserva la linea completa para el campo: ningun otro se
  acomoda a su lado, ni por la derecha ni por la izquierda, aunque quepa.

### El acomodo se calcula, no se deduce (SIEEJ 1.51.0)

`helpers/gridLayout.js` agrupa los campos en lineas con el **mismo algoritmo que
el editor del CMS** (`groupIntoRows`) y `layoutSlots` emite la secuencia que se
renderiza: los campos con su columna y, entre ellos, `spacer`s que rellenan los
huecos y completan cada linea hasta las 6 columnas. `FormStep` y `RepeaterStep`
los recorren; los rellenos son `<div aria-hidden>` con `hidden md:block`, asi que
no existen en mobile.

Antes el renderer emitia solo las clases de cada campo y **dejaba el corte de
lineas al auto-placement del navegador**, mientras el editor lo decidia con su
propio modelo. Coincidian mientras todo fluyera, y divergian con posicion
explicita: en 6 de 10 casos con acomodos que el propio editor genera, un campo
marcado «linea reservada» terminaba compartiendo linea, porque `md:col-end-7`
impide vecinos por la derecha pero no por la izquierda. Tambien desaparece el
`md:max-w-[…]` con que se recortaba el ancho de esos campos: al quedar la linea
completa por los rellenos, el ancho es exactamente el declarado.

Como el agrupamiento se calcula sobre los campos **visibles**, un campo oculto
por `showWhen` no deja hueco: la linea se recompone.

El contrato vive en `test/fixtures/layoutContract.js` y lo verifican los dos
repos contra su propia implementacion — `test/gridLayout.test.js` aqui y
`__tests__/fieldLayout.test.js` en mariachi. Al tocar el acomodo en cualquiera
de los dos, agrega el caso al fixture y copialo al otro repo.

## Endpoints

### Respondent — `/formularios/...`
Gateado por `Depends(require_project_access('sieej'))`. Coexiste con
catalogos del wizard original.

| Verbo | Path | |
|---|---|---|
| GET | `/formularios/` | Lista visible para el user. Incluye `envio_id`, `estado_envio`, `tiene_campos_editables` y, en los periodicos, `periodico`/`abierto`/`ventana_*`/`proxima_apertura` |
| GET | `/formularios/:slug` | Definicion + estado del envio |
| GET | `/formularios/:slug/schema` | Definicion + `validation_rules` planos |
| GET | `/formularios/:slug/envio` | Datos del envio (lazy init) |
| PUT | `/formularios/:slug/envio` | Guardar parcial (`enviar:false`) o enviar (`enviar:true`). Acepta `cambios_vistos` |
| POST | `/formularios/:slug/envio/actualizar-version` | Migra el envio `en_proceso` a la definicion vigente conservando `datos` |
| POST | `/formularios/:slug/envio/upload` | Multipart con `field_path` + `file` |
| GET | `/formularios/mis-envios/:id` | Detalle del envio: `definicion_snapshot` + `datos` + `archivos[]` + `eventos[]`. 404 si no existe; 403 si pertenece a otro usuario. No expone `actor_usuario_id`. |
| DELETE | `/formularios/mis-envios/:id` | Soft-delete para el respondent (`eliminado_en`); el admin lo sigue viendo. Idempotente |
| GET | `/formularios/mis-envios/:id/pdf` | PDF del envio generado server-side |
| PUT | `/formularios/mis-envios/:id/actualizar-campos` | Correccion post-envio de los campos `editableAfterSubmit`, sin reabrir |
| POST | `/formularios/mis-envios/:id/actualizar-archivo` | Contraparte multipart para los campos `file` |
| GET | `/formularios/mis-envios/:id/historial` | Historial append-only de valores corregidos (sin actor) |
| GET | `/formularios/catalogos` | Bundle dinamico `{clave: [{id, value}]}` con todos los catalogos |

> El **listado** `GET /formularios/mis-envios` se elimino en mariachi 1.47+: la
> pantalla «Mis envios» era redundante con «Mis formularios», que ya muestra el
> estado de cada formulario. Solo sobrevive el detalle individual.

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
     con la clave que arma `acervo_keys.py` (ver abajo).
   - Persiste un registro en `sieej.envio_archivo` (bucket, object_key,
     url_publica, filename_original, mime, size_bytes).
   - Inserta el valor del campo en `envio.datos[field_path]` server-side.
4. **Respuesta** (`EnvioUploadResponse`):
   `{ field_path, url_publica, object_key, filename_original, mime, size_bytes }`.
   El frontend guarda este objeto como valor del campo (lo consume `SummaryStep`
   y el PDF); el `PUT .../envio` posterior lo reenvia tal cual, pero
   `_preservar_archivos_del_servidor` **ignora** lo que mande el cliente en un
   campo `file` y conserva el valor que puso la subida (un valor vacio si se
   respeta: asi se quita un archivo). Eso cierra la puerta a apuntar un campo a
   una URL arbitraria.

**Donde queda el archivo:** en Acervo, en el bucket que declare `field.bucket`
(actualmente `sieej`), con esta convencion de claves (mariachi 1.91.1):

```
{slug}/{usuario}-{envio_id}[/{periodo}]/{step}.{campo}/{ts}-{nombre}-{sufijo}.{ext}
{slug}/{usuario}-{envio_id}[/{periodo}]/envio.json
```

```
mundial/admin-2/alta_archivos.base_de_datos/20260727T171309Z-direccion-de-integracion-0baab7.xlsx
censo/sedeco-enlace-23/2026-01/general.padron/20260115T090000Z-padron-4c2b1a.csv
```

Sustituye a la convencion anterior `{slug}/envio{id}/{uuid}.{ext}`, con la que
el bucket quedaba ilegible: que archivo es cada UUID, a que campo pertenece y
cual de varias versiones es la vigente solo se sabia cruzando con
`envio_archivo`. Ahora hay **un directorio por campo** con sus versiones
ordenadas cronologicamente, el nombre original sanitizado viaja en la clave con
un sufijo de 6 hex anticolision, el indice de los repeaters se aplana
(`bases_datos[0].diccionario` -> `bases_datos-0.diccionario`) y el periodo solo
aparece si el formulario es periodico.

Junto a los archivos se escribe un **`envio.json`** con `formulario`, `envio`,
`usuario`, `datos`, `definicion_snapshot` y el catalogo de `archivos`:
suficiente para reconstruir el envio sin la BD. Se actualiza al enviar, al
actualizar campos y al reemplazar un archivo — no en cada guardado de borrador.
Es best-effort de punta a punta: nunca puede tumbar el envio del respondent.

**El bucket `sieej` esta marcado `protegido`** en `acervo.buckets`: el
explorador del CMS oculta borrar, editar, mover, subir y crear carpeta, y los
endpoints de escritura de `/acervo` responden 409 **incluso al admin**. Su
contenido lo gestiona el flujo de formularios y sus claves estan referenciadas
desde `envio_archivo` y `envio.datos`.

### Admin — `/sieej/...`
Gateado por `staff_dep` (`tetlamamakani` + `editora`).

| Verbo | Path | |
|---|---|---|
| GET | `/sieej/stats` | Metricas de envios |
| GET/POST | `/sieej/formularios` | Lista (filtros estado/slug) / Crea |
| GET/PUT/DELETE | `/sieej/formularios/:id_or_slug` | CRUD completo. El `PUT` acepta `actualizado_en_esperado` (bloqueo optimista, 409) |
| POST | `/sieej/formularios/:id/publicar` | estado=activo |
| POST | `/sieej/formularios/:id/cerrar` | estado=cerrado |
| PUT | `/sieej/formularios/:id/asignaciones` | Reemplazo de grupos+usuarios |
| GET | `/sieej/formularios/:id/envios` | Lista paginada con filtro estado |
| GET | `/sieej/formularios/:id/envios/:envio_id` | Detalle + archivos |
| POST | `/sieej/formularios/:id/envios/:envio_id/reabrir` | Devuelve un envio `enviado`/`expirado` a `en_proceso`, conservando su version |
| GET | `/sieej/formularios/:id/envios/:envio_id/historial` | Historial de valores corregidos, con actor |
| GET | `/sieej/formularios/:id/periodos` | Ventanas de captura de un formulario periodico |
| GET | `/sieej/formularios/:id/notificaciones[/exportar]` | Bitacora de avisos (`?formato=csv\|xlsx`) |
| GET | `/sieej/formularios/presencia` | Presencia de **todos** los formularios en un scan (se declara antes que la ruta con parametro) |
| GET/PUT/DELETE | `/sieej/formularios/:id/presencia` | Quien esta editando / heartbeat / salida |
| POST | `/sieej/periodos/tick` | Corre el motor de apertura periodica (idempotente) |
| POST | `/sieej/expirar-envios-pendientes` | Bulk-expire de envios fuera de vigencia |
| GET/POST | `/sieej/grupos` | Lista / Crea (acepta `usuarios: int[]` atomico) |
| GET/PUT/DELETE | `/sieej/grupos/:id` | CRUD |
| GET/PUT | `/sieej/grupos/:id/usuarios` | Lista miembros / Reemplazo |
| GET/POST | `/sieej/catalogos` | Lista con total de opciones y campos enlazados / Crea |
| GET/POST | `/sieej/catalogos/:clave` | Opciones con conteo `en_uso` / Agrega opcion |
| PUT/DELETE | `/sieej/catalogos/:clave` | Renombra el `label` (la `clave` es inmutable) / Elimina (409 si esta en uso) |
| PUT/DELETE | `/sieej/catalogos/:clave/:item_id` | Renombra opcion (propaga a los envios) / Elimina (409 si esta en uso) |
| PUT | `/sieej/catalogos/:clave/reordenar` | Reordena las opciones (columna `posicion`) |

**Slugs reservados** (rechazados al crear formulario): `inicio-sesion`,
`exencion`, `cambiar-contrasena`, `error`, `regisño`, `catalogos`,
`schema`, `envio`, `mis-envios`.

## Frontend SIEEJ

### Routing
- `/` — `FormList` (lista de formularios visibles en tarjetas, con busqueda
  siempre visible; el toggle grid/lista se retiro).
- `/:slug` — `FormPage` (renderer dinamico).
- `/mis-envios/:id` — `EnvioDetalle` (vista de revisión read-only con
  `definicion_snapshot`, timeline y adjuntos).
- `/mis-envios/:id/actualizar` — `EnvioActualizar` (solo los campos
  `editableAfterSubmit` de un envio ya enviado).
- Reservadas: `/inicio-sesion`, `/exencion`, `/cambiar-contrasena`,
  `/error`. Declaradas literal antes de `/:slug` para precedencia (igual
  que las de `/mis-envios`).
- El listado `/mis-envios` se elimino: era redundante con «Mis formularios».

### Estructura
```
src/
├── Routes.jsx
├── pages/{FormList,FormPage,EnvioDetalle,EnvioActualizar,Login,ChangePassword,...}.jsx
├── forms/
│   ├── components/
│   │   ├── wizard/{StepIndicator,NavigateStep,Tabs}.jsx
│   │   ├── EventTimeline.jsx
│   │   └── EnvioAdjuntos.jsx
│   ├── context/
│   │   ├── {FormsContext,SubmissionContext,WizardContext}.jsx + hooks
│   │   └── CatalogosContext.jsx + useCatalogos.js
│   ├── renderer/
│   │   ├── {FormRenderer,StepRenderer,FormStep,RepeaterStep,SummaryStep,FieldRenderer}.jsx
│   │   ├── {conditional,catalogResolver,completeness,editableFields}.js
│   │   ├── {fieldValue,repeaterItems}.js
│   │   └── pdf/
│   │       ├── SummaryPdfButton.jsx              (dynamic-import del template)
│   │       ├── genericPdf.jsx                    (cualquier formulario)
│   │       └── templates/sieej-levantamiento/    (excepcion documentada)
│   │           ├── index.jsx                     (downloadSieejLevantamientoPdf)
│   │           └── PdfForm.jsx                   (245 LOC custom)
│   └── ...
├── services/{authServices,formulariosServices}.js
├── components/{Input,Select,Radio,DatePicker,DateRangePicker,Calendar,Checkbox,
│               Dragger,IncompleteBadge,AccessDenied,...}.jsx
├── helpers/{normalizeUser,DynamicDiv,gridLayout,FieldHints,fieldHints,
│            sessionRefresh,formErrors,ErrorsRequired,...}.{js,jsx}
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
`VITE_BACKEND_API_HOST=/api/mariachi` (sin sufijo). El prefijo anterior
`/api/administrador` sigue montado en mariachi-api por compatibilidad.

**Renovacion de sesion** (1.47.1): el `access_token` vive 30 min y se renueva
con el `refresh_token` (8 h deslizantes) llamando a
`POST /autenticacion/refrescar`. Ante un 401, `onFetch` intenta renovar una vez
y reintenta la peticion original; solo si la renovacion falla se limpia la
sesion y se va al login. `runExclusiveRefresh` (`helpers/sessionRefresh.js`)
serializa la renovacion entre pestañas con `navigator.locks` y una marca en
`localStorage`: SIEEJ y Mariachi comparten origen y cookie, y si ambas rotan el
mismo token a la vez la deteccion de reuso del backend revoca la familia y las
saca a las dos. **Toda peticion autenticada debe pasar por `onFetch`.**

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
- `pages/FormulariosListPage.jsx` — grid de tarjetas con busqueda, filtro de
  estado y tres ordenamientos; crear (modal slug/nombre/descripcion) y
  publicar/cerrar/eliminar.
- `pages/FormularioEditorPage.jsx` — tabs Definicion / Configuracion /
  Periodos (solo si es periodico) / Asignaciones / Envios, bookmarkables con
  `?tab=`.
- `pages/GruposPage.jsx` — CRUD de grupos + miembros (`MemberPicker`).
- `pages/CatalogosPage.jsx` — CRUD de catalogos y opciones, con reordenamiento
  por arrastre y tag «Sistema» en los que el producto necesita.
- `components/DefinicionEditor.jsx` — toggle Visual / JSON.
- `components/visualEditor/` — drag-n-drop con `@dnd-kit`:
  `StepsList` → `FieldsList` → `StepDrawer`/`FieldForm`, mas
  `LayoutControls`/`fieldLayout.js` (acomodo manual), `CatalogPicker`,
  `OptionsSource`, `ShowWhenField`, `OpenRangeConfig`, `TabsManager` y
  `fieldClipboard.js`.
- `components/{ConfiguracionEditor,AsignacionesEditor,EnviosTable,PeriodosPanel,PresenciaEditores}.jsx`.

**Crear un formulario** manda solo `slug`, `nombre`, `descripcion` y una
definicion semilla de un paso; el backend lo guarda en `borrador` con
`version: 1` y el editor se abre enseguida. Publicar es un paso aparte y
explicito: hasta entonces ningun respondent lo ve.

**Edicion concurrente** (mariachi 1.85.0): el `PUT` de la definicion lleva
`actualizado_en_esperado` y responde **409** con quien guardo y cuando en vez de
pisar — importa porque guardar una definicion vieja puede clasificarse como
cambio que rompe y reabrir envios ya enviados. Ademas hay presencia en Redis
(TTL 30 s): avatares de quien esta editando, en el header del editor y en cada
tarjeta del listado. La presencia es un aviso; quien garantiza es el 409.

**Copiar / Pegar / Duplicar campo**: el portapapeles vive en `localStorage`
(`mariachi.sieej.fieldClipboard`) para cruzar formularios y pestañas del
navegador; `prepareFieldForPaste` normaliza al pegar (nombre duplicado →
sufijo, `tab` → pestaña activa, `showWhen` huerfano → se quita, `bucket` sin
acceso → `sieej`) y avisa de cada ajuste. Sin backend.

**El acomodo es explicito y no se reorganiza solo** (mariachi 1.96.0+): antes de
cada cambio de acomodo, el editor fija la linea (`newRow`) y la columna (`col`) de
todos los campos visibles, asi que cambiar el ancho de uno no mueve a los demas.
Como consecuencia, la `definicion` guarda ambas en todos los campos del paso.
Los espacios libres son **zonas soltables** mientras se arrastra, de modo que un
campo se puede llevar a una columna concreta de otra linea; un hueco no se ofrece
si el campo arrastrado no cabe en el. Arrastrar sobre otra tarjeta **intercambia
las dos ranuras** en vez de reordenar la lista, que era lo que desplazaba lineas
enteras sin tocarlas.

Sidebar: grupo SIEEJ con items "Formularios", "Grupos" y "Catalogos".

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

## Apertura periodica (1.35.0)

Un formulario puede abrir una **ventana de captura recurrente** en vez de tener
una vigencia unica. La config vive en `formulario.periodicidad` (JSONB;
`null` = formulario no periodico):

```jsonc
{
  "frecuencia": "mensual" | "trimestral" | "semestral" | "anual",
  "dia_inicio": 1,        // dia del primer mes del periodo en que abre (1..28)
  "duracion_dias": 7,     // largo de la ventana
  "ancla": "2026-01-01"   // opcional: no abre ventanas antes de esta fecha
}
```

- **Un envio por periodo.** Cada ventana genera un envio nuevo
  (`envio_formulario.periodo_id` -> `sieej.formulario_periodo`), de modo que el
  historico por periodo no se sobreescribe. El `UNIQUE (formulario, usuario)` se
  partio en dos indices unicos parciales para que los formularios no periodicos
  conserven su invariante (migracion `f9a0b1c2d3e4` en mariachi).
- **"Abierto" se computa de la config**, no de un estado guardado: el gating es
  correcto aunque el cron no haya corrido. Fuera de ventana las escrituras
  responden 409, y un envio en proceso expira al `cierre` de **su** periodo.
- **Listado del respondent.** `GET /formularios/` agrega `periodico`, `abierto`,
  `ventana_apertura`, `ventana_cierre` y `proxima_apertura`. Los formularios
  periodicos siguen visibles con la ventana cerrada (para poder anunciar cuando
  vuelve a abrir): `FormList` muestra "Abierto hasta {fecha}" o el distintivo
  "Cerrado · proxima apertura {fecha}".
- **Avisos.** Al abrir se notifica al creador del formulario; el respondent se
  entera in-app (lo ve abierto en su lista). Al cerrar se reportan los
  **faltantes** solo al creador y a los administradores. Cada aviso queda en
  `sieej.notificacion` y sale best-effort por el webhook de Discord de SIEEJ; la
  bitacora se exporta a CSV/XLSX desde la pestaña "Periodos" del CMS. No hay
  correo: el stack no tiene SMTP.
- **Motor.** `PeriodosService.tick()` (idempotente) materializa las ventanas,
  abre, cierra, expira y avisa. Lo corre el sidecar `cron-sieej`
  (`scripts/sieej_periodos_tick.py`); `POST /sieej/periodos/tick` lo dispara a
  mano — es la via de prueba en dev, que no levanta el cron.

Detalle backend en `mariachi/docs/sieej.md`, seccion "Apertura periodica".

## Versionado de definiciones

Cada envio congela `formulario_version` + `definicion_snapshot` al iniciarse, y
`cambio_classifier.py` clasifica cada edicion de la definicion:

- **Cambio `menor`** — se propaga en silencio a los envios `en_proceso`,
  reescribiendo su snapshot. **No** incrementa `formulario.version`. Ejemplos:
  label, tooltip, layout, orden, campo opcional nuevo, opciones nuevas,
  validacion mas floja.
- **Cambio `rompe`** — incrementa `formulario.version`, archiva la definicion
  previa en `sieej.formulario_version` y **reabre** los envios ya `enviado`
  (evento `reabierto`), que deben reenviarse sobre la definicion vigente
  conservando `datos`.

Desde SIEEJ 1.28.0 la actualizacion **se aplica sola**: al cargar el formulario
(o al detectar en un guardado que el admin publico a media sesion) el frontend
llama `POST /formularios/{slug}/envio/actualizar-version` y sigue con el envio
migrado. El respondent solo ve avisos: etiqueta «Actualizacion» en la tarjeta,
panel `UpdateBanner` («Ver cambios» / «Entendido») y distintivos por paso y
campo, que se apagan al interactuar (`cambios_vistos` viaja en el `PUT`).

Los valores de campos eliminados **permanecen** en el JSONB `datos`: dejan de
renderizarse y de salir en el PDF, pero el export admin une las definiciones
historicas con la vigente, asi que si salen marcados «(eliminado)» y con la
columna «Version» de cada envio.

## Actualizacion ligera post-envio

Alternativa a la reapertura para correcciones puntuales. Un campo marcado
`editableAfterSubmit` se corrige sobre un envio ya `enviado` **sin reabrirlo**:
el estado no cambia y no pasa por la solicitud via Colibri.

- Pantalla dedicada `/mis-envios/:id/actualizar` (`pages/EnvioActualizar.jsx`),
  que renderiza solo esos campos.
- Los paths permitidos se derivan del `definicion_snapshot`; **la marca la manda
  la definicion vigente** (mariachi 1.89.0), porque es politica del admin, no
  contrato de datos: activarla despues alcanza a los envios ya enviados, que son
  justo los que se quieren corregir.
- Aplica a **cualquier tipo de campo**, repeaters y `file` incluidos (mariachi
  1.88.0). Los `file` van por `POST .../actualizar-archivo`, no por el `PUT`.
- Merge **parcial** de `datos` y una fila append-only por cambio en
  `sieej.envio_valor_historial`, mas un evento `actualizado`. Los no-op no
  generan historial.
- `GET /formularios/` expone `tiene_campos_editables` por item (mariachi
  1.87.0), asi que el acceso se pinta en la tarjeta de la lista, en el paso
  Resumen y en el encabezado del detalle sin tener que abrir el envio.

## Compatibilidad de definiciones legadas

Cada vez que el contrato se endurece, los formularios que ya viven en produccion
quedan fuera de el. `compat.py::normalizar_definicion` (mariachi 1.86.0) traduce
cualquier definicion historica al contrato vigente: es **idempotente** y **solo
relaja**, nunca inventa campos ni endurece reglas.

Reglas actuales: `tel`/`email` → `text` + patron; tipo desconocido → `text`;
`select`/`radio` sin `options` ni `catalog` → `text`; campo de repeater con
`tabs` sin `tab` valido → primera pestaña; `info` sin label (espaciadores) → se
elimina; `file` sin `bucket` → `sieej`; `maxSizeMB` sobre el cap → 100;
`colSpan` fuera de rango → acotado; `pattern` que no compila, `showWhen`
huerfano o cruzado entre steps → se descartan.

Se aplica en tres capas —lectura, escritura y persistencia (migracion
`c3d4e5f6a7b9`)— de modo que **un deploy no depende de que la migracion de datos
haya corrido**. Lado SIEEJ, el renderer hace el mismo fallback para los
snapshots historicos (1.40.0: un tipo de campo desconocido ya no rompe el
formulario).

Al endurecer el validador: agregar la regla equivalente en `compat.py` y una
definicion real en `api/tests/fixtures/sieej/legacy/`.

## Decisiones cerradas

- **Editor JSON como source of truth**: el visual transforma JSON, no
  al reves. Toggle bidireccional valida el JSON al cambiar de view.
- **Validacion compartida**: backend es la fuente. Frontend recibe
  `validation_rules` planos por `GET /formularios/:slug/schema`. Desde 1.50.0
  las condiciones (`patternMessage`, minimo, conteo hasta el maximo) se muestran
  y se evaluan mientras se escribe, en vez de solo al fallar.
- **Upload por campo**: `field.bucket` resuelve a un bucket del Acervo
  preexistente. Cap absoluto 100 MB (alineado con
  `client_max_body_size` del gateway-hub).
- **El valor de un campo `file` lo escribe el servidor**: el cliente no puede
  sobrescribirlo. Contrato unico
  `{field_path, url_publica, object_key, filename_original, mime, size_bytes}`.
- **PDF custom solo cuando hay flag**: por default los formularios
  usan el generico. `sieej-levantamiento` es la unica excepcion
  documentada.
- **Slug reservado list**: hardcoded en
  `mariachi/api/app/services/sieej/formularios_admin_service.py`.
  Si se agrega ruta literal nueva al frontend, actualizar la lista.

## Referencias

- **Contrato backend completo (fuente de verdad): `mariachi/docs/sieej.md`.**
- Modelos: `mariachi/api/app/models/sieej/`
- Validators: `mariachi/api/app/services/sieej/{definicion,datos}_validator.py`
- Compatibilidad: `mariachi/api/app/services/sieej/compat.py` +
  `scripts/sieej_check_definiciones.py` (`make sieej-check`)
- Clasificador de cambios: `mariachi/api/app/services/sieej/cambio_classifier.py`
- Claves del Acervo: `mariachi/api/app/services/sieej/acervo_keys.py`
- Migration inicial: `e7f8a9b0c1d2_init_sieej_schema.py` (catalogos +
  wizard, antes del refactor).
- Migration plataforma: `a4b5c6d7e8f9_add_sieej_formularios_dinamicos.py`
- Migration seed: `b5c6d7e8f9aa_seed_sieej_levantamiento.py`
- Migration drop wizard: `c6d7e8f9ab01_drop_wizard_sieej_tables.py`
- Migration pdfTemplate: `d7e8f9a0b1c2_sieej_levantamiento_pdf_template.py`
- Migration periodos: `f9a0b1c2d3e4` · historial de valores: `f2b3c4d5e6a7` ·
  normalizacion legada: `c3d4e5f6a7b9`
- Tests: `mariachi/api/tests/test_sieej_*.py` (13 archivos, ~250 tests)
- CHANGELOGs: `sieej/docs/CHANGELOG.md` y `mariachi/docs/CHANGELOG.md`
  para la historia version-por-version.
