# Flujo de n8n: avisos de estado por WhatsApp

El backend hace todo el trabajo pesado: decide **si** hay que avisar, arma el
**texto** según el pedido sea retiro, envío en Rosario o envío al interior, y lo
manda listo. n8n solo recibe y reenvía.

Son **tres nodos**.

```
[Webhook] → [Filtrar sin teléfono] → [Enviar WhatsApp]
```

## 1. Webhook

- **Tipo:** Webhook
- **Método:** POST
- **Path:** el que ya tenés en `WEBHOOK_ORDEN_ESTADO`
  (`.../webhook/31b7c59f-f024-41b6-a407-caf7f4401265`)
- **Respond:** Immediately

No hay que configurar nada más. El backend reintenta 3 veces con espera
creciente si n8n no responde, así que un corte breve no pierde el mensaje.

## 2. Filtrar sin teléfono

- **Tipo:** IF (o Filter)
- **Condición:** `{{ $json.telefono }}` — *is not empty* **y** *not equals* `—`

Existe checkout de invitado, y aunque el teléfono es obligatorio en el
formulario, hay pedidos viejos sin él. Sin este filtro, esos pedidos harían
fallar el nodo de WhatsApp y ensuciarían el historial de ejecuciones.

## 3. Enviar WhatsApp

- **Tipo:** el nodo de WhatsApp que uses (WhatsApp Business Cloud, Evolution API, etc.)
- **Destinatario:** `{{ $json.telefono }}`
- **Mensaje:** `{{ $json.mensaje }}`

**Eso es todo.** No hay que escribir condiciones por estado ni armar textos: el
campo `mensaje` ya viene redactado y con formato de WhatsApp (`*negrita*` y
saltos de línea).

## Qué llega en el webhook

```json
{
  "numero": 128,
  "estado": "LISTA",
  "cliente": "Juan Pérez (juan@mail.com)",
  "email": "juan@mail.com",
  "telefono": "3411234567",
  "tipoEntrega": "ENVIO",
  "modoEnvio": "ROSARIO",
  "puntoRetiro": null,
  "entregaFecha": "2026-07-30T12:00:00.000Z",
  "entregaFranja": "10-12",
  "mensaje": "🚚 *Pedido #128*\n\n¡Tu pedido está listo! Sale el jueves 30 de julio entre las 10 y las 12 hs."
}
```

`modoEnvio` es `RETIRO`, `ROSARIO` o `INTERIOR`. Los demás campos están por si
querés hacer algo extra (por ejemplo, cargar las entregas del día en una planilla),
pero para mandar el WhatsApp alcanza con `telefono` y `mensaje`.

## Cuándo dispara

Solo en los estados activados en `/admin/bot`. Por defecto: **Pagada, Lista,
Entregada y Cancelada**. `Preparando` viene apagado a propósito — no le pide una
acción al cliente ni le da información nueva, y cada mensaje de más gasta la
paciencia de la que dependen los que sí importan.

Para cambiarlo no hace falta tocar n8n: se tildan o destildan los estados en
`/admin/bot`.

## Los mensajes, por estado y tipo de entrega

| Estado | Retiro en local | Envío en Rosario | Envío al interior |
|---|---|---|---|
| Pagada | Recibimos tu pago, te avisamos cuando esté listo | Recibimos tu pago, te lo llevamos el {día} entre {franja} | Recibimos tu pago, te avisamos al despacharlo |
| Lista | Ya podés retirarlo en {dirección}, de 10 a 16 hs | Sale el {día} entre {franja} | Lo despachamos por Andreani |
| Entregada | Gracias por tu compra | Gracias por tu compra | Gracias por tu compra |
| Cancelada | Pedido cancelado, respondenos si es un error | ídem | ídem |

Los textos están en `backend/src/services/mensajesEstado.js` y cubiertos por
tests. Si querés cambiar una palabra, se cambia ahí y no en n8n: así queda
versionado y hay una prueba que impide, por ejemplo, prometerle un retiro a
alguien que pidió envío a domicilio.

## Probarlo sin molestar a nadie

1. Poné temporalmente `WEBHOOK_ORDEN_ESTADO` apuntando a una URL de
   [webhook.site](https://webhook.site).
2. Cambiá el estado de un pedido de prueba en el admin.
3. Mirá el JSON que llega y verificá que el `mensaje` diga lo correcto.
4. Recién ahí apuntá a n8n.

## Limitación de WhatsApp que conviene tener presente

Con la API oficial de WhatsApp Business no se le puede escribir a alguien cuando
uno quiere: fuera de la ventana de 24 horas desde el último mensaje del cliente,
solo se pueden enviar **plantillas aprobadas por Meta**.

En la práctica, para estos avisos hay que registrar una plantilla por tipo de
mensaje y mandar la plantilla en vez del texto libre. Es un trámite de la cuenta
de WhatsApp Business, no del código. Si usás un puente no oficial la restricción
no aplica, pero el número queda expuesto a que Meta lo bloquee.
