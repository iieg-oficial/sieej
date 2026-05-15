# Taiga API — Referencia de uso en SIEEJ

Instancia self-hosted del IIEG: `https://proyectosiieg.jalisco.gob.mx`

Las credenciales viven en `.env.development` (local, **no versionado**) bajo el bloque `# Taiga`:

```dotenv
TAIGA_URL=https://proyectosiieg.jalisco.gob.mx
TAIGA_USERNAME=<usuario>
TAIGA_PASSWORD=<password>
TAIGA_PROJECT_ID=3       # SIIEJ
TAIGA_USER_ID=<id_usuario>
```

> **Nota.** Las variables `TAIGA_*` no las usa el frontend en runtime —
> son únicamente para scripting local que interactúa con la API de Taiga.

---

## Autenticación

```bash
TOKEN=$(curl -sk -X POST "$TAIGA_URL/api/v1/auth" \
  -H "Content-Type: application/json" \
  -d "{\"type\": \"normal\", \"username\": \"$TAIGA_USERNAME\", \"password\": \"$TAIGA_PASSWORD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['auth_token'])")
```

El token es JWT de corta duración. Regenerarlo al inicio de cada sesión de scripting.

---

## Proyectos

### Listar proyectos del usuario

```bash
curl -sk "$TAIGA_URL/api/v1/projects?member=$TAIGA_USER_ID&order_by=name" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
for p in json.load(sys.stdin):
    print(f'ID: {p[\"id\"]} | {p[\"name\"]} | slug: {p[\"slug\"]}')
"
```

| ID | Nombre | Slug |
|----|--------|------|
| 1 | MapaLab | `mapalab` |
| 2 | Nuevo sitio del IIEG | `nuevo-sitio-del-iieg` |
| **3** | **SIIEJ** | **`siiej`** |
| 4 | Tableros municipales | `tableros-municipales` |
| 16 | Sitio Web Actual IIEG | `sitio-web-actual-iieg` |

Para SIEEJ: `TAIGA_PROJECT_ID=3`.

---

## Historias de usuario

### Listar asignadas a un usuario en un proyecto

```bash
curl -sk "$TAIGA_URL/api/v1/userstories?project=$TAIGA_PROJECT_ID&assigned_to=$TAIGA_USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
for u in json.load(sys.stdin):
    status = u.get('status_extra_info', {}).get('name', '?')
    sprint = u.get('milestone_name') or 'Sin sprint'
    print(f'#{u[\"ref\"]} [{status}] {u[\"subject\"]} | {sprint}')
"
```

### Crear historia de usuario

```bash
curl -sk -X POST "$TAIGA_URL/api/v1/userstories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project\": $TAIGA_PROJECT_ID,
    \"subject\": \"Título de la historia\",
    \"description\": \"Descripción detallada\",
    \"assigned_to\": $TAIGA_USER_ID
  }"
```

---

## Tareas

### Listar asignadas a un usuario en un proyecto

```bash
curl -sk "$TAIGA_URL/api/v1/tasks?project=$TAIGA_PROJECT_ID&assigned_to=$TAIGA_USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
for t in json.load(sys.stdin):
    status = t.get('status_extra_info', {}).get('name', '?')
    print(f'#{t[\"ref\"]} [{status}] {t[\"subject\"]}')
"
```

### Crear tarea (asociada a una historia de usuario)

```bash
curl -sk -X POST "$TAIGA_URL/api/v1/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project\": $TAIGA_PROJECT_ID,
    \"user_story\": <US_ID>,
    \"subject\": \"Título de la tarea\",
    \"assigned_to\": $TAIGA_USER_ID
  }"
```

---

## Issues

### Listar asignados a un usuario en un proyecto

```bash
curl -sk "$TAIGA_URL/api/v1/issues?project=$TAIGA_PROJECT_ID&assigned_to=$TAIGA_USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
for i in json.load(sys.stdin):
    status = i.get('status_extra_info', {}).get('name', '?')
    itype = i.get('type_extra_info', {}).get('name', '?')
    print(f'#{i[\"ref\"]} [{itype}] [{status}] {i[\"subject\"]}')
"
```

