# SIEEJ frontend — Contexto del proyecto

**Version:** 1.52.0
**Fecha de este documento:** 2026-07-28
**Repo:** https://github.com/iieg-oficial/sieej

Referencia general del proyecto SIEEJ. Para detalles de arquitectura
de la plataforma de formularios dinamicos (modelo de datos, endpoints,
schema JSONB, renderer, constructor visual), ver
**`docs/plataforma-formularios.md`**.

## Resumen

SIEEJ es la **plataforma web de recoleccion de formularios** para que las
dependencias e instituciones de gobierno del Estado de Jalisco entreguen
al IIEG informacion estructurada sobre:

1. Datos generales del ente de gobierno.
2. Enlaces tecnicos.
3. Inventario de bases de datos y sus diccionarios.

Tras la migracion del 2026-04-24, **este repositorio solo contiene el
frontend**. El backend, la base de datos y la infraestructura comun
viven en `mariachi`.

## Decisiones relevantes

- **Eliminacion del backend propio.** El backend FastAPI/SQLModel que
  vivia en `SIEEJ/backend/` se absorbio dentro de `mariachi/api` como
  modulo `formularios`. Razones: una sola DB (`mariachi`), Alembic
  desde el dia 1, integracion nativa con Acervo (SeaweedFS), borradores ya
  implementados, RBAC multi-proyecto, rate-limit y Sentry. El stub
  `formularios.py` que mariachi tenia con 501 se reemplazo por
  implementacion completa.
- **Schema dedicado `sieej`.** Las 12 tablas (8 catalogos + general +
  enlace + bases_datos + bd_ejes_estrategicos) viven en
  `mariachi.sieej.*`. Aislado de `public` para facilitar
  mantenimiento y eventual migracion.
- **Postgres y Redis externos a SIEEJ.** Provistos por mariachi. SIEEJ
  no levanta servicios de datos.
- **Sin nginx propio.** SIEEJ es 100% estatico. El `dist/` se sirve
  directamente desde `gateway-hub` con un location `^~ /sieej/`
  (`alias` + `try_files ... /sieej/index.html`). Mismo patron que
  cualquier ingress nginx con un dist puro.
- **Sin upstream `sieej` en el gateway.** No hace falta porque
  gateway-hub sirve los archivos directamente sin proxy. Las llamadas
  a `/api/mariachi/formularios/...` siguen yendo al upstream
  `portal` (= mariachi-api).
- **Prefijo del API: `/api/mariachi`.** El `admin_prefix` de mariachi-api
  cambio de `/api/administrador` a `/api/mariachi`; el prefijo viejo sigue
  montado por compatibilidad, pero `VITE_BACKEND_API_HOST` ya apunta al
  nuevo en `.env.development` y `.env.example`. Si se despliega contra un
  mariachi anterior al cambio, hay que revertir la variable.
- **Auth con cookie HttpOnly + CSRF.** Migrado de localStorage+Bearer a
  el patron oficial de mariachi (cookie + `X-CSRF-Token` header).
- **Catalogos expuestos por keys del backend.** Desde 1.9.0 el
  `CatalogosContext` (movido a `forms/context/`) expone
  `catalogos: { unidades_admin, categoria_datos, ... }` con los nombres
  que el JSONB de la `definicion` usa en `field.catalog`. El antiguo
  remap a aliases en ingles dejaba los selects dinamicos sin opciones.
- **Sin UserContext.** El `useAuth().user` ya viene normalizado con
  `nombre`/`apellido` (helper `helpers/normalizeUser.js`) — antes habia
  un `UserContext` que duplicaba el shape llamando a `getProfile` por
  segunda vez.
- **PDF on-demand.** El bundle `vendor-pdf` (~1.4 MB) solo se carga al
  hacer click en "Descargar PDF" gracias a dynamic imports en
  `forms/renderer/pdf/SummaryPdfButton.jsx`.
- **Repo separado del backend.** El frontend se maneja en
  `iieg-oficial/sieej` (privado, branch default `develop`, `production`
  protegida con require PR + 1 approval + commit-lint).
- **DataEngine queda fuera del alcance.** SIEEJ no toca la BD externa
  PostGIS de DataEngine. Cualquier cambio futuro a DataEngine va en
  rama `prod-migracion` con `alembic -x db=dataengine`.
