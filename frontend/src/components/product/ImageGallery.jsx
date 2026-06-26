import { useEffect, useState } from 'react'

export default function ImageGallery({ imagenes = [], colorFiltro = null }) {
  const [activa, setActiva] = useState(0)

  const imagenesDelColor = colorFiltro ? imagenes.filter(img => img.color === colorFiltro) : []
  const imagenesGenericas = imagenes.filter(img => !img.color)
  const visibles = colorFiltro
    ? (imagenesDelColor.length > 0 ? imagenesDelColor : imagenesGenericas)
    : imagenes

  useEffect(() => { setActiva(0) }, [colorFiltro])

  if (!visibles.length) {
    return (
      <div className="aspect-square bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 text-sm">
        Sin imagen
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square overflow-hidden rounded-xl bg-zinc-800">
        <img
          src={visibles[activa]?.url ?? visibles[0].url}
          alt={visibles[activa]?.alt ?? 'Producto'}
          className="w-full h-full object-cover"
        />
      </div>
      {visibles.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {visibles.map((img, i) => (
            <button key={img.id} onClick={() => setActiva(i)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === activa ? 'border-blue-500' : 'border-transparent hover:border-zinc-600'
              }`}
            >
              <img src={img.url} alt={img.alt ?? ''} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
