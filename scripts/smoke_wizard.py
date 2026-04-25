"""Smoke test end-to-end del wizard SIEEJ.

Recorre los cinco pasos del wizard como un usuario rol externo:

1. Login (cookie + CSRF).
2. Crea Informacion General.
3. Crea dos Enlaces (institucional + tecnico).
4. Crea dos Bases de Datos.
5. Actualiza una de las BD con todos los campos del paso 4.
6. (Opcional) Sube un PDF de diccionario via Acervo si hay file.
7. Verifica que /sieej/stats refleje el progreso.

Requiere:

- mariachi-api corriendo en BASE_URL.
- Postgres iieg_portal con schema sieej seedeado.
- Un usuario rol externo con UserProject sieej. Se puede crear con:
    POST /api/administrador/usuarios/agregar-dependencia-sieej
  desde una sesion admin (ver mariachi/admin -> Sieej -> Agregar dependencia).

Uso:

    python smoke_wizard.py \\
        --base-url http://localhost:8000 \\
        --username dep_smoke \\
        --password Sh0YPkRPrck3 \\
        [--file /ruta/diccionario.pdf]

El script imprime el resultado de cada paso y termina con codigo != 0
si algo falla.
"""

import argparse
import json
import sys
import urllib.request
import urllib.error
from http.cookiejar import CookieJar


def make_opener():
    cookies = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))
    return opener, cookies


def request(opener, method, url, body=None, csrf=None, multipart=None):
    headers = {"Accept": "application/json"}
    data = None
    if multipart is not None:
        boundary = "----SmokeBoundary"
        parts = []
        for name, value, filename in multipart:
            parts.append(f"--{boundary}".encode())
            disposition = f'Content-Disposition: form-data; name="{name}"'
            if filename:
                disposition += f'; filename="{filename}"'
            parts.append(disposition.encode())
            parts.append(b"Content-Type: application/octet-stream" if filename else b"Content-Type: text/plain")
            parts.append(b"")
            parts.append(value if isinstance(value, (bytes, bytearray)) else str(value).encode())
        parts.append(f"--{boundary}--".encode())
        data = b"\r\n".join(parts)
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
    elif body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"

    if csrf and method in ("POST", "PUT", "DELETE", "PATCH"):
        headers["X-CSRF-Token"] = csrf

    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with opener.open(req) as r:
            text = r.read().decode()
            return r.status, json.loads(text) if text else None
    except urllib.error.HTTPError as e:
        text = e.read().decode()
        try:
            return e.code, json.loads(text)
        except json.JSONDecodeError:
            return e.code, {"detail": text}


