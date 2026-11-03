# Onboarding técnico

1. Leer [README](../../README.md) de la app y [ADR-003](../05-architecture/decisions/records/ADR-003-camara-trasera.md).
2. `npm ci && npm test && npm run dev`.
3. La regla de negocio está en `src/domain` y no debe importar el DOM.
4. La llamada a la cámara está en `src/camera/session.ts`. Cualquier cambio tiene que seguir pidiendo `facingMode: "environment"`.
5. El Excel se arma en `src/export/xlsx.ts`. Si cambia una columna, cambian la prueba, `07-api` y el README en el mismo entregable.
6. La documentación viva usa el `.living-docs.json` de la raíz de este repositorio.
