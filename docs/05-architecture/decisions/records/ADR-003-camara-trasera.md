# ADR-003 — Cámara trasera con getUserMedia

- **ID:** ADR-003
- **Fecha:** 2026-11-03
- **Estado:** Aceptado
- **Autores:** Sebastian Osorio (restricción), entrega de este incremento

## Contexto

El escaneo tiene que usar la cámara del propio teléfono, la de atrás, en Chrome y Safari. El permiso puede negarse, puede no haber cámara y la página puede no ser segura.

**Origen:** HU-01, HU-02, HU-07, NFR-02, NFR-03.

## Decisión

**Decidimos:** al pulsar **Escanear con la cámara**, la app llama a `navigator.mediaDevices.getUserMedia` con `video.facingMode: "environment"` y `audio: false`. ZXing decodifica el video en el teléfono, limitado a EAN-13, EAN-8, UPC-A, Code 128, Code 39 y QR. Escribir el código es un control secundario. No hay lector de hardware ni un modo de webcam de escritorio.

**Justificación:** `facingMode: "environment"` es la forma compatible de pedir la cámara trasera en un solo gesto. `exact` falla en aparatos con una sola cámara y puede exigir una segunda llamada fuera del gesto de Safari. La cadena sigue siendo la trasera. Si el navegador solo tiene una cámara, puede entregarla; no ofrecemos un botón para cambiar a la frontal.

## Alternativas

| Alternativa | Motivo de descarte |
|---|---|
| Lector USB o Bluetooth | El pedido lo excluye |
| Webcam de escritorio como camino principal | No es el teléfono en el pasillo |
| `BarcodeDetector` solamente | Safari no lo ofrece de forma pareja. ZXing cubre los dos navegadores sobre el mismo video |

## Consecuencias

La cámara no se prueba en CI. Los estados de error sí tienen copia y clasificación. Hace falta HTTPS en el teléfono: ADR-005.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| El navegador entrega la única cámara aunque no sea la trasera | Media | Medio | La petición no cambia. El límite está en el README |
| Safari rechaza el video si no está silenciado | Media | Alto | `muted` y `playsinline` antes de reproducir |
