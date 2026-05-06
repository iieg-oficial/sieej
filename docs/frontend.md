# SIEEJ Frontend

> **Nota:** este documento describe stack, requisitos y comandos de
> dev. Para la arquitectura del renderer de formularios dinamicos,
> contextos y estructura de `forms/`, ver
> **`docs/plataforma-formularios.md`**.

React 19 + Vite 6 + Tailwind CSS 4. SPA con un renderer generico de
formularios cuyas definiciones viven en `mariachi/api`.

## Requisitos

- Node.js 24 (recomendado, mismo que mapalab).
- npm 11+.
- Mariachi corriendo localmente (provee la API).

## Arranque

### Con Docker

```bash
make dev
# http://localhost:5174
```

### Sin Docker

```bash
cd frontend
npm install

# Crear frontend/.env con variables:
# VITE_PORT=5174
# VITE_BASE_PATH=/
# VITE_BACKEND_API_HOST=/api/administrador
# VITE_NODE_ENV=development
# VITE_APP_ENV=dev
# BACKEND_DEV_TARGET=http://localhost:8000

npm run dev
```

## Estructura del codigo

```
frontend/
├── Dockerfile               # Build prod (node 24 alpine)
├── Dockerfile.dev           # Vite dev
├── eslint.config.js         # Flat config
├── index.html               # Title=SIEEJ, theme-color #5C2472
├── package.json             # name=sieej-frontend@1.1.4
├── vite.config.js           # base, aliases, proxy /api passthrough
├── public/                  # favicons, fonts Garet, manifest
└── src/
    ├── main.jsx             # Providers + Router
    ├── Routes.jsx           # Login, Home (protegida), Disclaimer, NoMatch
    ├── index.css            # Tailwind + @font-face Garet + scrollbar
    ├── components/          # UI: Button, Input, Select, Modal, Tabs,
    │                        # PdfForm, GeneralStep, LinksStep, etc.
    ├── layout/MainLayout.jsx
    ├── pages/               # Home, Login, Disclaimer, ClosePage, NoMatch
    ├── context/             # 5 providers (ver abajo)
    ├── services/authServices.js  # postLogin, postLogout, getProfile
    ├── helpers/             # Transformaciones (cleanObject, booleanToString,
    │                        # objectToFormData, etc.)
    └── assets/
        ├── fonts/           # Garet Bold/Medium/Regular/Book
        ├── icons/
        ├── png/
        └── svg/             # Logos SIEEJ, IIEG, Jal
```

## Aliases

Configurados en `vite.config.js`:

| Alias | Ruta |
|-------|------|
| `@components` | `src/components` |
| `@layout` | `src/layout` |
| `@pages` | `src/pages` |
| `@context` | `src/context` |
| `@helpers` | `src/helpers` |
| `@services` | `src/services` |
| `@assets` | `src/assets` |
| `@icons` | `src/assets/icons` |
| `@png` | `src/assets/png` |
| `@svg` | `src/assets/svg` |
| `@fonts` | `src/assets/fonts` |

## Providers

```jsx
<BrowserRouter basename={VITE_BASE_PATH}>
    <GlobalProvider>      {/* steps, tabs, modal, regex, hostBackend */}
        <AuthProvider>    {/* cookie+CSRF, onFetch, login/logout, checkAuth */}
            <CatalogProvider>  {/* fetch /formularios/catalogos al loguearse */}
                <UserProvider>     {/* perfil */}
                    <HomeProvider>     {/* CRUD del wizard */}
                        <Routes />
```

### Auth

`AuthContext`:
- En mount: `GET /autenticacion/perfil` → si 200 setUser; si 401 redirect.
- `onLogin({username, password})`: `POST /autenticacion/iniciar-sesion`,
  guarda `csrf_token` en `sessionStorage`, `setUser`.
- `onLogout`: `POST /autenticacion/cerrar-sesion`, limpia.
- `onFetch(url, options)`:
  - `credentials: 'include'`.
  - Inyecta `X-CSRF-Token` en `POST/PUT/DELETE/PATCH`.
  - Serializa body a JSON si no es FormData/URLSearchParams.
  - 401 → setUser(null) + redirect a `/inicio-sesion`.

### Catalogos

`CatalogContext`:
- Cuando `isAuthenticated` cambia a true, hace
  `GET /formularios/catalogos` y mapea las 8 colecciones a variables que
  consumen los componentes:

| Variable expuesta | Catalogo backend |
|---|---|
| `unidadesAdministrativas` | `unidades_admin` |
| `informationCategories` | `categoria_datos` |
| `jaliscoAreas` | `ejes_estrategicos` |
| `periodicity` | `periodicidad` |
| `managementSystem` | `herramientas_gestion` |
| `verificationMethods` | `calidad_datos` |
| `generationSources` | `usuarios_datos` |
| `usesInformation` | `objetivo_uso` |
| `yesOrNot` | (hardcoded local) |

### Wizard

`HomeContext` orquesta los CRUD del wizard:
- `onGeneral`/`onPutGeneral`/`onFetchGeneral` → `/formularios/general`.
- `onLink`/`onPutLink`/`onDeleteLink`/`onFetchLink` → `/formularios/enlaces`.
- `onDatabase`/`onPutDatabase`/`onDeleteDatabase`/`onFetchDatabase` →
  `/formularios/bases-datos`.
- `onFile(files, id)` → `POST /formularios/bases-datos/{id}/diccionario`
  (multipart, sube a Acervo).

## Variables Vite

| Variable | Default dev | Notas |
|---|---|---|
| `VITE_BASE_PATH` | `/` | `/sieej/` en build prod (afecta `BrowserRouter.basename` y `base` de Vite) |
| `VITE_BACKEND_API_HOST` | `/api/administrador` | Prefijo del API |
| `VITE_PORT` | `5174` | Puerto del dev server |
| `VITE_NODE_ENV` | `development` | Lo lee `GlobalContext` para `isDevelopment` |
| `VITE_APP_ENV` | `dev` | `dev` / `beta` / `prod` |
| `VITE_DISABLED_EDITION` | `false` | Si truthy → MainLayout muestra ClosePage |
| `VITE_GOOGLE_ANALYTICS_ID` | (vacio) | GA4 |
| `VITE_GOOGLE_RECAPTCHA_SITE_KEY` | (vacio) | reCAPTCHA opcional |
| `BACKEND_DEV_TARGET` | `http://host.docker.internal:8000` | Solo dev, target del proxy de Vite |

## ESLint

Reglas notables (`eslint.config.js`):
- `indent: 4`
- `quotes: single`
- `max-lines: 300` por archivo
- `react-hooks/recommended`
- `no-unused-vars` excepto nombres que empiecen con mayuscula o `_`

## Build

```bash
make build
# Genera frontend/dist/ con base path /sieej/.
# gateway-hub lo monta como /usr/share/nginx/html/sieej via bind mount.
```

El Dockerfile (multi-stage) recibe los `VITE_*` como ARGs y los hardcodea
en el bundle (no se pueden cambiar en runtime sin rebuild).
