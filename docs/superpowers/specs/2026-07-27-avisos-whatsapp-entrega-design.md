# Avisos por WhatsApp del estado del pedido y coordinación de entrega

Fecha: 2026-07-27
Estado: propuesta, pendiente de aprobación

## Problema

El cliente compra y después no sabe nada más. No hay forma automática de avisarle
que el pedido está listo para retirar, ni de coordinar cuándo se le lleva a
domicilio. Hoy eso se resuelve a mano, uno por uno.

Falta además un dato: el checkout pide nombre, dirección, ciudad, código postal
y teléfono, pero **no pide cuándo quiere recibir el pedido**. Sin eso no se puede
organizar un recorrido de reparto.

## Qué ya existe

Buena parte de la infraestructura está construida y no hace falta rehacerla:

- `backend/src/services/notificaciones.js` ya dispara webhooks a n8n:
  `notificarCambioEstado(orden, estado)` en **cada** cambio de estado y
  `notificarOrdenPagada(orden)` al confirmarse el pago.
- Los webhooks salen con reintentos (`lib/httpRetry.js`) y son fire-and-forget:
  si n8n está caído, el pedido igual se procesa.
- `WEBHOOK_ORDEN_ESTADO` y `WEBHOOK_ORDEN_PAGADA` ya apuntan a la instancia real
  de n8n.
- Los estados ya cubren el ciclo: `PENDIENTE`, `PAGADA`, `PREPARANDO`, `LISTA`,
  `ENTREGADA`, `CANCELADA`.
- `ConfigTienda` (tabla clave-valor) y la pantalla `/admin/bot` ya permiten
  configurar el bot sin tocar código.

Lo que falta es que el webhook lleve información suficiente para redactar
mensajes distintos según el tipo de entrega, y que se capture el día y la franja.

## Objetivo

Que mover el estado de un pedido en el admin sea lo único que haya que hacer para
que el cliente reciba el aviso correcto por WhatsApp, y que las entregas a
domicilio en Rosario tengan día y franja horaria acordados desde la compra.

## Fuera de alcance

- **Bot conversacional.** No se le pregunta nada al cliente por WhatsApp ni se
  procesan sus respuestas. Todos los datos se capturan en el checkout.
- **El flujo de n8n.** Lo arma el usuario. Acá solo se define qué recibe.
- **Aprobación de plantillas en Meta.** Es un trámite de la cuenta de WhatsApp
  Business, ajeno al código.
- **Feriados.** Ver "Decisiones" abajo.
- **Reprogramación de entregas.** Si hay que cambiar una fecha se hace hablando
  con el cliente; el admin no tiene pantalla para eso.

## Decisiones tomadas

**Día y franja se piden en el checkout, no por WhatsApp.** Un bot conversacional
depende de que el cliente conteste; si no contesta, el pedido queda sin fecha y
hay que llamarlo igual. Además, la API oficial de WhatsApp solo permite iniciar
conversaciones con plantillas aprobadas por Meta. Capturarlo en el checkout hace
que el dato exista siempre.

**Solo aplica a entregas a domicilio en Rosario.** Los envíos al interior los
reparte Andreani en su propia ventana: prometer día y horario sería mentirle al
cliente. El retiro en local tampoco lo necesita.

**El texto de los mensajes se arma en el backend, no en n8n.** El webhook lleva
un campo `mensaje` ya redactado y n8n solo lo reenvía. Si la lógica viviera en
n8n, cambiar una palabra requeriría editar el flujo a mano y no habría forma de
testearlo. En el backend queda versionado y cubierto por tests.

**`PREPARANDO` no dispara mensaje.** "Estamos preparando tu compra" no le pide
una acción al cliente ni le da información que no tenga, y cada mensaje de más
gasta la paciencia de la que dependen los que sí importan. El estado se sigue
usando internamente. Qué estados avisan queda configurable desde `/admin/bot`.

**Los feriados no se contemplan.** Manejarlos bien exige un calendario argentino
que hay que mantener cada año, y equivocarse genera una promesa incumplida. Por
ahora el sistema acepta cualquier día hábil y, si cae feriado, se reprograma
hablando con el cliente. Si más adelante molesta, se agrega una lista de fechas
bloqueadas en `ConfigTienda`.

## Modelo de datos

```prisma
model Orden {
  // ...campos existentes
  entregaFecha  DateTime?  // día acordado para la entrega en Rosario
  entregaFranja String?    // "10-12" | "12-14" | "14-16"
}
```

Van como columnas y no dentro del JSON `domicilio` porque el admin necesita
listar y ordenar por fecha para armar el recorrido del día, y sobre un campo JSON
eso es incómodo y lento.

Ambas quedan en `null` para retiro en local y para envíos al interior.

## Cálculo de fechas disponibles

Módulo nuevo `backend/src/lib/agendaEntrega.js`, con lógica pura y testeable:

```js
const FRANJAS = ['10-12', '12-14', '14-16']
const DIAS_DISPONIBLES = 14   // cuántos días hábiles se ofrecen hacia adelante
const ZONA = 'America/Argentina/Buenos_Aires'
```

- `fechasDisponibles(desde)` → los próximos `DIAS_DISPONIBLES` días hábiles
  (lunes a viernes), **empezando por el día siguiente**. Nunca el mismo día.