### Crear issue

```bash
curl -sk -X POST "$TAIGA_URL/api/v1/issues" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project\": $TAIGA_PROJECT_ID,
    \"subject\": \"Título del issue\",
    \"description\": \"Descripción\",
    \"assigned_to\": $TAIGA_USER_ID
  }"
```

---

## Wiki

### Listar páginas

```bash
curl -sk "$TAIGA_URL/api/v1/wiki?project=$TAIGA_PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
for p in json.load(sys.stdin):
    print(f'ID: {p[\"id\"]} | slug: {p[\"slug\"]}')
"
```

### Leer página por ID

```bash
curl -sk "$TAIGA_URL/api/v1/wiki/<WIKI_ID>" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
p = json.load(sys.stdin)
print('Versión:', p['version'])
print(p['content'])
"
```

### Actualizar página (PATCH)

El campo `version` es obligatorio para control de concurrencia optimista.
Siempre leer la versión actual antes de actualizar.

```bash
python3 -c "
import json
with open('nuevo_contenido.md') as f:
    content = f.read()
with open('/tmp/payload.json', 'w') as f:
    json.dump({'content': content, 'version': <VERSION_ACTUAL>}, f)
"

curl -sk -X PATCH "$TAIGA_URL/api/v1/wiki/<WIKI_ID>" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/payload.json \
  | python3 -c "
import sys,json
r = json.load(sys.stdin)
print('Nueva versión:', r['version'])
"
```

### Crear página nueva

```bash
curl -sk -X POST "$TAIGA_URL/api/v1/wiki" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project\": $TAIGA_PROJECT_ID,
    \"slug\": \"nombre-de-la-pagina\",
    \"content\": \"# Título\\n\\nContenido en markdown.\"
  }"
```

---

## Épicas

### Crear épica

```bash
curl -sk -X POST "$TAIGA_URL/api/v1/epics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project\": $TAIGA_PROJECT_ID,
    \"subject\": \"SIEEJ 1.x.x\",
    \"description\": \"Descripción en markdown.\",
    \"assigned_to\": $TAIGA_USER_ID
  }"
```

### Listar épicas del proyecto

```bash
curl -sk "$TAIGA_URL/api/v1/epics?project=$TAIGA_PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
for e in json.load(sys.stdin):
    print(f'ID: {e[\"id\"]} | #{e[\"ref\"]} {e[\"subject\"]}')
"
```

### Actualizar descripción de una épica (PATCH)

Siempre leer la versión actual antes de actualizar.

```python
import urllib.request, json, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE = 'https://proyectosiieg.jalisco.gob.mx/api/v1'
HEADERS = {'Authorization': 'Bearer <TOKEN>', 'Content-Type': 'application/json'}

def api(method, path, body=None):
    req = urllib.request.Request(
        f'{BASE}{path}', headers=HEADERS, method=method,
        data=json.dumps(body).encode() if body else None
    )
    with urllib.request.urlopen(req, context=ctx) as r:
        return json.loads(r.read())

epic = api('GET', '/epics/<ID>')
api('PATCH', '/epics/<ID>', {'description': '# Nueva descripción', 'version': epic['version']})
```

### Vincular historia de usuario a una épica

**Verificado en sesión 1.9.0 (2026-05-07).** El método correcto es
`POST /epics/{epic_id}/related_userstories`. El `PATCH` sobre la historia
con `{'epic': <ID>}` o `{'epics_order': {...}}` **no falla pero tampoco
vincula** (queda `epics: None` al hacer GET posterior).

```python
api('POST', f'/epics/{EPIC_ID}/related_userstories', {
    'user_story': US_ID,
    'epic': EPIC_ID,
})
```

Verificación posterior:

```python
us = api('GET', f'/userstories/{US_ID}')
assert us['epics'] and us['epics'][0]['id'] == EPIC_ID
```

