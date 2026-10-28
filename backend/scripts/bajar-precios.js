// Baja un porcentaje todos los precios de la tienda: bandas, productos (precio
// y oferta) y variantes, redondeados a $100.
//
//   node scripts/bajar-precios.js 30             (simula, no escribe)
//   node scripts/bajar-precios.js 30 --aplicar   (aplica)
//
// ACUMULA: correrlo dos veces baja dos veces. Por eso solo simula si no se le
// pasa --aplicar, al revés que recalcular-precios-productos.js.
//
// Se usó en 2026-10 para bajar un 30% al sacar Mercado Pago. Se escribe todo en
// una sola transacción: o quedan todos los precios bajados o ninguno.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const prisma = require('../src/lib/prisma')

const pesos = n => '$' + Number(n).toLocaleString('es-AR')

async function main() {
  const porcentaje = Number(process.argv[2])
  if (!(porcentaje > 0 && porcentaje < 100)) {
    console.error('Uso: node scripts/bajar-precios.js <porcentaje> [--aplicar]')
    process.exit(1)
  }
  const aplicar = process.argv.includes('--aplicar')
  const factor = 1 - porcentaje / 100
  const bajar = p => (p == null ? null : Math.round((Number(p) * factor) / 100) * 100)

  const bandas = await prisma.precioBanda.findMany({ include: { categoria: true } })
  const productos = await prisma.producto.findMany({ include: { variantes: true } })

  const ops = bandas.map(b =>
    prisma.precioBanda.update({ where: { id: b.id }, data: { precio: bajar(b.precio) } })
  )
  let variantes = 0
  for (const p of productos) {
    ops.push(prisma.producto.update({
      where: { id: p.id },
      data: { precio: bajar(p.precio), precioOferta: bajar(p.precioOferta) },
    }))
    for (const v of p.variantes) {
      if (v.precio == null) continue
      variantes++
      ops.push(prisma.variante.update({ where: { id: v.id }, data: { precio: bajar(v.precio) } }))
    }
  }

  for (const b of bandas) {
    console.log(`${aplicar ? '✓' : '·'} ${b.categoria.nombre.padEnd(38)} ${b.talles.join(',').padEnd(22)} ${pesos(b.precio)} → ${pesos(bajar(b.precio))}`)
  }

  if (aplicar) await prisma.$transaction(ops, { timeout: 120000 })
  console.log(
    `\n${bandas.length} banda(s), ${productos.length} producto(s) y ${variantes} variante(s) ` +
    `${aplicar ? 'bajados' : 'a bajar (simulación; agregá --aplicar)'} un ${porcentaje}%.`
  )

  await prisma.$disconnect()
}

main().catch(async err => {
  console.error('Error:', err.message)
  await prisma.$disconnect()
  process.exit(1)
})
