const { MercadoPagoConfig, Preference, Payment } = require('mercadopago')

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
})

async function crearPreferencia(orden) {
  const emailCliente = orden.usuario?.email ?? orden.emailGuest
  const nombreCliente = orden.usuario?.nombre ?? orden.nombreGuest ?? emailCliente

  const items = orden.items.map(item => ({
    id: item.varianteId,
    title: `${item.producto.nombre}${item.variante?.talle ? ` — talle ${item.variante.talle}` : ''}${item.variante?.color ? ` / ${item.variante.color}` : ''}`,
    quantity: item.cantidad,
    unit_price: Number(item.precioUnit),
    currency_id: 'ARS',
  }))

  // Si hay descuento, lo agregamos como ítem negativo
  if (Number(orden.descuento) > 0) {
    items.push({
      id: 'descuento',
      title: 'Descuento',
      quantity: 1,
      unit_price: -Number(orden.descuento),
      currency_id: 'ARS',
    })
  }

  // Si hay envío, lo sumamos como ítem
  if (Number(orden.costoEnvio) > 0) {
    items.push({
      id: 'envio',
      title: orden.entrega?.nombre ?? 'Envío',
      quantity: 1,
      unit_price: Number(orden.costoEnvio),
      currency_id: 'ARS',
    })
  }

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'

  const preference = await new Preference(client).create({
    body: {
      items,
      payer: {
        name: nombreCliente,
        email: emailCliente,
      },
      back_urls: {
        success: `${frontendUrl}/confirmacion/${orden.id}?pago=aprobado`,
        failure: `${frontendUrl}/confirmacion/${orden.id}?pago=rechazado`,
        pending: `${frontendUrl}/confirmacion/${orden.id}?pago=pendiente`,
      },
      auto_return: 'approved',
      notification_url: `${apiUrl}/api/webhooks/mercadopago`,
      external_reference: orden.id,
      statement_descriptor: 'TIENDA UNIFORMES',
    },
  })

  return preference
}

async function obtenerPago(paymentId) {
  return new Payment(client).get({ id: paymentId })
}

module.exports = { crearPreferencia, obtenerPago }
