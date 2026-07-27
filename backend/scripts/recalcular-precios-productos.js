// Sincroniza los precios de productos y variantes con las bandas por categoría.
//
// Uso (desde cualquier carpeta):
//   node backend/scripts/recalcular-precios-productos.js            (aplica)
//   node backend/scripts/recalcular-precios-productos.js --dry-run  (simula)
//
// Las bandas (categoría + rango de talles) son la fuente de verdad del precio,
// pero cada producto y cada variante guardan una copia, que es la que se muestra
// en la tienda. Cambiar una banda no propaga solo: hay que correr esto, o tocar
// "recalcular precios" producto por producto en el admin.
//
// Es idempotente: recalcula siempre desde las bandas, así que correrlo dos veces
// da el mismo resultado. Por eso aplica por defecto, al revés que
// ajustar-precios-mp.js, que sí acumula.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const prisma = require('../src/lib/prisma')

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  // Las bandas se cargan de una y se resuelven en memoria. Consultarlas por
  // cada talle serían cientos de viajes contra el pooler, y el script pasa de
  // segundos a minutos.
  const categorias = await prisma.categoria.findMany({ include: { preciosBanda: true } })
  const bandasPorTipo = new Map(categorias.map(c => [c.nombre, c.preciosBanda]))

  const precioDeTalle = (tipo, talle) => {
    const banda = (bandasPorTipo.get(tipo) ?? []).find(b => b.talles.includes(talle))
    return banda ? banda.precio : null
  }
  const precioBase = (tipo) => {
    const bandas = bandasPorTipo.get(tipo) ?? []
    if (!bandas.length) return null
    return bandas.reduce((min, b) => (b.precio.lessThan(min) ? b.precio : min), bandas[0].precio)
  }

  const productos = await prisma.producto.findMany({
    include: { variantes: { select: { id: true, talle: true, precio: true } } },
    orderBy: { nombre: 'asc' },
  })

  let productosTocados = 0
  let variantesTocadas = 0
  const sinBanda = []

  for (const producto of productos) {
    const base = precioBase(producto.tipo)
    if (base === null) {
      sinBanda.push(`${producto.nombre} (${producto.tipo})`)
      continue
    }

    const cambiaBase = Number(base) !== Number(producto.precio)
    if (cambiaBase && !dryRun) {
      await prisma.producto.update({ where: { id: producto.id }, data: { precio: base } })
    }
    if (cambiaBase) productosTocados++

    const detalle = []
    for (const variante of producto.variantes) {
      const precio = precioDeTalle(producto.tipo, variante.talle)
      if (precio === null) continue
      if (Number(precio) === Number(variante.precio)) continue

      if (!dryRun) {
        await prisma.variante.update({ where: { id: variante.id }, data: { precio } })
      }
      variantesTocadas++
      detalle.push(`${variante.talle}: $${Number(variante.precio ?? 0).toLocaleString('es-AR')}→$${Number(precio).toLocaleString('es-AR')}`)
    }

    if (cambiaBase || detalle.length) {
      console.log(
        `${dryRun ? '·' : '✓'} ${producto.nombre.slice(0, 44).padEnd(46)} ` +
        `base $${Number(producto.precio).toLocaleString('es-AR')}→$${Number(base).toLocaleString('es-AR')}` +
        (detalle.length ? `  |  ${detalle.join('  ')}` : '')
      )
    }
  }

  console.log(
    `\n${productosTocados} producto(s) y ${variantesTocadas} variante(s) ` +
    `${dryRun ? 'a actualizar' : 'actualizados'}.`
  )

  if (sinBanda.length) {
    console.log(`\n⚠️  Sin bandas cargadas, quedaron con el precio viejo:`)
    sinBanda.forEach(p => console.log(`   · ${p}`))
    console.log('   Cargá los precios de esas categorías en /admin/categorias.')
  }

  await prisma.$disconnect()
}

main().catch(async err => {
  console.error('Error:', err.message)
  await prisma.$disconnect()
  process.exit(1)
})
