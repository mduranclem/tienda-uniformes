// Completa las combinaciones de talle × color que faltan y deja todo el stock
// en un valor fijo.
//
// Uso (desde cualquier carpeta):
//   node backend/scripts/completar-stock.js                       (simulación)
//   node backend/scripts/completar-stock.js --aplicar             (escribe)
//   node backend/scripts/completar-stock.js --aplicar --stock 8
//   node backend/scripts/completar-stock.js --aplicar --todos-los-talles
//   node backend/scripts/completar-stock.js --aplicar --incluir-inactivos
//
// Por defecto toma los talles que cada producto YA tiene cargados y los cruza
// con sus colores declarados: no inventa talles.
//
// Con --todos-los-talles usa la grilla completa (4 a ESP) para todos los
// productos. Requiere que la categoría tenga precio para cada talle; si falta
// alguno se avisa y no se crea esa variante, porque una variante sin precio
// propio hereda el precio base del producto —el del talle más chico— y se
// vendería más barata de lo que corresponde.
//
// Cada cambio de stock queda registrado en MovimientoStock, que es el historial
// que alimenta /admin/movimientos-stock. Saltearlo dejaría el stock y su
// historia contando cosas distintas.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const prisma = require('../src/lib/prisma')

const STOCK_DEFECTO = 5
const PUNTO_VENTA = 'Fábrica - Dean Funes 1258'
// Misma grilla que usa el admin (frontend/src/lib/utils.js).
const TALLES_STANDARD = ['4', '6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL', 'ESP']

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
  const todosLosTalles = process.argv.includes('--todos-los-talles')
  const objetivo = leerStockObjetivo()

  // Los precios por talle viven en las bandas de cada categoría. Se cargan de
  // una y se resuelven en memoria: consultarlas por variante serían cientos de
  // viajes contra el pooler.
  const categorias = await prisma.categoria.findMany({ include: { preciosBanda: true } })
  const bandasPorTipo = new Map(categorias.map(c => [c.nombre, c.preciosBanda]))
  const precioDeTalle = (tipo, talle) =>
    (bandasPorTipo.get(tipo) ?? []).find(b => b.talles.includes(talle))?.precio ?? null

  const punto = await prisma.puntoDeVenta.findFirst({ where: { nombre: PUNTO_VENTA } })
  if (!punto) {
    console.error(`No existe el punto de venta "${PUNTO_VENTA}". Crealo en /admin/puntos-venta.`)
    process.exit(1)
  }

  // Por defecto solo los publicados: son los que se pueden vender y los únicos
  // cuyo stock miente si está mal. Con --incluir-inactivos entran también las
  // plantillas y los borradores, para dejarlos listos antes de publicarlos.
  const incluirInactivos = process.argv.includes('--incluir-inactivos')

  const productos = await prisma.producto.findMany({
    where: incluirInactivos ? {} : { activo: true },
    include: { colores: true, variantes: true },
    orderBy: { nombre: 'asc' },
  })

  let creadas = 0
  let ajustadas = 0
  const sinTalles = []
  const sinPrecio = []

  for (const producto of productos) {
    const talles = todosLosTalles
      ? TALLES_STANDARD
      : [...new Set(producto.variantes.map(v => v.talle))]
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

      // La banda de la categoría manda; la hermana del mismo talle es el
      // respaldo para productos cuya categoría no tenga bandas cargadas.
      const hermana = producto.variantes.find(v => v.talle === combo.talle)
      const precio = precioDeTalle(producto.tipo, combo.talle) ?? hermana?.precio ?? null

      if (precio === null) {
        sinPrecio.push(`${producto.nombre} — talle ${combo.talle}`)
        continue
      }

      nuevas.push({
        productoId: producto.id,
        talle: combo.talle,
        color: combo.color,
        precio,
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
  // Va en try aparte porque el stock ya quedó bien: si fallara el historial por
  // permisos, no tiene sentido dar por perdida toda la carga.
  if (aplicar) {
    const todas = await prisma.variante.findMany({
      where: incluirInactivos ? {} : { producto: { activo: true } },
      select: { id: true },
    })
    try {
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
    } catch (err) {
      console.log(`\n⚠️  El stock quedó bien, pero no se pudo registrar el historial: ${err.message.split('\n').find(l => l.includes('denied')) ?? err.message}`)
      console.log('   Corré backend/scripts/fix-permisos-tienda-app.js y volvé a ejecutar esto.')
    }
  }

  console.log(
    `\n${creadas} variante(s) ${aplicar ? 'creadas' : 'a crear'} · ` +
    `${ajustadas} ${aplicar ? 'ajustadas' : 'a ajustar'} a stock ${objetivo}.`
  )

  if (sinPrecio.length) {
    console.log('\n⚠️  Sin precio en la banda de su categoría, no se crearon:')
    sinPrecio.slice(0, 15).forEach(x => console.log('   ·', x))
    if (sinPrecio.length > 15) console.log(`   … y ${sinPrecio.length - 15} más`)
    console.log('   Cargá esos talles en /admin/categorias y volvé a correr esto.')
  }

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
