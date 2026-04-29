# SIEEJ — Integracion con gateway-hub

SIEEJ se publica via `/sieej/` directamente desde `gateway-hub` (otro repo).
Este documento describe la configuracion de enrutamiento.

## Arquitectura del enrutamiento

```
Browser HTTPS
   |
   v
gateway-hub (Nginx)
   |
   `-- location ^~ /sieej/ --> alias /usr/share/nginx/html/sieej
                               try_files ... /sieej/index.html
                               (dist montado por gateway-hub via bind mount
                                desde ../sieej/frontend/dist)
   |
   `-- location = /sieej/ontoy --> alias /usr/share/nginx/html/sieej/ontoy.json
   |
   `-- location /api/      --> proxy_pass http://portal
                                          |
                                          `-- location /api/ --> proxy_pass http://mariachi_api:8000
```

**Punto clave:** SIEEJ es 100% estatico. `gateway-hub` lo sirve directamente
con `alias` (mismo patron que un ingress nginx con un dist puro). No requiere
upstream propio ni un container nginx dedicado para SIEEJ.

## Configuracion en gateway-hub

### `nginx/templates/gateway.conf.template`

```nginx
location = /sieej {
    return 301 /sieej/;
}

location = /sieej/ontoy {
    default_type application/json;
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    alias /usr/share/nginx/html/sieej/ontoy.json;
}

location ^~ /sieej/ {
    limit_req zone=static burst=200 nodelay;
    alias /usr/share/nginx/html/sieej/;
    try_files $uri $uri/ /sieej/index.html;
    add_header Cache-Control "no-cache" always;
}
```

`/sieej/api/...` no aplica: las llamadas al backend van por `/api/administrador/formularios/...`
que ya tiene su location en gateway-hub apuntando al upstream `portal` (=mariachi-api).

### `docker-compose.yml`

```yaml
nginx:
  build: ...
  volumes:
    - ${SIEEJ_DIST_PATH:-../sieej/frontend/dist}:/usr/share/nginx/html/sieej:ro
```

### `.env`

```dotenv
SIEEJ_DIST_PATH=../sieej/frontend/dist
```

`SIEEJ_DIST_PATH` permite override (por ejemplo en CI donde el dist
viene de un artefacto descargado en otra ruta).

## Build flow

```bash
# 1. SIEEJ
cd sieej
make build           # genera frontend/dist/ con VITE_BASE_PATH=/sieej/

# 2. gateway-hub (recoge el dist via bind mount al levantar)
cd ../gateway-hub
make up
```

En produccion (CI/CD futuro): el repo `iieg-oficial/sieej` produce un
artefacto (`dist.tar.gz`) que se descomprime en el host donde corre
`gateway-hub` y se referencia con `SIEEJ_DIST_PATH`.

## Checklist de despliegue

1. `docker network create iieg-network` (si no existe).
2. `SIEEJ`: `make build`.
3. `gateway-hub`: `docker compose build nginx && docker compose up -d`.
4. `mariachi`: `make up ENV=prod` (provee la API).
5. Verificar:
   ```bash
   curl -k https://<APP_DOMAIN>/sieej/
   curl -k https://<APP_DOMAIN>/sieej/ontoy
   curl -k https://<APP_DOMAIN>/api/administrador/formularios/catalogos -b cookies.txt
   ```

## Troubleshooting

- **404 en `/sieej/`**: el dist no esta montado o `make build` no se
  ejecuto. `docker exec gateway-hub-nginx-1 ls /usr/share/nginx/html/sieej`.
- **404 en rutas internas (`/sieej/inicio-sesion`)**: `try_files` debe
  caer en `/sieej/index.html`. Verificar la directiva en `gateway.conf.template`.
- **401 en `/api/administrador/formularios/...`**: cookie no se esta
  enviando. Verificar `withCredentials: true` (frontend) y
  `set_real_ip_from` en gateway-hub.
- **CSRF token invalid**: el frontend debe leer `csrf_token` de la
  respuesta de login y enviarlo en `X-CSRF-Token` header en mutaciones.
