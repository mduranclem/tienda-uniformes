// Script one-off: re-sube TODOS los archivos del bucket "productos" con
// cacheControl de 1 año y comprimidos a WebP (el cacheControl se fija al
// momento de subir y no es retroactivo, por eso hay que re-subir lo viejo).
//
// Uso:
//   cd backend
//   node -r dotenv/config scripts/fix-cache-productos.js
//
// Variables de entorno requeridas (en backend/.env):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (Settings → API → service_role secret, NUNCA la anon key)
//   DATABASE_URL / DIRECT_URL   (para actualizar las URLs en Prisma si cambia el nombre de archivo)

const sharp = require('sharp')
const prisma = require('../src/lib/prisma')
const supabaseAdmin = require('../src/lib/supabaseAdmin')

const BUCKET = 'productos'
const CACHE_CONTROL_1_ANIO = '31536000'
const ANCHO_MAX = 1200
const CALIDAD_WEBP = 80

// Lista recursivamente todos los archivos del bucket (Storage.list() no
// recorre subcarpetas solo; hay que bajar manualmente por cada "folder").
async function listarArchivosRecursivo(prefijo = '') {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).list(prefijo, { limit: 1000 })
  if (error) throw new Error(`Error listando "${prefijo}": ${error.message}`)

  const archivos = []
  for (const entry of data ?? []) {
    const path = prefijo ? `${prefijo}/${entry.name}` : entry.name
    // Las carpetas vienen con id === null y sin metadata
    if (entry.id === null) {
      archivos.push(...await listarArchivosRecursivo(path))
    } else {
      archivos.push(path)
    }
  }
  return archivos
}

function urlPublica(path) {
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// Actualiza cualquier tabla que pueda tener guardada la URL vieja.
async function actualizarUrlEnBase(urlVieja, urlNueva) {
  const [productImage, colegio, bannerSlide] = await Promise.all([
    prisma.productImage.updateMany({ where: { url: urlVieja }, data: { url: urlNueva } }),
    prisma.colegio.updateMany({ where: { logo: urlVieja }, data: { logo: urlNueva } }),
    prisma.bannerSlide.updateMany({ where: { url: urlVieja }, data: { url: urlNueva } }),
  ])
  return productImage.count + colegio.count + bannerSlide.count
}

async function procesarArchivo(path) {
  const yaEsWebp = path.toLowerCase().endsWith('.webp')
  const pathNuevo = yaEsWebp ? path : path.replace(/\.[^./]+$/, '') + '.webp'

  const { data: blob, error: errDescarga } = await supabaseAdmin.storage.from(BUCKET).download(path)
  if (errDescarga) throw new Error(`descarga falló: ${errDescarga.message}`)

  const bufferOriginal = Buffer.from(await blob.arrayBuffer())
  const bufferWebp = await sharp(bufferOriginal)
    .resize({ width: ANCHO_MAX, withoutEnlargement: true })
    .webp({ quality: CALIDAD_WEBP })
    .toBuffer()

  const { error: errSubida } = await supabaseAdmin.storage.from(BUCKET).upload(pathNuevo, bufferWebp, {
    cacheControl: CACHE_CONTROL_1_ANIO,
    upsert: true,
    contentType: 'image/webp',
  })
  if (errSubida) throw new Error(`subida falló: ${errSubida.message}`)

  let filasActualizadas = 0
  if (pathNuevo !== path) {
    const urlVieja = urlPublica(path)
    const urlNueva = urlPublica(pathNuevo)
    filasActualizadas = await actualizarUrlEnBase(urlVieja, urlNueva)

    const { error: errBorrado } = await supabaseAdmin.storage.from(BUCKET).remove([path])
    if (errBorrado) throw new Error(`no se pudo borrar el archivo viejo "${path}": ${errBorrado.message}`)
  }

  return { renombrado: pathNuevo !== path, filasActualizadas }
}

async function main() {
  console.log(`Listando archivos del bucket "${BUCKET}"...`)
  const archivos = await listarArchivosRecursivo()
  console.log(`Encontrados ${archivos.length} archivos.\n`)

  let migrados = 0
  let fallidos = 0

  for (const path of archivos) {
    try {
      const { renombrado, filasActualizadas } = await procesarArchivo(path)
      migrados++
      console.log(
        `✓ ${path}` +
        (renombrado ? ` → renombrado a .webp (${filasActualizadas} fila(s) actualizadas en la base)` : ' → cache actualizado')
      )
    } catch (err) {
      fallidos++
      console.error(`✗ ${path} — ${err.message}`)
    }
  }

  console.log(`\nResumen: ${migrados} migrados, ${fallidos} fallidos, ${archivos.length} totales.`)
  await prisma.$disconnect()
  process.exit(fallidos > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
