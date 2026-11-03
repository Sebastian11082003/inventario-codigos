# Manual de uso

1. Abre la dirección `https://` en el teléfono. La cabecera es papaya y dice Inventario.
2. Pulsa **Escanear con la cámara**. Si la lista está vacía, el botón está en la cabecera. Si ya hay productos, queda fijo abajo. La indicación es «Mantén el código quieto.» La primera lectura cambia esa frase a «Ya lo veo, no lo muevas.» El número se acepta al segundo acuerdo seguido, no al primero.
3. Permite la cámara cuando el navegador lo pida. Se usa la de atrás. Deja el código dentro de la ventana. La línea papaya es una guía: la lectura también mira arriba y abajo de esa línea, y una botella de lado.
4. Si el teléfono puede iluminar, la barra del visor muestra **Flash**, a la derecha y sin tapar el recuadro. Púlsalo para encender la luz y otra vez para apagarla. El botón pasa a papaya cuando la luz está encendida. Si no aparece, esa cámara no ofreció flash. En una botella curva el reflejo puede borrar las barras: se puede leer con el flash apagado. Cerrar el visor apaga la luz.
5. Apunta al código hasta que la hoja blanca muestre el número. La ventana es ancha y la línea papaya es la guía. Deja el código dentro de esa ventana.
6. Si ese código ya estaba, ves el nombre, la categoría y la frase «En este teléfono había…». Escribe el conteo de ahora y pulsa **Guardar conteo y seguir**. La cámara no se cierra: apunta al siguiente. Si no hay ninguna unidad, escribe `0`. La hoja y, después, el Excel avisan `Sin existencias`.
7. Si el código es nuevo, no aparece un nombre sacado de internet. Pulsa **Completar producto**. Escribe el nombre que tú le pones, elige la categoría y la unidad: **Cantidad**, **kg** o **Gramos**. La unidad por defecto es Cantidad. En kg y gramos puedes escribir decimales, por ejemplo `0,5` kg o `250` g. En cantidad basta un entero; si escribes un decimal, no se pierde. El precio puede quedar vacío. También puedes escribir `0` si el estante está vacío.
8. Pulsa **Guardar producto**. El producto queda en la lista de este teléfono aunque cierres la pestaña. Exportar no borra esa lista.
9. En la lista, − y + corrigen de a una unidad, y − se apaga antes de llegar a 0. Para dejarlo en cero hay que abrir el producto y escribir `0`. La tarjeta muestra `Sin existencias`.
10. Pulsa **Exportar Excel**. Cada fila trae Código, Nombre, Categoría, Cantidad, Unidad (`cantidad`, `kg` o `g`), Precio, Notas y Alerta. Alerta dice `Sin existencias` solo en las filas con cantidad 0. Si la lista está vacía, exportar está apagado.

Si la frase no cambia de «Mantén el código quieto.», recarga la página. GitHub Pages puede guardar el HTML anterior unos diez minutos; el JavaScript nuevo tiene otro nombre y llega cuando el HTML está fresco.

Si la cámara no puede usarse, **Escribir código** abre la misma ficha del paso 7. Si el código ya estaba, la ficha dice cuántos había. Un campo vacío marca el error en rojo junto al campo y no guarda.

Categorías: desde la lista, **Categorías**. Las cuatro iniciales se pueden renombrar.

El archivo no se envía a ningún servidor. Quien tenga el teléfono puede ver la lista.
