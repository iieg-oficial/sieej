# Changelog

Todas las notas relevantes del proyecto SIEEJ. Formato basado en
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y
[SemVer](https://semver.org/lang/es/).

## [1.12.0] - 2026-05-08

### Reportes: integrar widget Colibri como FAB en bottom-right

Integra el widget embebible de Colibri (`@iieg/colibri-widget`) en SIEEJ. Los usuarios autenticados ven un boton flotante en la esquina inferior derecha que abre el panel de reportes centralizado del IIEG, con el usuario ya identificado y la ruta actual como contexto.

#### Frontend

**Componente nuevo:**
- `src/components/ColibriReportButton.jsx`: FAB con el patron estandar IIEG (bg blanco, text gris hover morado, w-7 h-7 md:w-6 md:h-6, rounded-full, shadow sutil) en `fixed bottom-4 right-4 z-50`. Incluye `style={{ padding: 0, border: 0 }}` inline para evitar que el reset CSS global de SIEEJ (`button { padding: 0.6em 1.2em; border: 1px solid }` en `index.css`) lo deforme en pildora — este reset gana specificity sobre las utilities Tailwind via selector de tipo. Al click llama `window.colibri.identify()` con datos del usuario logueado (id, email, name, role) y `setContext()` con `auto` (UA, viewport, lang, timestamp), `sourceRoute` (pathname actual). Despues abre el panel via `window.colibri.openPanel({ sourceApp, apiKey })`.

**Integracion:**
- `src/layout/MainLayout.jsx`: monta `<ColibriReportButton />` como hermano del `<Body />`. Solo aparece en rutas autenticadas (Login, Disclaimer y Cambio de contrasena no lo tienen porque no usan `MainLayout`).

#### Infraestructura

- `frontend/index.html`: `<script src="/colibri/widget/colibri-widget.v1.js" defer>` antes de `</head>`.
- `frontend/vite.config.js`: ya tenia (commit anterior) proxy `/colibri` y `/api/public` -> `MARIACHI_DEV_TARGET`.
- `frontend/Dockerfile` + `docker-compose.yml`: ARGs y env vars `VITE_COLIBRI_SOURCE_APP=sieej` y `VITE_COLIBRI_API_KEY` (en frontend dev y frontend-build args).
- `.env.example`: documenta las dos vars con nota de generar la key desde `/colibri/source-apps` del panel admin de Colibri.

#### Patron estandar

Este es el segundo huesped (despues de mapalab) que usa el patron React documentado en `/colibri/docs/#patron-react`. Los proximos integradores pueden copiar el snippet de ahi.

## [1.11.0] - 2026-05-08

Vista dedicada de "Mis envíos" — v1 del histórico, con detalle por
envío, timeline de eventos y adjuntos descargables. Consume los dos
endpoints respondent nuevos en `mariachi/api`
(`GET /formularios/mis-envios` y `GET /formularios/mis-envios/:id`).

### Added

- **`pages/MisEnvios.jsx`** (ruta `/mis-envios`): listado paginado del
  histórico del usuario con búsqueda por nombre/slug, filtro por estado
  (`en_proceso/enviado/expirado`) y ordenamiento
  (`-actualizado_en/-enviado_en/nombre`). 12 items por página, paginación
  Anterior/Siguiente. Empty state distinto para "sin envíos" vs.
  "sin resultados con filtros". Cada card abre `/mis-envios/:id`.
- **`pages/EnvioDetalle.jsx`** (ruta `/mis-envios/:id`): vista de
  revisión del envío.
  - Reusa `SummaryStep` con `useForm({ defaultValues: envio.datos })`
    apuntando a `definicion_snapshot` (la del momento del envío, no la
    actual del formulario) para fidelidad histórica.
  - Banner morado clarifica "vista de solo lectura".
  - Sidebar (xl: derecha; mobile: abajo) con `EventTimeline` y
    `EnvioAdjuntos`.
  - Maneja 403/404 con un mensaje genérico ("este envío no existe o no
    te pertenece") sin filtrar la diferencia.
- **`forms/components/EventTimeline.jsx`**: timeline vertical con
  bullets por tipo (`iniciado/guardado/enviado/expirado/reabierto`).
  Copy en primera persona cuando aplica
  ("Iniciaste el formulario", "Enviaste el formulario", etc.).
- **`forms/components/EnvioAdjuntos.jsx`**: lista de adjuntos con link
  `target="_blank"`, MIME y tamaño formateado (B/KB/MB).
- **`services/formulariosServices.js`**: `listMisEnvios(onFetch, params)`
  y `getMiEnvioDetalle(onFetch, envioId)`. Tests en
  `test/misEnviosServices.test.js` (9 cases — URL params, parseo, 403,
  404).
- **`Routes.jsx`**: rutas `mis-envios` y `mis-envios/:id` declaradas
  ANTES de `:slug` para que React Router no las trate como path param.
- **`MainLayout.jsx`** dropdown del avatar: nuevo item "Mis envíos"
  entre "Mis formularios" y "Cerrar sesión", deshabilitado cuando ya
  estás en esa sección.

### Changed / Reverted

- **`pages/FormList.jsx`** revertido al estado pre-1.10.0 (sin tabs ni
  búsqueda). El histórico ahora vive en su propia página dedicada
  (`/mis-envios`); `/` queda como lista de formularios asignados activa.
  Decisión: separar flujos en lugar de mezclarlos en tabs.
- **Removido** `helpers/filterForms.js` y su test (eran del MVP de tabs
  en `FormList`; el filtrado ahora es server-side via los endpoints
  nuevos).

### Bump

- **`VERSION`** -> 1.11.0.
- **`frontend/package.json`** -> 1.11.0.
- **`frontend/public/ontoy.json`** -> 1.11.0.

### Dependencias

Requiere `mariachi/api` con commit
`feat(sieej-formularios): endpoints respondent /mis-envios` ya
desplegado. Antes de eso, `/mis-envios` muestra el error de carga
gracefully (catch del 404).

---

## [1.10.0] - 2026-05-07

UX de cambio de contraseña + MVP de "Mis envíos" + bug fixes visuales.

### Added

- **`pages/ChangePassword.jsx`** reescrito en flujo de dos pasos
  (`WelcomeStep` + `FormStep`). Cuando `user.must_change_password=true`
  arranca con una pantalla de bienvenida (icono escudo, saludo
  personalizado, lista de requisitos) antes del formulario; cuando es
  cambio voluntario va directo al form. El formulario incluye barra de
  fuerza de 4 segmentos y checklist en vivo de los 4 requisitos
  (longitud, mayús+minús, número, carácter especial). Botón "Actualizar"
  deshabilitado hasta `score >= 3`.
- **`helpers/passwordStrength.js`** + tests
  (`computePasswordStrength`, `isStrongEnough`).
- **`pages/FormList.jsx`** ahora muestra **3 tabs**
  (Pendientes / Enviados / Expirados) con count por tab persistido en
  `localStorage.sieej_form_list_tab`, **búsqueda local** sobre nombre y
  descripción, contador `X de Y` y empty states distintos por tab.
  Card de "Enviado" muestra `Enviado el <fecha>` en lugar de
  `Vigencia hasta`. Accesibilidad: `role="tablist"/"tab"` con
  `aria-selected` y `tabIndex` roving.
- **`helpers/filterForms.js`** + tests (`filterByTab`, `filterBySearch`,
  `countByTab`, `TAB_KEYS`, `TAB_LABELS`).

### Fixed

- **`Routes.jsx` `ProtectedRoute`**: si `user.must_change_password=true`
  y el path no es `/cambiar-contrasena`, redirige forzadamente. Antes
  solo `handleLogin` respetaba el flag — recargas, sesiones recuperadas
  y navegación directa a `/<slug>` se saltaban el reset.
- **`pages/Login.jsx` `useEffect`**: respeta `must_change_password`
  antes de redirigir a `originPage`.
- **`layout/MainLayout.jsx`**:
  - Quitado `w-screen` de `<header>` y `<main>`. Eran `100vw + m-5` =
    desbordaban el viewport siempre. El bug pasaba desapercibido en
    1.8.x porque el typo `w-sceen` (clase inválida) era ignorado por
    Tailwind; en 1.9.0 al corregir el typo se hizo visible. Se notaba
    más con el `IncompleteBadge` porque el badge se proyecta hacia la
    derecha del avatar al borde derecho del header desbordado.
    `<main>` además recibe `min-w-0` (permite shrinking en flex),
    `<header>` recibe `shrink-0`.
  - Avatar fijo `w-12 h-12 + aspect-square + shrink-0` para que sea
    siempre circular (antes el ancho dependía de las iniciales y se
    ovalaba con "MM" o similares).
- **`h-screen` → `h-dvh`** (dynamic viewport height) en MainLayout,
  CardPage, ErrorPage, NoMatch, Routes fallback y Tooltip full-screen.
  En mobile se ajusta correctamente al área visible cuando aparece o
  desaparece la barra de URL.

### Bump

- **`VERSION`** -> 1.10.0.
- **`frontend/package.json`** -> 1.10.0.
- **`frontend/public/ontoy.json`** -> 1.10.0.

### Pendiente (v1 — requiere mariachi/api)

- Detalle dedicado de envío histórico con timeline de eventos y descarga
  de adjuntos. Necesita 2 endpoints respondent nuevos en `mariachi/api`:
  - `GET /formularios/mis-envios?estado=&q=&page=&sort=` — listado
    paginado del usuario (filtrado por `usuario_id` desde la sesión).
  - `GET /formularios/mis-envios/:id` — detalle con `definicion_snapshot`,
    `datos`, `archivos[]` y `eventos[]`.
  - Gateados por `Depends(require_project_access('sieej'))` (no por
    `require_staff` — el respondent debe consumirlos desde SIEEJ; el rol
    externo nunca toca `mariachi/admin` por T#208).
- Frontend SIEEJ: ruta `/mis-envios/:id` con `EnvioDetalle` que reusa
  `FormRenderer` en modo histórico apuntando a `definicion_snapshot`,
  más `EventTimeline` y `EnvioAdjuntos`.

---

## [1.9.0] - 2026-05-07

Auditoria profunda del frontend (arquitectura + seguridad + performance +
accesibilidad + estandares + tests). Se aplicaron 37 de 40 hallazgos. Los
3 restantes (CSP estricta en gateway-hub, migracion a TypeScript,
Storybook/i18n) requieren sprints o tocar otros repos y se dejaron como
seguimiento.

### Fixed (P0 — bugs reales)

- **`forms/context/CatalogosContext.jsx`** (nuevo, reemplaza al viejo
  `context/CatalogContext.jsx`): expone `catalogos` como objeto plano
  con las **mismas keys que devuelve el backend** (`unidades_admin`,
  `categoria_datos`, `ejes_estrategicos`, `periodicidad`,
  `herramientas_gestion`, `calidad_datos`, `usuarios_datos`,
  `objetivo_uso`). El context anterior remapeaba a aliases en ingles
  (`unidadesAdministrativas`, ...) que ningun consumidor del renderer
  dinamico usaba; resultado: los `field.catalog` del JSONB caian en
  `if (field.catalog && catalogos)` con `catalogos === undefined` y
  los selects/radios dinamicos quedaban sin opciones. Ahora
  `catalogResolver(field, catalogos[field.catalog])` resuelve.
- **`components/Checkbox.jsx`** y **`components/DatePicker.jsx`**
  (renombrado desde `DatePicket.jsx`): reescritos para recibir
  `methods` por props como Input/Select/Radio. Antes usaban
  `useFormContext()` pero `FieldRenderer` no monta `<FormProvider>` —
  hubieran tirado TypeError al desestructurar `register/errors` la
  primera vez que un schema dinamico declarara un `type:checkbox` o
  `type:date`.
- **`pages/Register.jsx`**: eliminado. El componente invocaba
  `useAuth().onRegister` que no existe en `AuthContext`. La ruta
  condicional `regisño` (solo dev) tambien se elimino de
  `Routes.jsx`.

### Security / UX

- **`context/GlobalContext.jsx`**: removido `regexPass` (rechazaba
  palabras como `SELECT`, `DROP`, `--` con la pretension de bloquear
  SQLi en el frontend — falso sentido de seguridad y bloqueaba
  contrasenas legitimas que contuvieran esas palabras). Backend
  parametriza queries; la validacion de complejidad real vive ahi.
- **`components/Input.jsx`**: `normalize` default cambia de
  `'capitalize'` a `'normal'` (capitalize destruia datos como
  `iPhone`, RFCs, URLs, correos no marcados como `type:email`); cap
  implicito `maxLength=100` removido (rompia textareas largas — los
  schemas que necesiten un cap lo declaran via `validation.maxLength`).
  Toggle de password convertido en `<button>` accesible con
  `aria-label`/`aria-pressed`.
- **`components/Dragger.jsx`**: reemplazado `alert()` bloqueante por
  `openModal('error', ...)` para los archivos que exceden tamano.
- **`context/AuthContext.jsx`**: `onFetch` ya no muta `options.body`
  recibido; soporta `Blob` ademas de `FormData`/`URLSearchParams`/
  `string`; cleanup con `mountedRef` para evitar setState en
  componente desmontado.
- **`services/{auth,formularios}Services.js`**: `parseJson` resiliente
  a respuestas no JSON (502 con HTML ya no lanza desde dentro del
  parser); el `Error` lleva `status` y `data` adjuntos para que el
  caller decida.

### Performance

- **`forms/renderer/SummaryStep.jsx`**: usa `useWatch` sobre el
  `control` en lugar de recibir `datos={methods.watch()}` calculado
  desde `FormRenderer`. Antes cualquier keystroke en cualquier campo
  re-renderizaba la jerarquia entera (FormRenderer → StepRenderer →
  cada FieldRenderer); ahora solo el SummaryStep re-renderiza, y solo
  cuando esta montado.
- **`forms/renderer/pdf/SummaryPdfButton.jsx`**: pasa de imports
  estaticos a `await import(...)` dentro del handler para
  `genericPdf` y `templates/sieej-levantamiento`. **Reduccion del
  initial bundle ~1.4 MB** (`vendor-pdf` ahora es chunk on-demand).
- **`context/GlobalContext.jsx`**: el listener de `resize` se envuelve
  en `requestAnimationFrame` para no propagar re-render de
  `screenSize` en cada pixel; corregido `screenSize.sm` para empezar
  desde 0 (antes `>= 100` dejaba viewports muy angostos sin
  breakpoint).
- **`components/Tooltip.jsx`**: `hoverTimeout` migrado a `useRef` +
  cleanup al desmontar; antes se reinicializaba en cada render y
  podia dejar timers huerfanos.

### Architecture

- **Provider tree aplanado** de 4 niveles globales a 2:
  ```
  <BrowserRouter>
    <GlobalProvider>
      <AuthProvider>
        <Routes>
          <ProtectedRoute>
            <MainLayout>
              <CatalogosProvider>
                <FormsProvider>
                  ...
  ```
  El antiguo `CatalogProvider`/`UserProvider` colgaba del root incluso
  para usuarios no autenticados. Ahora `CatalogosProvider` y
  `FormsProvider` solo se montan dentro de `MainLayout` (que solo
  renderiza tras `ProtectedRoute`), y `UserContext` desaparece — el
  layout consume `useAuth().user` directo, con un helper
  `helpers/normalizeUser.js` que deriva `nombre`/`apellido` desde
  `user.name` cuando el backend solo lo manda como string.
- **`forms/renderer/pdf/templates/sieej-levantamiento/`**: PDF custom
  (`PdfForm.jsx` 245 LOC + `index.jsx` con el adapter de datos) movido
  desde `components/` y `forms/renderer/pdf/` a su carpeta de plantilla
  para dejar claro que es la unica excepcion documentada al
  `genericPdf`.

### Removed (dead code)

- `components/Pdf.jsx` (PDFViewer/PDFDownload sin imports).
- `components/Upload.jsx` (reemplazado por `Dragger.jsx`, sin imports).
- `components/PdfForm.jsx` (movido a templates).
- `pages/Register.jsx` (ver P0).
- `context/UserContext.jsx`, `context/useUser.js`,
  `context/CatalogContext.jsx`, `context/useCatalog.js` (ver
  Architecture).

### Standards / Tooling

- **Imports**: pasada masiva de imports relativos `../components/...`
  → alias `@components/...` (idem `@helpers`, `@context`, `@services`,
  `@pages`, `@forms`, `@layout`, `@assets`, `@svg`, `@png`, `@icons`,
  `@fonts`) en todo `src/`.
- **`react-router` unico**: reemplazo `react-router-dom` por
  `react-router` (RR v7) en todos los imports y removida la dep de
  `package.json`. Regla ESLint `no-restricted-imports` bloquea el
  regreso.
- **ESLint**: cargado `eslint-plugin-react` con `jsx-no-target-blank` y
  `display-name`. Removidos overrides muertos (`DataBaseStep`,
  `ResumeStep`). Solo quedan overrides para `SummaryStep` y
  `PdfForm` legacy (max-lines 500).
- **`index.css`**: paleta SIEEJ centralizada en `@theme` (Tailwind v4
  custom properties: `--color-sieej-primary`, `--color-sieej-bg`,
  `--color-sieej-error`, etc.); removido `color: rgba(255,255,255,0.87)`
  del `:root` que dejaba texto casi-blanco sobre fondo gris claro.
- **Typos**: `DatePicket` → `DatePicker`; `w-sceen` → `w-screen` en
  `MainLayout`; `coursor-pointer` → `cursor-pointer` en `Radio`;
  `felx-wrap` → `flex-wrap` en `Tabs`.

### Accessibility

- **`Modal`**: `role="dialog"` + `aria-modal` + `aria-labelledby`/
  `describedby`, focus trap con `Tab`/`Shift+Tab`, cierre con `Esc` y
  click en backdrop, restaura el foco al disparador al cerrar.
- **`Select`**: `role="combobox"` + `aria-expanded`/`haspopup`/
  `controls`, `<listbox>` y `<option>` con roles + `aria-selected`,
  soporte teclado (Enter/Espacio/Esc).
- **`Tabs` (wizard)**: `role="tablist"`/`tab` + `aria-selected` +
  `tabIndex` roving para navegacion por teclado.
- **Avatar (`MainLayout`)**: span clickable convertido en `<button>`
  con `aria-haspopup="menu"`/`aria-expanded`; dropdown con
  `role="menu"`/`menuitem` y cierre por `Escape`.
- **Password toggle (`Input`)**: `<span>` con prop invalido convertido
  en `<button>` con `aria-label`/`aria-pressed`.

### Testing

- **`vitest`** + **`@testing-library/react`** + `jest-dom` + `jsdom`.
  Configuracion en `vite.config.js` (`test: { environment: 'jsdom' }`).
- Suite inicial sobre logica pura (los contratos JSONB que mas duelen
  si rompen):
  - `test/conditional.test.js` — `evaluarShowWhen` (bool/string,
    campos faltantes, sin condicion).
  - `test/catalogResolver.test.js` — `resolveOptions` (options
    inline, catalog string array, catalog object array, prioridad
    options sobre catalog).
  - `test/normalizeUser.test.js` — derivacion de `nombre`/`apellido`
    desde `user.name`.
- **14 tests verdes**. Scripts: `npm run test` (run-once para CI),
  `npm run test:watch`.

### Build / Env

- **`Dockerfile`**: `VITE_BACKEND_API_HOST` default `'/api/administrador'`
  (antes `'/sieej/api'` — un build sin args producia un dist que
  apuntaba a un endpoint inexistente). Removido
  `VITE_GOOGLE_RECAPTCHA_SITE_KEY` (declarado pero sin uso en codigo).
  Agregado `VITE_SENTRY_DSN` al pipeline.
- **`Makefile`**: target `ensure-env` que copia `.env.development`
  desde `.env.example` si falta. `make dev` y `make build` dependen de
  el — antes el primer `make dev` fallaba con
  `--env-file .env.development` no encontrado.
- **`docker-compose.yml`** y **`.env.example`** alineados.

### Bump

- **`VERSION`** -> 1.9.0.
- **`frontend/package.json`** -> 1.9.0.
- **`frontend/public/ontoy.json`** -> 1.9.0.

### Pendiente (sprints fuera de esta entrega)

- **CSP estricta en gateway-hub** (#8 de la auditoria): requiere
  inventario de origenes externos en prod (Sentry DSN, GTM/GA, etc.)
  y editar `gateway.conf.template` en otro repo.
- **Migracion a TypeScript** (#28): sprint dedicado; afecta 50+
  archivos. Recomendacion: encarar despues con generacion de tipos
  desde el OpenAPI de `mariachi/api`.
- **Storybook + i18n**: proyectos enteros, no incluidos.

---

## [1.8.5] - 2026-05-06

Reorganizacion de la documentacion del proyecto:

### Added

- **`docs/plataforma-formularios.md`**: arquitectura final de la
  plataforma (descriptivo del estado actual, no prescriptivo del
  futuro). Modelo de datos, schema JSONB, endpoints respondent +
  admin, frontend structure, PDF custom vs generico, decisiones
  cerradas, referencias a migrations y commits.

### Removed

- **`docs/planes/plataforma-formularios.md`**: el plan completo (el
  trabajo ya esta hecho; mantenerlo como "plan" sugeriria
  pendientes que no existen). La carpeta `docs/planes/` queda vacia
  y se elimina.

### Changed

- **`docs/context.md`**: bumped a v1.8.4. Quitado el aviso del plan;
  ahora apunta a `plataforma-formularios.md` para detalles.
- **`docs/arquitectura.md`** y **`docs/frontend.md`**: avisos
  reemplazados por nota directa que apunta a
  `plataforma-formularios.md`.

### Bump

- **`VERSION`** -> 1.8.5.
- **`frontend/package.json`** -> 1.8.5.
- **`frontend/public/ontoy.json`** -> 1.8.5.

---

## [1.8.4] - 2026-05-06

Tipografia y centrado del header:

### Changed

- **`components/Typography.jsx`**: `h1` sube de `text-[21px]/[31px]`
  a `text-[28px]/[36px]`. Antes h1 era mas chico que h2 (21 vs 22),
  jerarquia invertida que se notaba en cada page con titulo h1
  (FormList, Login, ChangePassword, etc.). Ahora h1 > h2 > h3 segun
  lo esperado.
- **`layout/MainLayout.jsx`**: el `<button>` que envuelve el logo
  SIEEJ ahora es `inline-flex items-center justify-center align-middle`
  para que el `<img>` quede centrado verticalmente respecto a los
  otros logos (IIEG, Jal). El `EnvBadge` se restaura sobre el logo
  (no era el causante del desplazamiento; el logo ahora queda
  enderezado correctamente).

### Bump

- **`VERSION`** -> 1.8.4.
- **`frontend/package.json`** -> 1.8.4.
- **`frontend/public/ontoy.json`** -> 1.8.4.

---

## [1.8.3] - 2026-05-06

Iteracion del header y la lista:

### Changed

- **`layout/MainLayout.jsx`**: removido el `EnvBadge` del logo SIEEJ
  para evitar empuje vertical del logo. El indicador de entorno solo
  vivira en el avatar (badge naranja con corner=bottom-right) o en
  ningun lado si no hay incompletos.
- **`layout/MainLayout.jsx`**: el item "Mis formularios" del dropdown
  se muestra siempre. Cuando estas en `/` queda `disabled` con
  opacity-50 y cursor-default (en vez de ocultarse) — asi siempre
  ves la opcion y el contador de incompletos.
- **`pages/FormList.jsx`**: titulo "Sistema de Información..."
  reemplazado por **"Mis formularios"**. Subtitulo h3 reemplazado por
  parrafo descriptivo "Aquí encuentras los formularios asignados a tu
  dependencia. Da click en uno para empezar o continuar tu captura."
  con estilo `text-[#7C7C7C] font-garetregular`.
- **`pages/FormList.jsx`**: `FormCard` ahora tiene
  `shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition
  duration-200` para feedback elevado en hover (consistente con
  cards de admin AntD).

### Bump

- **`VERSION`** -> 1.8.3.
- **`frontend/package.json`** -> 1.8.3.
- **`frontend/public/ontoy.json`** -> 1.8.3.

---

## [1.8.2] - 2026-05-06

Fixes del header introducidos por 1.8.0/1.8.1:

### Fixed

- **Menú dropdown del avatar no era visible**: el wrapper del
  `MainLayout` tenia `overflow-hidden` lo cual recortaba el menu
  `absolute` que cae fuera del header (h-[100px]). Cambiado a
  `overflow-x-hidden` para que el menu pueda desplegar
  verticalmente sin recorte. Ademas el `z-index` del menu se subio
  de `z-10` a `z-50`.
- **Logo SIEEJ se desplazaba hacia abajo**: al envolver el `<img>`
  en `<button>` (1.8.0), los estilos default del navegador (padding,
  border, line-height) empujaban la imagen. Agregado
  `p-0 m-0 border-0 bg-transparent` al boton + `block` al `<img>`
  para resetear esos estilos.

### Changed

- **`components/IncompleteBadge.jsx`**: nuevo prop `corner` con
  valores `top-right` (default), `bottom-right`, `top-left`,
  `bottom-left`. Se posiciona absolute sin afectar dimensiones del
  contenedor padre.
- **`layout/MainLayout.jsx`**: el badge en el avatar ahora se
  posiciona en `corner="bottom-right"`.

### Bump

- **`VERSION`** -> 1.8.2.
- **`frontend/package.json`** -> 1.8.2.
- **`frontend/public/ontoy.json`** -> 1.8.2.

---

## [1.8.1] - 2026-05-06

Reubica el badge de incompletos al avatar y agrega item "Mis
formularios" al dropdown del header.

### Changed

- **`layout/MainLayout.jsx`**: el `IncompleteBadge` se mueve del logo
  SIEEJ al circulo del avatar (top-right). El logo conserva
  `EnvBadge` y la nav a `/`.
- **`layout/MainLayout.jsx`**: dropdown del avatar agrega item
  "Mis formularios" arriba de "Cerrar sesión" con divider sutil.
  Si `incompleteCount > 0` muestra debajo "{n} por completar" en
  naranja menor (font-garetbold, 11px). Si estas en `/` ya, el item
  se oculta para no ofrecer nav redundante (`location.pathname === '/'`).
  Ancho del menu ajustado de `w-48` a `w-56` para acomodar dos
  lineas comodamente.

### Bump

- **`VERSION`** -> 1.8.1.
- **`frontend/package.json`** -> 1.8.1.
- **`frontend/public/ontoy.json`** -> 1.8.1.

---

## [1.8.0] - 2026-05-06

UX del header y de la lista de formularios:
- Logo SIEEJ del header ahora es boton que navega a `/` (lista).
- Badge de "formularios incompletos" sobre el logo (count de envios
  en estado `en_proceso`).
- FormList con toggle grid/lista; default grid; preferencia
  persistida en localStorage.

### Added

- **`components/IncompleteBadge.jsx`**: badge naranja absoluto al
  estilo de `EnvBadge`. Muestra count si > 0, "9+" si > 9. Recibe
  `count` y `className` por props.
- **`pages/FormList.jsx`**: toggle visual con dos botones
  (`GridIcon` y `ListIcon` SVG inline) + `FormCard` que se adapta
  al modo. Grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`.
  Lista: `space-y-4`. Preferencia guardada en
  `localStorage.sieej_form_list_view`.

### Changed

- **`layout/MainLayout.jsx`**: el contenedor del logo SIEEJ se
  convierte en `<button>` con `onClick={() => navigate('/')}`,
  `aria-label="Ir al inicio"`, focus visible. Mantiene `EnvBadge` y
  agrega `IncompleteBadge` con el count desde
  `useForms().formularios.filter(f => f.estado_envio === 'en_proceso').length`.
- **`layout/MainLayout.jsx`**: `<FormsProvider>` envuelve todo el
  layout para que el header pueda leer la lista. `FormList` ya no
  monta su propio provider (lo eliminamos del page).

### Bump

- **`VERSION`** -> 1.8.0.
- **`frontend/package.json`** -> 1.8.0.
- **`frontend/public/ontoy.json`** -> 1.8.0.

---

## [1.7.0] - 2026-05-06

PDF de resumen — custom para sieej-levantamiento + generico para los
demas. Cierre del item pendiente del cleanup.

### Added

- **`forms/renderer/pdf/sieejLevantamiento.jsx`**: descarga el PDF
  custom usando el `PdfForm` existente (245 lineas, totalmente
  custom SIEEJ con logos, fonts Garet, layout especifico). Adapter
  `adaptDatosToFormData` mapea las claves del modelo dinamico
  (general/enlaces/bases_datos) a las del wizard original
  (informacion_general/_enlaces/_basesdatos) y convierte boolean
  strings ("true"/"false") a boolean reales.
- **`forms/renderer/pdf/genericPdf.jsx`**: PDF generico que itera
  cualquier definicion + datos. Header con logos institucionales
  (sieej, iieg, jal), titulo desde `definicion.nombre`, descripcion,
  una seccion por step (resumen omitido), repeaters listados con
  separadores. Resuelve labels de catalogos/options.
- **`forms/renderer/pdf/SummaryPdfButton.jsx`**: el boton decide
  cual PDF generar. Si `step.pdfTemplate === 'sieej-levantamiento'`
  → custom. Si `step.exportPdf === true` (sin pdfTemplate) →
  generico. Manejo de loading + error.

### Changed

- **`forms/renderer/SummaryStep.jsx`**: agrega el `SummaryPdfButton`
  al pie del resumen cuando el step tiene `exportPdf` o
  `pdfTemplate`.
- **`forms/renderer/StepRenderer.jsx`** y **`FormRenderer.jsx`**:
  pasan `formNombre`/`formDescripcion` al SummaryStep para que el
  PDF generico tenga ambos en el header.

### Bump

- **`VERSION`** -> 1.7.0.
- **`frontend/package.json`** -> 1.7.0.
- **`frontend/public/ontoy.json`** -> 1.7.0.

---

## [1.6.0] - 2026-05-06

Restaurado el look & feel del wizard SIEEJ original sobre el renderer
dinamico. La home ahora es lista directa en `/`, formularios en
`/:slug` (sin subruta `/formularios` redundante).

### Added

- **`forms/components/wizard/StepIndicator.jsx`**: progreso vertical
  con bullets numerados, ✓ verde al completar, separadores entre
  steps. Cuando el step actual es repeater con items, muestra los
  items como tabs anidados (con borrar via icono X). Recibe
  `steps`, `currentStep`, `repeaterItems`, `activeTab`, `visitedTabs`,
  `sizeTabs`, `onTabClick`, `onTabRemove` por props (no acoplado a
  ningun contexto).
- **`forms/components/wizard/NavigateStep.jsx`**: header sticky con
  titulo del step + 3 botones (Anterior / Siguiente o Confirmar y
  enviar / Guardar avance icon-only). Recibe `step`, `isFirst`,
  `isLast`, `isLastTab`, `isMobile`, `onPrev`, `onSubmit`, `onSave`
  por props.
- **`forms/components/wizard/Tabs.jsx`**: tabs verticales/horizontales
  para items de repeaters. Soporta `vertical`, `items`, `activeTab`,
  `visitedTabs`, `onTabClick`, `onTabRemove`.

### Changed

- **`pages/FormPage.jsx`**: layout 2 columnas como el wizard
  original — panel izquierdo sticky (con titulo del formulario,
  descripcion del formulario, StepIndicator) + panel derecho
  rounded-[20px] con NavigateStep arriba + step actual abajo. El
  panel izquierdo solo se muestra si `definicion.steps.length > 1`.
  Header (titulo + descripcion) lee de `definicion.nombre` y
  `definicion.descripcion`.
- **`pages/FormList.jsx`**: rediseñada en panel rounded blanco con
  Typography h1/h3 institucionales. Tarjetas con border morado al
  hover, badges de estado con colores semanticos, redirige a
  `/<slug>` directo (no `/formularios/<slug>`).
- **`Routes.jsx`**: `/` muestra FormList directo (sin redirect).
  `/:slug` muestra FormPage. Las rutas literales reservadas
  (`inicio-sesion`, `exencion`, `cambiar-contrasena`, `error`) se
  declaran antes para que ganen sobre el dynamic `:slug`.
- **`forms/renderer/FormRenderer.jsx`**: ahora usa NavigateStep
  para el header de step + nav. Los 3 botones tienen el
  comportamiento del wizard (Guardar = silencioso si esta dentro de
  Anterior, explicito si se da click directo). Read-only cuando
  `envio.estado in ('enviado','expirado')`.
- **`forms/renderer/RepeaterStep.jsx`**: muestra UN item a la vez
  navegable por `activeTab` (no todos los items uno encima del otro).
  Boton Agregar arriba a la derecha + Eliminar (si fields > minItems).
  Sub-tabs internos cuando `step.tabs` esta definido.
- **`forms/renderer/SummaryStep.jsx`**: itera la definicion + datos
  para reproducir el resumen estilo wizard original. Usa `Text`,
  `Typography`, `Divide`, `FieldGrid` existentes. Resuelve labels de
  catalogos/options en lugar de mostrar values raw.
- **`forms/context/WizardContext.jsx`**: extendido con `activeTab`,
  `visitedTabs`, `sizeTabs`, `onActiveTab`, `onSizeTab`,
  `resetVisitedTabs` para soportar tabs de repeaters (estado que
  vivia en GlobalContext del wizard original; ahora vive scoped al
  formulario activo).

### Bump

- **`VERSION`** -> 1.6.0.
- **`frontend/package.json`** -> 1.6.0.
- **`frontend/public/ontoy.json`** -> 1.6.0.

---

## [1.5.0] - 2026-05-06

Cleanup post-cutover. El wizard hardcodeado se elimina por completo.
SIEEJ ahora es 100% renderer dinamico que consume las definiciones
de mariachi.

### Removed

- **`pages/Home.jsx`**: la home de wizard hardcodeado.
- **`context/HomeContext.jsx`** y **`context/useHome.js`**: el state
  del wizard se reemplazo por `WizardContext` por formulario activo.
- **Helpers wizard**: `helpers/initDatabase.js` (default de la BD del
  wizard), `helpers/pdfActions.jsx` (PDF hardcodeado), `helpers/textLarge.jsx`
  (tooltips estaticos).
- **Componentes wizard**: `components/Tabs.jsx` (reemplazado por la
  implementacion local de `RepeaterStep`), `GeneralStep.jsx`,
  `LinksStep.jsx`, `ListDatabaseStep.jsx`, `DataBaseStep.jsx`,
  `ResumeStep.jsx` (los 5 steps especificos del wizard),
  `NavigateStep.jsx` y `StepIndicator.jsx` (la navegacion vive ahora
  en `forms/renderer/FormRenderer`).
- **Ruta `/legacy-wizard`** y `HomeProvider` del provider tree en
  `main.jsx`.

### Changed

- **`context/GlobalContext.jsx`**: limpiado del wizard. Removidos
  `STEPS` array, state de navegacion (`currentStep`, `activeTab`,
  `visitedTabs`, `sizeTabs`, `tabLoading`), handlers
  (`handleNext`/`handlePrev`/`handleActiveTab`/`handleVisitedTabs`/
  `handleTabChange`/`handleSizeTab`/`handleTabLoading`/
  `updateStepStatus`/`resetVisitedTabs`) e iconos del wizard.
  Lo que queda: `hostBackend`, `screenSize`, `regex*`,
  `linkPrivacity`, `isDisabledEdition`, `isMessageOpen`/`onMessage`,
  `isModalOpen`/`openModal`/`closeModal`, `onAnalytics`.
- **`components/Dragger.jsx`**: ya no depende de `useHome()`. Recibe
  `onFile` como prop. El renderer dinamico lo pasa via
  `FieldRenderer` cuando `field.type === 'file'`.
- **`forms/renderer/FieldRenderer.jsx`**: adapta la signatura de
  `Dragger.onFile(filesArray, idItem)` para tomar el primer archivo
  y pasarlo al `onUpload(fieldPath, file)` del SubmissionContext.

### Bump

- **`VERSION`** -> 1.5.0.
- **`frontend/package.json`** -> 1.5.0.
- **`frontend/public/ontoy.json`** -> 1.5.0.

---

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
