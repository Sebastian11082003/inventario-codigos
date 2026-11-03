# ADR-002 — Sitio estático sin backend

- **ID:** ADR-002
- **Fecha:** 2026-11-03
- **Estado:** Aceptado
- **Autores:** entrega de este incremento

## Contexto

Hace falta guardar una sesión y exportar Excel. También hace falta que el despliegue sea gratis y que la cámara funcione en el teléfono.

**Origen:** NFR-04, NFR-05 y NFR-08.

## Decisión

**Decidimos:** una SPA con Vite, sin servidor de aplicación. Persistencia en IndexedDB. El Excel se arma en el navegador.

**Justificación:** un backend, aunque sea gratuito con límites, agrega cuenta, secretos y un punto de falla que el pedido no pide. La estabilidad de v1 es un solo artefacto estático.

## Alternativas

| Alternativa | Motivo de descarte |
|---|---|
| API más base de datos | Costo operativo y datos fuera del teléfono |
| Hoja de cálculo en línea de un proveedor | Dependencia de cuenta y de un formato que no controlamos |

## Consecuencias

No hay sincronización entre aparatos. Borrar datos del sitio borra el inventario. Queda registrado en riesgos.
