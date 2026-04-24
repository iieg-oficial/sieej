# Changelog

Todas las notas relevantes del proyecto SIEEJ. Formato basado en
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y
[SemVer](https://semver.org/lang/es/).

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
