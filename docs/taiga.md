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

**Historias** (épica/feature):

```markdown
## Objetivo
Una a tres líneas con el "qué" y el "por qué".

## Alcance
- Lo que incluye, agrupado por capa (backend/frontend/infra) cuando aplica.
- Lo que NO incluye (delimitar).

## Implementación
- Componentes/archivos clave.
- Decisiones técnicas relevantes (con tabla cuando aplica).

## Resultado
- Versión(es) y fechas (`docs/CHANGELOG.md` § X.Y.Z).
- Métricas (tests, bundle, etc.) cuando aplican.

## Referencias
- Docs internas, US/T relacionadas, commits.
```

**Tareas** (subtarea técnica):

```markdown
## Qué se hizo
Descripción concreta de la implementación.

## Archivos clave
Lista de los archivos tocados o creados.

## Notas / Decisiones
Por qué se hizo así (cuando no es obvio).

## Verificación
Cómo se validó (tests, lint, manual, etc.).
```

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

---

## Notas generales

- El SSL del servidor usa una CA local. Usar `-sk` en curl (skip verify) en entornos de desarrollo.
- Los tokens JWT expiran rápido; regenerar al inicio de cada script.
- El campo `version` en wiki es requerido para evitar sobreescrituras concurrentes.
- Para SIEEJ no hay todavía wiki IDs específicos catalogados; al crear páginas
  recordar guardar el ID que devuelve el POST.
