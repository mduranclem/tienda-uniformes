// Borra los productos "plantilla" que se crearon por error al cargar la lista
// de precios: cada línea de esa lista era una categoría, no algo que se venda.
//
//   node scripts/borrar-productos-plantilla.js              (simula)
//   node scripts/borrar-productos-plantilla.js --aplicar    (borra)
//
// Se borra únicamente lo que cumple TODAS estas condiciones, para que ningún
// producto real quede en el camino:
//   · el nombre está en la lista de abajo
//   · no tiene colegio asignado
//   · está inactivo
//   · no aparece en ninguna orden ni carrito
//   · no tiene fotos cargadas
//
// Las variantes, sus movimientos de stock y sus alertas se van en cascada.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const prisma = require('../src/lib/prisma')

const NOMBRES = [
  'Remera Bordada',
  'Remera estampada',
  'Short sin frisa bordado',
  'Short sin frisa estampado',
  'Chomba bordada',
  'Chomba estampada',
  'Buzo cuello redondo con frisa bordado',
  'Buzo cuello redondo con frisa estampado',
  'Pantalón largo con frisa bordado',
  'Pantalón largo con frisa estampado',
  'Campera canguro con frisa bordada',
  'Campera canguro con frisa estampada',
  'Buzo de acetato',
  'Chomba lisa',
  'Remera lisa manga larga',
  'Short liso colegial',
  'Chaleco liso polar azul marino',
  'Campera polar lisa azul marino',
  'Pantalón jogging liso con frisa',
  'Campera lisa canguro con frisa',
  'Buzo canguro liso con frisa',
  'Pantalón cargo azul-gris gabardina',
]

async function main() {
  const aplicar = process.argv.includes('--aplicar')

  const candidatos = await prisma.producto.findMany({
    where: { nombre: { in: NOMBRES }, colegioId: null, activo: false },
    include: { _count: { select: { variantes: true, itemsOrden: true, itemsCarrito: true, imagenes: true } } },
    orderBy: { nombre: 'asc' },
  })

  const borrables = []
  const conservados = []

  for (const p of candidatos) {
    const c = p._count
    if (c.itemsOrden || c.itemsCarrito || c.imagenes) {
      conservados.push({ p, motivo: c.itemsOrden ? 'está en una orden' : c.itemsCarrito ? 'está en un carrito' : 'tiene fotos cargadas' })
    } else {
      borrables.push(p)
    }
  }

  for (const p of borrables) {
    console.log(`${aplicar ? '✓' : '·'} ${p.nombre.padEnd(42)} ${p._count.variantes} variante(s)`)
  }

  if (aplicar && borrables.length) {
    await prisma.producto.deleteMany({ where: { id: { in: borrables.map(p => p.id) } } })
  }

  console.log(`\n${borrables.length} producto(s) ${aplicar ? 'borrados' : 'a borrar'}.`)

  if (conservados.length) {
    console.log('\nNo se tocaron, tienen datos asociados:')
    conservados.forEach(({ p, motivo }) => console.log(`   · ${p.nombre.padEnd(42)} ${motivo}`))
  }

  if (!aplicar) console.log('\nSimulación. Corré con --aplicar para borrar.')
}

main()
  .catch(err => { console.error('Error:', err.message); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
