import { useState } from 'react'

export default function ImageGallery({ imagenes = [] }) {
  const [activa, setActiva] = useState(0)

  if (!imagenes.length) {
    return (
      <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
        Sin imagen
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Imagen principal */}
      <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
        <img
          src={imagenes[activa].url}
          alt={imagenes[activa].alt ?? 'Producto'}
          className="w-full h-full object-cover"
        />
      </div>
      {/* Miniaturas */}
      {imagenes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imagenes.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiva(i)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === activa ? 'border-blue-600' : 'border-transparent hover:border-gray-300'
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
