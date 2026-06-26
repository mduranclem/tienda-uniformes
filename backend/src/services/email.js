const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

function formatPrecio(n) {
  return `$ ${Number(n).toLocaleString('es-AR')}`
}

function htmlConfirmacion(orden) {
  const cliente = orden.usuario?.nombre ?? orden.nombreGuest ?? 'Cliente'
  const emailDestino = orden.usuario?.email ?? orden.emailGuest

  const esEnvio = orden.entrega?.tipo === 'ENVIO'
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
            <tr>
              <td style="padding:10px 0 0;font-size:15px;font-weight:700;color:#f4f4f5;border-top:1px solid #27272a;">Total</td>
              <td style="padding:10px 0 0;font-size:15px;font-weight:700;color:#f4f4f5;text-align:right;border-top:1px solid #27272a;">${formatPrecio(orden.total)}</td>
            </tr>
          </table>

          <!-- Entrega -->
          <div style="margin-top:24px;padding:16px;background:#09090b;border-radius:10px;border:1px solid #27272a;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:0.08em;">Entrega</p>
            ${entregaHtml}
          </div>

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

async function enviarConfirmacionCompra(orden) {
  const emailCliente = orden.usuario?.email ?? orden.emailGuest
  const adminEmail = process.env.ADMIN_EMAIL
  const from = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

  await Promise.allSettled([
    emailCliente && resend.emails.send({
      from,
      to: emailCliente,
      subject: `Pedido #${orden.numero} recibido — InCollege`,
      html: htmlConfirmacion(orden),
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
