# Flujo de n8n: los locales descuentan stock desde una planilla

Los 3 locales no tienen sistema propio. Cada uno anota lo que vende en **su
propia** Google Sheet y n8n se encarga de avisarle a la tienda, que es la que
lleva el stock real. Como el stock de `Variante` es uno solo, lo que se vende
en un local deja de estar disponible en la web al instante, y al revés.

Cada local tiene su planilla justamente para que **nadie tenga que escribir de
qué local es**: el flujo lo deduce de la planilla que disparó. Una columna
menos para completar es una columna menos para equivocarse.

```
[Fábrica: fila nueva]   → [Es Fábrica]   ┐
[Fisherton: fila nueva] → [Es Fisherton] ├→ [Validar fila] → [Buscar producto]
[Norte: fila nueva]     → [Es Norte]     ┘
    → [Elegir producto y armar body] → [Llamar API stock]
    → [Preparar estado] → [Leer planilla] → [Ubicar fila] → [Actualizar Estado]
```

La columna **Producto** es un desplegable con el catálogo real, así nadie tiene
que escribir a mano "Chomba – Escuela Claret Rosario". Lo mantiene al día el
flujo `bot/workflow-sync-catalogo.json`, que corre todos los días a las 6 y
puede dispararse a mano con `POST /webhook/sync-catalogo-locales`. Escribe los
nombres en una pestaña oculta `Catálogo` de cada planilla y apunta ahí la
validación de datos. Si agregás un producto en la tienda, al otro día ya está
en las tres planillas.

Los tres primeros nodos son lo único que cambia por local: fijan el nombre del
punto de venta, su API key y a qué planilla escribirle la respuesta. De
*Validar fila* en adelante la lógica es una sola.

## Las planillas

Una por local, todas con las mismas columnas. Una fila por movimiento:

| Columna | Qué va |
|---|---|
| Fecha | Referencia para el empleado. La API guarda su propia fecha. |
| Tipo | `VENTA`, `INGRESO` o `AJUSTE` (no distingue mayúsculas). |
| Producto | El nombre del producto tal como está en el catálogo. |
| Talle | El talle. |
| Color | Solo si ese talle tiene más de un color; si no, se puede dejar vacío. |
| Cantidad | Para `VENTA` e `INGRESO`. |
| Cantidad final (solo AJUSTE) | El número **contado** en el local, no la diferencia. |
| Nota | Obligatoria en `AJUSTE`. |
| Estado | Lo escribe el flujo: `OK — stock actual: N` o el error. |

El empleado nunca ve un id interno: escribe el nombre del producto y el flujo
lo resuelve contra el catálogo.

## Importarlo

El flujo está en `bot/workflow-stock-locales.json`:

1. Copiá todo el contenido del archivo.
2. En n8n, entrá a un workflow nuevo y **pegá con Ctrl+V sobre el canvas**.
3. Aparecen los once nodos ya conectados.
4. Falta completar lo que es propio de cada instalación (por eso no está en el
   archivo):
   - Los **tres nodos trigger** y **Actualizar Estado**: elegí tu credencial de
     Google Sheets.
   - En cada trigger, el `documentId` de la planilla de ese local
     (`PEGAR_ID_PLANILLA_FABRICA`, `..._FISHERTON`, `..._NORTE`).
   - En **Es Fábrica**, **Es Fisherton** y **Es Norte**: la API key real de ese
     punto de venta y otra vez el id de su planilla (lo usa el flujo para
     saber a cuál escribirle la respuesta).
5. Activá el workflow.

Las API keys se generan en `/admin/puntos-venta` y **se muestran una sola vez**
(se guardan hasheadas). Si perdiste una, no se recupera: se regenera, y hay que
actualizarla en el nodo del local.

> **El nombre de la pestaña importa.** Los nodos de Sheets apuntan a la pestaña
> por nombre, no por `gid`. Si la planilla se creó subiendo un CSV a Drive, la
> pestaña suele quedar como `Untitled`. Si la renombrás, hay que actualizar el
> campo *Sheet* de los cuatro nodos o el workflow deja de activarse con el
> error `Sheet with ID ... not found`.

