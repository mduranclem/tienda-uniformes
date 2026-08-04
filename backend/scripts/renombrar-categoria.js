// Renombra una categoría y arrastra a los productos que la usan.
//
//   node scripts/renombrar-categoria.js "NOMBRE VIEJO" "NOMBRE NUEVO"
//   node scripts/renombrar-categoria.js "NOMBRE VIEJO" "NOMBRE NUEVO" --aplicar
//
// Producto.tipo guarda el nombre de la categoría como texto, no una clave
// foránea. Renombrar la categoría sin actualizar los productos los dejaría
// apuntando a una categoría que ya no existe: se quedarían sin precio por
// banda y desaparecerían del filtro del catálogo. Por eso las dos cosas van
// juntas y en una transacción.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const prisma = require('../src/lib/prisma')

async function main() {
  const args = process.argv.slice(2).filter(a => a !== '--aplicar')
  const aplicar = process.argv.includes('--aplicar')
  const [viejo, nuevo] = args

  if (!viejo || !nuevo) {
    console.error('Uso: node scripts/renombrar-categoria.js "VIEJO" "NUEVO" [--aplicar]')
    process.exit(1)
  }

  const categoria = await prisma.categoria.findUnique({ where: { nombre: viejo } })
  if (!categoria) {
    console.error(`No existe la categoría "${viejo}".`)
    process.exit(1)
  }

  const ocupado = await prisma.categoria.findUnique({ where: { nombre: nuevo } })
  if (ocupado) {
    console.error(`Ya existe una categoría llamada "${nuevo}". Fusionarlas es otra cosa: hacelo a mano.`)
    process.exit(1)
  }

  const productos = await prisma.producto.count({ where: { tipo: viejo } })

  console.log(`${viejo}  →  ${nuevo}`)
  console.log(`Productos que se actualizan: ${productos}`)

  if (!aplicar) {
    console.log('\nSimulación. Corré con --aplicar para escribir los cambios.')
    return
  }

  await prisma.$transaction([
    prisma.categoria.update({ where: { id: categoria.id }, data: { nombre: nuevo } }),
    prisma.producto.updateMany({ where: { tipo: viejo }, data: { tipo: nuevo } }),
  ])

  console.log('\nListo.')
}

main()
  .catch(err => { console.error('Error:', err.message); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
