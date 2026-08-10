// Sube una tabla de talles a Supabase Storage y guarda su URL en ConfigTienda.
//
// Uso:
//   cd backend
//   node -r dotenv/config scripts/subir-tabla-talles.js "C:/ruta/talles.jpg" [familia]
//
//   familia: general (por defecto) | short | pantalon
//
// Hay una imagen por familia de prendas, compartida por todos los productos de
// esa familia: se sube una vez y la URL queda en ConfigTienda. Para
// actualizarla, volvé a correr el script con la imagen nueva — pisa la anterior
// y no hay que tocar producto por producto.
//
// Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en backend/.env.

const fs = require('fs')
const sharp = require('sharp')
const prisma = require('../src/lib/prisma')
const supabaseAdmin = require('../src/lib/supabaseAdmin')
const { FAMILIAS } = require('../src/lib/tablaTalles')

const BUCKET = 'productos'
const CACHE_CONTROL_1_ANIO = '31536000'
// Más ancho que una foto de producto: es una tabla y tiene que leerse el texto.
const ANCHO_MAX = 1600
// Calidad alta a propósito: son números chicos que el cliente amplía para
// medir. Un artefacto de compresión acá se traduce en un talle equivocado.
const CALIDAD_WEBP = 92

async function main() {
  const origen = process.argv[2]
  const nombreFamilia = (process.argv[3] && !process.argv[3].startsWith('--')) ? process.argv[3] : 'general'
  if (!origen) {
    console.error('Falta la ruta de la imagen.\n  node -r dotenv/config scripts/subir-tabla-talles.js "C:/ruta/talles.jpg" [general|short|pantalon]')
    process.exit(1)
  }
  if (!fs.existsSync(origen)) {
    console.error(`No existe el archivo: ${origen}`)
    process.exit(1)
  }

  // La calidad por defecto sirve para tablas planas. Una foto con textura
  // —jersey, frisa— puede pesar más en WebP que el JPEG original; bajarla unos
  // puntos no toca los números de la tabla, que son texto sobre fondo liso.
  const iCalidad = process.argv.indexOf('--calidad')
  const calidad = iCalidad === -1 ? CALIDAD_WEBP : Number(process.argv[iCalidad + 1])
  if (!Number.isInteger(calidad) || calidad < 1 || calidad > 100) {
    console.error('--calidad tiene que ser un entero entre 1 y 100')
    process.exit(1)
  }

  const familia = FAMILIAS.find(f => f.nombre === nombreFamilia)
  if (!familia) {
    console.error(`Familia desconocida: "${nombreFamilia}". Opciones: ${FAMILIAS.map(f => f.nombre).join(', ')}`)
    process.exit(1)
  }

  // Path fijo por familia: al re-subir con upsert la URL no cambia y los
  // productos siguen apuntando al mismo lugar.
  const PATH = `config/tabla-talles-${familia.nombre}.webp`
  const CLAVE = familia.clave

  const original = fs.readFileSync(origen)
  const webp = await sharp(original)
    .resize({ width: ANCHO_MAX, withoutEnlargement: true })
    .webp({ quality: calidad })
    .toBuffer()

  console.log(`Original: ${(original.length / 1024).toFixed(0)} kB → WebP: ${(webp.length / 1024).toFixed(0)} kB`)

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(PATH, webp, {
    cacheControl: CACHE_CONTROL_1_ANIO,
    upsert: true,
    contentType: 'image/webp',
  })
  if (error) throw new Error(`Error subiendo a Supabase: ${error.message}`)

  const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(PATH)

  await prisma.configTienda.upsert({
    where: { clave: CLAVE },
    create: { clave: CLAVE, valor: publicUrl },
    update: { valor: publicUrl },
  })

  console.log(`✓ Tabla de talles publicada:\n  ${publicUrl}`)
  await prisma.$disconnect()
}

main().catch(async err => {
  console.error('Error:', err.message)
  await prisma.$disconnect()
  process.exit(1)
})
