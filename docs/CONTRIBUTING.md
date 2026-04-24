# Guia de contribucion - SIEEJ

## Flujo de trabajo

1. `git checkout -b feat/mi-feature` (o `fix/`, `docs/`, `refactor/`,
   `chore/`).
2. Commit con mensajes convencionales, sin atribucion a asistentes o
   modelos (ni `Co-Authored-By: Claude ...`, ni lineas `Generated with`).
3. Pull request a `develop`. Revisar checklist:
   - [ ] `make dev` arranca sin errores.
   - [ ] Lint del frontend (`npm run lint` en `frontend/`) sin warnings.
   - [ ] Tests del backend (`pytest test/` en `backend/`) verdes.
   - [ ] Documentacion actualizada si la API o la configuracion cambio.
   - [ ] `docs/CHANGELOG.md` con una entrada en la seccion correcta.

## Convencion de commits

Prefijos sugeridos:

| Prefijo | Uso |
|---------|-----|
| `feat:` | Feature nueva |
| `fix:` | Correccion de bug |
| `docs:` | Solo documentacion |
| `refactor:` | Refactor sin cambio funcional |
| `chore:` | Infra, tooling, CI, dependencias |
| `test:` | Solo tests |
| `perf:` | Mejora de rendimiento |

Ejemplos:

```
feat(backend): endpoint /users/{id}/enlaces para admin
fix(frontend): evitar doble submit en ResumeStep
docs: agregar docs/gateway.md con upstream sieej
chore: bump vite 6.2.2 -> 6.3.0
```

## Estilo de codigo

### Backend (Python)

- Python 3.12.
- Indentacion 4 espacios.
- Imports agrupados: stdlib, third-party, local (con linea en blanco).
- Type hints obligatorios en firmas publicas (funciones de services y
  routers).
- Log con `Logger.info/warning/error` (`app/utils/logger.py`), **no**
  `print`.
- Nada de `print` o `breakpoint()` en commits.

### Frontend (JS/JSX)

- ESLint flat config en `frontend/eslint.config.js`.
- Indentacion 4 espacios.
- Comillas simples (`single`).
- Max 300 lineas por archivo (skipBlank + skipComments).
- Nombres de componentes en `PascalCase`, hooks en `camelCase`
  comenzando con `use*`.
- Imports via aliases (`@components`, `@context`, `@helpers`, ...)
  cuando sea posible.

### Commits destructivos o de infra

- Cambios a `docker-compose.yml`, `Makefile`, `Dockerfile*`, rutas del
  gateway o al esquema de DB deben mencionarse explicitamente en el
  titulo del PR y documentarse en `docs/CHANGELOG.md`.
- Las variables de entorno nuevas deben agregarse a `.env.example` en
  la seccion correspondiente (General / Frontend / Backend / Nginx) y
  mencionarse en `docs/context.md#variables-de-entorno-importantes`.

## Ejecucion local

```bash
# Dev (requiere Docker + docker compose)
cp .env.example .env.development
# editar .env.development
make dev

# Detener
make down-dev

# Staging (simula produccion)
cp .env.example .env.staging
make staging
make down-staging

# Limpieza total
make clean
```

## Seeds y catalogos

Los seeders estan en `backend/app/migrations/` y leen JSONs en
`backend/app/migrations/data/`. Agregar un valor nuevo a un catalogo:

1. Editar el JSON correspondiente (conservar el orden por convencion).
2. Reiniciar el backend; los seeders son idempotentes.
3. Si el cambio afecta IDs usados en el frontend, documentar el cambio
   en un PR separado.

## Versionado

- `VERSION` en la raiz del repo es la fuente de verdad del version
  global.
- `frontend/package.json::version` debe mantenerse sincronizado
  (hasta que se automatice).
- Cada release se taggea `v<major>.<minor>.<patch>` y se menciona en
  `docs/CHANGELOG.md` con la fecha.

## PRs que tocan el gateway-hub

Si tu cambio requiere modificar `gateway-hub/nginx/templates/*.template`
o variables del gateway:

1. Hacer el cambio en el repo de `gateway-hub` en su propio PR.
2. Referenciar ese PR desde el PR de SIEEJ.
3. Validar con `nginx -t` antes de hacer `nginx -s reload`.
