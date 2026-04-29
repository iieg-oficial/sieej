# SIEEJ frontend — Contexto del proyecto

**Version:** 1.1.4
**Fecha de este documento:** 2026-04-24
**Repo:** https://github.com/iieg-oficial/sieej

Referencia unica del estado actual de SIEEJ tras la migracion del backend
a `mariachi/api` y la simplificacion de la infraestructura.

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
  modulo `formularios`. Razones: una sola DB (`iieg_portal`), Alembic
  desde el dia 1, integracion nativa con Acervo (MinIO), borradores ya
  implementados, RBAC multi-proyecto, rate-limit y Sentry. El stub
  `formularios.py` que mariachi tenia con 501 se reemplazo por
  implementacion completa.
- **Schema dedicado `sieej`.** Las 12 tablas (8 catalogos + general +
  enlace + bases_datos + bd_ejes_estrategicos) viven en
  `iieg_portal.sieej.*`. Aislado de `public` para facilitar
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
- **Repo separado del backend.** El frontend se maneja en
  `iieg-oficial/sieej` (privado, branch default `develop`, `production`
  protegida con require PR + 1 approval + commit-lint).
- **DataEngine queda fuera del alcance.** SIEEJ no toca la BD externa
  PostGIS de DataEngine. Cualquier cambio futuro a DataEngine va en
  rama `prod-migracion` con `alembic -x db=dataengine`.

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
   `X-CSRF-Token` solo en POST/PUT/DELETE/PATCH.
6. 401 → limpiar CSRF + redirect.

## Variables de entorno

| Variable | Rol |
|----------|-----|
| `VITE_BASE_PATH` | `/` en dev, `/sieej/` en staging/prod. |
| `VITE_BACKEND_API_HOST` | Prefijo del API. Siempre `/api/administrador`. |
| `VITE_PORT`, `FRONTEND_PORT` | Puerto Vite (default 5174). |
| `VITE_DISABLED_EDITION` | Si truthy, MainLayout muestra ClosePage. |
| `VITE_GOOGLE_ANALYTICS_ID` | Opcional. |
| `BACKEND_DEV_TARGET` | Target del proxy Vite (`http://host.docker.internal:8000`). |
| `NETWORK_NAME` | Red Docker (default `sieej-network`). |
| `SIEEJ_DIST_PATH` | (en mariachi/.env) ruta al dist montado en mariachi-nginx (default `../SIEEJ/frontend/dist`). |

## Operacion

- `make dev` — Vite + hot-reload + proxy a mariachi-api.
- `make build` — genera `frontend/dist` con base path `/sieej/`.
- `make down`, `make clean`, `make logs`, `make status` — utilitarios.

Prerrequisitos:
- mariachi corriendo localmente (`make up` en `mariachi/`).
- Postgres y Redis los provee mariachi.

## Pendientes / observaciones

- **Mover `frontend/` al repo `iieg-oficial/sieej`.** Hoy el codigo vive
  en `/home/egar/IIEG/SIEEJ/frontend/`. Cuando se mueva, agregar a ese
  repo: `ci.yml` (lint+build), `test-frontend.yml`, etc.
- **Login portado a mariachi admin.** El mockup oficial es el de SIEEJ
  (2 columnas + logos + copy "Hola"). Se replica en
  `mariachi/admin/src/features/auth/pages/LoginPage.jsx`.

## Referencias

- mariachi: `../mariachi/` — backend + admin CMS.
- gateway-hub: `../gateway-hub/` — reverse proxy publico + TLS.
- mapalab: `../mapalab/` — proyecto hermano (mismo patron de infra).
- acervo: `../acervo/` — MinIO compartido para media.
