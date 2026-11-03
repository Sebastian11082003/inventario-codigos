# ADR-003 — Cámara trasera con getUserMedia

- **ID:** ADR-003
- **Fecha:** 2026-11-03
- **Estado:** Aceptado
- **Autores:** Sebastian Osorio (restricción), entrega de este incremento

## Contexto

El escaneo tiene que usar la cámara del propio teléfono, la de atrás, en Chrome y Safari. El permiso puede negarse, puede no haber cámara y la página puede no ser segura.

**Origen:** HU-01, HU-02, HU-07, NFR-02, NFR-03.

## Decisión

**Decidimos:** al pulsar **Escanear con la cámara**, la app llama a `navigator.mediaDevices.getUserMedia` con `video.facingMode: "environment"` y `audio: false`. El fotograma se copia entero con `drawImage(video, 0, 0)` al tamaño real del video. Un lector de filas EAN-13 recorre arriba, centro y abajo, y también el eje girado 90°. ZXing (`TRY_HARDER`, binarizado híbrido e histograma) corre sobre la franja con más contraste de barras. Si el navegador tiene `BarcodeDetector`, se consulta el video y el lienzo; si no devuelve nada, siguen los otros. Los formatos siguen siendo EAN-13, EAN-8, UPC-A, Code 128, Code 39 y QR. Hacen falta dos lecturas iguales y, en los códigos de retail, el dígito GS1. Escribir el código es un control secundario. No hay lector de hardware ni un modo de webcam de escritorio.

**Justificación:** `facingMode: "environment"` es la forma compatible de pedir la cámara trasera en un solo gesto. `exact` falla en aparatos con una sola cámara y puede exigir una segunda llamada fuera del gesto de Safari. La cadena sigue siendo la trasera. Si el navegador solo tiene una cámara, puede entregarla; no ofrecemos un botón para cambiar a la frontal.

## Alternativas

| Alternativa | Motivo de descarte |
|---|---|
| Lector USB o Bluetooth | El pedido lo excluye |
| Webcam de escritorio como camino principal | No es el teléfono en el pasillo |
| `BarcodeDetector` solamente | Safari no lo ofrece de forma pareja. ZXing y el lector de filas cubren los dos navegadores sobre el mismo video |
| Recortar el video con un rectángulo de origen en `drawImage` | En este iPhone esa copia sale en blanco o toma otra zona del sensor. El visor se queda en «Mantén el código quieto.» |

## Consecuencias

La cámara no se prueba en CI. Los estados de error sí tienen copia y clasificación. Hace falta HTTPS en el teléfono: ADR-005.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| El navegador entrega la única cámara aunque no sea la trasera | Media | Medio | La petición no cambia. El límite está en el README |
| Safari rechaza el video si no está silenciado | Media | Alto | `muted` y `playsinline` antes de reproducir |
