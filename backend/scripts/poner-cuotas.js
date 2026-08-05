// Deja todos los productos con la misma cantidad de cuotas sin interés.
//
//   node scripts/poner-cuotas.js                     (simula, 3 cuotas)
//   node scripts/poner-cuotas.js --aplicar
//   node scripts/poner-cuotas.js --aplicar --cuotas 6
//
// `cuotas` en null significa "no mostrar financiación": el producto no dice
// nada sobre cuotas ni en la tarjeta ni en la ficha. Con la promo vigente de 3
// sin interés, un producto en null le miente por omisión al cliente.
//
// `cuotasRecargo` queda en null a propósito: null es sin interés. Ponerle 0
// sería lo mismo para la cuenta, pero null es lo que el resto del código
// entiende como "sin recargo".

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const prisma = require('../src/lib/prisma')

function leerCuotas() {
  const i = process.argv.indexOf('--cuotas')
  if (i === -1) return 3
  const valor = Number(process.argv[i + 1])
  if (!Number.isInteger(valor) || valor < 1) {
    console.error('--cuotas debe ser un entero mayor o igual a 1')
    process.exit(1)
  }
  return valor
}

async function main() {
  const aplicar = process.argv.includes('--aplicar')
  const cuotas = leerCuotas()

  const productos = await prisma.producto.findMany({
    select: { id: true, nombre: true, cuotas: true, cuotasRecargo: true },
    orderBy: { nombre: 'asc' },
  })

  const aCambiar = productos.filter(p => p.cuotas !== cuotas || p.cuotasRecargo !== null)

  for (const p of aCambiar) {
    console.log(`${aplicar ? '✓' : '·'} ${p.nombre.slice(0, 46).padEnd(48)} ${p.cuotas ?? 'sin cuotas'} → ${cuotas}`)
  }

  if (aplicar && aCambiar.length) {
    await prisma.producto.updateMany({
      where: { id: { in: aCambiar.map(p => p.id) } },
      data: { cuotas, cuotasRecargo: null },
    })
  }

  console.log(
    `\n${aCambiar.length} de ${productos.length} producto(s) ` +
    `${aplicar ? 'actualizados' : 'a actualizar'} a ${cuotas} cuotas sin interés.`
  )

  if (!aplicar) console.log('\nSimulación. Corré con --aplicar para escribir.')
}

main()
  .catch(err => { console.error('Error:', err.message); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
