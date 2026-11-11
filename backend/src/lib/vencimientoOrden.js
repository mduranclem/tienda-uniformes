// Plazo para pagar un pedido y cancelación de los vencidos.
//
// Sin pasarela de pago, un pedido queda PENDIENTE hasta que llega la
// transferencia o la persona paga en el local. El stock ya se descontó al
// crearlo, así que un pedido que nadie paga deja prendas "tomadas" que no se le
// pueden vender a otra familia. Pasado el plazo, se cancela y el stock vuelve.

const prisma = require('./prisma')
const { notificarCambioEstado } = require('../services/notificaciones')

// El mismo plazo para transferencia y efectivo: quien compra un viernes y pasa
// por el local el lunes no tiene que encontrarse el pedido cancelado.
const DIAS_PLAZO_PAGO = 7
const MS_POR_DIA = 24 * 60 * 60 * 1000

function calcularVencimiento(desde = new Date()) {
  return new Date(desde.getTime() + DIAS_PLAZO_PAGO * MS_POR_DIA)
}

// Al extender se suma desde el vencimiento actual si todavía no pasó. Si ya
// pasó, desde ahora: sumarle 7 días a una fecha de hace dos semanas dejaría el
// pedido vencido igual.
function extenderVencimiento(venceEl, ahora = new Date()) {
  const base = venceEl && venceEl > ahora ? venceEl : ahora
  return calcularVencimiento(base)
}

// Cancela los pedidos PENDIENTE cuyo plazo ya pasó y les devuelve el stock.
// Los pedidos sin venceEl son de antes de este campo: la migración se los
// completó a todos los pendientes, así que se ignoran en vez de adivinar.
async function cancelarVencidas(ahora = new Date()) {
  const vencidas = await prisma.orden.findMany({
    where: { estado: 'PENDIENTE', venceEl: { lt: ahora } },
    include: {
      items: true,
      entrega: true,
      usuario: { select: { email: true, nombre: true, telefono: true } },
    },
  })

  let canceladas = 0
  for (const orden of vencidas) {
    const cancelada = await prisma.$transaction(async (tx) => {
      // Se vuelve a filtrar por estado dentro de la transacción: si alguien la
      // marcó pagada entre la búsqueda y acá, no se cancela ni se repone stock.
      const { count } = await tx.orden.updateMany({
        where: { id: orden.id, estado: 'PENDIENTE' },
        data: { estado: 'CANCELADA' },
      })
      if (!count) return false

      for (const item of orden.items) {
        await tx.variante.update({
          where: { id: item.varianteId },
          data: { stock: { increment: item.cantidad } },
        })
      }
      await tx.historialOrden.create({
        data: {
          ordenId: orden.id,
          estado: 'CANCELADA',
          nota: `Cancelada automáticamente: pasaron ${DIAS_PLAZO_PAGO} días sin recibir el pago`,
        },
      })
      return true
    })

    if (cancelada) {
      notificarCambioEstado(orden, 'CANCELADA').catch(() => {})
      canceladas++
    }
  }
  return canceladas
}

module.exports = { DIAS_PLAZO_PAGO, calcularVencimiento, extenderVencimiento, cancelarVencidas }
