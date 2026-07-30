// Sube la tabla de talles a Supabase Storage y guarda su URL en ConfigTienda.
//
// Uso:
//   cd backend
//   node -r dotenv/config scripts/subir-tabla-talles.js "C:/ruta/a/talles.jpg"
//
// Es una sola imagen compartida por todos los productos: se sube una vez y la
// URL queda en ConfigTienda. Para actualizarla, volvé a correr el script con la
// imagen nueva — pisa la anterior y no hay que tocar producto por producto.
//
// Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en backend/.env.

const fs = require('fs')
const sharp = require('sharp')
const prisma = require('../src/lib/prisma')
const supabaseAdmin = require('../src/lib/supabaseAdmin')

const BUCKET = 'productos'
// Path fijo: al re-subir con upsert, la URL no cambia y los productos siguen
// apuntando al mismo lugar.
const PATH = 'config/tabla-talles.webp'
const CLAVE = 'tablaTallesUrl'
const CACHE_CONTROL_1_ANIO = '31536000'
// Más ancho que una foto de producto: es una tabla y tiene que leerse el texto.
const ANCHO_MAX = 1600
// Calidad alta a propósito: son números chicos que el cliente amplía para
// medir. Un artefacto de compresión acá se traduce en un talle equivocado.
const CALIDAD_WEBP = 92

async function main() {
  const origen = process.argv[2]
  if (!origen) {
    console.error('Falta la ruta de la imagen.\n  node -r dotenv/config scripts/subir-tabla-talles.js "C:/ruta/talles.jpg"')
    process.exit(1)
  }
  if (!fs.existsSync(origen)) {
    console.error(`No existe el archivo: ${origen}`)
    process.exit(1)
  }

  const original = fs.readFileSync(origen)
  const webp = await sharp(original)
    .resize({ width: ANCHO_MAX, withoutEnlargement: true })
    .webp({ quality: CALIDAD_WEBP })
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
