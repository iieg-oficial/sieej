# Analytics en SIEEJ

SIEEJ no embebe ningun SDK de analytics. La medicion de Google Analytics 4 se hace via Google Tag Manager (GTM), inyectado por el `gateway-hub` para todos los productos del ecosistema IIEG. Esta convencion es la misma que usa MapaLab.

## Modelo

```
Browser
   |
   v
gateway-hub (Nginx)
   |
   |  sub_filter en </head> y </body> (gtm.inc.template):
   |  inyecta GTM con GTM_ID configurado en gateway-hub/.env
   |
   v
mariachi-nginx (sirve /sieej/, /mariachi/, etc.)
   |
   v
SIEEJ frontend (dist/)  <-- recibe el HTML ya con el snippet GTM
```

`GTM_ID` vive en `gateway-hub/.env` (variable `GTM_ID`). El template responsable es `gateway-hub/nginx/includes/gtm.inc.template`. El template usa `sub_filter` para reemplazar `</head>` y `</body>` con los snippets correspondientes en cualquier respuesta `text/html`.

GA4 se configura como tag dentro de GTM. Cualquier evento `dataLayer.push(...)` que SIEEJ emita se procesa segun los triggers definidos en GTM, sin necesidad de modificar el frontend.

## Eventos custom

Helper en `src/helpers/analytics.js`:

```js
import { pushAnalyticsEvent } from '@helpers/analytics';

pushAnalyticsEvent('Autenticación', 'Iniciar sesión', 'Inicio de sesión exitoso');
```

Equivalente al payload empujado:

```js
window.dataLayer.push({
    event: 'sieej_event',
    category: 'Autenticación',
    action: 'Iniciar sesión',
    label: 'Inicio de sesión exitoso',
});
```

El helper es no-op si `window.dataLayer` no existe (dev local sin gateway). En modo desarrollo (`VITE_NODE_ENV=development`) imprime un `console.debug` para que el dev verifique que el evento se llamaria si hubiera GTM.

## Dimensiones esperadas en el dataLayer

| Campo | Tipo | Descripcion |
|---|---|---|
| `event` | `'sieej_event'` constante | Trigger principal en GTM. |
| `category` | string | Agrupacion semantica del evento. Hoy se usan: `Autenticación`, `Usuario`, `Formulario`, `Todo`. |
| `action` | string | Verbo en infinitivo o gerundio (Iniciar sesión, Cerrar sesión, Subir base de datos, Eliminar base de datos). |
| `label` | string \| null | Detalle libre (mensaje de exito, identificador, etc.). |

## Eventos emitidos hoy

| Origen | Category | Action | Label |
|---|---|---|---|
| `AuthContext.handleLogin` | Autenticación | Iniciar sesión | Inicio de sesión exitoso |
| `AuthContext.handleLogout` | Autenticación | Cerrar sesión | Sesión cerrada manualmente |
| `UserContext.handleUser` | Usuario | Obtener usuario | Se obtuvo el usuario {username} |
| `HomeContext.handlePostFile` | Formulario | Subir base de datos | Se subió base de datos como archivo. |
| `HomeContext.handleDeleteDatabase` | Formulario | Eliminar base de datos | Eliminar base de datos con id: {id} |
| `GlobalContext.globalAnalyticsEvent` | Todo | (variable) | (variable) |

## Configuracion en gateway-hub

```dotenv
# gateway-hub/.env
GTM_ID=GTM-XXXXXXX
```

Si `GTM_ID` esta vacio, el `sub_filter` aplica un script con id vacio que GTM ignora; los eventos `dataLayer.push` se acumulan en memoria pero nadie los consume (no rompe nada).

## Local dev sin GTM

`VITE_GOOGLE_ANALYTICS_ID` ya no se usa. El `.env.development` no requiere ninguna variable de analytics. Los eventos se envian al `dataLayer` si esta presente; en dev local el browser arranca sin GTM, asi que los eventos solo aparecen como `console.debug` (con `VITE_NODE_ENV=development`).

## Por que no usar `react-ga4` directamente

- Cada producto cargaria su propio script GA4 -> tags duplicados, inconsistencia de configuracion.
- La medicion se acopla al codigo del frontend; cambiar el ID de medicion implica rebuild.
- Mapalab y otros productos del IIEG ya siguen el patron GTM via gateway.
- GTM permite agregar/quitar herramientas de medicion (GA4, Hotjar, Pixel, etc.) sin tocar producto.
