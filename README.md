# SIEEJ frontend

Frontend del **Sistema de Información Estadística del Estado de Jalisco** —
plataforma de captura para que dependencias e instituciones de gobierno
entreguen información estructurada al IIEG.

**Version:** 1.52.2
**Repo:** [iieg-oficial/sieej](https://github.com/iieg-oficial/sieej)

> **Backend**: este repositorio **solo** contiene el frontend. La API la
> sirve `mariachi/api` bajo `/api/administrador/formularios/*` (modulo
> SIEEJ con schema dedicado `sieej` en `mariachi`).
>
> **Despliegue**: el `dist/` generado se sirve directamente desde
> `gateway-hub` en `/sieej/` (bind mount al volumen del nginx, igual
> patron que usa el resto del ecosistema con su `proxy_pass`).

## Requisitos

- Docker >= v28.2.2
- Docker Compose >= v2.36.2
- Node.js 24 (si quieres correr fuera de Docker)
- Git >= 2.48
- Mariachi corriendo en `localhost:8000` (la api lo provee)

## Inicio rapido

### Desarrollo

```bash
make dev
# Frontend (Vite):     http://localhost:5174
# Backend (mariachi):  http://localhost:8000/api/administrador
```

`make dev` invoca `make ensure-env` que copia `.env.development` desde
`.env.example` la primera vez. El proxy de Vite reenvía las llamadas
`/api/*` al `BACKEND_DEV_TARGET`.

### Tests y lint

```bash
cd frontend
npm run lint         # ESLint flat config (plugin react + hooks)
npm run test         # vitest (suite logica pura)
npm run test:watch
```

### Build para staging/produccion

```bash
cp .env.example .env.production
# Editar VITE_BASE_PATH=/sieej/ y demas.

make build
# Genera ./frontend/dist/ con base path /sieej/
# gateway-hub lo sirve via bind mount (ver gateway-hub/docker-compose.yml).
```

## Comandos disponibles

| Comando | Descripcion |
|---------|-------------|
| `make dev` | Modo desarrollo (Vite hot-reload) |
| `make build` | Construir `dist/` consumido por gateway-hub |
| `make ensure-env` | Crea `.env.development` desde `.env.example` si falta |
| `make down` | Detener servicios de desarrollo |
| `make logs` | Ver logs |
| `make status` | Estado de los servicios |
| `make clean` | Detener servicios y limpiar `dist/`, `node_modules/`, volumenes |

## Variables de entorno

Ver `.env.example`. Las clave:

- `VITE_BASE_PATH` — `/` en dev, `/sieej/` en staging/prod.
- `VITE_BACKEND_API_HOST` — `/api/administrador` (apunta a las rutas de mariachi).
- `BACKEND_DEV_TARGET` — `http://host.docker.internal:8000` (mariachi-api en dev).
- `VITE_DISABLED_EDITION` — bandera para mostrar `ClosePage` en lugar del listado.
- `VITE_APP_ENV` — `dev`/`beta`/`prod` (controla el `EnvBadge`).
- `VITE_SENTRY_DSN` — opcional; si vacio, Sentry no se inicializa.

GA4 se inyecta por `gateway-hub` via GTM; no requiere variable en el
frontend.

## Arquitectura

### Desarrollo

```
Browser
   |
   v
Vite Dev (:5174)
   |- assets, index.html
   `- /api/* --proxy--> http://host.docker.internal:8000 (mariachi-api)
                                |
                                v
                        cookie+CSRF + PostgreSQL
                                |
                                v
                            Acervo (MinIO) para diccionarios
```

### Staging / produccion

```
Browser HTTPS
   |
   v
gateway-hub (:443)
   `- /sieej/        --> alias /usr/share/nginx/html/sieej (dist montado por gateway-hub)
   `- /api/admin/... --> portal --> mariachi-api FastAPI
```

## Stack

- **React 19** + **React Router 7** (sin `react-router-dom`)
- **Vite 6** + `@vitejs/plugin-react` + `@tailwindcss/vite`
- **Tailwind CSS 4** con paleta institucional centralizada en `@theme`
  (`--color-sieej-primary`, `--color-sieej-bg`, etc.)
- **react-hook-form** para formularios multi-paso
- **@react-pdf/renderer** (chunk on-demand, no en initial bundle)
- **@sentry/react** para error tracking (opcional)
- **vitest** + **@testing-library/react** para tests
- **GTM** inyectado por `gateway-hub` (no SDK de GA en el bundle)

## Auth

- Backend devuelve `csrf_token` + cookie HttpOnly (`access_token`).
- Frontend guarda CSRF en `sessionStorage['sieej_csrf_token']`.
- Cada `fetch` lleva `credentials: 'include'`. Mutaciones inyectan `X-CSRF-Token`.
- 401 limpia CSRF y redirige a `/inicio-sesion`.

## Documentacion

| Documento | Descripcion |
|-----------|-------------|
| [Contexto del proyecto](docs/context.md) | Referencia completa: arquitectura, decisiones, integracion con mariachi |
| [Arquitectura](docs/arquitectura.md) | Diagramas y flujos |
| [Frontend](docs/frontend.md) | Detalles tecnicos del frontend |
| [Gateway](docs/gateway.md) | Como se enruta `/sieej/` via gateway-hub |
| [CHANGELOG](docs/CHANGELOG.md) | Historial de cambios |
| [Contribucion](docs/CONTRIBUTING.md) | Flujo de trabajo, convenciones |
| [Codigo de conducta](docs/CODE_OF_CONDUCT.md) | Normas |

## Licencia

MIT - IIEG Jalisco. Ver [LICENSE](./LICENSE).
