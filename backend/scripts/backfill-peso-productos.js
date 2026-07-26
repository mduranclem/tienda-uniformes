// Completa `pesoGramos` en los productos que no lo tienen, estimando por tipo.
//
// Uso:
//   cd backend
//   node -r dotenv/config scripts/backfill-peso-productos.js
//   node -r dotenv/config scripts/backfill-peso-productos.js --dry-run
//
// Idempotente: solo toca filas con `pesoGramos` en null, así que correrlo dos
// veces no pisa nada de lo que hayas ajustado a mano desde el admin.

const prisma = require('../src/lib/prisma')
const { pesoDeProducto } = require('../src/lib/pesos')

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const productos = await prisma.producto.findMany({
    where: { pesoGramos: null },
    select: { id: true, nombre: true, tipo: true, pesoGramos: true },
  })

  if (productos.length === 0) {
    console.log('No hay productos sin peso. Nada que hacer.')
    await prisma.$disconnect()
    return
  }

  console.log(`${productos.length} producto(s) sin peso.${dryRun ? ' (simulación)' : ''}\n`)

  for (const producto of productos) {
    const peso = pesoDeProducto(producto)
    if (!dryRun) {
      await prisma.producto.update({ where: { id: producto.id }, data: { pesoGramos: peso } })
    }
    console.log(`${dryRun ? '·' : '✓'} ${producto.nombre} (${producto.tipo}) → ${peso} g`)
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
