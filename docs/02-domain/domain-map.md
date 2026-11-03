# Mapa de dominio

```mermaid
flowchart LR
  operador[Operador]
  app[Inventario en el teléfono]
  pos[POS externo]
  operador -->|escanea o escribe| app
  app -->|archivo xlsx| pos
```

Bounded context único: **Inventario de mostrador**. No hay otro contexto en v1. El POS no es un módulo de este sistema.
