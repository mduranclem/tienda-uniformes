import { Link } from 'react-router-dom'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { formatPrecio } from '../../lib/utils'

export default function CartDrawer({ abierto, onCerrar }) {
  const { items, totalPrecio, totalItems, dispatch } = useCart()

  return (
    <>
      {/* Overlay */}
      {abierto && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onCerrar}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          abierto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="font-bold text-lg text-gray-900">
            Mi carrito {totalItems > 0 && <span className="text-blue-600">({totalItems})</span>}
          </h2>
          <button onClick={onCerrar} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-gray-500">
              <ShoppingBag className="w-12 h-12 text-gray-300" />
              <p className="font-medium">Tu carrito está vacío</p>
              <button
                onClick={onCerrar}
                className="text-sm text-blue-600 hover:underline"
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.varianteId} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                <img
                  src={item.imagen}
                  alt={item.nombre}
                  className="w-16 h-16 object-cover rounded-lg bg-gray-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                    {item.nombre}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Talle: {item.talle}{item.color ? ` · ${item.color}` : ''}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    {/* Cantidad */}
                    <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                      <button
                        onClick={() =>
                          item.cantidad > 1
                            ? dispatch({ type: 'ACTUALIZAR_CANTIDAD', varianteId: item.varianteId, cantidad: item.cantidad - 1 })
                            : dispatch({ type: 'QUITAR', varianteId: item.varianteId })
                        }
                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-l-lg"
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-xs font-medium">{item.cantidad}</span>
                      <button
                        onClick={() => dispatch({ type: 'ACTUALIZAR_CANTIDAD', varianteId: item.varianteId, cantidad: item.cantidad + 1 })}
                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-r-lg"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrecio(item.precioUnit * item.cantidad)}
                      </span>
                      <button
                        onClick={() => dispatch({ type: 'QUITAR', varianteId: item.varianteId })}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con total y CTA */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-bold text-gray-900">{formatPrecio(totalPrecio)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={onCerrar}
              className="block w-full text-center bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Finalizar compra
            </Link>
            <button
              onClick={onCerrar}
              className="text-sm text-gray-500 hover:text-gray-700 text-center"
            >
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  )
}