> Nota histórica: una versión anterior de este documento decía lo
> contrario (que `POST /epics/{id}/related_userstories` devolvía 400 y
> que había que usar PATCH). Eso aplicaba a una versión más antigua de
> Taiga; en la instancia actual del IIEG (verificada con 4 vinculaciones
> exitosas en sesión 1.9.0) es al revés.

---

## Flujo recomendado: Épica → Historia → Tarea

```
Épica (milestone/versión)
└── Historia de usuario (feature independiente, va a sprint)
    └── Tarea (subtarea técnica)
```

- **Épica**: contenedor del milestone o versión (ej. `SIEEJ 1.2.0`). Tiene descripción rica con arquitectura y referencias.
- **Historia**: una funcionalidad concreta dentro de la épica (ej. *"Migrar AuthContext a cookies + CSRF"*). Se estima y entra a un sprint.
- **Tarea**: paso técnico de la historia (ej. *"Reescribir handleFetchWithAuth con credentials:include"*).

### Crear los tres a la vez (Python)

```python
# 1. Crear o localizar la épica
epic = api('POST', '/epics', {
    'project': TAIGA_PROJECT_ID,
    'subject': 'SIEEJ 1.2.0',
    'description': '...'
})
epic_id = epic['id']

# 2. Crear historia y vincularla a la épica
us = api('POST', '/userstories', {
    'project': TAIGA_PROJECT_ID,
    'subject': 'Migrar AuthContext a cookies + CSRF',
    'assigned_to': TAIGA_USER_ID
})
api('POST', f'/epics/{epic_id}/related_userstories', {'user_story': us['id'], 'epic': epic_id})

# 3. Crear tarea vinculada a la historia
api('POST', '/tasks', {
    'project': TAIGA_PROJECT_ID,
    'user_story': us['id'],
    'subject': 'Reescribir handleFetchWithAuth con credentials:include',
    'assigned_to': TAIGA_USER_ID
})
```

### Actualizar los tres en cascada

```python
# Épica: actualizar descripción
epic = api('GET', f'/epics/{epic_id}')
api('PATCH', f'/epics/{epic_id}', {'description': nueva_desc, 'version': epic['version']})

# Historia: cambiar estado
us = api('GET', f'/userstories/{us_id}')
api('PATCH', f'/userstories/{us_id}', {'status': <STATUS_ID>, 'version': us['version']})

# Tarea: marcar como done
task = api('GET', f'/tasks/{task_id}')
api('PATCH', f'/tasks/{task_id}', {'status': <STATUS_ID>, 'version': task['version']})
```

Para obtener los IDs de estados disponibles:

```bash
curl -sk "$TAIGA_URL/api/v1/userstory-statuses?project=$TAIGA_PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; [print(f'{s[\"id\"]} {s[\"name\"]}') for s in json.load(sys.stdin)]"

curl -sk "$TAIGA_URL/api/v1/task-statuses?project=$TAIGA_PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; [print(f'{s[\"id\"]} {s[\"name\"]}') for s in json.load(sys.stdin)]"
```

---

## Pitfalls conocidos

### Paginación en listados de tareas

La API devuelve **30 resultados por página**. Un query sin `&page=N` solo trae la primera página. En proyectos con historial largo se pierden resultados. Siempre paginar:

```python
all_tasks = []
page = 1
while True:
    result = subprocess.run(
        ["curl", "-sk", f"{base}&page={page}", "-H", f"Authorization: Bearer {token}"],
        capture_output=True, text=True
    )
    data = json.loads(result.stdout)
    if not data or not isinstance(data, list):
        break
    all_tasks.extend(data)
    if len(data) < 30:
        break
    page += 1
```

### `assigned_to_extra_info` puede ser null aunque la tarea esté asignada

Algunas tareas tienen `assigned_to: <USER_ID>` correcto pero `assigned_to_extra_info: null`. Esto provoca dos problemas:

