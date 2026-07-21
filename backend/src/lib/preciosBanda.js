// Resuelve el precio de un talle según las bandas configuradas por categoría.
// La categoría se matchea por nombre (Producto.tipo es texto libre, no FK).

async function bandasDeCategoria(prisma, { tipo, colegial }) {
  const categoria = await prisma.categoria.findUnique({ where: { nombre: tipo } })
  if (!categoria) return []
  return prisma.precioBanda.findMany({ where: { categoriaId: categoria.id, colegial } })
}

async function resolverPrecioBanda(prisma, { tipo, colegial, talle }) {
  const bandas = await bandasDeCategoria(prisma, { tipo, colegial })
  const banda = bandas.find(b => b.talles.includes(talle))
  return banda ? banda.precio : null
}

async function precioBaseCategoria(prisma, { tipo, colegial }) {
  const bandas = await bandasDeCategoria(prisma, { tipo, colegial })
  if (!bandas.length) return null
  return bandas.reduce((min, b) => (b.precio.lessThan(min) ? b.precio : min), bandas[0].precio)
}

module.exports = { resolverPrecioBanda, precioBaseCategoria }
