// Completa las combinaciones de talle × color que faltan y deja todo el stock
// en un valor fijo.
//
// Uso (desde cualquier carpeta):
//   node backend/scripts/completar-stock.js                    (simulación)
//   node backend/scripts/completar-stock.js --aplicar          (escribe)
//   node backend/scripts/completar-stock.js --aplicar --stock 8
//
// Para cada producto activo toma los talles que YA tiene cargados y los cruza
// con los colores declarados en el producto. No inventa talles nuevos: si un
// producto solo tiene 4 y 6, sigue teniendo 4 y 6.
//
// El precio de cada variante nueva se copia de otra del mismo talle en el mismo
// producto, que es la fuente más confiable: replica exactamente lo que ya está
// publicado en vez de recalcularlo.
//
// Cada cambio de stock queda registrado en MovimientoStock, que es el historial
// que alimenta /admin/movimientos-stock. Saltearlo dejaría el stock y su
// historia contando cosas distintas.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const prisma = require('../src/lib/prisma')

const STOCK_DEFECTO = 5
const PUNTO_VENTA = 'Fábrica - Dean Funes 1258'

function leerStockObjetivo() {
  const i = process.argv.indexOf('--stock')
  if (i === -1) return STOCK_DEFECTO
  const valor = Number(process.argv[i + 1])
  if (!Number.isInteger(valor) || valor < 0) {
    console.error('--stock debe ser un entero mayor o igual a 0')
    process.exit(1)
  }
  return valor
}

async function main() {
  const aplicar = process.argv.includes('--aplicar')
  const objetivo = leerStockObjetivo()

  const punto = await prisma.puntoDeVenta.findFirst({ where: { nombre: PUNTO_VENTA } })
  if (!punto) {
    console.error(`No existe el punto de venta "${PUNTO_VENTA}". Crealo en /admin/puntos-venta.`)
    process.exit(1)
  }

  const productos = await prisma.producto.findMany({
    where: { activo: true },
    include: { colores: true, variantes: true },
    orderBy: { nombre: 'asc' },
  })

  let creadas = 0
  let ajustadas = 0
  const sinTalles = []

  for (const producto of productos) {
    const talles = [...new Set(producto.variantes.map(v => v.talle))]
    const colores = producto.colores.map(c => c.nombre)

    if (talles.length === 0) {
      sinTalles.push(producto.nombre)
      continue
    }

    // Sin colores declarados, la variante se identifica solo por talle.
    const combinaciones = colores.length
      ? talles.flatMap(t => colores.map(c => ({ talle: t, color: c })))
      : talles.map(t => ({ talle: t, color: null }))

    const nuevas = []
    for (const combo of combinaciones) {
      const existe = producto.variantes.some(v => v.talle === combo.talle && v.color === combo.color)
      if (existe) continue

      const hermana = producto.variantes.find(v => v.talle === combo.talle)
      nuevas.push({
        productoId: producto.id,
        talle: combo.talle,
        color: combo.color,
        precio: hermana?.precio ?? null,
        stock: objetivo,
      })
    }

    if (nuevas.length && aplicar) {
      await prisma.variante.createMany({ data: nuevas, skipDuplicates: true })
    }
    creadas += nuevas.length

    const desactualizadas = producto.variantes.filter(v => v.stock !== objetivo)
    if (desactualizadas.length && aplicar) {
      await prisma.variante.updateMany({
        where: { id: { in: desactualizadas.map(v => v.id) } },
        data: { stock: objetivo },
      })
    }
    ajustadas += desactualizadas.length

    if (nuevas.length || desactualizadas.length) {
      console.log(
        `${aplicar ? '✓' : '·'} ${producto.nombre.slice(0, 44).padEnd(46)} ` +
        `+${String(nuevas.length).padStart(2)} nuevas · ${String(desactualizadas.length).padStart(2)} ajustadas`
      )
    }
  }

  // Historial: se registra después de crear las variantes, para tener sus ids.
  if (aplicar) {
    const todas = await prisma.variante.findMany({
      where: { producto: { activo: true } },
      select: { id: true },
    })
    await prisma.movimientoStock.createMany({
      data: todas.map(v => ({
        varianteId: v.id,
        puntoDeVentaId: punto.id,
        tipo: 'AJUSTE',
        cantidad: objetivo,
        nota: `Carga inicial de stock (${objetivo} por variante)`,
      })),
    })
    console.log(`\n${todas.length} movimiento(s) registrados en "${punto.nombre}".`)
  }

  console.log(
    `\n${creadas} variante(s) ${aplicar ? 'creadas' : 'a crear'} · ` +
    `${ajustadas} ${aplicar ? 'ajustadas' : 'a ajustar'} a stock ${objetivo}.`
  )

  if (sinTalles.length) {
    console.log('\n⚠️  Sin ningún talle cargado, no se pudo completar nada:')
    sinTalles.forEach(n => console.log('   ·', n))
    console.log('   Cargales al menos un talle desde /admin/productos y volvé a correr esto.')
  }

  if (!aplicar) console.log('\nSimulación. Corré con --aplicar para escribir los cambios.')

  await prisma.$disconnect()
}

main().catch(async err => {
  console.error('Error:', err.message)
  await prisma.$disconnect()
  process.exit(1)
})
