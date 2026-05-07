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

`make dev` invoca `make ensure-env` que copia `.env.development` desde
`.env.example` si falta.

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
├── eslint.config.js         # Flat config + plugin react
├── index.html               # Title=SIEEJ, theme-color #5C2472
├── package.json             # name=sieej-frontend@1.9.0
├── vite.config.js           # base, aliases, proxy /api, vitest config
├── public/                  # favicons, fonts Garet, manifest, ontoy.json
├── test/                    # vitest + suite logica pura
│   ├── setup.js
│   ├── conditional.test.js
│   ├── catalogResolver.test.js
│   └── normalizeUser.test.js
└── src/
    ├── main.jsx             # GlobalProvider + AuthProvider + Router
    ├── Routes.jsx           # Login, Disclaimer, ProtectedRoute, NoMatch, ErrorPage
    ├── index.css            # Tailwind v4 + @theme paleta SIEEJ + @font-face Garet
    ├── components/          # Primitivas: Input, Select, SelectMultiple, Radio,
    │                        # Checkbox, DatePicker, Dragger, Button, Modal,
    │                        # Tooltip, Typography, Spinner, Loading, EnvBadge,
    │                        # IncompleteBadge, CardPage, Message, Text, Divide
    ├── layout/MainLayout.jsx
    ├── pages/               # Login, Disclaimer, FormList, FormPage,
    │                        # ChangePassword, ClosePage, NoMatch, ErrorPage
    ├── context/             # AuthContext + GlobalContext (raiz)
    ├── forms/
    │   ├── components/wizard/{StepIndicator,NavigateStep,Tabs}.jsx
    │   ├── context/         # CatalogosContext, FormsContext,
    │   │                    # SubmissionContext, WizardContext + hooks
    │   └── renderer/
    │       ├── *.jsx        # FormRenderer, StepRenderer, FormStep,
    │       │                # RepeaterStep, SummaryStep, FieldRenderer
    │       ├── conditional.js, catalogResolver.js
    │       └── pdf/
    │           ├── SummaryPdfButton.jsx (dynamic import)
    │           ├── genericPdf.jsx
    │           └── templates/sieej-levantamiento/{index,PdfForm}.jsx
    ├── services/{authServices,formulariosServices}.js
    ├── helpers/             # normalizeUser, DynamicDiv, FieldLayout,
    │                        # ErrorsRequired, analytics, cleanObject, etc.
    └── assets/
        ├── fonts/           # Garet Bold/Medium/Regular/Book
        ├── icons/           # SVG inline
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
| `@forms` | `src/forms` |
| `@assets` | `src/assets` |
| `@icons` | `src/assets/icons` |
| `@png` | `src/assets/png` |
| `@svg` | `src/assets/svg` |
| `@fonts` | `src/assets/fonts` |

ESLint regla `no-restricted-imports` bloquea `react-router-dom`; usar
siempre `react-router` (RR v7).

## Providers

```jsx
<BrowserRouter basename={VITE_BASE_PATH}>
    <GlobalProvider>      {/* modal, screenSize, regex, hostBackend */}
        <AuthProvider>    {/* cookie+CSRF, onFetch, login/logout, checkAuth */}
            <Routes>
                <ProtectedRoute>
                    <MainLayout>
                        <CatalogosProvider> {/* GET /formularios/catalogos */}
                            <FormsProvider> {/* lista global del usuario */}
                                ...
```

`CatalogosProvider` y `FormsProvider` se montan dentro de `MainLayout`
para no ejecutarse en pantallas publicas (login/exencion).

### Auth

`AuthContext`:
- En mount: `GET /autenticacion/perfil` → si 200 setUser (normalizado);
  si 401 redirect.
- `onLogin({username, password})`: `POST /autenticacion/iniciar-sesion`,
  guarda `csrf_token` en `sessionStorage`, `setUser`.
- `onLogout`: `POST /autenticacion/cerrar-sesion`, limpia.
- `onFetch(url, options)`:
  - `credentials: 'include'`.
  - Inyecta `X-CSRF-Token` en `POST/PUT/DELETE/PATCH`.
  - Serializa body a JSON si no es FormData/URLSearchParams/Blob/string.
  - **No muta** `options.body` recibido.
  - 401 → setUser(null) + redirect a `/inicio-sesion`.
  - `mountedRef` evita setState en componente desmontado.

