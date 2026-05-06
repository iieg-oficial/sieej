# Changelog

Todas las notas relevantes del proyecto SIEEJ. Formato basado en
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y
[SemVer](https://semver.org/lang/es/).

## [1.4.0] - 2026-05-06

Plataforma de formularios SIEEJ — Fase 5 cutover frontend. La home (`/`)
ahora redirige al listado dinamico (`/formularios`); la version del
wizard hardcodeado queda accesible temporalmente en `/legacy-wizard`
hasta que el backfill se valide en prod con datos reales.

### Changed

- **`Routes.jsx`**: `/` ahora hace `<Navigate to="/formularios" replace />`.
  El wizard original (Home.jsx) se mueve a `/legacy-wizard` como
  fallback durante la transicion de Fase 5.
- El frontend dinamico ahora consume el formulario seed
  `sieej-levantamiento` que mariachi 0.37.0 inyectó en la BD.

### Bump

- **`VERSION`** -> 1.4.0.
- **`frontend/package.json`** -> 1.4.0.
- **`frontend/public/ontoy.json`** -> 1.4.0.

### Pendiente (cleanup post-validacion)

- Eliminar `pages/Home.jsx`, ruta `/legacy-wizard`, contextos
  `HomeContext` + helpers `initDatabase`/`pdfActions`/`textLarge`
  + componentes `GeneralStep` / `LinksStep` / `ListDatabaseStep` /
  `DataBaseStep` / `ResumeStep` cuando el backfill confirme datos
  migrados correctamente.

---

## [1.3.0] - 2026-05-06

Plataforma de formularios dinamicos en SIEEJ — Fase 3 (frontend).
Aterriza el renderer generico que consume definiciones JSON desde
`mariachi/api`. El wizard SIEEJ existente sigue intacto en `/`; el
sistema dinamico convive en `/formularios` y `/formularios/:slug`. La
union/desmantelamiento del wizard sucede en Fase 5.

### Added

- **`src/services/formulariosServices.js`**: cliente del API respondent
  (`/formularios/...`) usando `onFetch` del `AuthContext` para heredar
  cookie + CSRF.
- **`src/forms/renderer/`** (motor generico): `FormRenderer` con
  react-hook-form, `StepRenderer` (despacha por step.type),
  `FormStep`, `RepeaterStep` (con `useFieldArray` y soporte de tabs
  internas), `SummaryStep`, `FieldRenderer` (mapea field.type a las
  primitivas existentes — Input, Select, SelectMultiple, Radio,
  Checkbox, DatePicket, Dragger, Typography). Helpers
  `conditional.js` (showWhen) y `catalogResolver.js`.
- **`src/forms/context/`**: `FormsContext` (lista de formularios
  visibles + cache), `SubmissionContext` (envio activo: cargar,
  guardar borrador, enviar, subir archivo), `WizardContext`
  (currentStep + visited + navegacion). Hooks en archivos separados
  (`useForms.js`, `useSubmission.js`, `useWizard.js`).
- **`src/pages/FormList.jsx`** (ruta `/formularios`): tarjetas
  clickeables con estado del envio (no_iniciado / en_proceso /
  enviado / expirado).
- **`src/pages/FormPage.jsx`** (ruta `/formularios/:slug`): monta
  `SubmissionProvider + WizardProvider + FormRenderer`. Usa los
  catalogos del `CatalogProvider` existente.
- **`vite.config.js`**: alias `@forms` → `src/forms/`.

### Changed

- **`src/Routes.jsx`**: rutas nuevas `formularios` y
  `formularios/:slug` dentro del `ProtectedRoute`. El wizard SIEEJ
  sigue en `/` sin cambios. Cuando aterrice Fase 5, `/` redirige a
  `/formularios` o sirve la lista directo.

### Bump

- **`VERSION`** -> 1.3.0.
- **`frontend/package.json`** -> 1.3.0.
- **`frontend/public/ontoy.json`** -> 1.3.0.

---

## [1.2.3] - 2026-05-06

Plan de plataforma de formularios: cierre de Fase 1 (backend respondent)
y Fase 2 (backend admin) en `mariachi/api`. Ajuste de namespace en el
plan tras descubrir el `sieej_admin.router` existente. Sin cambios
funcionales en el frontend.

### Changed

- **`docs/planes/plataforma-formularios.md`**: seccion 5.2 corregida —
  el prefix de admin es `/sieej` (no `/admin/sieej`), alineado con el
  router existente que ya expone `/sieej/stats`. Listado de endpoints
  admin actualizado para reflejar lo implementado en mariachi 0.35.0
  (CRUD formularios + publicar/cerrar + asignaciones + listar envios +
  CRUD grupos + miembros + GET miembros).
- **`docs/planes/plataforma-formularios.md`**: seccion "Estado de
  implementacion" actualizada — Fase 1 y Fase 2 marcadas como
  completas, con referencias a la migration `a4b5c6d7e8f9` y al
  conteo de tests (47 + 19 = 66 nuevos en mariachi).

### Bump

- **`VERSION`** -> 1.2.3.
- **`frontend/package.json`** -> 1.2.3.
- **`frontend/public/ontoy.json`** -> 1.2.3.

---

## [1.2.2] - 2026-05-06

Audit del plan de plataforma de formularios contra el estado real de los repos vecinos. Cierre de decisiones que la version original del plan dejo abiertas y reflejo del avance de implementacion. Sin cambios funcionales en el frontend.

### Changed

- **`docs/planes/plataforma-formularios.md`**: agregada seccion "Estado de implementacion (2026-05-06)" con el avance real por capa (backend, admin, frontend, gateway, docs). Corregida la referencia de Alembic head — la cadena en mariachi es lineal, head real es `d3e4f5a6b7c8_scope_media_folders_to_bucket.py`. Documentado el conflicto de namespace que tenia el esqueleto `mariachi/admin/src/features/sieej-formularios/`. Versiones del stack frontend SIEEJ aterrizadas (Vite 6.2, RHF 7.54, RR 7.2).
- **`docs/planes/plataforma-formularios.md`**: nueva seccion "Decisiones cerradas en este audit" con cierre de pendientes — auditoria via `envio_evento`, estado `expirado` para envios vencidos, PDF en frontend con `@react-pdf/renderer`, validacion compartida via endpoint `/formularios/:slug/schema` con reglas declarativas, preview separado en AntD para el constructor, politica de archivos en Acervo (limites por campo, buckets via `MediaBucket`, MIME validation, job de limpieza de huerfanos).
- **`docs/planes/plataforma-formularios.md`**: actualizada seccion 3.1 (modelo de datos) con tabla `envio_evento` (auditoria liviana del ciclo de vida de los envios) y campo `expirado_en` mas estado `expirado` en `envio_formulario`. Actualizada seccion 4.3 con notas de bucket existente, MIME y cap de 100 MB.
- **`docs/planes/plataforma-formularios.md`**: agregadas secciones 14-18 — estrategia de tests (matriz pytest backend + vitest frontend), generacion de PDF (decision opcion a), validacion compartida (decision endpoint con `validation_rules` planos), preview en el constructor (decision duplicar logica con lint sync), politica de archivos en Acervo (limites + huerfanos).
- **`docs/context.md`** (v1.1.4 -> v1.1.5): callout al inicio apuntando al plan en marcha. Quitado el pendiente "mover frontend al repo iieg-oficial/sieej" (ya esta hecho — este es ese repo).
- **`docs/arquitectura.md`** y **`docs/frontend.md`**: disclaimer al inicio aclarando que describen el estado pre-plataforma; apuntan al plan para el estado futuro.

### Bump

- **`VERSION`** -> 1.2.2.
- **`frontend/package.json`** -> 1.2.2.
- **`frontend/public/ontoy.json`** -> 1.2.2.

---

## [1.2.1] - 2026-04-29

Documentacion actualizada para reflejar que el dist de SIEEJ ahora se sirve directamente desde `gateway-hub` (>= v1.24.0), no desde `mariachi-nginx`. Sin cambios funcionales en el frontend.

### Changed

- **`README.md`**: nota de despliegue, comandos `make`, variables de entorno y diagrama de staging/produccion ahora apuntan a `gateway-hub` como origen del dist. Removida la mencion de `react-ga4` y `VITE_GOOGLE_ANALYTICS_ID` de la lista de stack/variables (sieej no los usa desde 1.2.0; estaban como deuda en el README).
- **`docs/gateway.md`**: reescrito el diagrama de enrutamiento. Antes mostraba `gateway-hub -> proxy_pass portal -> mariachi-nginx -> alias /sieej`. Ahora describe el flujo correcto: `gateway-hub -> alias /usr/share/nginx/html/sieej` con `try_files` y `bind mount` desde `../sieej/frontend/dist`. Snippet del `gateway.conf.template` actualizado y troubleshooting hace referencia a `gateway-hub-nginx-1` en lugar de `mariachi-nginx`.
- **`docs/context.md`**: la decision "Sin nginx propio" ahora explica que SIEEJ es 100% estatico y `gateway-hub` lo sirve con `alias`. Diagrama de staging/produccion actualizado al nuevo flujo.
- **`docs/frontend.md`**: la nota del `make build` ahora indica que `gateway-hub` consume el dist (no `mariachi-nginx`).
- **`docs/analytics.md`**: el modelo del flujo de GTM aclara que `gateway-hub` aplica el `sub_filter` directo sobre el `index.html` que sirve, sin intermediarios.
- **`Makefile`**: `make help` y la nota final mencionan a `gateway-hub` como consumidor del dist.

### Bump

- **`VERSION`** -> 1.2.1.
- **`frontend/package.json`** -> 1.2.1.
- **`frontend/public/ontoy.json`** creado (antes solo existia en `dist/`, lo que provocaba que se borrara en cada `make build`). Ahora vive en `public/` y Vite lo copia al dist en cada build.
- **`frontend/dist/ontoy.json`** actualizado a 1.2.1 (regenerable con `make build`).

---

## [1.2.0] - 2026-04-25

Homologacion del sistema de analytics al patron mapalab: GA4 se inyecta exclusivamente via GTM en el `gateway-hub`. SIEEJ ya no inicializa `react-ga4` ni depende de `VITE_GOOGLE_ANALYTICS_ID`. Los eventos custom siguen disponibles a traves de `window.dataLayer.push(...)` cuando GTM esta presente.

### Removed

- Dependencia `react-ga4` del `package.json`.
- `ReactGA.initialize(...)` en `src/main.jsx`.
- `import ReactGA from 'react-ga4'` y `ReactGA.event(...)` en `AuthContext`, `GlobalContext`, `UserContext` y `HomeContext`.

### Added

- `src/helpers/analytics.js` con `pushAnalyticsEvent(category, action, label)`. Es no-op si `window.dataLayer` no existe (e.g. dev sin GTM, build sin gateway por encima). En dev sin GTM imprime un `console.debug` para ayudar a depurar.
- Documentacion en `docs/analytics.md` describiendo el patron, el formato del evento (`event: 'sieej_event'`, `category`, `action`, `label`) y como configurar GTM/GA4 en el lado del gateway.

### Changed

- `package.json` bumped a 1.2.0 (minor por cambio de pipeline de analytics).
- `VERSION` -> 1.2.0.

### Notes

- El gateway-hub inyecta el snippet de GTM en `</head>` y `</body>` via `nginx/includes/gtm.inc.template` con la variable `GTM_ID`. Cualquier producto servido detras del gateway hereda esa configuracion sin instalar SDK.
- Para dev local sin gateway, `dataLayer` no existe; los eventos se pierden silenciosamente (es lo deseado para que el dev no tenga que tocar configuracion).
- Si en algun momento se necesita un tracking distinto al de GTM (medicion privada, debugging), se puede inyectar `window.dataLayer = []` y un consumer manual antes de cargar el bundle.

---

## [1.1.4] - 2026-04-24 (unreleased - refactor de infra)

### Changed
- Estructura del repo alineada con mapalab:
  - Raiz unificada con `backend/`, `frontend/`, `nginx/` hermanos.
  - `docker-compose.yml` unico con profiles (`dev` / `build` / `staging`) +
    `docker-compose.override.yml` para desarrollo con `network_mode: host`.
  - `.env.development`, `.env.staging`, `.env.production` separados.
  - `Makefile` orquestador (`make dev|staging|prod|down|clean|status`).
  - `VERSION=1.1.4` en la raiz como fuente unica de versionado.
- Backend:
  - `main.py` -> `server.py` (alineado a mapalab).
  - `config.py` migrado de dict + Configuration base a
    `pydantic-settings.BaseSettings`, con validador de `CORS_ORIGINS`.
    Se conservan wrappers `DatabaseConfig` y `JwtConfig` por
    retrocompatibilidad.
  - Routers sin `prefix="/api/v0.1"`; el prefijo `/api/` lo gestiona
    nginx (staging/gateway) y el proxy de Vite (dev).
  - `Dockerfile` multi-stage (development/production) con
    `gunicorn + UvicornWorker` en prod.
  - Endpoint `/health` agregado (usado por healthcheck Docker y
    gateway).
  - Swagger/ReDoc expuestos solo cuando `ENVIRONMENT != production`.
- Frontend:
  - `BrowserRouter basename` parametrizado via `VITE_BASE_PATH` (antes
    hardcodeado a `/enlaces`). Nuevo default: `/` en dev, `/sieej/` en
    staging/prod.
  - `vite.config.js` con aliases de import (`@components`, `@context`,
    `@helpers`, `@services`, `@assets`, ...) y proxy de dev
    `/api -> BACKEND_DEV_TARGET` con `rewrite`.
  - `Dockerfile.dev` (Vite) + `Dockerfile` (builder multi-stage).
- Nginx:
  - Un unico `nginx/` en la raiz para staging; sirve `dist/` y hace
    `proxy_pass /api/ -> http://backend/` (strip del prefijo).

### Added
- `docs/` con documentacion consolidada:
  `context.md`, `arquitectura.md`, `backend.md`, `frontend.md`,
  `gateway.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`.
- Integracion con `gateway-hub`:
  - `SIEEJ_HOST` agregado en `.env.example`, `.env` y `docker-compose.yml`.
  - `upstream sieej` + `location ^~ /sieej/` + `location ^~ /sieej/api/`
    en `gateway.conf.template`.
  - Readme del gateway-hub actualizado (tabla de enrutamiento +
    variables).

### Removed
- Contenedor `db: postgres:17` del compose (Postgres queda externo,
  igual que mapalab).
- `forms-page-backend/` como sub-directorio (se aplana a `backend/`).
- Docker-compose legados: `docker-compose.override.yml`,
  `docker-compose.production.yml`, `docker-compose.testing.yml`
  anteriores.
- READMEs duplicados (`backend/README.md`, `frontend/README.md`,
  `backend/ARCHITECTURE.md`, etc.) consolidados en `docs/`.
- Archivos `CHANGELOG` antiguos (backend y frontend) migrados a
  `docs/CHANGELOG.md`.
- `nginx/mapamuestra/` y `nginx/certs/` (recursos obsoletos).

## [1.1.4] - 2025-08-27 (historico backend)

### Added
- Documentacion del modulo license.
- Actualizacion de guias de contribucion.
- Logica de validacion de formularios.
- Endpoints de autenticacion.

### Changed
- Refactor del manejo de conexion a base de datos.
- Actualizacion del formato de respuestas del API.
- Mejor manejo de errores en el envio de formularios.

### Fixed
- Corregidos problemas de CORS en endpoints.
- Bugs de validacion de tokens.
- Formato de documentacion.

## [1.1.4] - 2025-05-15 (historico frontend)

### Added
- Documentacion completa del API en Swagger.
- Guia de usuario en Markdown.
- Documentacion tecnica para desarrolladores.
- Funcionalidad de exportacion de datos de tablas.
- Sistema avanzado de filtros para tablas.
- Control de acceso basado en roles (RBAC).
- Gestion del perfil de usuario.
- Sistema de recuperacion de contrasena.
- Servicio de notificaciones por email.
- Optimizaciones de rendimiento.

### Fixed
- Problemas de paginacion en tablas.
- Mecanismo de refresco del token de autenticacion.
- Errores de validacion de formularios.
- Bugs de layout responsivo en mobile.

## [0.9.1] - 2025-04-20

### Added
- Configuracion de autenticacion JWT.
- Endpoints del API para autenticacion (GET, POST, PUT).
- Endpoints del API para la tabla general (GET, POST, PUT).
- Theme color para navegadores.
- Setup de Docker y docker compose.
- Sistema de layout para tablas.
- Sistema de catalogos para selects y multiselects.
- Providers de contexto (autenticacion, home, global, catalogs, users).
- Estructura de layout principal (header, body, footer).
- Paginas nuevas: About us, Home, Login, Register, Terms, 404.
- Componentes: Button, CardPage, Checkbox, Input, Radio, Select,
  MultiSelect, Spinner, Typography, Tooltip, etc.
- Funciones helpers.

### Removed
- Servicio de Supabase.

## [0.1.0] - 2025-01-20

### Added
- Setup inicial del repositorio en GitLab.
- Package.json + TailwindCSS + React Router + Vite.
- Mockups de Login y Home.
- Configuracion inicial de Supabase (removido en 0.9.1).
