// Dispara el webhook de "volvió el stock" a los suscriptores de AlertaStock
// cuando una variante pasa de 0 a stock disponible.

const prisma = require('../lib/prisma')
const { postConReintentos } = require('../lib/httpRetry')

async function resolverWebhookUrl() {
  const config = await prisma.configTienda.findUnique({ where: { clave: 'webhookStockAlert' } })
  return config?.valor || process.env.WEBHOOK_STOCK_ALERT || null
}

async function verificarAlertasStock(varianteId, stockAnterior, stockNuevo) {
  if (!(stockAnterior === 0 && stockNuevo > 0)) return

  const url = await resolverWebhookUrl()
  if (!url) return

  const alertas = await prisma.alertaStock.findMany({
    where: { varianteId, notificada: false },
    include: {
      variante: { include: { producto: { select: { nombre: true } } } },
    },
  })
  if (!alertas.length) return

  for (const alerta of alertas) {
    const payload = {
      telefono: alerta.telefono,
      producto: alerta.variante.producto.nombre,
      talle: alerta.variante.talle,
      color: alerta.variante.color,
      stock: stockNuevo,
    }
    await postConReintentos(url, payload, { tag: 'n8n:alerta-stock' })
  }

  await prisma.alertaStock.updateMany({
    where: { id: { in: alertas.map(a => a.id) } },
    data: { notificada: true },
  })
}

module.exports = { verificarAlertasStock }
