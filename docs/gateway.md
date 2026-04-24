# SIEEJ — Integracion con gateway-hub

SIEEJ se publica via `/sieej/` a traves del `gateway-hub` (otro repo).
Este documento describe la configuracion de enrutamiento.

## Arquitectura del enrutamiento

```
Browser HTTPS
   |
   v
gateway-hub (Nginx)
   |
   `-- location ^~ /sieej/ --> proxy_pass http://portal
                                          (= mariachi-nginx:80)
                                          |
                                          `-- location /sieej --> alias /usr/share/nginx/html/sieej
                                                                       (volumen ../SIEEJ/frontend/dist)
                                                                       try_files ... /sieej/index.html
   `-- location /api/      --> proxy_pass http://portal
                                          |
                                          `-- location /api/ --> proxy_pass http://mariachi_api:8000
```

**Punto clave:** SIEEJ **no** tiene su propio upstream en gateway-hub.
Reusa el upstream `portal` (que apunta a `mariachi-nginx`).

## Configuracion en gateway-hub

### `nginx/templates/gateway.conf.template`

```nginx
location ^~ /sieej/ {
    limit_req zone=general burst=150 nodelay;
    include /etc/nginx/includes/bot-protection.inc;
    proxy_pass http://portal;
    include /etc/nginx/includes/proxy-params.inc;
    proxy_set_header Accept-Encoding "";
    proxy_intercept_errors on;
    proxy_read_timeout 120s;
    proxy_send_timeout 120s;
    add_header X-Robots-Tag $seo_robots;
}
```

`/sieej/api/...` cae en el `location /api/` ya existente (que tambien
apunta a `portal` y por ende a mariachi-nginx → mariachi-api).

### `.env`

No se necesita `SIEEJ_HOST`. Las variables relevantes:

```dotenv
PORTAL_HOST=mariachi-nginx:80
```

## Configuracion en mariachi

### `nginx/conf.d/mariachi.conf`

```nginx
location /sieej {
    alias /usr/share/nginx/html/sieej;
    try_files $uri $uri/ /sieej/index.html;
}
```

### `docker-compose.yml`

```yaml
nginx:
  build: ...
  volumes:
    - ${SIEEJ_DIST_PATH:-../SIEEJ/frontend/dist}:/usr/share/nginx/html/sieej:ro
```

`SIEEJ_DIST_PATH` permite override (por ejemplo en CI donde el dist
viene de un artefacto descargado en otra ruta).

## Build flow

```bash
# 1. SIEEJ
cd SIEEJ
make build           # genera frontend/dist/ con VITE_BASE_PATH=/sieej/

# 2. mariachi
cd ../mariachi
make up ENV=staging  # o ENV=prod; mariachi-nginx monta el dist via volumen
```

En produccion (CI/CD futuro): el repo `iieg-oficial/sieej` produce un
artefacto (`dist.tar.gz`) que se descomprime en el host donde corre
mariachi y se referencia con `SIEEJ_DIST_PATH`.

## Checklist de despliegue

1. `docker network create iieg-network` (si no existe).
2. `gateway-hub`: `docker compose up -d`.
3. `SIEEJ`: `make build`.
4. `mariachi`: `make up ENV=prod`.
5. Verificar:
   ```bash
   curl -k https://<APP_DOMAIN>/sieej/
   curl -k https://<APP_DOMAIN>/api/administrador/formularios/catalogos -b cookies.txt
   ```

## Troubleshooting

- **404 en `/sieej/`**: el dist no esta montado o `make build` no se
  ejecuto. `docker exec mariachi-nginx ls /usr/share/nginx/html/sieej`.
- **404 en rutas internas (`/sieej/inicio-sesion`)**: `try_files` debe
  caer en `/sieej/index.html`. Verificar la directiva en `mariachi.conf`.
- **401 en `/api/administrador/formularios/...`**: cookie no se esta
  enviando. Verificar `withCredentials: true` (frontend) y
  `set_real_ip_from` en gateway-hub.
- **CSRF token invalid**: el frontend debe leer `csrf_token` de la
  respuesta de login y enviarlo en `X-CSRF-Token` header en mutaciones.
