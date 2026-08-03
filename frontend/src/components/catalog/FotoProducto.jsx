import { useState } from 'react'
import { ImageOff } from 'lucide-react'

// Foto de producto con su estado vacío.
//
// Antes, un producto sin imagen apuntaba a /placeholder.png —un archivo que no
// existe— y el navegador dibujaba el ícono de imagen rota con el nombre del
// producto al lado. Es de las cosas que más barata hacen ver una tienda.
//
// Cubre los dos casos: no hay URL, y hay URL pero falla al cargar (un archivo
// borrado del bucket, por ejemplo).
export default function FotoProducto({ url, alt, className = '', sinStock = false }) {
  const [falló, setFalló] = useState(false)
  const hayFoto = Boolean(url) && !falló

  if (!hayFoto) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1.5 bg-zinc-800/60 text-zinc-600 ${className}`}
        role="img"
        aria-label={`${alt} — sin foto disponible`}
      >
        <ImageOff className="w-7 h-7" strokeWidth={1.5} />
        <span className="text-[11px] font-medium">Sin foto</span>
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={alt}
      onError={() => setFalló(true)}
      loading="lazy"
      className={`${className} ${sinStock ? 'opacity-50 grayscale' : ''}`}
    />
  )
}
