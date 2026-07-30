// Ajusta las bandas de precio para que, después de los descuentos de Mercado
// Pago, entre en la cuenta el precio actual de lista.
//
// Uso (desde cualquier carpeta):
//   node backend/scripts/ajustar-precios-mp.js            (simulación)
//   node backend/scripts/ajustar-precios-mp.js --aplicar  (escribe)
//
// ⚠️ NO ES IDEMPOTENTE: cada corrida con --aplicar vuelve a recargar sobre el
// precio ya recargado. Por eso la simulación es el modo por defecto.
//
// El cálculo divide, no suma. Si a $30.000 le sumás 25,12% obtenés $37.536,
// pero la comisión se cobra sobre ESE total, así que te quedan $28.108. Para
// recibir $30.000 hay que cobrar $30.000 / (1 - 0,2512) = $40.064.

// El .env se busca por la ubicación del script y no por el directorio actual,
// para que no importe desde dónde se ejecute.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const prisma = require('../src/lib/prisma')

// Comisión de Checkout Pro para "hasta 3 cuotas sin interés" (planilla de MP).
const COMISION_MP = 0.1861
const IVA = 0.21
// Retenciones Santa Fe: 2% IIBB + 0,6% créditos/débitos, sobre el bruto.
const RETENCIONES = 0.026

const DESCUENTO_TOTAL = COMISION_MP * (1 + IVA) + RETENCIONES
const FACTOR = 1 / (1 - DESCUENTO_TOTAL)

// Se redondea hacia arriba para que el redondeo nunca deje el neto por debajo
// del precio objetivo.
const REDONDEO = 100
const redondear = n => Math.ceil(n / REDONDEO) * REDONDEO

async function main() {
  const aplicar = process.argv.includes('--aplicar')

  console.log(`Comisión MP ${(COMISION_MP * 100).toFixed(2)}% + IVA ${IVA * 100}% + retenciones ${(RETENCIONES * 100).toFixed(1)}%`)
  console.log(`Te descuentan ${(DESCUENTO_TOTAL * 100).toFixed(2)}% → hay que recargar ${((FACTOR - 1) * 100).toFixed(1)}%\n`)

  const bandas = await prisma.precioBanda.findMany({
    include: { categoria: { select: { nombre: true } } },
    orderBy: { categoria: { nombre: 'asc' } },
  })

  for (const banda of bandas) {
    const actual = Number(banda.precio)
    const nuevo = redondear(actual * FACTOR)
    const neto = Math.round(nuevo * (1 - DESCUENTO_TOTAL))

    if (aplicar) {
      await prisma.precioBanda.update({ where: { id: banda.id }, data: { precio: nuevo } })
    }

    console.log(
      `${aplicar ? '✓' : '·'} ${banda.categoria.nombre.padEnd(34)} ${banda.talles.join(',').padEnd(14)} ` +
      `$${actual.toLocaleString('es-AR').padStart(7)} → $${nuevo.toLocaleString('es-AR').padStart(7)} ` +
      `(te entran $${neto.toLocaleString('es-AR')})`
    )
  }

  // Si absorbés el costo de las 3 cuotas, la tienda tiene que mostrarlas: es lo
  // que estás pagando. cuotasRecargo en null = sin interés.
  const cuotas = aplicar
    ? (await prisma.producto.updateMany({ data: { cuotas: 3, cuotasRecargo: null } })).count
    : await prisma.producto.count()

  console.log(`\n${bandas.length} bandas ${aplicar ? 'actualizadas' : 'a actualizar'}.`)
  console.log(`${cuotas} productos ${aplicar ? 'quedaron' : 'quedarían'} en "3 cuotas sin interés".`)
  if (!aplicar) console.log('\nSimulación. Volvé a correrlo con --aplicar para escribir los cambios.')

  await prisma.$disconnect()
}

main().catch(async err => {
  console.error('Error:', err.message)
  await prisma.$disconnect()
  process.exit(1)
})
