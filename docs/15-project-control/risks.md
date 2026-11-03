# Riesgos

| ID | Riesgo | Probabilidad | Impacto | Estado | Mitigación |
|---|---|---|---|---|---|
| R1 | La cámara real no se prueba en CI. En el iPhone, un recorte del video dejó el visor en «Mantén el código quieto.» | Alta | Alto para el uso en pasillo | Abierto | El lector de filas, el dígito GS1 y los dos acuerdos están en `tests/camera.test.ts`. Falta confirmar en el teléfono que la frase pasa a «Ya lo veo, no lo muevas.» |
| R2 | Borrar datos del sitio borra el inventario | Media | Alto | Aceptado | Sin backend a propósito. El manual lo dice |
| R3 | Un teléfono con una sola cámara puede no entregar la trasera | Baja | Medio | Aceptado | No hay botón de webcam. La petición no cambia |
| R4 | El POS nombra los campos distinto | Media | Medio | Aceptado | Columnas estables y documentadas. El mapeo es del POS |
| R5 | GitHub Pages no es gratis en un repo privado | Media | Medio | Mitigado | Cloudflare Pages Free documentado, sin tarjeta |
| R6 | Avisos de npm en Vitest (dependencia de desarrollo) | Media | Bajo en producción | Aceptado | No están en `dist/`. No se aplicó `audit fix --force` |
| R7 | Dos pestañas pueden pisarse al guardar | Baja | Bajo | Abierto | v1 asume un operador y una pestaña |

Clasificación de seguridad del incremento: **baja**. No hay tenant, token ni secreto. La entrada se valida. El QR no se navega. Evidencia en `tests/products.test.ts`.

No hay bloqueo para usar la app en local. El bloqueo para el teléfono es publicar en HTTPS (R5 si el repo fuera privado y no se usara Cloudflare).