- **Subida de archivos por campo.** Los campos `type=file` se suben al
  instante via `POST /formularios/:slug/envio/upload` al bucket Acervo
  `sieej` (nombre canonico tras renombrar `sieej-diccionarios`). Desde
  mariachi 1.91.1 la clave es legible —
  `{slug}/{usuario}-{envio_id}[/{periodo}]/{step}.{campo}/{ts}-{nombre}-{sufijo}.{ext}`
  — con un directorio por campo y sus versiones ordenadas dentro, en vez del
  `{slug}/envio{id}/{uuid}.{ext}` anterior. El valor del campo guarda la
  respuesta del backend (`url_publica`, `object_key`, `filename_original`), no
  el `File` local; el backend **ignora** lo que mande el cliente en un campo
  `file` y conserva lo que escribio la subida. El bucket esta marcado
  `protegido`: el explorador del CMS no permite tocarlo a mano.
- **Formularios enviados abren el resumen read-only.** Cuando el
  `estado_envio === 'enviado'`, al hacer clic en una tarjeta del listado
  el frontend navega a `/mis-envios/{envio_id}` (resumen de solo lectura
  con header sticky, tabs moviles y boton PDF) en lugar de abrir el
  wizard de captura. La navegacion depende del campo `envio_id` que
  devuelve `GET /formularios/` desde mariachi api >= 1.48.0.
- **Pantalla "Mis envios" eliminada.** La ruta `/mis-envios` (listado
  paginado de envios) se elimino por redundante con "Mis formularios",
  que ya muestra el estado de cada formulario. Solo se conserva el
  detalle individual `/mis-envios/:id`. Si en el futuro el levantamiento
  se vuelve periodico y admite multi-envio por formulario, se reevalua
  reintroducir una vista de historial.
- **Busqueda siempre visible en Mis formularios.** Un input de busqueda
  con icono de lupa junto al titulo, siempre desplegado y ocupando el
  ancho disponible. Filtrado client-side por nombre, descripcion y slug.
  Sin toggle grid/lista: solo vista en tarjetas (grid), columnas
  adaptativas (1/2/3). En mobile los controles de busqueda ocupan toda la
  fila debajo del titulo.
- **Acciones directas en formularios enviados.** Las tarjetas de
  formularios con `estado_envio === 'enviado'` muestran un footer con la
  etiqueta de estado y dos botones de accion: descarga de PDF (fetch del
  detalle del envio + generacion client-side via `@react-pdf/renderer`) y
  solicitud de reapertura via Colibri (panel pre-llenado con `envioId` y
  nombre del formulario, tipo `solicitud`). El polyfill de `Buffer`
  (`buffer/` + `global: 'globalThis'` en vite.config.js) permite que la
  generacion de PDF funcione desde cualquier ruta.