1. El filtro `?assigned_to=<ID>` **no las devuelve** en el listado.
2. Al parsear el nombre del asignado aparece "Sin asignar" aunque sí lo esté.

**Solución:** para auditar tareas asignadas a un usuario específico, obtener **todas las páginas** sin filtro y filtrar en Python por `assigned_to`:

```python
mis_tareas = [t for t in all_tasks if t.get('assigned_to') == TAIGA_USER_ID]
pendientes  = [t for t in mis_tareas if not t.get('status_extra_info', {}).get('is_closed', False)]
```

### Caracteres especiales en descripciones rompen variables de shell

Las descripciones de tareas pueden contener saltos de línea, tabs y otros caracteres de control. Si se guarda la respuesta JSON en una variable de shell (`VAR=$(curl ...)`), el JSON queda corrupto y cualquier `json.load` posterior falla con `Invalid control character`.

**Nunca usar variables de shell para almacenar respuestas JSON con descripciones.** Usar siempre `urllib.request` en Python puro:

```python
import urllib.request, json, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def api(method, path, body=None):
    req = urllib.request.Request(
        f"{BASE}{path}", headers=HEADERS, method=method,
        data=json.dumps(body).encode() if body else None
    )
    with urllib.request.urlopen(req, context=ctx) as r:
        return json.loads(r.read())
```

### Resolver `ref` → ID interno

El parámetro `?ref=N` en `/api/v1/tasks` no filtra correctamente. Usar el endpoint `resolver`:

```bash
curl -sk "$TAIGA_URL/api/v1/resolver?project=siiej&task=<REF>" \
  -H "Authorization: Bearer $TOKEN"
# Devuelve: {"project": 3, "task": <ID_INTERNO>}
```

### Listados paginados no traen `description` completa

`GET /userstories?project=N` y `GET /tasks?project=N` traen la descripción **truncada o vacía** (lazy load). Esto puede dar la falsa impresión de que un PATCH de descripción no funcionó.

**Para verificar que una descripción quedó escrita, hacer GET individual al recurso:**

```python
us = api('GET', f'/userstories/{US_ID}')
assert len(us.get('description') or '') > 0
```

### `PATCH {epic: <ID>}` sobre historia no vincula

Confirmado en sesión 1.9.0: el PATCH responde 200 OK pero el campo `epics` queda `None` al hacer GET posterior. Usar siempre `POST /epics/{epic_id}/related_userstories` (ver sección "Vincular historia de usuario a una épica").

---

## Reglas operativas para hidratar/modificar el proyecto