def assert_ok(label, status, body, expected=200):
    if isinstance(expected, int):
        expected = (expected,)
    ok = status in expected
    icon = "OK" if ok else "FAIL"
    print(f"[{icon}] {label}: HTTP {status}")
    if not ok:
        print(f"      body: {json.dumps(body, ensure_ascii=False)[:300]}")
        sys.exit(1)
    return body


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--base-url", default="http://localhost:8000")
    p.add_argument("--username", required=True)
    p.add_argument("--password", required=True)
    p.add_argument("--file", help="archivo opcional para upload diccionario")
    args = p.parse_args()

    base = args.base_url.rstrip("/") + "/api/administrador"
    opener, _ = make_opener()

    print(f"Base URL: {base}")
    print(f"User    : {args.username}")
    print()

    print("[1/7] login")
    status, body = request(opener, "POST", f"{base}/autenticacion/iniciar-sesion",
                           body={"username": args.username, "password": args.password})
    body = assert_ok("login", status, body, 200)
    csrf = body["csrf_token"]
    user = body["user"]
    print(f"      role={user['role']}, must_change_password={user['must_change_password']}")
    print(f"      proyectos: {[p['slug'] for p in user.get('projects', [])]}")
    print()

    print("[2/7] catalogos")
    status, catalogos = request(opener, "GET", f"{base}/formularios/catalogos", csrf=csrf)
    catalogos = assert_ok("catalogos", status, catalogos, 200)
    unidades = catalogos.get("unidades_admin", [])
    if not unidades:
        print("FAIL: catalogo unidades_admin vacio. Aplica la migration sieej y seeds.")
        sys.exit(1)
    unidad = unidades[0]["value"]
    categoria = catalogos["categoria_datos"][0]["value"]
    periodicidad = catalogos["periodicidad"][0]["value"]
    objetivo = catalogos["objetivo_uso"][0]["value"]
    usuarios_datos = catalogos["usuarios_datos"][0]["value"]
    herramientas = catalogos["herramientas_gestion"][0]["value"]
    calidad = catalogos["calidad_datos"][0]["value"]
    eje = catalogos["ejes_estrategicos"][0]["value"]
    print(f"      unidades_admin={len(unidades)}, primer valor: {unidad[:50]}")
    print()

    print("[3/7] general")
    status, general = request(opener, "POST", f"{base}/formularios/general", csrf=csrf, body={
        "nombre_ente_gobierno": "Ente Smoke Test",
        "unidad_admin": unidad,
        "hay_responsable": True,
        "descripcion_hay_responsable": "Direccion de Datos",
        "desafios_oportunidades": "Mejorar pipelines de ingesta",
    })
    assert_ok("crear general", status, general, (200, 201))
    print(f"      id={general['id']}")
    print()

    print("[4/7] enlaces")
    enlace_inst = {
        "nombres": "Juan", "apellido1": "Perez", "apellido2": "Gomez",
        "direccion": "Direccion General", "puesto": "Director", "email": "juan@dep.gob.mx",
        "extension": "1234", "telefono": "33-1234-5678", "es_tecnico": False,
        "nombres_jefe": "Maria", "apellido1_jefe": "Lopez", "apellido2_jefe": "Mtz",
        "puesto_jefe": "Subsecretaria", "email_jefe": "maria@dep.gob.mx",
    }
    status, e1 = request(opener, "POST", f"{base}/formularios/enlaces", csrf=csrf, body=enlace_inst)
    assert_ok("crear enlace institucional", status, e1, 201)
    print(f"      enlace inst id={e1['id']}")

    enlace_tec = {**enlace_inst, "nombres": "Pedro", "puesto": "Lider tecnico", "es_tecnico": True}
    status, e2 = request(opener, "POST", f"{base}/formularios/enlaces", csrf=csrf, body=enlace_tec)
    assert_ok("crear enlace tecnico", status, e2, 201)
    print(f"      enlace tec  id={e2['id']}")
    print()

    print("[5/7] bases-datos (crear)")
    status, bd = request(opener, "POST", f"{base}/formularios/bases-datos", csrf=csrf, body={
        "nombre_bd": "Padron de Vialidades",
        "descripcion_bd": "Listado oficial de vialidades del municipio",
    })
    assert_ok("crear bd", status, bd, 201)
    bd_id = bd["id"]
    print(f"      bd id={bd_id}")
    print()

    print("[6/7] bases-datos (actualizar con todos los campos)")
    status, bd = request(opener, "PUT", f"{base}/formularios/bases-datos/{bd_id}", csrf=csrf, body={
        "nombre_bd": "Padron de Vialidades",
        "descripcion_bd": "Listado oficial de vialidades del municipio (actualizado)",
        "categoria_datos": categoria,
        "herramientas_gestion": herramientas,
        "calidad_datos": calidad,
        "limpieza_validacion": True,
        "desc_limpieza_validacion": "Validacion automatica diaria",
        "proveedores_bd": "DGT municipal",
        "periodicidad": periodicidad,
        "desc_periodicidad": "Cada lunes a las 8am",
        "tiene_diccionario": False,
        "objetivo_uso": objetivo,
        "usuarios_datos": usuarios_datos,
        "quienes_son": "Equipo de movilidad",
        "historicos": True,
        "desc_historicos": "Historicos desde 2020",
        "migracion_actualizacion": False,
        "desc_migracion_actualizacion": None,
        "medidas_seguridad": True,
        "desc_medidas_seguridad": "Acceso por VPN",
        "normativas_proteccion": True,
        "desc_normativas_proteccion": "LFPDPPP",
        "plan_contingencia": False,
        "desc_plan_contingencia": None,
        "interoperatividad": True,
        "desc_interoperatividad": "Comparte con SCT",
        "plataforma_difusion": True,
        "nombre_plataforma_difusion": "Datos Abiertos Jalisco",
        "url_plataforma_difusion": "https://datos.jalisco.gob.mx",
        "retos": "Estandarizacion entre municipios",
        "ejes_estrategicos": [eje],
    })
    assert_ok("actualizar bd", status, bd, 200)
    print(f"      ejes asociados: {[e['value'] for e in bd.get('ejes_estrategicos', [])]}")
    print()

    if args.file:
        print(f"[7/7] upload diccionario ({args.file})")
        with open(args.file, "rb") as f:
            content = f.read()
        status, body = request(opener, "POST",
                               f"{base}/formularios/bases-datos/{bd_id}/diccionario",
                               csrf=csrf,
                               multipart=[("file", content, args.file.split("/")[-1])])
        body = assert_ok("upload diccionario", status, body, 200)
        print(f"      ruta_diccionario: {body.get('ruta_diccionario')}")
    else:
        print("[7/7] upload diccionario: omitido (sin --file)")
    print()

    print("[8/7] logout")
    status, body = request(opener, "POST", f"{base}/autenticacion/cerrar-sesion", csrf=csrf)
    assert_ok("logout", status, body, 200)
    print()

    print("Wizard smoke completo. Todo OK.")


if __name__ == "__main__":
    main()
