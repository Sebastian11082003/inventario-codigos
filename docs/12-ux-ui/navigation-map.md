# Mapa de navegación

```mermaid
flowchart TD
  lista[Lista]
  cam[Cámara trasera]
  manual[Escribir código]
  ficha[Ficha]
  cats[Categorías]
  lista -->|Escanear con la cámara| cam
  lista -->|acción secundaria| manual
  lista --> cats
  lista -->|tarjeta| ficha
  cam -->|código confirmado| ficha
  cam -->|respaldo| manual
  manual --> ficha
  ficha --> lista
  cats --> lista
  lista -->|Exportar Excel| archivo[Archivo xlsx]
```

No hay rutas de URL. Es una sola página. Volver siempre regresa a la lista y apaga la cámara.

Con la lista vacía, **Escanear con la cámara** está en la cabecera papaya. Cuando ya hay productos, el mismo botón queda fijo en el pie. **Escribir código** no pasa a ser la acción principal.
