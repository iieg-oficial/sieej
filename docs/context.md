# SIEEJ frontend — Contexto del proyecto

**Version:** 1.29.0
**Fecha de este documento:** 2026-07-17
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
  a `/api/administrador/formularios/...` siguen yendo al upstream
  `portal` (= mariachi-api).
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
  `sieej` (nombre canonico tras renombrar `sieej-diccionarios`), bajo la
  ruta `{slug}/envio{id}/{uuid}.{ext}` para escalar a multiples encuestas.
  El valor del campo guarda la respuesta del backend (`url_publica`,
  `filename_original`), no el `File` local.
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
  del admin. En esta version solo aplica a campos de pasos `form` (repeaters y
  `file` quedan fuera). Requiere mariachi api >= 1.75.0.

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
   `-- /api/administrador/* --proxy--> http://host.docker.internal:8000
                                              |
                                              v
                                    mariachi-api (FastAPI)
                                              |
                                              |-- PostgreSQL (mariachi)
                                              |-- Redis (mariachi)
                                              `-- Acervo MinIO (diccionarios)
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
- **Routes**: `mariachi/api/app/api/routes/formularios/__init__.py`:
  - `GET /catalogos`
  - `GET|POST|PUT|DELETE /general[/{id}]`
  - `GET|POST|PUT|DELETE /enlaces[/{id}]`
  - `GET|POST|PUT|DELETE /bases-datos[/{id}]`
  - `POST /bases-datos/{id}/diccionario` (upload via Acervo)
- Todos protegidos por `Depends(require_project_access('sieej'))`.
- Migration: `alembic/versions/mariachi/e7f8a9b0c1d2_init_sieej_schema.py`
  (rama mariachi, NO dataengine).

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
| `VITE_BACKEND_API_HOST` | Prefijo del API. Siempre `/api/administrador`. |
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
- acervo: `../acervo/` — MinIO compartido para media.
