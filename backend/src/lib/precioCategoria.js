// Precio de una prenda: uno por categoría, igual para todos los talles.
// La categoría se matchea por nombre (Producto.tipo es texto libre, no FK).
// Cada categoría ya es específica (ej. "CHOMBA BORDADA" vs "CHOMBA ESTAMPADA"
// son categorías separadas), así que alcanza con un solo precio.

/** Precio de la categoría, o null si no existe o todavía no tiene precio. */
async function precioCategoria(prisma, { tipo }) {
  const categoria = await prisma.categoria.findUnique({
    where: { nombre: tipo },
    select: { precio: true },
  })
  return categoria?.precio ?? null
}

module.exports = { precioCategoria }
