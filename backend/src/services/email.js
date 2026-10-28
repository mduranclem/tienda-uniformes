const { Resend } = require('resend')
const { esZonaLocal } = require('../lib/envios')

const resend = new Resend(process.env.RESEND_API_KEY)

function formatPrecio(n) {
  return `$ ${Number(n).toLocaleString('es-AR')}`
}

// Número al que se manda el comprobante. Es el mismo de frontend/src/lib/contacto.js.
const WHATSAPP_NUMERO = '5493417434552'
const WHATSAPP_LEGIBLE = '341 743 4552'

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// venceEl es un instante: se muestra en hora argentina.
function formatearVencimiento(venceEl) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(venceEl)).replace(',', '')
}

// Qué tiene que hacer el cliente para pagar. Sin pasarela, el mail es uno de
// los lugares donde quedan los datos bancarios: la pantalla del pedido se
// cierra y el WhatsApp puede no llegar si el número está mal escrito.
function htmlPago(orden, transferencia) {
  const plazo = orden.venceEl
    ? `<p style="margin:10px 0 0;font-size:12px;color:#a1a1aa;line-height:1.5;">Te guardamos el pedido hasta el ${formatearVencimiento(orden.venceEl)}. Si necesitás más tiempo, escribinos.</p>`
    : ''

  if (orden.metodoPago === 'efectivo') {
    return `
          <div style="margin-top:24px;padding:16px;background:#09090b;border-radius:10px;border:1px solid #27272a;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:0.08em;">Pago</p>
            <p style="margin:4px 0;color:#d4d4d8;font-size:14px;">💵 <strong>Efectivo al retirar</strong></p>
            <p style="margin:4px 0;color:#a1a1aa;font-size:13px;">Lo pagás cuando pasás a buscar el pedido.</p>
            ${plazo}
          </div>`
  }
  if (orden.metodoPago !== 'transferencia') return ''

  const fila = (etiqueta, valor) => valor ? `
              <tr>
                <td style="padding:3px 0;font-size:13px;color:#71717a;">${etiqueta}</td>
                <td style="padding:3px 0;font-size:13px;color:#f4f4f5;text-align:right;font-weight:600;word-break:break-all;">${escaparHtml(valor)}</td>
              </tr>` : ''

  const datosHtml = transferencia
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
              ${fila('Alias', transferencia.alias)}
              ${fila('CBU', transferencia.cbu)}
              ${fila('Titular', transferencia.titular)}
              ${fila('Banco', transferencia.banco)}
            </table>`
    : `<p style="margin:4px 0;color:#a1a1aa;font-size:13px;">Te pasamos los datos para transferir por WhatsApp.</p>`

  const mensajeWhatsapp = encodeURIComponent(`Hola! Te mando el comprobante del pedido #${orden.numero}`)

  return `
          <div style="margin-top:24px;padding:16px;background:#09090b;border-radius:10px;border:1px solid #27272a;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:0.08em;">Cómo pagar</p>
            <p style="margin:4px 0;color:#d4d4d8;font-size:14px;">Transferí <strong style="color:#f4f4f5;">${formatPrecio(orden.total)}</strong> a esta cuenta:</p>
            ${datosHtml}
            <p style="margin:14px 0 0;color:#a1a1aa;font-size:13px;line-height:1.5;">
              Después mandanos el comprobante por WhatsApp al <strong style="color:#d4d4d8;">${WHATSAPP_LEGIBLE}</strong>, indicando el pedido #${orden.numero}.
            </p>
            <a href="https://wa.me/${WHATSAPP_NUMERO}?text=${mensajeWhatsapp}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#16a34a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">Enviar comprobante por WhatsApp</a>
            ${plazo}
          </div>`
}

