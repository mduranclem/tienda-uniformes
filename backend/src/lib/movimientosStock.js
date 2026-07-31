// Registra un movimiento de stock y actualiza Variante.stock de forma atómica.
// cantidad va con signo: negativo = sale stock, positivo = entra stock.
async function registrarMovimiento(tx, { varianteId, puntoDeVentaId, tipo, cantidad, nota }) {
  const variante = await tx.variante.findUnique({ where: { id: varianteId } })
  if (!variante) throw Object.assign(new Error('Variante no encontrada'), { status: 404 })

  const stockNuevo = variante.stock + cantidad
  if (stockNuevo < 0) {
    throw Object.assign(new Error('Stock insuficiente'), { status: 409 })
  }

  await tx.variante.update({ where: { id: varianteId }, data: { stock: stockNuevo } })
  const movimiento = await tx.movimientoStock.create({
    data: { varianteId, puntoDeVentaId, tipo, cantidad, nota: nota ?? null },
  })

  return { stockAnterior: variante.stock, stockNuevo, movimiento }
}

// Busca la variante por productoId+talle (+color si hay ambigüedad).
async function resolverVariante(prisma, { productoId, talle, color }) {
  if (!productoId || !talle) {
    throw Object.assign(new Error('productoId y talle son requeridos'), { status: 400 })
  }

  const candidatas = await prisma.variante.findMany({
    where: { productoId, talle, ...(color ? { color } : {}) },
    include: { producto: { select: { id: true, nombre: true } } },
  })

  if (candidatas.length === 0) {
    throw Object.assign(new Error(`No se encontró variante para talle ${talle}`), { status: 404 })
  }
  if (candidatas.length > 1) {
    const colores = candidatas.map(v => v.color).filter(Boolean)
    throw Object.assign(
      new Error(`Hay más de un color para el talle ${talle}, especificá color: ${colores.join(', ')}`),
      { status: 409 }
    )
  }

  return candidatas[0]
}

module.exports = { registrarMovimiento, resolverVariante }
