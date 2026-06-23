import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrecio } from '../lib/utils'
import { Trash2 } from 'lucide-react'

export default function CarritoPage() {
  const { items, totalPrecio, dispatch } = useCart()

  if (!items.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-xl font-semibold text-gray-700 mb-3">Tu carrito está vacío</p>
        <Link
          to="/catalogo"
          className="inline-block bg-blue-600 text-white font-medium px-6 py-2.5 rounded-full hover:bg-blue-700 transition-colors"
        >
          Ver catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi carrito</h1>
      <div className="flex flex-col gap-3 mb-8">
        {items.map(item => (
          <div
            key={item.varianteId}
            className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4"
          >
            <img
              src={item.imagen}
              alt={item.nombre}
              className="w-20 h-20 object-cover rounded-lg bg-gray-100 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm leading-snug">{item.nombre}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Talle: {item.talle}{item.color ? ` · ${item.color}` : ''}
              </p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() =>
                      item.cantidad > 1
                        ? dispatch({ type: 'ACTUALIZAR_CANTIDAD', varianteId: item.varianteId, cantidad: item.cantidad - 1 })
                        : dispatch({ type: 'QUITAR', varianteId: item.varianteId })
                    }
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-l-lg text-base"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">{item.cantidad}</span>
                  <button
                    onClick={() => dispatch({ type: 'ACTUALIZAR_CANTIDAD', varianteId: item.varianteId, cantidad: item.cantidad + 1 })}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-r-lg text-base"
                  >
                    +
                  </button>
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  {formatPrecio(item.precioUnit * item.cantidad)}
                </p>
                <button
                  onClick={() => dispatch({ type: 'QUITAR', varianteId: item.varianteId })}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex justify-between text-base font-bold text-gray-900 mb-4">
          <span>Total</span>
          <span>{formatPrecio(totalPrecio)}</span>
        </div>
        <Link
          to="/checkout"
          className="block w-full text-center bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
        >
          Continuar con la compra
        </Link>
        <Link
          to="/catalogo"
          className="block w-full text-center text-blue-600 text-sm font-medium mt-3 hover:underline"
        >
          ← Seguir comprando
        </Link>
      </div>
    </div>
  )
}