function htmlConfirmacion(orden, transferencia) {
  const cliente = orden.usuario?.nombre ?? orden.nombreGuest ?? 'Cliente'
  const emailDestino = orden.usuario?.email ?? orden.emailGuest

  const esEnvio = orden.entrega?.tipo === 'ENVIO'
  // Envío al interior sin flete cobrado: el total de este mail NO lo incluye y
  // hay que decirlo, o el cliente da por hecho que el envío ya está pago.
  const envioACotizar = esEnvio
    && Number(orden.costoEnvio) === 0
    && !esZonaLocal(orden.domicilio?.ciudad)
  const domicilio = orden.domicilio
    ? `${orden.domicilio.calle} ${orden.domicilio.numero}${orden.domicilio.piso ? `, Piso ${orden.domicilio.piso}` : ''}, ${orden.domicilio.ciudad}`
    : ''

  const itemsHtml = orden.items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#d4d4d8;font-size:14px;">
        ${item.producto.nombre}<br/>
        <span style="color:#71717a;font-size:12px;">Talle: ${item.variante.talle}${item.variante.color ? ` · ${item.variante.color}` : ''} · Cantidad: ${item.cantidad}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#d4d4d8;font-size:14px;text-align:right;white-space:nowrap;">
        ${formatPrecio(item.subtotal)}
      </td>
    </tr>
  `).join('')

  const entregaHtml = esEnvio
    ? `<p style="margin:4px 0;color:#d4d4d8;font-size:14px;">🚚 <strong>Envío a domicilio</strong></p>
       <p style="margin:4px 0;color:#a1a1aa;font-size:13px;">${domicilio}</p>`
    : `<p style="margin:4px 0;color:#d4d4d8;font-size:14px;">📍 <strong>Retiro en local</strong></p>
       <p style="margin:4px 0;color:#a1a1aa;font-size:13px;">${orden.entrega?.nombre ?? ''}</p>
       <p style="margin:4px 0;color:#a1a1aa;font-size:13px;">Te avisamos cuando tu pedido esté listo.</p>`

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f4f4f5;letter-spacing:-0.5px;">InCollege</h1>
          <p style="margin:4px 0 0;font-size:13px;color:#71717a;">Uniformes escolares</p>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:28px;">

          <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#f4f4f5;">¡Pedido recibido, ${cliente}!</p>
          <p style="margin:0 0 24px;font-size:14px;color:#71717a;">Pedido <strong style="color:#a1a1aa;">#${orden.numero}</strong></p>

          <!-- Items -->
          <table width="100%" cellpadding="0" cellspacing="0">
            ${itemsHtml}
          </table>

          <!-- Totales -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
            ${Number(orden.descuento) > 0 ? `
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#71717a;">Descuento</td>
              <td style="padding:4px 0;font-size:13px;color:#4ade80;text-align:right;">− ${formatPrecio(orden.descuento)}</td>
            </tr>` : ''}
            ${Number(orden.costoEnvio) > 0 ? `
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#71717a;">Envío</td>
              <td style="padding:4px 0;font-size:13px;color:#a1a1aa;text-align:right;">${formatPrecio(orden.costoEnvio)}</td>
            </tr>` : ''}
            ${envioACotizar ? `
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#71717a;">Envío</td>
              <td style="padding:4px 0;font-size:13px;color:#fbbf24;text-align:right;">A cotizar</td>
            </tr>` : ''}
            <tr>
              <td style="padding:10px 0 0;font-size:15px;font-weight:700;color:#f4f4f5;border-top:1px solid #27272a;">Total</td>
              <td style="padding:10px 0 0;font-size:15px;font-weight:700;color:#f4f4f5;text-align:right;border-top:1px solid #27272a;">${formatPrecio(orden.total)}</td>
            </tr>
          </table>
          ${envioACotizar ? `
          <p style="margin:10px 0 0;font-size:12px;color:#fbbf24;line-height:1.5;">
            El total no incluye el envío. Te pasamos el costo por WhatsApp antes de despacharlo.
          </p>` : ''}

          <!-- Entrega -->
          <div style="margin-top:24px;padding:16px;background:#09090b;border-radius:10px;border:1px solid #27272a;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:0.08em;">Entrega</p>
            ${entregaHtml}
          </div>
${htmlPago(orden, transferencia)}

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#3f3f46;">© 2026 InCollege · Uniformes escolares</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function htmlAdmin(orden) {
  const cliente = orden.usuario?.nombre ?? orden.nombreGuest ?? 'Invitado'
  const emailCliente = orden.usuario?.email ?? orden.emailGuest ?? '—'
  const telefono = orden.usuario?.telefono ?? orden.telefonoGuest ?? '—'
  const esEnvio = orden.entrega?.tipo === 'ENVIO'
  const domicilio = orden.domicilio
    ? `${orden.domicilio.calle} ${orden.domicilio.numero}${orden.domicilio.piso ? `, Piso ${orden.domicilio.piso}` : ''}, ${orden.domicilio.ciudad}`
    : ''

  const itemsHtml = orden.items.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #27272a;color:#d4d4d8;font-size:14px;">
        ${item.producto.nombre} · T:${item.variante.talle}${item.variante.color ? ` ${item.variante.color}` : ''} × ${item.cantidad}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #27272a;color:#d4d4d8;font-size:14px;text-align:right;">
        ${formatPrecio(item.subtotal)}
      </td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <tr><td style="padding-bottom:16px;">
          <p style="margin:0;font-size:11px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:0.08em;">InCollege · Panel Admin</p>
          <h1 style="margin:4px 0 0;font-size:20px;font-weight:700;color:#f4f4f5;">Nuevo pedido #${orden.numero}</h1>
        </td></tr>

        <tr><td style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:24px;">

          <!-- Cliente -->
          <div style="margin-bottom:20px;padding:14px;background:#09090b;border-radius:10px;border:1px solid #27272a;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:0.08em;">Cliente</p>
            <p style="margin:2px 0;font-size:14px;color:#f4f4f5;font-weight:600;">${cliente}</p>
            <p style="margin:2px 0;font-size:13px;color:#a1a1aa;">${emailCliente}</p>
            <p style="margin:2px 0;font-size:13px;color:#a1a1aa;">Tel: ${telefono}</p>
            <p style="margin:2px 0;font-size:13px;color:#a1a1aa;">Pago: ${orden.metodoPago === 'efectivo' ? 'Efectivo al retirar' : 'Transferencia (esperando comprobante)'}</p>
          </div>

          <!-- Productos -->
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:0.08em;">Productos</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            ${itemsHtml}
            <tr>
              <td style="padding:10px 0 0;font-size:15px;font-weight:700;color:#f4f4f5;border-top:1px solid #3f3f46;">Total</td>
              <td style="padding:10px 0 0;font-size:15px;font-weight:700;color:#f4f4f5;text-align:right;border-top:1px solid #3f3f46;">${formatPrecio(orden.total)}</td>
            </tr>
          </table>

          <!-- Entrega -->
          <div style="padding:14px;background:#09090b;border-radius:10px;border:1px solid #27272a;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:0.08em;">Entrega</p>
            <p style="margin:2px 0;font-size:14px;color:#d4d4d8;">${esEnvio ? '🚚 Envío a domicilio' : '📍 Retiro en local'}</p>
            ${esEnvio ? `<p style="margin:2px 0;font-size:13px;color:#a1a1aa;">${domicilio}</p>` : `<p style="margin:2px 0;font-size:13px;color:#a1a1aa;">${orden.entrega?.nombre ?? ''}</p>`}
          </div>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function enviarConfirmacionCompra(orden, transferencia = null) {
  const emailCliente = orden.usuario?.email ?? orden.emailGuest
  const adminEmail = process.env.ADMIN_EMAIL
  const from = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

  await Promise.allSettled([
    emailCliente && resend.emails.send({
      from,
      to: emailCliente,
      subject: `Pedido #${orden.numero} recibido — InCollege`,
      html: htmlConfirmacion(orden, transferencia),
    }),
    adminEmail && resend.emails.send({
      from,
      to: adminEmail,
      subject: `🛍️ Nuevo pedido #${orden.numero} — ${orden.usuario?.nombre ?? orden.nombreGuest ?? 'Invitado'}`,
      html: htmlAdmin(orden),
    }),
  ]).then(results => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') console.error(`[email] Error email ${i}:`, r.reason?.message)
    })
  })
}

module.exports = { enviarConfirmacionCompra }
