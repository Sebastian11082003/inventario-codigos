# ADR-001 — Idioma español y carpeta propia

- **ID:** ADR-001
- **Fecha:** 2026-11-03
- **Estado:** Aceptado
- **Autores:** Sebastian Osorio (pedido), entrega de este incremento

## Contexto

El OS está en español y un producto consumidor debe fijar el idioma. El stakeholder pidió la app sin reescribir el sistema operativo de ingeniería.

**Origen:** alcance de `01-context` y reglas de `standards/documentation-rules.md`.

## Decisión

**Decidimos:** la app es el repositorio `inventario-codigos`. El SDD vive en `docs/`. La interfaz y el markdown van en español. El código y los commits van en inglés. No se mezcla con el repositorio del OS.

**Justificación:** mezcla de idiomas en la misma categoría se rechaza. Separar la carpeta evita tocar `core/`, `agents/` y el mapa de living-docs del OS.

## Alternativas

| Alternativa | Motivo de descarte |
|---|---|
| App en la raíz del OS | Mezcla el producto con el framework |
| Documentación solo en el README | Incumple la estructura 00–15 |

## Consecuencias

El CI del OS ejecuta un segundo mapa con `LIVING_DOCS_CONFIG`. El núcleo no cambia de rol.
