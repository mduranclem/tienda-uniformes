import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrecio } from '../lib/utils'
import { Trash2, ShoppingCart } from 'lucide-react'

export default function CarritoPage() {
  const { items, totalPrecio, dispatch } = useCart()
  const { sesion } = useAuth()

  if (!items.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
        <p className="text-lg font-semibold text-zinc-300 mb-2">Tu carrito está vacío</p>
        <p className="text-sm text-zinc-500 mb-6">Agregá productos desde el catálogo.</p>
        <Link to="/catalogo" className="inline-block bg-blue-600 text-white font-medium px-6 py-2.5 rounded-full hover:bg-blue-500 transition-colors">
          Ver catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Mi carrito</h1>

      <div className="flex flex-col gap-3 mb-6">
        {items.map(item => (
          <div key={item.varianteId} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4">
            <img
              src={item.imagen}
              alt={item.nombre}
              className="w-20 h-20 object-cover rounded-lg bg-zinc-800 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-zinc-100 text-sm leading-snug">{item.nombre}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Talle: {item.talle}{item.color ? ` · ${item.color}` : ''}
              </p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center border border-zinc-700 rounded-lg bg-zinc-950">
                  <button
                    onClick={() =>
                      item.cantidad > 1
                        ? dispatch({ type: 'ACTUALIZAR_CANTIDAD', varianteId: item.varianteId, cantidad: item.cantidad - 1 })
                        : dispatch({ type: 'QUITAR', varianteId: item.varianteId })
                    }
                    className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-100 rounded-l-lg"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm text-zinc-100">{item.cantidad}</span>
                  <button
                    onClick={() => dispatch({ type: 'ACTUALIZAR_CANTIDAD', varianteId: item.varianteId, cantidad: item.cantidad + 1 })}
                    className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-100 rounded-r-lg"
                  >
                    +
                  </button>
                </div>
                <p className="font-semibold text-zinc-100 text-sm">
                  {formatPrecio(item.precioUnit * item.cantidad)}
                </p>
                <button
                  onClick={() => dispatch({ type: 'QUITAR', varianteId: item.varianteId })}
                  className="text-zinc-600 hover:text-red-400 transition-colors"
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex justify-between text-base font-bold text-zinc-100 mb-4">
          <span>Total</span>
          <span>{formatPrecio(totalPrecio)}</span>
        </div>
        <Link
          to="/checkout"
          className="block w-full text-center bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-500 transition-colors"
        >
          Continuar con la compra
        </Link>
        {!sesion && (
          <Link
            to="/login?redirect=/checkout"
            className="block w-full text-center text-blue-400 text-sm font-medium mt-3 hover:text-blue-300 transition-colors"
          >
            ¿Ya tenés cuenta? Ingresá
          </Link>
        )}
        <Link
          to="/catalogo"
          className="block w-full text-center text-zinc-400 text-sm font-medium mt-3 hover:text-zinc-200 transition-colors"
        >
          ← Seguir comprando
        </Link>
      </div>
    </div>
  )
}
