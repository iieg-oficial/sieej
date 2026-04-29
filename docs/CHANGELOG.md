# Changelog

Todas las notas relevantes del proyecto SIEEJ. Formato basado en
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y
[SemVer](https://semver.org/lang/es/).

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
