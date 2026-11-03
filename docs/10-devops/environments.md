# Entornos

| Entorno | URL | Datos | Costo |
|---|---|---|---|
| Local | `http://localhost:5173` | IndexedDB de ese navegador | $0 |
| GitHub Pages | `https://sebastian11082003.github.io/inventario-codigos/` | IndexedDB del teléfono | $0 si el repo es público |
| Cloudflare Pages Free | `https://<proyecto>.pages.dev` | IndexedDB del teléfono | $0, sin tarjeta, también con repo privado |

No hay staging con base de datos. Cada navegador es su propio almacén.

La base de Vite en local y en Cloudflare es `/`. En GitHub Pages el workflow pasa `--base "/<nombre-del-repo>/"`.

GitHub Pages responde `Cache-Control: max-age=600` en `index.html` y en los assets. El JS del build lleva hash en el nombre: con el HTML fresco el teléfono no reutiliza un bundle viejo. Una pestaña abierta puede seguir con el HTML anterior hasta diez minutos. El `index.html` de la app pide no cachear, pero la cabecera HTTP de Pages manda.
