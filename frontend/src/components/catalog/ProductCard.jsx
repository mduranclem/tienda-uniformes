import { Link } from 'react-router-dom'
import { formatPrecio, calcularCuotas } from '../../lib/utils'

export default function ProductCard({ producto }) {
  const imagenPrincipal = producto.imagenes?.[0]?.url ?? '/placeholder.png'
  const stockTotal = producto.variantes?.reduce((acc, v) => acc + v.stock, 0) ?? 0

  return (
    <Link
      to={`/producto/${producto.id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      {/* Imagen */}
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={imagenPrincipal}
          alt={producto.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        {producto.colegio && (
          <span className="text-xs text-blue-600 font-medium">{producto.colegio.nombre}</span>
        )}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
          {producto.nombre}
        </h3>
        <div className="mt-auto pt-2">
          <p className="text-base font-bold text-gray-900">{formatPrecio(producto.precio)}</p>
          <p className="text-xs text-gray-500">3 cuotas de {calcularCuotas(producto.precio)}</p>
        </div>
        {stockTotal === 0 && (
          <span className="text-xs text-red-500 font-medium">Sin stock</span>
        )}
      </div>
    </Link>
  )
}
