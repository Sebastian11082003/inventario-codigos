# Historias de usuario

Origen común: [overview](../01-context/overview.md) y [visión](../03-product/vision.md). Prioridad: Must.

## HU-01 Escanear con la cámara trasera

Como operador, quiero apuntar la cámara de atrás del teléfono al código para no transcribirlo.

- Dado un contexto seguro y permiso concedido, cuando pulso **Escanear con la cámara**, entonces la app llama a `getUserMedia` con `facingMode: "environment"` y sin audio.
- Dado un código leído, cuando pulso **Usar este código**, entonces se abre la ficha con ese texto.
- Dado un QR con una URL, cuando lo confirmo, entonces el texto queda en el código y el navegador no abre esa URL.

## HU-02 Respaldo manual

Como operador, quiero escribir el código cuando la cámara no pueda usarse.

- Dado el estante, cuando busco otra acción, entonces **Escanear con la cámara** es el control principal y **Escribir código** es secundario.
- Dado un código vacío, cuando continúo, entonces veo un error y no se crea un producto.

## HU-03 Ficha de producto

Como operador, quiero nombre, categoría, cantidad, unidad, precio opcional y notas para que el POS reciba datos útiles.

- Dado un precio vacío, cuando guardo, entonces el precio queda nulo y no cero.
- Dado un nombre vacío o una cantidad negativa, cuando guardo, entonces la ficha no se cierra y marca el campo.

## HU-04 Categorías

Como operador, quiero crear y renombrar categorías, partiendo de Abarrotes, Bebidas, Limpieza y Otros.

- Dado un nombre repetido aunque cambien mayúsculas o acentos, cuando lo creo, entonces se rechaza.
- Dado un producto en esa categoría, cuando intento borrarla, entonces se conserva.

## HU-05 Sesión local

Como operador, quiero que un refresco no borre el estante.

- Dado un producto guardado, cuando la página vuelve a abrir IndexedDB, entonces el producto y el precio nulo siguen igual.

## HU-06 Editar y exportar

Como operador, quiero corregir la lista y descargar el Excel.

- Dado un estante vacío, cuando miro exportar, entonces la acción está deshabilitada.
- Dado productos guardados, cuando exporto, entonces el archivo trae las siete columnas en el orden del contrato y el código como texto.

## HU-07 Cámara no disponible

Como operador, quiero entender por qué no hay imagen.

- Dado un permiso negado, sin cámara o sin HTTPS, cuando falla la apertura, entonces veo un texto distinto para cada caso y puedo escribir el código.