- **PDF usa el nombre del formulario.** El titulo del documento y el
  nombre de archivo del PDF usan `definicion.nombre` en lugar del titulo
  generico legacy ("Registro de enlaces para el Sistema de Informacion
  Estrategica del Estado de Jalisco").
- **Versionado de envios (requiere mariachi-api >= 1.55.0).** Cada envio
  guarda `formulario_version` y `definicion_snapshot`. Al editar la
  definicion de un formulario con envios, el backend clasifica el cambio
  (`mariachi/api/app/services/sieej/cambio_classifier.py`): un cambio
  `menor` se propaga en silencio al snapshot de los envios en proceso;
  un cambio que `rompe` sube `formulario.version`, reabre los envios ya
  enviados y activa `actualizacion_disponible`. Desde 1.28.0 la
  actualizacion se aplica sola: al cargar el formulario (o al detectar
  en un guardado que el admin publico a media sesion) el frontend llama
  `POST /formularios/{slug}/envio/actualizar-version` y sigue con el
  envio migrado. El respondent solo ve avisos: etiqueta "Actualizacion"
  en la tarjeta (`FormList`), panel informativo `UpdateBanner` ("Ver
  cambios" + "Entendido") y distintivos por paso/campo
  (`cambios_aplicados`: punto en el sider, badges "Nuevo"/"Cambio") que
  se apagan al interactuar con el campo o al dar Entendido
  (`cambios_vistos` viaja en el PUT del envio). Los valores de campos
  eliminados permanecen en el JSONB `datos` (ningun paso los poda);
  dejan de renderizarse y de salir en el PDF. Cada cambio `rompe`
  archiva la definicion previa en `sieej.formulario_version`
  (mariachi >= 1.57.0); el export admin (Excel o CSV,
  `?formato=csv|xlsx`) une esas definiciones historicas con la vigente,
  asi que los campos eliminados si salen, marcados "(eliminado)" y con
  la columna "Version" de cada envio.
- **Tooltip en pasos.** Ademas de los campos, cada paso admite un
  `tooltip` (icono de ayuda junto al titulo, en `NavigateStep`). En el
  header sticky del wizard el mensaje se despliega hacia abajo
  (`Tooltip placement="bottom"`) para que ni el header ni la barra
  superior lo tapen. El icono del tooltip (comun a campos y pasos)
  requirio forzar `!p-0 !border-0` en su boton: el reset global
  `button {}` de `index.css` esta fuera de `@layer` y en Tailwind v4
  ganaba sobre las utilities, aplastando el `<img>` a ancho 0.
- **Actualizacion ligera de campos post-envio.** Un campo puede marcarse
  `editableAfterSubmit` en la definicion (toggle en el CMS). Los envios ya
  `enviado` exponen una pantalla dedicada (`/mis-envios/:id/actualizar`,
  `pages/EnvioActualizar.jsx`) que renderiza solo esos campos y hace
  `PUT /formularios/mis-envios/:id/actualizar-campos`. No reabre el envio (el
  estado sigue en `enviado`) ni pasa por la solicitud de reapertura via
  Colibri. El backend valida contra el `definicion_snapshot` que cada campo
  enviado este realmente marcado, hace merge parcial de `datos` (no reemplazo)
  y guarda cada cambio en un historial append-only para el reporte de auditoria
  del admin. **Ya no se limita a los pasos `form` (1.42.0)**: acepta campos de
  listas repetibles (con indice en el path) y campos `file`, que van por
  `POST /formularios/mis-envios/:id/actualizar-archivo` en vez del `PUT`.
  Requiere mariachi api >= 1.88.0, y >= 1.89.0 para que marcar un campo
  **despues** del envio alcance a los envios ya enviados (la marca la manda la
  definicion vigente, no el snapshot: es politica del admin, no contrato de
  datos).
- **Acceso visible a «Actualizar informacion» (1.41.0).** `GET /formularios/`
  expone `tiene_campos_editables` por item (mariachi >= 1.87.0), asi que el
  acceso a `/mis-envios/:id/actualizar` se pinta en la tarjeta de la lista, en
  el paso Resumen y en el encabezado del detalle, sin tener que abrir el envio.
- **Historial por campo visible para el respondent (1.43.0–1.47.0).** Cada
  campo actualizable cuelga su propio historial (`valor anterior → valor nuevo`
  + fecha, una fila por cambio), con la paleta naranja de los distintivos de
  cambio. Los valores se formatean con la misma funcion que el resumen:
  resuelve la etiqueta contra el catalogo o las opciones del campo y traduce
  las booleanas a «Si»/«No», en vez de imprimir el valor crudo.
- **Renovacion de sesion propia (1.47.1).** El `access_token` vive 30 min y el
  `refresh_token` 8 h deslizantes; renovar es responsabilidad del cliente. Ante
  un 401, `onFetch` llama `POST /autenticacion/refrescar` una vez y reintenta la
  peticion; solo si la renovacion falla se limpia la sesion y se va al login.
  `runExclusiveRefresh` (`helpers/sessionRefresh.js`) la serializa entre
  pestañas con `navigator.locks`: SIEEJ y Mariachi comparten origen y cookie, y
  si ambas rotan el mismo token a la vez la deteccion de reuso del backend
  revoca la familia y las saca a las dos. **Toda peticion autenticada debe pasar
  por `onFetch`** — `downloadEnvioPdf` era la excepcion que fallaba.
- **Un tipo de campo desconocido no rompe el formulario (1.40.0).** El renderer
  degrada a texto en vez de tumbar el paso, en linea con
  `compat.py::normalizar_definicion` del backend (mariachi 1.86.0).
- **Acomodo manual de campos (1.49.0).** `layout.col` ancla el campo a una
  columna de la rejilla (`md:col-start-{n}`, con `newRow` como caso particular)
  y `layout.alone` le reserva la linea completa. El calculo salio a
  `helpers/gridLayout.js`, compartido por `DynamicDiv` y `FieldRenderer`. Va de
  la mano de mariachi 1.94.0.
- **El acomodo se calcula, no se deduce (1.51.0).** `gridLayout.js` agrupa los
  campos en lineas con el **mismo algoritmo que el editor del CMS**
  (`groupIntoRows`) y emite cada campo con su columna mas rellenos que completan
  la linea. Antes el renderer dejaba el corte de lineas al auto-placement del
  navegador mientras el editor lo decidia con su propio modelo: con posicion
  explicita divergian, y un campo con «linea reservada» acababa compartiendola
  porque `col-end-7` bloquea la derecha pero no la izquierda. El agrupamiento
  corre sobre los campos **visibles**, asi que un campo oculto por `showWhen` no
  deja hueco. El contrato esta fijado en `test/fixtures/layoutContract.js`,
  duplicado identico en mariachi para que los dos repos verifiquen el mismo
  acomodo. Va de la mano de mariachi 1.95.0.
- **Las reglas del campo se leen mientras se escribe (1.50.0).** Debajo del
  input se listan las condiciones del campo (`patternMessage`, «Minimo N
  caracteres», conteo `escritos/maximo`), que se pintan verde al cumplirse y
  rojo mientras no. `validation.minLength` **se registra** y bloquea el avance
  igual que el backend; el salto entre pasos desde el indice lateral y el envio
  revisan los obligatorios de **todos** los pasos, no solo del visible.
- **Un campo, una pestaña en las listas repetibles (1.39.0).** En un step
  `repeater` con `tabs`, cada campo pertenece a exactamente una pestaña.
  `RepeaterStep` resuelve la pestaña con fallback a la primera cuando el `tab`
  falta o apunta a una que ya no existe: antes un campo sin `tab` se repetia en
  todas las pestañas y uno con `tab` invalido no se renderizaba en ninguna.
  El CMS (mariachi >= 1.85.0) elimino la pestaña «Comunes» y exige `tab`.
- **Apertura periodica de formularios (1.35.0).** Un formulario puede abrir una
  ventana recurrente (`mensual`/`trimestral`/`semestral`/`anual`, con dia de
  apertura y duracion en dias) en vez de una vigencia unica, y **cada periodo
  genera un envio nuevo**, de modo que el historico por periodo no se
  sobreescribe. El estado "abierto" se computa de la configuracion y no de un
  estado guardado, asi que el gating es correcto aunque el cron no haya corrido.
  `FormList` distingue "Abierto hasta {fecha}" de "Cerrado · proxima apertura
  {fecha}". Los avisos (apertura al creador; faltantes al creador y a los
  administradores) salen por el webhook de Discord de SIEEJ y quedan en una
  bitacora exportable a CSV/XLSX desde la pestaña "Periodos" del CMS; no hay
  correo porque el stack no tiene SMTP. Requiere la migracion `f9a0b1c2d3e4`
  de mariachi.

## Arquitectura

### Modo desarrollo

```
Browser
   |
   v
Vite Dev Server (:5174)
   |
   |-- /assets, index.html              (servidos con HMR)
   |
   `-- /api/mariachi/*      --proxy--> http://host.docker.internal:8000
                                              |
                                              v
                                    mariachi-api (FastAPI)
                                              |
                                              |-- PostgreSQL (mariachi)
                                              |-- Redis (mariachi)
                                              `-- Acervo SeaweedFS (bucket sieej)
```

### Modo staging / produccion

```
Browser HTTPS
   |
   v
gateway-hub (Nginx :443, TLSv1.2/1.3, HSTS)
   |
   |-- /sieej/      --> alias /usr/share/nginx/html/sieej/
   |                    (bind mount de sieej/frontend/dist read-only,
   |                     servido directamente por gateway-hub)
   |
   |-- /api/...     --> portal --> mariachi-api (FastAPI Gunicorn)
   |
   |-- /administrador/, /mapalab/, /acervo/, /geoserver/...
```

## Backend SIEEJ en mariachi (referencia rapida)

- **Modelos**: `mariachi/api/app/models/sieej/`.
- **Schemas**: `mariachi/api/app/schemas/sieej/`.
- **Services**: `mariachi/api/app/services/sieej/`.
- **Routes respondent**: `mariachi/api/app/api/routes/formularios/`:
  - `GET /formularios/catalogos` — bundle `{clave: [{id, value}]}`
  - `GET /formularios/` · `GET /formularios/{slug}` · `GET /formularios/{slug}/schema`
  - `GET|PUT /formularios/{slug}/envio` · `POST /formularios/{slug}/envio/upload`
  - `POST /formularios/{slug}/envio/actualizar-version`
  - `GET|DELETE /formularios/mis-envios/{envio_id}`
  - `PUT /formularios/mis-envios/{envio_id}/actualizar-campos` · `GET .../historial`
- Todos protegidos por `Depends(require_project_access('sieej'))`.
- Las rutas del CMS (`/sieej/*`: formularios, grupos, catalogos, envios,
  periodos, notificaciones) las consume mariachi-admin, no este frontend.
- Migraciones en `alembic/versions/mariachi/` (rama mariachi, NO dataengine).
  Las tablas del wizard estatico original (`general`, `enlace`, `bases_datos`,
  `bd_ejes_estrategicos`) se eliminaron en `c6d7e8f9ab01`; hoy todo pasa por
  `formulario` + `envio_*` con la definicion en JSONB.

## Auth flow (frontend)

1. App monta → `AuthContext.handleCheckAuth()` → `GET /autenticacion/perfil`.
2. Si 200: `isAuthenticated = true`. Si 401: navega a `/inicio-sesion`.
3. Login: `POST /autenticacion/iniciar-sesion {username, password}` →
   cookie HttpOnly + `csrf_token` en JSON.
4. Frontend guarda `csrf_token` en `sessionStorage['sieej_csrf_token']`.
5. `onFetch(url, options)` siempre `credentials:'include'` y agrega
   `X-CSRF-Token` solo en POST/PUT/DELETE/PATCH. No muta el `body`
   recibido; soporta `FormData`/`URLSearchParams`/`Blob`/string;
   serializa el resto a JSON.
6. 401 → limpiar CSRF + redirect.
7. `setUser` siempre pasa por `normalizeUser(...)` para garantizar
   `nombre`/`apellido`.
8. **Cambio de contraseña** (`POST /autenticacion/cambiar-contrasena`):
   el backend (mariachi) rota la cookie JWT y devuelve un `csrf_token`
   fresco; sin eso la sesión quedaba inválida (el `iat` anterior a
   `password_changed_at` daba 401 en `/perfil`). `ChangePassword.jsx`
   persiste ese token en `CSRF_KEY` (exportado por `AuthContext`).
9. **Sin acceso al proyecto** (403 al listar formularios): `FormsContext`
   expone `errorStatus` y `FormList` muestra `components/AccessDenied.jsx`
   (pantalla amable + cerrar sesión) en lugar del error genérico.

## Variables de entorno

| Variable | Rol |
|----------|-----|
| `VITE_BASE_PATH` | `/` en dev, `/sieej/` en staging/prod. |
| `VITE_BACKEND_API_HOST` | Prefijo del API. `/api/mariachi` (antes `/api/administrador`, aun aceptado por el backend). |
| `VITE_PORT`, `FRONTEND_PORT` | Puerto Vite (default 5174). |
| `VITE_DISABLED_EDITION` | Si truthy, MainLayout muestra ClosePage. |
| `VITE_APP_ENV` | `dev`/`beta`/`prod`. Usado por `EnvBadge`. |
| `VITE_SENTRY_DSN` | Opcional. Si vacio, Sentry no se inicializa. |
| `BACKEND_DEV_TARGET` | Target del proxy Vite (`http://host.docker.internal:8000`). |
| `NETWORK_NAME` | Red Docker (default `sieej-network`). |

## Operacion

- `make ensure-env` — copia `.env.development` desde `.env.example` si
  falta (lo invocan `dev` y `build` automaticamente).
- `make dev` — Vite + hot-reload + proxy a mariachi-api.
- `make build` — genera `frontend/dist` con base path `/sieej/`.
- `make down`, `make clean`, `make logs`, `make status` — utilitarios.
- `npm run test` (en `frontend/`) — vitest (14 tests sobre logica pura
  del renderer). `npm run test:watch` para iterar.
- `npm run lint` (en `frontend/`) — eslint flat config con plugin react.

Prerrequisitos:
- mariachi corriendo localmente (`make up` en `mariachi/`).
- Postgres y Redis los provee mariachi.

## Pendientes / observaciones

- **Login portado a mariachi admin.** El mockup oficial es el de SIEEJ
  (2 columnas + logos + copy "Hola"). Se replica en
  `mariachi/admin/src/features/auth/pages/LoginPage.jsx`.
- **CSP estricta en gateway-hub.** Hallazgo #8 de la auditoria 1.9.0;
  requiere inventario de origenes externos (Sentry DSN, GTM/GA) y
  editar `gateway.conf.template`. No se aplico en 1.9.0.
- **Migracion a TypeScript.** Hallazgo #28 de la auditoria 1.9.0;
  sprint dedicado, afecta 50+ archivos. Recomendado despues con
  generacion de tipos desde el OpenAPI de `mariachi/api`.
- **Storybook + i18n.** Sembrados como propuesta (auditoria 1.9.0);
  proyectos enteros, fuera del alcance.

## Referencias

- mariachi: `../mariachi/` — backend + admin CMS.
- gateway-hub: `../gateway-hub/` — reverse proxy publico + TLS.
- mapalab: `../mapalab/` — proyecto hermano (mismo patron de infra).
- acervo: `../acervo/` — SeaweedFS (S3-compatible) compartido para media.
