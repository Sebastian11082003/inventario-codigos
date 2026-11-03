# Onboarding técnico

1. Leer [README](../../README.md) de la app y [ADR-003](../05-architecture/decisions/records/ADR-003-camara-trasera.md).
2. `npm ci && npm test && npm run dev`.
3. La regla de negocio está en `src/domain` y no debe importar el DOM.
4. La llamada a la cámara está en `src/camera/session.ts`. Cualquier cambio tiene que seguir pidiendo `facingMode: "environment"`. El fotograma se copia con `drawImage(video, 0, 0)` y el lienzo al tamaño `videoWidth` × `videoHeight`. No uses un rectángulo de origen sobre el elemento video: en el iPhone esa copia sale en blanco y, si el lector aborta por poco contraste, no llega a probar nada más. `src/camera/pixels.ts` lee varias filas del fotograma completo y las columnas (botella de lado), engrosa las barras y sigue exigiendo el dígito GS1. Un margen blanco corto no descarta el código. Hacen falta dos lecturas iguales. Si existe `BarcodeDetector`, se llama con el video y con el lienzo; un resultado vacío sigue con el resto.
5. El Excel se arma en `src/export/xlsx.ts`. Si cambia una columna, cambian la prueba, `07-api` y el README en el mismo entregable.
6. La documentación viva usa el `.living-docs.json` de la raíz de este repositorio.
