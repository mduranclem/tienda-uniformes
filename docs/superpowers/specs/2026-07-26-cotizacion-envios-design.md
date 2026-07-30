# Cotización de envíos fuera de Rosario

Fecha: 2026-07-26
Estado: propuesta, pendiente de aprobación

## Problema

Hoy el costo de envío es un valor fijo por opción de entrega (`Entrega.costo`), más una
regla hardcodeada de envío gratis dentro de Rosario (`backend/src/lib/envios.js`). Eso
funciona mientras se venda localmente, pero cobra lo mismo a un cliente de Rosario que a
uno de Ushuaia. Cada venta al interior se despacha a pérdida.

Para cobrar lo que corresponde hacen falta dos datos que el sistema hoy no tiene:

1. **Cuánto pesa lo que se está comprando.** Ni `Producto` ni `Variante` tienen peso ni
   dimensiones. Ningún cotizador (Andreani o cualquier otro) puede calcular sin eso.
2. **A dónde va.** El checkout ya pide el código postal (`form.cp` en `CheckoutPage.jsx`),
   pero nadie lo usa para nada.

## Contexto: por qué no usamos la API de Andreani todavía

Se verificó la cuenta de Andreani el 2026-07-26. Es una cuenta **Andreani PyME**
(`pymes.andreani.com`), con origen en Dean Funes 1258, Rosario.

El "Panel de integraciones" de esa cuenta ofrece únicamente conectores cerrados para
**WooCommerce** y **Tiendanube**. No expone generación de credenciales de API, ni número
de cliente, ni número de contrato. Como la tienda es un desarrollo propio, esos dos
conectores no sirven.

Consumir `apis.andreani.com` requiere una cuenta con contrato comercial. La autenticación
está documentada y es simple (`POST /login` con Basic Auth → token de 24 hs → header
`x-authorization-token`), pero las credenciales solo se obtienen mediante un ejecutivo
comercial. Ese trámite está iniciado por separado y no bloquea este trabajo.

Por eso el diseño central de esta especificación es **una interfaz de cotización con
implementación intercambiable**: arranca leyendo una tabla de tarifas propia y, cuando
lleguen las credenciales, se cambia la implementación sin tocar checkout, carrito ni admin.

## Objetivo

Que un cliente de cualquier punto del país ingrese su código postal en el checkout y vea
el costo real de su envío antes de pagar, calculado según destino y peso.

## Fuera de alcance

- Generar etiquetas, órdenes de envío o seguimiento en Andreani. Solo cotización.
- Envío a sucursal Andreani. Solo envío a domicilio (más retiro en local, que ya existe).
- Dimensiones y volumen. Se cotiza por peso únicamente; ver "Decisiones" abajo.
- Cotización multi-correo (comparar Andreani vs OCA vs Correo Argentino).

## Modelo de datos

### Peso de producto

```prisma
model Producto {
  // ...campos existentes
  pesoGramos   Int?     // peso unitario de la prenda, sin embalaje
}
```

Nullable a propósito: los productos existentes no lo tienen y no se puede inventar un
valor correcto para todos. Cuando es `null`, se usa un peso por defecto según `tipo`,
definido en `backend/src/lib/pesos.js`:

```js
const PESO_POR_TIPO = {
  REMERA: 180,
  CHOMBA: 200,
  BUZO: 500,
  CAMPERA: 800,
  PANTALON: 400,
}
const PESO_DEFECTO = 300
const PESO_EMBALAJE = 200
```

Peso del envío = `suma(peso de cada ítem × cantidad) + PESO_EMBALAJE`.

El peso vive en `Producto` y no en `Variante`. La diferencia de peso entre un talle 6 y un
talle 16 de la misma prenda existe, pero es chica frente a los saltos de tarifa (que van de
kilo en kilo) y multiplicaría por diez la carga de datos en el admin. Si en el futuro
resulta insuficiente, agregar `pesoGramos` a `Variante` como override es un cambio aditivo.

### Zonas y tarifas

```prisma
model ZonaEnvio {
  id                String        @id @default(cuid())
  nombre            String        @unique   // "Santa Fe", "AMBA", "Patagonia"
  orden             Int           @default(0)
  activo            Boolean       @default(true)
  precioKgAdicional Decimal?      @db.Decimal(10, 2)
  rangos            RangoCP[]
  tarifas           TarifaEnvio[]
}

model RangoCP {
  id     String    @id @default(cuid())
  zonaId String
  zona   ZonaEnvio @relation(fields: [zonaId], references: [id], onDelete: Cascade)
  desde  Int
  hasta  Int

  @@index([desde, hasta])
}

model TarifaEnvio {
  id         String    @id @default(cuid())
  zonaId     String
  zona       ZonaEnvio @relation(fields: [zonaId], references: [id], onDelete: Cascade)
  pesoHastaG Int
  precio     Decimal   @db.Decimal(10, 2)

  @@unique([zonaId, pesoHastaG])
}
```