- `esFechaValida(fecha, desde)` → true si cae dentro de esa lista.

**Todo se calcula en horario argentino explícitamente.** El servidor corre en
UTC: un pedido hecho a las 22:00 de Argentina es el día siguiente en UTC, y sin
convertir la zona el sistema ofrecería una fecha corrida. Es el tipo de error que
no aparece en las pruebas de la tarde y sí en producción a la noche.

## Checkout

En `CheckoutPage.jsx`, cuando la entrega es de tipo `ENVIO` **y**
`esRosario(form.ciudad)`, aparecen dos selectores:

- **Día de entrega**: lista de fechas hábiles formateadas ("jueves 30 de julio").
- **Franja horaria**: 10-12, 12-14, 14-16.

Ambos obligatorios en ese caso: sin ellos el botón de pagar queda deshabilitado,
igual que ya ocurre cuando falta la cotización de envío. No se muestran para
retiro ni para envíos al interior.

## Backend

`POST /api/ordenes` valida y persiste:

- Si es `ENVIO` + Rosario: `entregaFecha` y `entregaFranja` son obligatorias, la
  fecha tiene que estar entre las disponibles y la franja ser una de las tres.
  Si no, 400.
- En cualquier otro caso se guardan en `null`, ignorando lo que haya mandado el
  cliente.

La validación se repite en el servidor aunque el frontend ya limite las opciones,
por el mismo criterio que ya se aplica a precios, stock y descuentos: el
navegador no es una fuente confiable.

## Notificaciones

### Qué estados avisan

Clave nueva en `ConfigTienda`: `estadosQueNotifican`, con valor por defecto
`"PAGADA,LISTA,ENTREGADA,CANCELADA"`. Editable desde `/admin/bot`.

`notificarCambioEstado` consulta esa lista y no hace nada si el estado no está.

### Payload enriquecido

`notificarCambioEstado` pasa a mandar:

```js
{
  numero, estado, cliente, email, telefono,   // ya existían
  tipoEntrega,      // "RETIRO" | "ENVIO"
  modoEnvio,        // "RETIRO" | "ROSARIO" | "INTERIOR"
  puntoRetiro,      // dirección del local, solo si es RETIRO
  entregaFecha,     // ISO, solo si es ROSARIO
  entregaFranja,    // "10-12", solo si es ROSARIO
  mensaje,          // texto listo para reenviar por WhatsApp
}
```

`modoEnvio` se deriva del tipo de entrega y de si la ciudad es Rosario, usando el
mismo `esRosario` que ya usan el checkout y la creación de la orden. No se
introduce una segunda definición de "es Rosario".

### Redacción de los mensajes

Módulo nuevo `backend/src/services/mensajesEstado.js`, función pura
`componerMensaje({ estado, modoEnvio, numero, puntoRetiro, entregaFecha, entregaFranja })`.

| Estado | RETIRO | ROSARIO | INTERIOR |
|---|---|---|---|
| `PAGADA` | Pago confirmado; te avisamos cuando esté listo para retirar | Pago confirmado; te lo llevamos el {fecha} entre {franja} | Pago confirmado; te avisamos cuando lo despachemos |
| `LISTA` | Ya podés retirarlo en {puntoRetiro} | Sale el {fecha} entre {franja} | Lo despachamos por Andreani |
| `ENTREGADA` | Gracias por tu compra | Gracias por tu compra | Gracias por tu compra |
| `CANCELADA` | Pedido cancelado | Pedido cancelado | Pedido cancelado |

Ser función pura la hace testeable sin base de datos ni red, que es donde están
los errores que importan: un mensaje que promete un retiro cuando era un envío.

## Admin

En `AdminOrdenesPage.jsx`:

- Columna nueva con fecha y franja en el listado, para armar el recorrido.
- Los mismos datos en el detalle del pedido.

En `AdminBotPage.jsx`:

- Casillas para elegir qué estados disparan WhatsApp, sobre la clave
  `estadosQueNotifican`.

## Manejo de errores

Sin cambios de criterio: los webhooks siguen siendo fire-and-forget con
reintentos. Si n8n está caído, el cambio de estado se guarda igual y el cliente
no recibe el aviso. Se prefiere perder un mensaje antes que bloquear la operación
de la tienda.

## Verificación

Tests unitarios sobre las dos piezas con lógica real:

`agendaEntrega.js`
- El primer día ofrecido nunca es hoy.
- Comprando un viernes, el primero es el lunes siguiente.
- Comprando un sábado o domingo, el primero es el lunes.
- No aparece ningún sábado ni domingo en la lista.
- Una fecha fuera de la lista se rechaza; una de la lista se acepta.
- Un pedido a las 22:00 hora argentina ofrece las mismas fechas que uno a las
  10:00 del mismo día (control de zona horaria).

`mensajesEstado.js`
- Cada combinación de estado y modo de envío devuelve el texto correcto.
- Un pedido de retiro nunca menciona fecha ni franja.
- Un pedido a domicilio en Rosario incluye la fecha formateada en español y la
  franja.
- Un estado que no notifica devuelve `null`.

Prueba manual: compra completa en Rosario verificando que los selectores
aparezcan solo con envío a domicilio, y que al mover el pedido a `LISTA` el
webhook salga con el mensaje correcto (se puede observar con un endpoint de
prueba tipo webhook.site antes de apuntar a n8n).
