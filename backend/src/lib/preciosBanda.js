// Resuelve el precio de un talle según las bandas configuradas por categoría.
// La categoría se matchea por nombre (Producto.tipo es texto libre, no FK).
// Cada categoría ya es específica (ej. "CHOMBA BORDADA" vs "CHOMBA LISA" son
// categorías separadas), así que una categoría tiene una sola tabla de precios.

async function bandasDeCategoria(prisma, { tipo }) {
  const categoria = await prisma.categoria.findUnique({ where: { nombre: tipo } })
  if (!categoria) return []
  return prisma.precioBanda.findMany({ where: { categoriaId: categoria.id } })
}

async function resolverPrecioBanda(prisma, { tipo, talle }) {
  const bandas = await bandasDeCategoria(prisma, { tipo })
  const banda = bandas.find(b => b.talles.includes(talle))
  return banda ? banda.precio : null
}

async function precioBaseCategoria(prisma, { tipo }) {
  const bandas = await bandasDeCategoria(prisma, { tipo })
  if (!bandas.length) return null
  return bandas.reduce((min, b) => (b.precio.lessThan(min) ? b.precio : min), bandas[0].precio)
}

module.exports = { resolverPrecioBanda, precioBaseCategoria }
