// Comprime y redimensiona una imagen en el navegador antes de subirla,
// para no llenar el bucket de Storage con fotos de celular sin optimizar.
export async function comprimirImagen(file, { maxAncho = 1600, maxAlto = 1600, calidad = 0.82 } = {}) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file

  try {
    const bitmap = await createImageBitmap(file)
    const escala = Math.min(1, maxAncho / bitmap.width, maxAlto / bitmap.height)
    const ancho = Math.round(bitmap.width * escala)
    const alto = Math.round(bitmap.height * escala)

    const canvas = document.createElement('canvas')
    canvas.width = ancho
    canvas.height = alto
    canvas.getContext('2d').drawImage(bitmap, 0, 0, ancho, alto)
    bitmap.close?.()

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', calidad))
    if (!blob) return file

    const nombreBase = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${nombreBase}.webp`, { type: 'image/webp' })
  } catch {
    // Formato que el canvas no puede decodificar (ej. HEIC en algunos navegadores): subir sin comprimir.
    return file
  }
}
