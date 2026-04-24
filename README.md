# SIEEJ

**Sistema de Información Estadística del Estado de Jalisco**

Frontend de captura para que dependencias e instituciones de gobierno
entreguen información estructurada al Instituto de Información Estadística
y Geográfica de Jalisco (IIEG).

## Stack

- React 19 + Vite 6
- Tailwind CSS 4
- React Router 7
- Backend: consume `mariachi/api` via gateway-hub bajo `/api/administrador/formularios/*`

## Estado

🚧 **En migración a la arquitectura del ecosistema IIEG (gateway-hub + mariachi).**
El código del frontend se moverá aquí desde `IIEG/SIEEJ/frontend/` cuando la
fase de backend en `mariachi/api` esté lista.

## Documentación

- Roadmap y arquitectura general en el repo `mariachi`.
- Flujo de despliegue público a través de `gateway-hub` en `/sieej/`.

## Licencia

[MIT](./LICENSE) — IIEG Jalisco.
