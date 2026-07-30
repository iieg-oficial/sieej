# SIEEJ frontend

Frontend del **Sistema de Información Estadística del Estado de Jalisco** —
plataforma de captura para que dependencias e instituciones de gobierno
entreguen información estructurada al IIEG.

**Version:** ver `frontend/package.json` y el [changelog](docs/CHANGELOG.md)
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
make up
# Frontend (Vite):     http://localhost:5174
# Backend (mariachi):  http://localhost:8000/api/administrador
```

`make up` invoca `make setup` que copia `.env.development` desde
`.env.example` la primera vez. El proxy de Vite reenvía las llamadas
`/api/*` al `BACKEND_DEV_TARGET`.

### Tests y lint

```bash
cd frontend
npm run lint         # ESLint flat config (plugin react + hooks)
npm run test         # vitest (suite logica pura)
npm run test:watch
```

### Build para produccion

```bash
cp .env.example .env.production
# Editar VITE_BASE_PATH=/sieej/ y demas.

make deploy
# Genera ./frontend/dist/ con base path /sieej/
# gateway-hub lo sirve via bind mount (ver gateway-hub/docker-compose.yml).
```

## Comandos disponibles

| Comando | Descripcion |
|---------|-------------|
| `make up` | Modo desarrollo (Vite hot-reload) |
| `make deploy` | Construir `dist/` consumido por gateway-hub |
| `make setup` | Crea `.env.development` desde `.env.example` si falta |
| `make down` | Detener servicios de desarrollo |
| `make logs` | Ver logs |
| `make status` | Estado de los servicios |
| `make clean` | Detener servicios y limpiar `dist/`, `node_modules/`, volumenes |

## Variables de entorno

Ver `.env.example`. Las clave:

- `VITE_BASE_PATH` — `/` en dev, `/sieej/` en produccion.
- `VITE_BACKEND_API_HOST` — `/api/administrador` (apunta a las rutas de mariachi).
- `BACKEND_DEV_TARGET` — `http://host.docker.internal:8000` (mariachi-api en dev).
- `VITE_DISABLED_EDITION` — bandera para mostrar `ClosePage` en lugar del listado.
- `VITE_APP_ENV` — `dev`/`beta`/`prod` (controla el `EnvBadge`).

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

### Produccion

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
- **Vite 8** (Rolldown) + `@vitejs/plugin-react` + `@tailwindcss/vite`
- **Tailwind CSS 4** con paleta institucional centralizada en `@theme`
  (`--color-sieej-primary`, `--color-sieej-bg`, etc.)
- **react-hook-form** para formularios multi-paso
- **@react-pdf/renderer** (chunk on-demand, no en initial bundle)
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
| [Arquitectura](docs/arquitectura.md) | Diagramas y flujos |
| [Frontend](docs/frontend.md) | Detalles tecnicos del frontend |
| [CHANGELOG](docs/CHANGELOG.md) | Historial de cambios |
| [Contribucion](docs/CONTRIBUTING.md) | Flujo de trabajo, convenciones |
| [Codigo de conducta](docs/CODE_OF_CONDUCT.md) | Normas |

El contexto del proyecto, la plataforma de formularios dinamicos y el contrato de enrutamiento con
gateway-hub viven en el repositorio central de contexto: `repos/sieej/` y `ecosistema/contratos.md`.

## Licencia

MIT - IIEG Jalisco. Ver [LICENSE](./LICENSE).
