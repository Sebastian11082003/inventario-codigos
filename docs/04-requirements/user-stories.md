# Historias de usuario

Origen común: [overview](../01-context/overview.md) y [visión](../03-product/vision.md). Prioridad: Must.

## HU-01 Escanear con la cámara trasera

Como operador, quiero apuntar la cámara de atrás del teléfono al código para no transcribirlo.

- Dado un contexto seguro y permiso concedido, cuando pulso **Escanear con la cámara**, entonces la app llama a `getUserMedia` con `facingMode: "environment"` y sin audio.
- Dado un código leído, cuando la hoja lo muestra, entonces el texto queda visible. Si es nuevo, **Completar producto** abre la ficha. Si ya estaba, el conteo se anota sin crear otro producto.
- Dado un QR con una URL, cuando lo confirmo, entonces el texto queda en el código y el navegador no abre esa URL.

## HU-02 Respaldo manual

Como operador, quiero escribir el código cuando la cámara no pueda usarse.

- Dado el estante, cuando busco otra acción, entonces **Escanear con la cámara** es el control principal y **Escribir código** es secundario.
- Dado un código vacío, cuando continúo, entonces veo un error y no se crea un producto.

## HU-03 Ficha de producto

Como operador, quiero nombre, categoría, cantidad, unidad, precio opcional y notas para que el POS reciba datos útiles.

- Dado un precio vacío, cuando guardo, entonces el precio queda nulo y no cero.
- Dado un producto nuevo, cuando abro la ficha, entonces la unidad es Cantidad y puedo cambiarla a kg o Gramos.
- Dado 0,5 kg o 250 g, cuando guardo, entonces el número se conserva. Un decimal en cantidad tampoco se rechaza.
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
- Dado productos guardados, cuando exporto, entonces el archivo trae Código, Nombre, Categoría, Cantidad, Unidad, Precio, Notas y, al final, Alerta. El código va como texto y la unidad como `cantidad`, `kg` o `g`.
- Dado un producto con cantidad 0, cuando exporto, entonces Alerta dice `Sin existencias`. Con cantidad mayor que 0, esa celda va vacía.

## HU-07 Cámara no disponible

Como operador, quiero entender por qué no hay imagen.

- Dado un permiso negado, sin cámara o sin HTTPS, cuando falla la apertura, entonces veo un texto distinto para cada caso y puedo escribir el código.

## HU-08 Conteo contra lo ya guardado

Como operador que vuelve a contar, quiero ver cuántos había y anotar los de ahora sin volver a escribir el nombre.

- Dado un código que ya está en el teléfono, cuando la cámara lo confirma, entonces veo el nombre, la categoría y la cantidad guardada, escribo el conteo (puede ser 0) y, al guardar, la cámara sigue lista para el siguiente.
- Dado un código nuevo, cuando la cámara lo confirma, entonces no aparece un nombre de internet. Puedo completar la ficha o seguir escaneando.
- Dado cantidad 1, 0 o 0,4, cuando pulso −, entonces la cantidad no cambia. Dado 1,5, cuando pulso −, entonces queda 0,5.
- Dado la ficha de un producto ya guardado, cuando escribo 0 y guardo, entonces queda 0 y el Excel avisa `Sin existencias`.