Se zonifica por **rangos de código postal numérico**, no por nombre de provincia. El CP es
un dato que el cliente ya carga y que no admite variantes de escritura; el nombre de
provincia sí («Bs As», «Buenos Aires», «CABA»). Del CP ingresado se extraen los 4 dígitos
numéricos, tolerando el formato CPA (`S2000ABC` → `2000`).

### Entrega

```prisma
model Entrega {
  // ...campos existentes
  cotizado Boolean @default(false)
}
```

`Entrega` sigue existiendo tal cual para retiro en local y para envíos de precio fijo. Con
`cotizado: true`, el precio de esa opción deja de salir de `costo` y pasa a calcularse con
el cotizador. Es un cambio aditivo: todas las opciones actuales siguen funcionando igual.

### Orden

```prisma
model Orden {
  // ...campos existentes
  servicioEnvio String?   // código del servicio cotizado, ej. "tabla:santa-fe" o "andreani:estandar"
}
```

Deja registrado con qué se cotizó cada orden. Necesario para conciliar cuando migremos a
Andreani y para depurar reclamos de "me cobraron mal el envío".

## Arquitectura del cotizador

El punto central del diseño. El checkout **no** le pregunta el precio a la tabla de
tarifas: le pregunta a un cotizador, que es una interfaz con implementaciones
intercambiables.

```
backend/src/services/cotizadorEnvio/
  index.js        ← elige implementación y expone cotizar()
  tablaZonas.js   ← implementación actual (lee ZonaEnvio/TarifaEnvio)
  andreani.js     ← implementación futura (stub documentado)
```

Contrato único:

```js
/**
 * @param {{ cp: string, ciudad?: string, pesoGramos: number, valorDeclarado: number }} destino
 * @returns {Promise<Array<{ codigo: string, nombre: string, precio: number, plazoDias: number|null }>>}
 * @throws {ErrorCotizacion} si no se puede cotizar ese destino
 */
async function cotizar(destino)
```

`index.js` elige la implementación según la variable de entorno `COTIZADOR_ENVIO`
(`tabla` por defecto, `andreani` cuando existan credenciales). Ninguna otra parte del
código sabe cuál está activa.

`andreani.js` se crea en este trabajo pero **sin implementar**: lanza un error explícito
si se lo selecciona sin credenciales. Queda como el lugar documentado donde va el `POST
/login` + `x-authorization-token` cuando lleguen. Esto no es código muerto especulativo:
es lo que hace verificable que la interfaz sirve para ambas implementaciones.

### Resolución de zona y tarifa (`tablaZonas.js`)

1. Normalizar el CP a 4 dígitos. Si no se puede, lanzar `ErrorCotizacion`.
2. Buscar zonas activas con un `RangoCP` que contenga ese número. Si hay más de una
   (rangos solapados por error de carga), gana la de `orden` menor.
3. Si no hay ninguna, lanzar `ErrorCotizacion` con el CP en el mensaje.
4. Dentro de la zona, elegir la tarifa de menor `pesoHastaG` que sea `>= pesoGramos`.
5. Si el peso supera el escalón más alto:
   - con `precioKgAdicional` cargado: `precioTopeMáximo + ceil((peso − topeMáximo) / 1000) × precioKgAdicional`
   - sin él: lanzar `ErrorCotizacion`.

## API

```
POST /api/envios/cotizar
body: { cp: string, ciudad?: string, items: [{ varianteId, cantidad }] }
200:  { pesoGramos, opciones: [{ codigo, nombre, precio, plazoDias }] }
422:  { mensaje: "No podemos calcular el envío al CP 9410..." }
```

Público (el checkout de invitado tiene que poder usarlo).

**El peso y el valor declarado se calculan en el servidor**, leyendo variantes y productos
de la base a partir de los `varianteId`. Nunca se acepta un peso enviado por el cliente:
sería trivial mandar `pesoGramos: 1` y pagar envío de mínima.

Regla de Rosario: si `esRosario(ciudad)`, se devuelve una única opción con `precio: 0`,
antes de consultar al cotizador. Se mantiene keyed en `ciudad` y no en el CP, para que sea
exactamente la misma condición que ya aplica `backend/src/routes/ordenes.js` y no aparezcan
dos definiciones distintas de "es Rosario".

La zona "Rosario y alrededores" del seed cubre entonces las localidades del cordón (Funes,
Roldán, Villa Gobernador Gálvez, San Lorenzo) que tienen CP propio y sí se cobran. Rosario
capital nunca llega a consultarla.

## Checkout

