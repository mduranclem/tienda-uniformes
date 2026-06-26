import { Link } from 'react-router-dom'
import { formatPrecio, titleCase } from '../../lib/utils'

export default function ProductCard({ producto }) {
  const imagenPrincipal = producto.imagenes?.[0]?.url ?? '/placeholder.png'
  const stockTotal = producto.variantes?.reduce((acc, v) => acc + v.stock, 0) ?? 0
  const tieneOferta = producto.precioOferta && Number(producto.precioOferta) < Number(producto.precio)
  const descuentoPct = tieneOferta
    ? Math.round((1 - Number(producto.precioOferta) / Number(producto.precio)) * 100)
    : 0

  return (
    <Link
      to={`/producto/${producto.id}`}
      className="group bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-600 transition-colors flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-800">
        <img
          src={imagenPrincipal}
          alt={producto.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {tieneOferta && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{descuentoPct}%
          </span>
        )}
        {stockTotal === 0 && (
          <div className="absolute inset-0 bg-zinc-950/60 flex items-center justify-center">
            <span className="text-xs font-semibold text-zinc-400 bg-zinc-900/80 px-3 py-1 rounded-full">Sin stock</span>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1 flex-1">
        {producto.colegio && (
          <span className="text-xs text-blue-400 font-medium">{producto.colegio.nombre}</span>
        )}
        <h3 className="text-sm font-medium text-zinc-100 line-clamp-2 leading-snug">
          {titleCase(producto.nombre)}
        </h3>
        <div className="mt-auto pt-2">
          {tieneOferta ? (
            <>
              <p className="text-base font-bold text-red-400">{formatPrecio(producto.precioOferta)}</p>
              <p className="text-xs text-zinc-600 line-through">{formatPrecio(producto.precio)}</p>
            </>
          ) : (
            <p className="text-base font-bold text-zinc-100">{formatPrecio(producto.precio)}</p>
          )}
          {producto.cuotas && (
            <p className="text-xs text-zinc-500">
              {producto.cuotas} cuotas de {formatPrecio(
                (tieneOferta ? Number(producto.precioOferta) : Number(producto.precio)) / producto.cuotas
              )}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
