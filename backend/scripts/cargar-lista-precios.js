// Carga la lista de precios de la tienda: bandas por categoría y los productos
// que falten.
//
//   node scripts/cargar-lista-precios.js --dry-run   (simula, no escribe)
//   node scripts/cargar-lista-precios.js             (aplica)
//
// Después hay que propagar a los productos ya cargados:
//   node scripts/recalcular-precios-productos.js
//
// Los precios son los FINALES que ve el cliente: no se les suma el recargo de
// Mercado Pago. Si alguna vez se vuelve a aplicar, se hace con
// ajustar-precios-mp.js y no tocando esta lista.
//
// La fuente de verdad del precio es la banda (categoría + rango de talles), no
// el producto: el producto y la variante guardan una copia que es la que se
// muestra. Por eso acá se cargan las bandas y no precios sueltos — escribirlos
// producto por producto los perdería en la próxima recalculación.
//
// Es idempotente: correrlo dos veces deja lo mismo.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const prisma = require('../src/lib/prisma')

// Los cuatro rangos, en el orden en que se muestran.
const BANDAS = [
  { clave: '4-10', talles: ['4', '6', '8', '10'] },
  { clave: '12-16', talles: ['12', '14', '16'] },
  { clave: 'S-XL', talles: ['S', 'M', 'L', 'XL'] },
  { clave: 'ESP', talles: ['ESP'] },
]

const TALLES = BANDAS.flatMap(b => b.talles)

// `categoria` es el nombre exacto en la tabla Categoria, que es también lo que
// guarda Producto.tipo. Para renombrar una categoría no alcanza con cambiarla
// acá: hay que arrastrar el tipo de cada producto, y de eso se ocupa
// scripts/renombrar-categoria.js.
const LISTA = [
  // ── Colegiales: llevan escudo, se producen a pedido ──────────────────────
  { nombre: 'Remera Bordada', categoria: 'REMERA BORDADA', colegial: true, precios: [25250, 26680, 27720, 29540] },
  { nombre: 'Remera estampada', categoria: 'REMERA ESTAMPADA', colegial: true, precios: [19400, 20800, 22100, 24800] },
  { nombre: 'Short sin frisa bordado', categoria: 'SHORT SIN FRISA BORDADO', colegial: true, precios: [30800, 32800, 33400, 35400] },
  { nombre: 'Short sin frisa estampado', categoria: 'SHORT SIN FRISA ESTAMPADO', colegial: true, precios: [28000, 30000, 31000, 33000] },
  { nombre: 'Chomba bordada', categoria: 'CHOMBA BORDADA', colegial: true, precios: [39500, 40800, 42100, 45500] },
  { nombre: 'Chomba estampada', categoria: 'CHOMBA ESTAMPADA', colegial: true, precios: [36500, 37800, 39100, 42500] },
  { nombre: 'Buzo cuello redondo con frisa bordado', categoria: 'BUZO CUELLO RED CON FRISA BORDADO', colegial: true, precios: [42800, 46000, 49200, 54800] },
  { nombre: 'Buzo cuello redondo con frisa estampado', categoria: 'BUZO CUELLO RED CON FRISA ESTAMPADO', colegial: true, precios: [39800, 43000, 46200, 51800] },
  { nombre: 'Pantalón largo con frisa bordado', categoria: 'PANTALON LARGO CON FRISA BORDADO', colegial: true, precios: [45500, 46800, 50800, 56100] },
  { nombre: 'Pantalón largo con frisa estampado', categoria: 'PANTALON LARGO CON FRISA ESTAMPADO', colegial: true, precios: [42500, 43800, 46800, 51100] },
  { nombre: 'Campera canguro con frisa bordada', categoria: 'CAMPERA CANGURO CON FRISA BORDADO', colegial: true, precios: [52100, 56100, 58800, 64200] },
  { nombre: 'Campera canguro con frisa estampada', categoria: 'CAMPERA CANGURO CON FRISA ESTAMPADO', colegial: true, precios: [50100, 53100, 55800, 60200] },
  { nombre: 'Buzo de acetato', categoria: 'BUZO ACETATO', colegial: true, precios: [56100, 58800, 61500, 66800] },

  // ── Lisos: sin escudo, stock permanente ──────────────────────────────────
  { nombre: 'Chomba lisa', categoria: 'CHOMBA LISA', colegial: false, precios: [31685, 33110, 34454, 37405] },
  { nombre: 'Remera lisa', categoria: 'REMERA LISA', colegial: false, precios: [15400, 16700, 18100, 21400] },
  { nombre: 'Remera lisa manga larga', categoria: 'REMERA MANGAS LARGAS LISA', colegial: false, precios: [18800, 20100, 21400, 24100] },
  { nombre: 'Short liso colegial', categoria: 'SHORT SIN FRISA LISO', colegial: false, precios: [22800, 24800, 26100, 29300] },
  { nombre: 'Chaleco liso polar azul marino', categoria: 'CHALECO LISO POLAR', colegial: false, precios: [25400, 28100, 30800, 33400] },
  { nombre: 'Campera polar lisa azul marino', categoria: 'CAMPERA LISA POLAR', colegial: false, precios: [33400, 35400, 38100, 40800] },
  { nombre: 'Pantalón jogging liso con frisa', categoria: 'PANTALON LARGO CON FRISA LISO', colegial: false, precios: [36000, 38400, 42100, 46100] },
  { nombre: 'Campera lisa canguro con frisa', categoria: 'CAMPERA CANGURO CON FRISA LISO', colegial: false, precios: [49190, 52050, 54910, 59200] },
  { nombre: 'Buzo canguro liso con frisa', categoria: 'BUZO CANGURO CON FRISA LISO', colegial: false, precios: [36580, 42040, 44900, 49190] },
  { nombre: 'Pantalón cargo azul-gris gabardina', categoria: 'PANTALON CARGO GABARDINA', colegial: false, precios: [56000, 61000, 66000, 71000] },
]