> **Nunca dejes filas de ejemplo en las planillas.** El flujo resuelve el
> producto por nombre y no distingue mayúsculas: un ejemplo tipo
> "Campera Polar / S / AJUSTE / 3" coincide con un producto real y le **pisa el
> stock**. Las planillas arrancan solo con la fila de encabezados.

> **Ojo con rotar el client secret en Google Cloud.** Borrar un secreto
> invalida los refresh tokens emitidos con él, y las credenciales de n8n que lo
> usaban dejan de andar con
> `The provided authorization grant ... is invalid, expired, revoked`. Si pasa,
> hay que reconectar cada credencial afectada desde n8n. Por eso todos los nodos
> de este flujo usan **una sola** credencial: los que hablan con la API de
> Sheets lo hacen por HTTP con `googleSheetsTriggerOAuth2Api`, en vez de sumar
> una credencial más de tipo `googleSheetsOAuth2Api`.

## Qué hace cada nodo

**1-3. `<Local>`: fila nueva** — un trigger por planilla. Dispara cuando aparece
una fila nueva; consulta cada minuto.

**4-6. Es `<Local>`** — agrega el nombre del punto de venta, su API key y el id
de su planilla. Es lo único que distingue a un local de otro.

**7. Validar fila** — punto donde convergen las tres planillas. Rechaza acá lo
que no tiene sentido mandar a la API (tipo inválido, falta producto o talle).

**8. Buscar producto** — `GET /api/productos?q=<nombre>`, que es público y no
necesita autenticación.

**9. Elegir producto y armar body** — se queda con el producto cuyo nombre
coincide exacto (o el primer resultado si ninguno coincide del todo) y arma el
cuerpo que espera cada endpoint: `cantidad` para venta/ingreso,
`cantidadFinal` + `nota` para ajuste.

**10. Llamar API stock** — `POST /api/stock/venta|ingreso|ajuste` con el header
`x-pdv-key`. Está en `neverError`, así que un 409 por falta de stock no corta el
flujo: sigue para poder escribirle el motivo al empleado.

**11-14. Preparar estado / Leer planilla / Ubicar fila / Actualizar Estado** —
arma el texto y lo escribe en la fila que lo originó.

El trigger de Google Sheets **no dice en qué fila cayó** (solo entrega los
valores de las columnas), así que hay que ubicarla releyendo la planilla y
buscando de abajo hacia arriba la primera fila con Estado vacío que coincida en
tipo, producto, talle, color, cantidad y nota. Se busca desde el final porque lo
recién agregado está ahí, y se saltean las filas ya resueltas para no pisar el
resultado de otra.

La escritura va por HTTP contra la API de Sheets en vez del nodo de Google
Sheets, para poder usar la misma credencial OAuth2 que los triggers (ver la nota
sobre credenciales más abajo).

## Errores que va a ver el empleado

| Estado en la planilla | Qué pasó |
|---|---|
| `OK — stock actual: 3` | Se registró. Quedan 3 unidades. |
| `ERROR: Stock insuficiente` | Quiso descontar más de lo que hay. No se tocó nada. |
| `ERROR: Tipo inválido: "..."` | La columna Tipo no dice VENTA, INGRESO ni AJUSTE. |
| `ERROR: Falta el nombre del producto` / `Falta el talle` | Fila incompleta. |
| `ERROR: Producto no encontrado: "..."` | El nombre no existe en el catálogo (o el producto está inactivo). |
| `ERROR: No se encontró variante para talle X` | Ese producto no tiene ese talle cargado. |
| `ERROR: Hay más de un color para el talle X` | Falta completar la columna Color. |
| `ERROR: nota es requerida en ajustes` | Un `AJUSTE` sin nota. |
| `ERROR: API key inválida` | La key se regeneró y quedó vieja en el nodo del local. |

Cada movimiento que entra queda registrado en `/admin/movimientos-stock`, con
el local, el producto, el talle y la nota.
