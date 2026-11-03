# Reglas de documentación del producto

## Idioma

Decisión en [ADR-001](../05-architecture/decisions/records/ADR-001-idioma-y-ubicacion.md).

- Markdown, interfaz y mensajes al usuario: español.
- Identificadores de código, ramas y commits: inglés, Conventional Commits.
- Los nombres de columna Excel son contrato en snake_case español y no se traducen.

## Qué se actualiza con el código

Si cambia la interfaz, el contrato Excel o el almacenamiento, el mismo cambio toca la carpeta SDD que indica `.living-docs.json`. Un checkbox no sustituye al job **Documentación viva**.
