# 13 — Operación

No hay servicio que observar. Esta carpeta existe para el incidente que sí puede pasar: la cámara o los datos locales.

## Señales

No hay logs centrales. El operador ve el estado en la pantalla. Si IndexedDB falla al abrir, la app avisa que la lista quedó solo en memoria.

## Incidentes

| Síntoma | Qué hacer |
|---|---|
| Permiso de cámara bloqueado | El texto de la pantalla indica Chrome y Safari. Luego Reintentar |
| Página en HTTP por IP | Publicar por HTTPS. No hay arreglo en el código: el navegador lo prohíbe |
| Inventario desaparecido | No hay backup. Volver a capturar. Evitar borrar datos del sitio |
| Pages no publica | Confirmar Source = GitHub Actions y que el repo sea público. Si es privado, Cloudflare Pages Free |

El runbook del módulo está en [inventario-web/runbook.md](../09-microservices/inventario-web/runbook.md). No hay SLA: es una herramienta local publicada como archivo estático.
