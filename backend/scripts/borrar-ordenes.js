// Borra TODAS las órdenes. Pensado para limpiar los pedidos de prueba antes de
// abrir la tienda de verdad.
//
//   node scripts/borrar-ordenes.js              (simula)
//   node scripts/borrar-ordenes.js --aplicar    (borra)
//
// Esto no se puede deshacer. Antes de aplicar conviene mirar la lista que
// imprime: si aparece un pedido de alguien que no sea de la casa, frenar.
//
// ItemOrden e HistorialOrden apuntan a Orden sin borrado en cascada, así que
// hay que barrerlos en orden y dentro de una transacción: a mitad de camino
// quedarían ítems apuntando a un pedido que ya no existe.
//
// Lo que NO toca:
//   · el stock, que no se devuelve solo (las órdenes lo habían descontado)
//   · los movimientos de stock, que son el historial del depósito y viven
//     aparte de los pedidos

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const prisma = require('../src/lib/prisma')

async function main() {
  const aplicar = process.argv.includes('--aplicar')
  const reiniciarNumeracion = !process.argv.includes('--mantener-numeracion')

  const ordenes = await prisma.orden.findMany({
    include: { items: true, _count: { select: { historial: true } } },
    orderBy: { numero: 'asc' },
  })

  if (!ordenes.length) {
    console.log('No hay órdenes.')
    return
  }

  for (const o of ordenes) {
    const quien = o.nombreGuest ?? o.emailGuest ?? o.usuarioId ?? '—'
    console.log(
      `${aplicar ? '✓' : '·'} #${String(o.numero).padEnd(4)} ${o.estado.padEnd(11)} ` +
      `$${Number(o.total).toLocaleString('es-AR').padStart(9)}  ${String(quien).slice(0, 30)}`
    )
  }

  const items = ordenes.reduce((a, o) => a + o.items.length, 0)
  const historial = ordenes.reduce((a, o) => a + o._count.historial, 0)
  console.log(`\n${ordenes.length} orden(es), ${items} ítem(s) y ${historial} registro(s) de historial.`)

  if (!aplicar) {
    console.log('\nSimulación. Corré con --aplicar para borrar. NO se puede deshacer.')
    return
  }

  await prisma.$transaction([
    prisma.historialOrden.deleteMany({}),
    prisma.itemOrden.deleteMany({}),
    prisma.orden.deleteMany({}),
  ])

  // El número de pedido es un autoincremental: sin reiniciarlo, el primer
  // pedido real seguiría después del último de prueba.
  if (reiniciarNumeracion) {
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Orden_numero_seq" RESTART WITH 1`)
    console.log('\nBorradas. El próximo pedido va a ser el #1.')
  } else {
    console.log('\nBorradas. La numeración sigue donde estaba.')
  }
}

main()
  .catch(err => { console.error('Error:', err.message); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
