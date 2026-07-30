# Flujo de n8n: los locales descuentan stock desde una planilla

Los 3 locales no tienen sistema propio. Anotan lo que venden en una Google
Sheet y n8n se encarga de avisarle a la tienda, que es la que lleva el stock
real. Como el stock de `Variante` es uno solo, lo que se vende en un local
deja de estar disponible en la web al instante, y al revés.

```
[Nueva fila en Sheets] → [Armar pedido] → [Buscar producto]
    → [Elegir producto y armar body] → [Llamar API stock]
    → [Preparar estado] → [Actualizar Estado en Sheets]
```

## La planilla

Una fila por movimiento. Las columnas son:

| Columna | Qué va |
|---|---|
| Fecha | Referencia para el empleado. La API guarda su propia fecha. |
| Punto de venta | El nombre **exacto** del local, igual que en `/admin/puntos-venta`. |
| Tipo | `VENTA`, `INGRESO` o `AJUSTE` (no distingue mayúsculas). |
| Producto | El nombre del producto tal como está en el catálogo. |
| Talle | El talle. |
| Color | Solo si el talle tiene más de un color; si no, se puede dejar vacío. |
| Cantidad | Para `VENTA` e `INGRESO`. |
| Cantidad final (solo AJUSTE) | El número **contado** en el local, no la diferencia. |
| Nota | Obligatoria en `AJUSTE`. |
| Estado (lo completa n8n) | Lo escribe el flujo: `OK — stock actual: N` o el error. |

El empleado nunca ve un id interno: escribe el nombre del producto y el flujo
lo resuelve contra el catálogo.

## Importarlo

El flujo está en `bot/workflow-stock-locales.json`:

1. Copiá todo el contenido del archivo.
2. En n8n, entrá a un workflow nuevo y **pegá con Ctrl+V sobre el canvas**.
3. Aparecen los siete nodos ya conectados.
4. Falta completar tres cosas (son datos de cada instalación, por eso no están
   en el archivo):
   - **Nueva fila en Sheets** y **Actualizar Estado en Sheets**: elegí tu
     credencial de Google Sheets, y en `documentId` el id de tu planilla.
   - **Armar pedido**: reemplazá `PEGAR_API_KEY_FABRICA`,
     `PEGAR_API_KEY_FISHERTON` y `PEGAR_API_KEY_NORTE` por las API keys reales
     de cada punto de venta.
5. Activá el workflow.

> **El nombre de la pestaña importa.** Los dos nodos de Sheets apuntan a la
> pestaña por nombre, no por `gid`. Si la planilla se creó subiendo un CSV a
> Drive, la pestaña suele quedar como `Untitled`. Si la renombrás, hay que
> actualizar el campo *Sheet* de ambos nodos o el workflow deja de activarse
> con el error `Sheet with ID ... not found`.

> **Nunca dejes filas de ejemplo en la planilla.** El flujo resuelve el
> producto por nombre y no distingue mayúsculas: un ejemplo tipo
> "Campera Polar / S / AJUSTE / 3" coincide con un producto real y le
> **pisa el stock**. La planilla arranca solo con la fila de encabezados.

Las API keys se generan en `/admin/puntos-venta` y **se muestran una sola vez**
(se guardan hasheadas). Si perdiste una, no se recupera: se regenera, y hay que
actualizarla acá.

## Qué hace cada nodo

**1. Nueva fila en Sheets** — dispara cuando aparece una fila nueva. Consulta
cada minuto.

**2. Armar pedido** — traduce el nombre del local a su API key y normaliza el
tipo. Si el local no existe o el tipo no es válido, marca el error acá y no
molesta a la API.

**3. Buscar producto** — `GET /api/productos?q=<nombre>`, que es público y no
necesita autenticación.

**4. Elegir producto y armar body** — se queda con el producto cuyo nombre
coincide exacto (o el primer resultado si ninguno coincide del todo) y arma el
cuerpo que espera cada endpoint: `cantidad` para venta/ingreso,
`cantidadFinal` + `nota` para ajuste.

**5. Llamar API stock** — `POST /api/stock/venta|ingreso|ajuste` con el header
`x-pdv-key`. Está en `neverError`, así que un 409 por falta de stock no corta
el flujo: sigue para poder escribirle el motivo al empleado.

**6. Preparar estado** — arma el texto de la columna Estado. Distingue los
errores propios (local desconocido, producto inexistente) de los que devuelve
la API (`Stock insuficiente`, `nota es requerida en ajustes`).

**7. Actualizar Estado en Sheets** — escribe el resultado en la misma fila,
buscándola por `row_number`.

## Errores que va a ver el empleado

| Estado en la planilla | Qué pasó |
|---|---|
| `OK — stock actual: 3` | Se registró. Quedan 3 unidades. |
| `ERROR: Stock insuficiente` | Quiso descontar más de lo que hay. No se tocó nada. |
| `ERROR: Punto de venta desconocido: "..."` | El nombre del local no coincide con `/admin/puntos-venta`. |
| `ERROR: Producto no encontrado: "..."` | El nombre no existe en el catálogo (o el producto está inactivo). |
| `ERROR: No se encontró variante para talle X` | Ese producto no tiene ese talle cargado. |
| `ERROR: Hay más de un color para el talle X` | Falta completar la columna Color. |
| `ERROR: nota es requerida en ajustes` | Un `AJUSTE` sin nota. |
| `ERROR: API key inválida` | La key se regeneró y quedó vieja en el nodo *Armar pedido*. |

Cada movimiento que entra queda registrado en `/admin/movimientos-stock`, con
el local, el producto, el talle y la nota.
