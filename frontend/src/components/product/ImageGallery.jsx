import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSwipe } from '../../lib/useSwipe'

export default function ImageGallery({ imagenes = [], colorFiltro = null }) {
  const [activa, setActiva] = useState(0)

  const imagenesDelColor = colorFiltro ? imagenes.filter(img => img.color === colorFiltro) : []
  const imagenesGenericas = imagenes.filter(img => !img.color)
  const visibles = colorFiltro
    ? (imagenesDelColor.length > 0 ? imagenesDelColor : imagenesGenericas)
    : imagenes

  useEffect(() => { setActiva(0) }, [colorFiltro])

  function siguiente() { setActiva(i => (i + 1) % visibles.length) }
  function anterior() { setActiva(i => (i - 1 + visibles.length) % visibles.length) }
  const swipe = useSwipe(siguiente, anterior)

  if (!visibles.length) {
    return (
      <div className="aspect-square bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 text-sm">
        Sin imagen
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-square overflow-hidden rounded-xl bg-zinc-800"
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        <img
          src={visibles[activa]?.url ?? visibles[0].url}
          alt={visibles[activa]?.alt ?? 'Producto'}
          className="w-full h-full object-cover"
        />
        {visibles.length > 1 && (
          <>
            <button
              onClick={anterior}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={siguiente}
              aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
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