Reglas verificadas en la auditoría 1.9.0 (US#222), pensadas para evitar tocar trabajo ajeno y mantener auditabilidad.

### 1. Solo modificar lo asignado al usuario que ejecuta el script

Antes de cualquier `PATCH`, hacer `GET` y comprobar `assigned_to == TAIGA_USER_ID`. Si no coincide, **skip silencioso** y registrarlo en un log:

```python
def patch_us(us_id, fields, label):
    us = api('GET', f'/userstories/{us_id}')
    if us.get('assigned_to') != USER_ID:
        skipped.append(f"US#{us['ref']}: assigned_to={us.get('assigned_to')} != {USER_ID}")
        return None
    body = {**fields, 'version': us['version']}
    return api('PATCH', f'/userstories/{us_id}', body)
```

Lo mismo aplica para tareas. Las épicas y otros recursos no asignados a ti se leen pero no se modifican.

### 2. Al crear nuevo, asignar y verificar

Las creaciones (`POST /userstories`, `POST /tasks`) deben llevar `assigned_to: TAIGA_USER_ID`. Después del POST, hacer GET y comprobar que el campo quedó así:

```python
new_us = api('POST', '/userstories', {
    'project': PROJECT_ID,
    'subject': '...',
    'description': '...',
    'assigned_to': USER_ID,
    'status': STATUS_ID,
})
assert new_us.get('assigned_to') == USER_ID
```

### 3. Antes de publicar masivamente: redactar local y mostrar al usuario

Para hidrataciones grandes (decenas de descripciones), no escribir directo al API:
1. Redactar todas las descripciones a un módulo Python (`descriptions.py` con dicts `US_DESCRIPTIONS[us_id] = "..."` y `TASK_DESCRIPTIONS[task_id] = "..."`).
2. Mostrarle al humano el contenido inline o en archivos.
3. Esperar aprobación explícita.
4. Aplicar con un script idempotente que loguee `OK / SKIPPED / ERROR` por operación.

### 4. Estructura consistente de descripciones

Toda **épica** y toda **historia** se hidrata con tres o cuatro secciones, en este orden:

```markdown
## Objetivo

Una a tres líneas que explican qué se busca lograr y a quién beneficia. Lenguaje
accesible: si la lee una persona de área no técnica, debe entender el qué y el porqué.

## Contexto

Por qué se hace el cambio: incidente, deuda técnica, requerimiento externo, falla
observada. Aquí sí se pueden mencionar archivos, funciones y nombres internos.

## Resultado

Estado final tras la entrega. Una a tres líneas.

## Coordinación  (opcional)

Dependencias con otros sistemas/repos, requisitos de versión mínima, variables de
entorno compartidas. Se omite si no aplica.
```

Las **tareas** llevan estructura más simple:

```markdown
## Cambios

- Bullet técnico 1 (archivo, función, número de línea cuando aporta).
- Bullet técnico 2.

Commit: `<hash-corto>`.
```

Lenguaje:

- **Épicas** y la primera sección (Objetivo) de las historias se redactan para servidor público común: evitar `hook`, `provider`, `context`, `closure`, etc. cuando se puedan sustituir por una descripción funcional. Términos genuinos del dominio (`SeaweedFS`, `Acervo`, `mariachi`, `respondent`) sí pueden quedarse.
- Sin emojis en subjects ni descripciones.

### 5. PATCH siempre con `version` (control de concurrencia optimista)

Leer la versión justo antes del PATCH. Si otro proceso modificó el recurso entremedio, el PATCH falla y hay que releer:

```python
def patch_with_retry(path, fields, max_retries=3):
    for _ in range(max_retries):
        obj = api('GET', path)
        try:
            return api('PATCH', path, {**fields, 'version': obj['version']})
        except urllib.error.HTTPError as e:
            if e.code != 412:  # Precondition Failed
                raise
    raise RuntimeError(f'Versión cambió 3 veces en {path}')
```

### 6. Idempotencia y log de cambios

Mantener tres listas (`ok`, `skipped`, `errors`) y volcarlas al final del script. Esto permite re-ejecutar sin miedo:

```python
ok, skipped, errors = [], [], []
# ... operaciones ...
print(f"\nRESUMEN: {len(ok)} OK, {len(skipped)} skipped, {len(errors)} errors")
for line in ok: print(f"  ✓ {line}")
for line in skipped: print(f"  · {line}")
for line in errors: print(f"  ✗ {line}")
```

### 7. No mover de estado salvo solicitud explícita

Hidratar descripciones **no implica** mover de `New → Done`. Los cambios de estado siempre van con instrucción explícita del humano para evitar marcar algo como hecho cuando no lo está. Excepción: si una US tiene todas sus tareas `Closed`, sugerirle al humano y aplicar solo si confirma.

### 8. Vinculación de épicas: usar el endpoint correcto

`POST /epics/{epic_id}/related_userstories` con `{'user_story': US_ID, 'epic': EPIC_ID}`. Después GET y verificar `us['epics']` no nulo. Ver "Vincular historia de usuario a una épica".

### 9. Asignación por default (POST y PATCH)

Cuando crees o modifiques épicas, historias, tareas o issues:

- Si el item **no tiene `assigned_to`** (es `null` o no viene en el body), asignarlo a `TAIGA_USER_ID` por default.
- Si ya tiene `assigned_to` (otro usuario), **no sobrescribir** — respetar la asignación existente.

Aplica al crear (POST) y al actualizar (PATCH). En PATCH, si el `GET` previo muestra `assigned_to: null`, incluir `"assigned_to": USER_ID` en el cuerpo del PATCH antes de enviar.

```python
target = api('GET', f'/userstories/{us_id}')
patch = {'version': target['version'], **resto_de_cambios}
if target.get('assigned_to') is None:
    patch['assigned_to'] = TAIGA_USER_ID
api('PATCH', f'/userstories/{us_id}', patch)
```

Esta regla complementa a la regla 1 (no tocar lo asignado a otros): si está `null` lo tomamos, si está asignado a alguien más lo dejamos.

### 10. Títulos: patrón homologado

Las tres jerarquías siguen un patrón fijo. Mantenerlo es lo que permite que el backlog se lea de un golpe y que cualquier ingest futuro sea visualmente coherente con los anteriores.

**Épica** — contenedor del rango de versiones, sin descripción inline:

- Patrón: `SIEEJ X.Y.x`
- Ejemplos: `SIEEJ 1.12.x`, `SIEEJ 1.10.x`
- Para épicas temáticas no asociadas a una versión, usar nombre descriptivo en sustantivo (ej. `Plataforma SIEEJ: Ingesta de fuentes estatales`).
- ❌ `SIEEJ 1.10.0 — Auth UX: cambio de contraseña y mis envíos` (sin descripción inline; eso va en la descripción de la épica).

**User Story** — un cambio coherente dentro de una versión específica:

- Patrón: `vX.Y.Z — <descripción funcional>`
- `v` en minúscula, em-dash (`—`) con espacios alrededor, descripción que empieza con sustantivo o sustantivada (no con verbo).
- Ejemplos: `v1.12.0 — Integración del widget Colibri como botón flotante`, `v1.11.0 — Vista dedicada de "Mis envíos" con detalle, timeline y adjuntos`.
- ❌ `SIEEJ 1.10.0 — auth: cambio de contraseña y MVP de mis envíos` (sin prefijo `SIEEJ`, sin dos puntos enlistando, no se mezclan nombres internos en el subject).
- ❌ `Implementar cambio de contraseña en dos pasos` (un subject que empieza con verbo es de tarea, no de historia).

**Tarea** — un paso técnico concreto, sin prefijo de versión:

- Patrón: `<Verbo en infinitivo> <objeto técnico>`
- Sin prefijo de commit (`tipo(scope):`); el prefijo y el hash del commit van en la descripción.
- Ejemplos: `Reescribir ChangePassword con flujo de dos pasos`, `Crear helpers/passwordStrength con tests`, `Quitar w-screen de header y main`.
- ❌ `feat(formularios): MVP de vista de envios — tabs, busqueda y empty states por tab`
- ❌ `v1.10.0 — Reescribir ChangePassword` (las tareas no llevan prefijo de versión)

Aplica a items nuevos y a renombrado de items existentes que estén asignados al usuario actual. **No renombrar items asignados a otros** (regla 1).

### 11. Helpers idempotentes `ensure_us` / `ensure_task`

Re-ejecutar un script de hidratación no debe duplicar items. Buscar por subject exacto y aplicar `PATCH` si existe, `POST` si no:

```python
def ensure_us(subject, description, epic_id, status_id):
    existing = api('GET', f'/userstories?project={PROJECT_ID}')
    found = next((u for u in existing if u['subject'] == subject), None)
    if found:
        full = api('GET', f"/userstories/{found['id']}")
        return api('PATCH', f"/userstories/{found['id']}", {
            'description': description,
            'status': status_id,
            'version': full['version'],
        })
    us = api('POST', '/userstories', {
        'project': PROJECT_ID,
        'subject': subject,
        'description': description,
        'assigned_to': TAIGA_USER_ID,
    })
    api('POST', f'/epics/{epic_id}/related_userstories', {
        'user_story': us['id'],
        'epic': epic_id,
    })
    full = api('GET', f"/userstories/{us['id']}")
    return api('PATCH', f"/userstories/{us['id']}", {
        'status': status_id,
        'version': full['version'],
    })
```

Misma estructura para `ensure_task(us_id, subject, description, status_id)`. La regla 9 (asignación por default) aplica dentro del helper.

### 12. Status cerrado para trabajo ya mergeado

Cuando creas items en Taiga para trabajo que **ya está mergeado** en `develop`/`production`, marcarlos al status con `is_closed=true` para que no se cuelen al sprint planning:

```python
us_statuses = api('GET', f'/userstory-statuses?project={PROJECT_ID}')
task_statuses = api('GET', f'/task-statuses?project={PROJECT_ID}')
US_DONE = next(s['id'] for s in us_statuses if s.get('is_closed'))
TASK_DONE = next(s['id'] for s in task_statuses if s.get('is_closed'))
```

Aplicar el `status` cerrado en un PATCH separado (post-creación) o en el mismo POST si la API lo permite. **Excepción a la regla 7**: hidratar trabajo histórico ya mergeado sí justifica marcar como Done sin nueva confirmación, porque el estado real del código ya lo refleja.

### 13. Hash de commit en descripción

Última línea de la descripción de toda tarea: ``Commit `<hash-corto>`.`` o ``Commits: `<hash1>`, `<hash2>`.`` cuando aplique. Permite saltar de Taiga al repo sin abrir GitHub:

```
- ...bullet técnico...
- ...otro bullet...

Commit `fd6ce8d`.
```

Para historias que agrupan varios commits, listar los relevantes al final del bloque `## Referencias` (regla 4) en vez de inline.

### 14. Estructura jerárquica de hidratación por release

Para un release `vX.Y.Z`:

1. **Épica** `SIEEJ X.Y.x` — resumen ejecutivo de la versión en markdown, con secciones por subversión y viñetas por feature.
2. **User Story** `vX.Y.Z — <feature>` — descripción técnica del bloque de cambios. Vincular a la épica con `POST /epics/{id}/related_userstories` (regla 8).
3. **Tareas** — una por commit relevante; descripción con bullets concretas + hash del commit al final (regla 13).

Cuando un release toca varios subsistemas (ej. respondent + admin), una US por subsistema, no una US por release. La épica `SIEEJ X.Y.x` agrupa todas las US de las versiones `X.Y.0`, `X.Y.1`, ..., `X.Y.N`.

### 15. Granularidad: una historia por fix/feature concreto

Las historias deben representar **un cambio coherente y verificable**, no agrupar cosas porque vivan en el mismo archivo. Si un release toca cinco bugs distintos del mismo hook, son cinco historias (cada una con su descripción de Objetivo / Contexto / Resultado), no una historia "Bugfixes del hook". Esto facilita revisión, estimación y trazabilidad a commits.

Regla práctica: si tienes que usar la palabra "y" en el subject de la historia, probablemente es más de una historia. Excepciones: ajustes finos sumamente pequeños del mismo parámetro (ej. dos constantes relacionadas) pueden ir juntos.

### 16. Etiquetas por área técnica

Aplicar al campo `tags` (lista de strings) según el área principal del item. Las etiquetas son libres en este proyecto (no hay catálogo fijo); usar el set siguiente como convención:

- `backend` — cambios en `mariachi/api` o servicios backend relacionados.
- `frontend` — cambios en `frontend/src/**` del repo SIEEJ.
- `infra` — `docker-compose`, `Dockerfile`, `vite.config`, gateway-hub, deploy.
- `docs` — `docs/**`, `README.md`, `CHANGELOG.md`, `.env.example`.
- `tests` — cambios en suites de prueba (`test/**`, `*.test.js`).

Las épicas pueden cargar varias etiquetas (`backend`, `frontend`, `infra`, `docs`). Las historias y tareas idealmente una o dos.

### 17. Puntos: escala Fibonacci del proyecto

La escala configurada en el proyecto SIIEJ (IDs reales en `GET /points?project=3`):

| Nombre | Valor | ID |
|--------|------:|---:|
| `1/2`  | 0.5   | 27 |
| `1`    | 1.0   | 28 |
| `2`    | 2.0   | 29 |
| `3`    | 3.0   | 30 |
| `5`    | 5.0   | 31 |
| `8`    | 8.0   | 32 |
| `10`   | 10.0  | 33 |
| `13`   | 13.0  | 34 |
| `20`   | 20.0  | 35 |
| `40`   | 40.0  | 36 |

Roles del proyecto (IDs reales en `GET /roles?project=3`): `17 UX`, `18 Design`, `19 Front`, `20 Back`, `21 Product Owner`, `22 Stakeholder`, `23 Gobernanza`, `24 Datos Abiertos`, `140 Análisis`.

El campo `points` de una user story es un dict `{role_id_str: point_id}`. Asignar el punto al **rol principal** del trabajo. Ejemplo para una historia frontend de 5 puntos:

```python
api('PATCH', f'/userstories/{us_id}', {
    'points': {'19': 31},  # Rol Front (19) → punto "5" (id 31)
    'version': us_full['version'],
})
```

Las **tareas no llevan puntos individuales** (no aplica el campo). La suma de tareas puede ser menor o igual a la estimación de la historia: la historia se estima de manera integral, las tareas son desglose técnico.

Calibración mental (no es regla rígida):

- `1/2` — cambio de una sola constante o flag.
- `1` — refactor mecánico, rename, ajuste menor con tests intactos.
- `2` — fix de un solo bug acotado, con análisis breve.
- `3` — feature pequeña aislada, o fix con análisis profundo en un componente.
- `5` — integración nueva (librería + config + docs), o fix con cambios coordinados en varios archivos.
- `8` — feature mediana con efectos cross-cutting, o módulo nuevo con pruebas.
- `13` — auditoría a fondo (múltiples bugs latentes), refactor de un sistema completo.
- `20+` — un release entero o un cambio que cruza varios subsistemas; idealmente dividir.

### 18. Fecha límite (`due_date`)

Aplica a **épicas y tareas**. Las user stories no llevan `due_date` en la convención del proyecto (su entrega se rastrea por el milestone y por el estado de sus tareas).

Formato: `YYYY-MM-DD`. Para trabajo retroactivo (épica que se hidrata después de mergear), usar la fecha del día de hidratación: refleja cuándo se cerró el registro en Taiga, aunque el merge sea anterior.

```python
api('PATCH', f'/epics/{epic_id}', {
    'due_date': '2026-05-15',
    'version': epic_full['version'],
})
```

### 19. Valores observados de statuses en SIIEJ

Sujetos a cambio si se reconfigura el proyecto. Verificar con `GET /epic-statuses?project=3`, `/userstory-statuses?project=3`, `/task-statuses?project=3`:

- Epic status `Done` → id `15`.
- User story status `Done` → id `17` (también existe `Archived` id `18`, también cerrado).
- Task status `Closed` → id `14` (es el único `is_closed=true` del flujo).

Aun cerrando el item, sí aplica la regla 18 (`due_date`).

### 20. Verificar vínculos de una épica

Después de un POST a `related_userstories`, validar:

```python
rel = api('GET', f'/epics/{epic_id}/related_userstories')
print(f'{len(rel)} historias vinculadas')
```

Nota: el campo `user_story_extra_info` de la respuesta puede venir vacío (`ref=None, subject=None`); la relación sí está creada, es un detalle de hidratación del endpoint. Para ver los refs, hacer GET individual a cada `user_story` id de la respuesta.

---

## Notas generales

- El SSL del servidor usa una CA local. Usar `-sk` en curl (skip verify) en entornos de desarrollo.
- Los tokens JWT expiran rápido; regenerar al inicio de cada script.
- El campo `version` en wiki es requerido para evitar sobreescrituras concurrentes.
- Para SIEEJ no hay todavía wiki IDs específicos catalogados; al crear páginas
  recordar guardar el ID que devuelve el POST.
