// Carga la lista de precios de la tienda: un precio por categoría (prenda),
// igual para todos los talles, y lo copia a los productos de cada categoría.
//
// NO crea productos. Cada entrada de la lista es una categoría —un tipo de
// prenda con su precio—, no algo que se venda: los productos son las prendas
// concretas de cada colegio y se cargan desde el panel.
//
//   node scripts/cargar-lista-precios.js --dry-run   (simula, no escribe)
//   node scripts/cargar-lista-precios.js             (aplica)
//
// Los precios son los FINALES que ve el cliente: la lista "precio promo, solo
// efectivo o transferencia" de noviembre de 2026. Se cobra por transferencia o
// en el local, sin recargo de pasarela.
//
// La fuente de verdad es Categoria.precio; Producto.precio guarda una copia, que
// es la que se cobra. Desde el panel, guardar el precio de una categoría hace
// las dos cosas juntas; este script hace lo mismo para toda la lista de una vez.
//
// Es idempotente: correrlo dos veces deja lo mismo.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const prisma = require('../src/lib/prisma')

// `categoria` es el nombre exacto en la tabla Categoria, que es también lo que
// guarda Producto.tipo. Para renombrar una categoría no alcanza con cambiarla
// acá: hay que arrastrar el tipo de cada producto, y de eso se ocupa
// scripts/renombrar-categoria.js.
const LISTA = [
  { prenda: 'Remera lisa', categoria: 'REMERA LISA', precio: 10000 },
  { prenda: 'Remera bordada', categoria: 'REMERA BORDADA', precio: 14000 },
  { prenda: 'Remera estampada', categoria: 'REMERA ESTAMPADA', precio: 12000 },

  { prenda: 'Chomba bordada', categoria: 'CHOMBA BORDADA', precio: 25000 },
  { prenda: 'Chomba estampada', categoria: 'CHOMBA ESTAMPADA', precio: 23000 },

  { prenda: 'Jogging frisa / rústico liso', categoria: 'PANTALON LARGO CON FRISA LISO', precio: 25000 },
  { prenda: 'Jogging frisa / rústico bordado', categoria: 'PANTALON LARGO CON FRISA BORDADO', precio: 28000 },
  { prenda: 'Jogging frisa / rústico estampado', categoria: 'PANTALON LARGO CON FRISA ESTAMPADO', precio: 26000 },

  { prenda: 'Short rústico liso', categoria: 'SHORT SIN FRISA LISO', precio: 12000 },
  { prenda: 'Short rústico bordado', categoria: 'SHORT SIN FRISA BORDADO', precio: 15000 },
  { prenda: 'Short rústico estampado', categoria: 'SHORT SIN FRISA ESTAMPADO', precio: 13000 },

  { prenda: 'Buzo básico de frisa liso', categoria: 'BUZO CUELLO RED CON FRISA LISO', precio: 25000 },
  { prenda: 'Buzo básico de frisa bordado', categoria: 'BUZO CUELLO RED CON FRISA BORDADO', precio: 28000 },
  { prenda: 'Buzo básico de frisa estampado', categoria: 'BUZO CUELLO RED CON FRISA ESTAMPADO', precio: 26000 },

  { prenda: 'Buzo canguro liso', categoria: 'BUZO CANGURO CON FRISA LISO', precio: 27000 },
  { prenda: 'Buzo canguro bordado', categoria: 'BUZO CANGURO CON FRISA BORDADO', precio: 30000 },
  { prenda: 'Buzo canguro estampado', categoria: 'BUZO CANGURO CON FRISA ESTAMPADO', precio: 28000 },

  // No es la campera canguro: es otra prenda, y la canguro no vino en la lista.
  { prenda: 'Campera básica frisa / rústico lisa', categoria: 'CAMPERA BASICA CON FRISA LISO', precio: 33000 },
  { prenda: 'Campera básica frisa / rústico bordada', categoria: 'CAMPERA BASICA CON FRISA BORDADO', precio: 36000 },
  { prenda: 'Campera básica frisa / rústico estampada', categoria: 'CAMPERA BASICA CON FRISA ESTAMPADO', precio: 34000 },

  { prenda: 'Pantalón cargo liso', categoria: 'PANTALON CARGO GABARDINA', precio: 35000 },
  { prenda: 'Pantalón cargo bordado', categoria: 'PANTALON CARGO GABARDINA BORDADO', precio: 40000 },
  { prenda: 'Pantalón cargo estampado', categoria: 'PANTALON CARGO GABARDINA ESTAMPADO', precio: 38000 },

  // ── Productos especiales ─────────────────────────────────────────────────
  { prenda: 'Buzo con tejidos y bordados (Nuevo Siglo y Oblatas)', categoria: 'BUZO CON TEJIDOS Y BORDADOS', precio: 39000 },
  { prenda: 'Mochila Nuevo Siglo', categoria: 'MOCHILA', precio: 30000 },
]

const pesos = n => (n == null ? '—' : '$' + Number(n).toLocaleString('es-AR'))

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const marca = dryRun ? '·' : '✓'

  const existentes = await prisma.categoria.findMany()
  const porNombre = new Map(existentes.map(c => [c.nombre, c]))
  let orden = existentes.reduce((m, c) => Math.max(m, c.orden), 0)

  let categoriasNuevas = 0
  let preciosCambiados = 0
  let productosActualizados = 0

  for (const item of LISTA) {
    const categoria = porNombre.get(item.categoria)
    const antes = categoria?.precio == null ? null : Number(categoria.precio)
    const productos = await prisma.producto.count({
      where: { tipo: item.categoria, precio: { not: item.precio } },
    })
    if (antes === item.precio && productos === 0) continue

    if (!categoria) categoriasNuevas++
    if (antes !== item.precio) preciosCambiados++
    productosActualizados += productos
    console.log(
      `${marca} ${item.categoria.padEnd(38)} ${pesos(antes).padStart(9)} → ${pesos(item.precio).padStart(9)}` +
      `${categoria ? '' : '  (categoría nueva)'}${productos ? `  · ${productos} producto(s)` : ''}`
    )

    if (dryRun) continue
    await prisma.$transaction([
      categoria
        ? prisma.categoria.update({ where: { id: categoria.id }, data: { precio: item.precio } })
        : prisma.categoria.create({ data: { nombre: item.categoria, orden: ++orden, activo: true, precio: item.precio } }),
      prisma.producto.updateMany({ where: { tipo: item.categoria }, data: { precio: item.precio } }),
    ])
  }

  // ── Resumen ──────────────────────────────────────────────────────────────
  console.log(
    `\n${preciosCambiados} precio(s) de categoría, ${categoriasNuevas} categoría(s) nueva(s) y ` +
    `${productosActualizados} producto(s) ${dryRun ? 'a actualizar' : 'actualizados'}.`
  )

  // Categorías que existen en la base pero no están en la lista: quedan con el
  // precio que tenían y conviene decirlo, no que se descubra en una venta.
  const enLista = new Set(LISTA.map(i => i.categoria))
  const fuera = existentes.filter(c => !enLista.has(c.nombre))
  if (fuera.length) {
    console.log('\n⚠️  Categorías que NO están en la lista (cargales el precio en /admin/categorias):')
    for (const c of fuera) {
      const n = await prisma.producto.count({ where: { tipo: c.nombre } })
      console.log(`   · ${c.nombre.padEnd(38)} ${pesos(c.precio).padStart(9)}  ${n} producto(s)`)
    }
  }
}

main()
  .catch(err => { console.error('Error:', err.message); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
