import { ShoppingCart } from 'lucide-react'
import { formatPrecio } from '../../lib/utils'

// Barra fija inferior (solo mobile) con precio + agregar al carrito,
// siempre visible al scrollear la ficha de producto.
export default function StickyAddToCart({ precioFinal, cuotas, varianteSeleccionada, agregado, sinColores, onAgregar }) {
  const stockVariante = varianteSeleccionada?.stock ?? 0
  const deshabilitado = sinColores || !varianteSeleccionada || stockVariante === 0

  const etiqueta = sinColores
    ? 'No disponible'
    : !varianteSeleccionada
      ? 'Elegí un talle'
      : stockVariante === 0
        ? 'Sin stock'
        : agregado
          ? '¡Agregado!'
          : 'Agregar al carrito'

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-zinc-900/95 backdrop-blur border-t border-zinc-800 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-3">
        <div className="min-w-0 shrink-0 max-w-[45%]">
          <p className="text-lg font-bold text-zinc-100 leading-tight">{formatPrecio(precioFinal)}</p>
          {cuotas ? (
            <p className="text-[11px] text-green-400 leading-tight truncate">{cuotas.texto}</p>
          ) : varianteSeleccionada ? (
            <p className="text-[11px] text-zinc-500 leading-tight truncate">
              Talle {varianteSeleccionada.talle}{varianteSeleccionada.color ? ` · ${varianteSeleccionada.color}` : ''}
            </p>
          ) : null}
        </div>
        <button
          onClick={onAgregar}
          disabled={deshabilitado}
          className={`flex-1 flex items-center justify-center gap-2 min-h-[48px] px-3 rounded-xl font-semibold text-base transition-colors ${
            deshabilitado
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : agregado
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white active:bg-blue-500'
          }`}
        >
          <ShoppingCart className="w-5 h-5 shrink-0" />
          <span className="truncate">{etiqueta}</span>
        </button>
      </div>
    </div>
  )
}
