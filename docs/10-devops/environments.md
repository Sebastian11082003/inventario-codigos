# Entornos

| Entorno | URL | Datos | Costo |
|---|---|---|---|
| Local | `http://localhost:5173` | IndexedDB de ese navegador | $0 |
| GitHub Pages | `https://sebastian11082003.github.io/inventario-codigos/` | IndexedDB del teléfono | $0 si el repo es público |
| Cloudflare Pages Free | `https://<proyecto>.pages.dev` | IndexedDB del teléfono | $0, sin tarjeta, también con repo privado |

No hay staging con base de datos. Cada navegador es su propio almacén.

La base de Vite en local y en Cloudflare es `/`. En GitHub Pages el workflow pasa `--base "/<nombre-del-repo>/"`.
