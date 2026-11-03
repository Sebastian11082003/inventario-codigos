# ADR-005 — Hosting estático de costo cero

- **ID:** ADR-005
- **Fecha:** 2026-11-03
- **Estado:** Aceptado
- **Autores:** Sebastian Osorio (restricción), entrega de este incremento

## Contexto

La cámara del teléfono exige HTTPS. El despliegue no puede pedir tarjeta ni un plan de pago.

**Origen:** NFR-03 y NFR-05.

## Decisión

**Decidimos:** publicar el `dist/` de Vite en GitHub Pages (repositorio público, workflow manual **Inventario en GitHub Pages**) o en Cloudflare Pages plan Free (también si el repo es privado). Los pasos están en el README del producto. No se provisiona un backend.

**Justificación:** las dos opciones dan HTTPS a $0 sin tarjeta. Pages en un repo privado no es gratis, por eso el segundo camino está escrito y no escondido.

## Alternativas

| Alternativa | Motivo de descarte |
|---|---|
| Un PaaS con capa gratuita que pide tarjeta | Viola la restricción en el momento de registrarse |
| Servir por HTTP en la LAN | El teléfono no abre la cámara |

## Consecuencias

La URL de Pages es `https://sebastian11082003.github.io/inventario-codigos/` y la base es `/inventario-codigos/`. Cloudflare Pages usa la base `/`. El workflow de Pages no corre en cada push: se lanza a mano para no dejar `main` en rojo antes de activar Pages.
