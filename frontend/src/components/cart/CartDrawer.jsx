import { Link } from 'react-router-dom'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { formatPrecio } from '../../lib/utils'

export default function CartDrawer({ abierto, onCerrar }) {
  const { items, totalPrecio, totalItems, dispatch } = useCart()

  return (
    <>
      {abierto && (
        <div className="fixed inset-0 bg-black/60 z-40 transition-opacity" onClick={onCerrar} />
      )}

      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-zinc-900 z-50 shadow-2xl flex flex-col transition-transform duration-300 border-l border-zinc-800 ${
        abierto ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
          <h2 className="font-bold text-lg text-zinc-100">
            Mi carrito {totalItems > 0 && <span className="text-blue-400">({totalItems})</span>}
          </h2>
          <button onClick={onCerrar} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-zinc-500">
              <ShoppingBag className="w-12 h-12 text-zinc-700" />
              <p className="font-medium text-zinc-400">Tu carrito está vacío</p>
              <button onClick={onCerrar} className="text-sm text-blue-400 hover:underline">
                Seguir comprando
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.varianteId} className="flex gap-3 bg-zinc-800 rounded-xl p-3">
                <img src={item.imagen} alt={item.nombre}
                  className="w-16 h-16 object-cover rounded-lg bg-zinc-700 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 line-clamp-2 leading-snug">{item.nombre}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Talle: {item.talle}{item.color ? ` · ${item.color}` : ''}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-zinc-700 rounded-lg bg-zinc-900">
                      <button
                        onClick={() => item.cantidad > 1
                          ? dispatch({ type: 'ACTUALIZAR_CANTIDAD', varianteId: item.varianteId, cantidad: item.cantidad - 1 })
                          : dispatch({ type: 'QUITAR', varianteId: item.varianteId })}
                        className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-100 rounded-l-lg"
                      >−</button>
                      <span className="w-7 text-center text-xs font-medium text-zinc-100">{item.cantidad}</span>
                      <button
                        onClick={() => dispatch({ type: 'ACTUALIZAR_CANTIDAD', varianteId: item.varianteId, cantidad: item.cantidad + 1 })}
                        className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-100 rounded-r-lg"
                      >+</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-100">
                        {formatPrecio(item.precioUnit * item.cantidad)}
                      </span>
                      <button onClick={() => dispatch({ type: 'QUITAR', varianteId: item.varianteId })}
                        className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-zinc-800 px-4 py-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Total</span>
              <span className="text-lg font-bold text-zinc-100">{formatPrecio(totalPrecio)}</span>
            </div>
            <Link to="/checkout" onClick={onCerrar}
              className="block w-full text-center bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-500 transition-colors">
              Finalizar compra
            </Link>
            <button onClick={onCerrar} className="text-sm text-zinc-500 hover:text-zinc-300 text-center transition-colors">
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  )
}