En `CheckoutPage.jsx`, cuando la entrega seleccionada es de tipo `ENVIO` **y** tiene
`cotizado: true`, y el CP tiene 4 dígitos:

- Se llama a `/api/envios/cotizar` con debounce de 500 ms sobre el CP, con el mismo patrón
  de guarda `cancelado` que ya se usa en `CatalogoPage.jsx` para evitar que una respuesta
  vieja pise a una nueva.
- Mientras carga, el renglón de envío muestra "Calculando…" y el botón de pagar queda
  deshabilitado.
- Con éxito, el costo de envío pasa a ser el de la opción cotizada y se suma al total.
- Con error 422, se muestra el mensaje del backend más un contacto de WhatsApp, y el
  botón de pagar **queda deshabilitado**.

Ese último punto es deliberado: ante un fallo de cotización, la alternativa era dejar
comprar con envío $0. Es preferible perder la venta y que el cliente escriba, antes que
despachar a pérdida sin enterarse.

## Creación de la orden

`POST /api/ordenes` recalcula el costo de envío llamando al mismo cotizador, con los ítems
reales de la orden. No se confía en ningún costo mandado por el cliente — es el mismo
criterio que ya se aplica a precios, stock y al descuento de primera compra en
`backend/src/routes/ordenes.js`.

Si la cotización falla en este punto, la orden se rechaza con 422. No se crea una orden con
envío $0.

## Admin

Página nueva `/admin/envios`, siguiendo el patrón de `AdminEntregasPage.jsx`:

- ABM de zonas (nombre, orden, activo, precio por kg adicional).
- Por zona: rangos de CP (desde/hasta) y escalones de tarifa (peso hasta / precio).
- Un probador: se ingresa un CP y un peso, y muestra qué zona y qué precio daría. Sirve
  para validar la carga sin tener que simular una compra.

Rutas en `backend/src/routes/admin/envios.js`, protegidas con el middleware de admin
existente.

En `AdminProductosPage.jsx` se agrega el campo de peso en gramos al formulario de producto.

## Datos iniciales

Seed con seis zonas y sus rangos de CP, ordenadas de más barata a más cara: Rosario y
alrededores, resto de Santa Fe, Córdoba y Entre Ríos, AMBA y Buenos Aires, Cuyo/NOA/NEA,
Patagonia. Escalones de peso: 1 kg, 3 kg, 5 kg, 10 kg.

**Los precios del seed son provisorios y quedan explícitamente marcados como tales.** Los
valores reales se cargan desde el admin, tomados del cotizador público de Andreani
(`andreani.com` → "Cotizar envío"), que funciona sin contrato. Se cotiza desde CP 2000
hacia un CP representativo de cada zona, para cada escalón de peso.

Migración de productos existentes: script `backend/scripts/backfill-peso-productos.js` que
completa `pesoGramos` según `PESO_POR_TIPO`. Idempotente — solo toca filas con `pesoGramos`
en `null`.

## Verificación

Tests unitarios (`tablaZonas.js`), que son la parte con lógica real y casos de borde:

- CP en formato CPA (`S2000ABC`) y numérico (`2000`) resuelven a la misma zona.
- CP inexistente en toda zona → `ErrorCotizacion`.
- Rangos solapados → gana la zona de `orden` menor.
- Peso justo en el límite de un escalón (1000 g con escalón "hasta 1 kg") → usa ese escalón,
  no el siguiente.
- Peso sobre el tope máximo con `precioKgAdicional` → aplica el adicional redondeando kg
  hacia arriba; sin `precioKgAdicional` → `ErrorCotizacion`.
- Peso calculado usa `PESO_POR_TIPO` cuando `pesoGramos` es `null`, y suma `PESO_EMBALAJE`
  una sola vez por envío.

Test de integración del endpoint: que el peso se calcule del lado del servidor y que un
`pesoGramos` mandado en el body sea ignorado.

Prueba manual en el checkout, mobile-first (375 px), con CP 2000 (Rosario, gratis), 3000
(Santa Fe), 5000 (Córdoba), 1425 (CABA) y 9410 (Ushuaia), verificando que el total se
actualiza y que un CP inválido bloquea el pago.

## Camino a Andreani

Cuando lleguen las credenciales, el trabajo se reduce a:

1. Implementar `cotizarAndreani()` en `andreani.js` respetando el contrato ya existente,
   con caché del token (dura 24 hs) y fallback a la tabla si la API no responde.
2. Cargar `ANDREANI_USUARIO`, `ANDREANI_PASSWORD`, `ANDREANI_CLIENTE`, `ANDREANI_CONTRATO`
   en el entorno.
3. Cambiar `COTIZADOR_ENVIO=andreani`.

Checkout, órdenes, carrito y admin no se tocan.
