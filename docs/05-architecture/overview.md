# Overview

## C4 — Contexto

```mermaid
flowchart LR
  operador[Operador con teléfono]
  app[Inventario de códigos]
  pos[POS que importa Excel]
  operador -->|HTTPS| app
  app -->|archivo xlsx descargado| pos
```

## C4 — Contenedores

Un solo contenedor: sitio estático. El navegador guarda IndexedDB y genera el xlsx. No hay contenedor de servidor.

```mermaid
flowchart TB
  subgraph telefono [Teléfono]
    ui[Interfaz en español]
    cam[getUserMedia cámara trasera]
    zxing[Lector ZXing en el navegador]
    idb[(IndexedDB inventario-codigos)]
    xlsx[Generador xlsx]
    ui --> cam --> zxing --> ui
    ui --> idb
    ui --> xlsx
  end
```

Módulos de código: `src/domain` (reglas), `src/camera` (restricción y errores), `src/persistence`, `src/export`, `src/ui`. La UI depende del dominio. El dominio no depende del navegador.
