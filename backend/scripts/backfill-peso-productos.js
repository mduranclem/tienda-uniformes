// Completa `pesoGramos` en los productos que no lo tienen, estimando por tipo.
//
// Uso:
//   cd backend
//   node -r dotenv/config scripts/backfill-peso-productos.js
//   node -r dotenv/config scripts/backfill-peso-productos.js --dry-run
//   node -r dotenv/config scripts/backfill-peso-productos.js --recalcular
//
// Idempotente: solo toca filas con `pesoGramos` en null, así que correrlo dos
// veces no pisa nada de lo que hayas ajustado a mano desde el admin.
//
// --recalcular recalcula TODOS los productos, incluidos los que ya tienen peso.
// Pisa cualquier ajuste manual: usalo solo después de cambiar las reglas de
// estimación en lib/pesos.js.

const prisma = require('../src/lib/prisma')
const { pesoPorTipo } = require('../src/lib/pesos')

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const recalcular = process.argv.includes('--recalcular')

  const productos = await prisma.producto.findMany({
    where: recalcular ? {} : { pesoGramos: null },
    select: { id: true, nombre: true, tipo: true, pesoGramos: true },
  })

  if (productos.length === 0) {
    console.log('No hay productos sin peso. Nada que hacer.')
    await prisma.$disconnect()
    return
  }

  console.log(
    `${productos.length} producto(s)${recalcular ? ' a recalcular' : ' sin peso'}.` +
    `${dryRun ? ' (simulación)' : ''}\n`
  )

  for (const producto of productos) {
    // Siempre se estima por tipo: si se usara pesoDeProducto, un producto que ya
    // tiene peso devolvería el suyo y --recalcular no cambiaría nada.
    const peso = pesoPorTipo(producto.tipo)
    if (!dryRun) {
      await prisma.producto.update({ where: { id: producto.id }, data: { pesoGramos: peso } })
    }
    const antes = producto.pesoGramos !== null && producto.pesoGramos !== peso
      ? ` (antes ${producto.pesoGramos} g)`
      : ''
    console.log(`${dryRun ? '·' : '✓'} ${producto.nombre} (${producto.tipo}) → ${peso} g${antes}`)
  }

  console.log(
    `\n${dryRun ? 'Se actualizarían' : 'Actualizados'} ${productos.length} producto(s).` +
    '\nSon estimaciones por tipo de prenda: ajustá los que no den desde /admin/productos.'
  )
  await prisma.$disconnect()
}

main().catch(async err => {
  console.error('Error:', err.message)
  await prisma.$disconnect()
  process.exit(1)
})