### Catalogos

`forms/context/CatalogosContext.jsx`:
- Cuando `isAuthenticated` cambia a true, hace
  `GET /formularios/catalogos` con `AbortController` y expone:

| API expuesta | Tipo |
|---|---|
| `catalogos` | `{ unidades_admin, categoria_datos, ejes_estrategicos, periodicidad, herramientas_gestion, calidad_datos, usuarios_datos, objetivo_uso }` (mismas keys que el JSONB de `definicion`) |
| `loading` | `boolean` |
| `error` | `string \| null` |

`yesOrNot` es export const local (no parte del context).

`catalogResolver(field, catalogos[field.catalog])` hace el match.

### Formularios

`forms/context/FormsContext.jsx`: lista del usuario (`GET /formularios/`).
El header lee `formularios.filter(f => f.estado_envio === 'en_proceso').length`
para el badge de incompletos.

`forms/context/SubmissionContext.jsx`: scoped al `FormPage`. Carga
`/formularios/:slug` (definicion + envio activo), expone `guardar`,
`enviar`, `subirArchivo`.

`forms/context/WizardContext.jsx`: estado de navegacion del wizard
(`currentStep`, `activeTab`, `visitedTabs`, etc.).

## Variables Vite

| Variable | Default dev | Notas |
|---|---|---|
| `VITE_BASE_PATH` | `/` | `/sieej/` en build prod (afecta `BrowserRouter.basename` y `base` de Vite) |
| `VITE_BACKEND_API_HOST` | `/api/administrador` | Prefijo del API |
| `VITE_PORT` | `5174` | Puerto del dev server |
| `VITE_NODE_ENV` | `development` | Lo lee `GlobalContext` para `isDevelopment` |
| `VITE_APP_ENV` | `dev` | `dev` / `beta` / `prod` (afecta `EnvBadge`) |
| `VITE_DISABLED_EDITION` | `false` | Si truthy → MainLayout muestra ClosePage |
| `VITE_SENTRY_DSN` | (vacio) | Si vacio, Sentry no se inicializa |
| `BACKEND_DEV_TARGET` | `http://host.docker.internal:8000` | Solo dev, target del proxy de Vite |

## ESLint

Reglas notables (`eslint.config.js`):
- `indent: 4`
- `quotes: single`
- `max-lines: 300` por archivo (overrides 500 para `SummaryStep` y
  `PdfForm` legacy)
- `react/recommended` + `react-hooks/recommended`
- `react/jsx-no-target-blank` con `allowReferrer: false`
- `no-restricted-imports` bloquea `react-router-dom`
- `no-unused-vars` excepto nombres que empiezan con mayuscula o `_`

## Tests

```bash
npm run test         # vitest run (CI)
npm run test:watch   # vitest watch
```

Configuracion en `vite.config.js` (`test: { environment: 'jsdom' }`).
Setup en `test/setup.js` (jest-dom matchers).

Suite inicial sobre logica pura del renderer: `evaluarShowWhen`,
`resolveOptions`, `normalizeUser`. **14 tests verdes**.

## Build

```bash
make build
# Genera frontend/dist/ con base path /sieej/.
# gateway-hub lo monta como /usr/share/nginx/html/sieej via bind mount.
```

El Dockerfile (multi-stage) recibe los `VITE_*` como ARGs y los
hardcodea en el bundle (no se pueden cambiar en runtime sin rebuild).
Defaults del Dockerfile alineados con `.env.production`
(`VITE_BACKEND_API_HOST=/api/administrador`).

### Code splitting

`vite.config.js` agrupa vendors en chunks dedicados (`vendor-react`,
`vendor-router`, `vendor-form`, `vendor-pdf`). El chunk `vendor-pdf`
(~1.4 MB) **no esta en el initial bundle** desde 1.9.0: se carga
on-demand cuando el usuario hace click en "Descargar PDF" via dynamic
import en `forms/renderer/pdf/SummaryPdfButton.jsx`.
