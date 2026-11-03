# Entidades y reglas

## Producto

- Código obligatorio, sin caracteres de control, hasta 500 caracteres. Se recortan solo los extremos.
- Nombre obligatorio, hasta 120 caracteres.
- Categoría obligatoria y existente.
- Cantidad mayor o igual a 0, hasta 3 decimales. Se acepta coma o punto.
- Los botones − y + no dejan la cantidad en 0 ni por debajo. Si el paso llegaría a 0, la cantidad no cambia.
- El 0 solo se escribe en el conteo del visor o en la ficha, cuando el estante está vacío.
- Ese 0 no se guarda como alerta. Al exportar, la columna Alerta dice `Sin existencias`. Con cantidad mayor que 0, la celda va vacía.
- Unidad de la lista cerrada: `cantidad`, `kg` o `g`. Por defecto `cantidad`. Un registro viejo sin unidad, o con `und`, se lee como `cantidad`.
- Precio vacío o número mayor o igual a 0 con hasta 2 decimales. Vacío no se guarda como 0.
- Notas hasta 500 caracteres.
- El código es único. Escanear uno que ya existe muestra ese producto y la cantidad guardada, y pide el conteo de ahora. No se crea un duplicado. El nombre no se busca en internet.

## Categoría

- Semilla al primer uso: Abarrotes, Bebidas, Limpieza, Otros.
- Nombre obligatorio, hasta 40 caracteres, único sin distinguir mayúsculas ni acentos.
- No se borra si tiene productos ni si es la última.

## Código leído

- Un texto vacío no entra.
- Un QR con URL se acepta como texto. No hay acción de navegación.