const pesos = n => '$' + Number(n).toLocaleString('es-AR')

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const marca = dryRun ? '·' : '✓'

  const existentes = await prisma.categoria.findMany({ include: { preciosBanda: true } })
  const porNombre = new Map(existentes.map(c => [c.nombre, c]))
  const maxOrden = existentes.reduce((m, c) => Math.max(m, c.orden), 0)
  let orden = maxOrden

  let categoriasNuevas = 0
  let bandasEscritas = 0
  const productosCreados = []

  for (const item of LISTA) {
    // ── Categoría ──────────────────────────────────────────────────────────
    let categoria = porNombre.get(item.categoria)
    if (!categoria) {
      orden++
      if (!dryRun) {
        categoria = await prisma.categoria.create({
          data: { nombre: item.categoria, orden, activo: true },
        })
      }
      categoriasNuevas++
      console.log(`${marca} categoría nueva: ${item.categoria}`)
    }

    // ── Bandas de precio ───────────────────────────────────────────────────
    // Se reemplazan enteras en vez de actualizar una por una: así el resultado
    // no depende de cómo estaban cargadas antes (había rangos con los talles
    // en otro orden, y alguno de más).
    const anterior = (categoria?.preciosBanda ?? [])
    const cambios = BANDAS.map((banda, i) => {
      const previo = anterior.find(b => b.talles.includes(banda.talles[0]))
      const antes = previo ? Number(previo.precio) : null
      return { banda, precio: item.precios[i], antes }
    })

    const hayCambio = cambios.some(c => c.antes !== c.precio)
    if (hayCambio && !dryRun && categoria) {
      await prisma.$transaction([
        prisma.precioBanda.deleteMany({ where: { categoriaId: categoria.id } }),
        prisma.precioBanda.createMany({
          data: BANDAS.map((banda, i) => ({
            categoriaId: categoria.id,
            talles: banda.talles,
            precio: item.precios[i],
          })),
        }),
      ])
    }
    if (hayCambio) {
      bandasEscritas += BANDAS.length
      const detalle = cambios
        .map(c => `${c.banda.clave} ${c.antes === null ? '—' : pesos(c.antes)}→${pesos(c.precio)}`)
        .join('  ')
      console.log(`${marca} ${item.categoria.padEnd(38)} ${detalle}`)
    }

    // ── Producto ───────────────────────────────────────────────────────────
    // Se busca por categoría y no por nombre: los nombres cargados difieren en
    // mayúsculas y redacción ("Remera Lisa" vs "Remera lisa"), y matchear por
    // texto exacto crearía duplicados casi idénticos.
    const yaHay = categoria
      ? await prisma.producto.count({ where: { tipo: item.categoria, colegioId: null } })
      : 0

    if (yaHay === 0) {
      productosCreados.push(item)
      if (!dryRun && categoria) {
        await prisma.producto.create({
          data: {
            nombre: item.nombre,
            tipo: item.categoria,
            colegioId: null,
            precio: item.precios[0],
            // Nace apagado: sin foto cargada, publicarlo dejaría un hueco en la
            // grilla de la tienda. Se activa desde el panel con un clic.
            activo: false,
            variantes: {
              create: BANDAS.flatMap((banda, i) =>
                banda.talles.map(talle => ({ talle, stock: 5, precio: item.precios[i] }))
              ),
            },
          },
        })
      }
    }
  }

  // ── Resumen ──────────────────────────────────────────────────────────────
  console.log(
    `\n${categoriasNuevas} categoría(s) nueva(s), ${bandasEscritas} banda(s) ` +
    `${dryRun ? 'a escribir' : 'escritas'}, ${productosCreados.length} producto(s) ` +
    `${dryRun ? 'a crear' : 'creados'}.`
  )
  if (productosCreados.length) {
    console.log('\nProductos nuevos (quedan INACTIVOS hasta que les cargues la foto):')
    productosCreados.forEach(p => console.log(`   · ${p.nombre.padEnd(40)} ${TALLES.length} talles, stock 5`))
  }

  // Categorías que existen en la base pero no están en la lista: quedan con el
  // precio viejo y conviene decirlo, no que se descubra en una venta.
  const enLista = new Set(LISTA.map(i => i.categoria))
  const fuera = existentes.filter(c => !enLista.has(c.nombre))
  if (fuera.length) {
    console.log('\n⚠️  Categorías que NO están en la lista y mantienen su precio anterior:')
    for (const c of fuera) {
      const n = await prisma.producto.count({ where: { tipo: c.nombre } })
      console.log(`   · ${c.nombre.padEnd(38)} ${n} producto(s)`)
    }
  }

  if (!dryRun) {
    console.log('\nAhora corré:  node scripts/recalcular-precios-productos.js')
  }
}

main()
  .catch(err => { console.error('Error:', err.message); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
