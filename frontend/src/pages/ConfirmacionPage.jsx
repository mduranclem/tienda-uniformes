import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ordenesApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatPrecio } from '../lib/utils'
import Spinner from '../components/ui/Spinner'
import { CheckCircle2, Package } from 'lucide-react'

export default function ConfirmacionPage() {
  const { id } = useParams()
  const { sesion } = useAuth()
  const [orden, setOrden] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    ordenesApi.obtener(id, sesion?.access_token ?? null)
      .then(setOrden)
      .finally(() => setCargando(false))
  }, [id])

  if (cargando) {
    return <div className="flex justify-center py-20"><Spinner className="w-10 h-10" /></div>
  }

  if (!orden) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-400">No se encontró la orden.</p>
        <Link to="/" className="mt-4 inline-block text-blue-400 hover:underline">Volver al inicio</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Encabezado */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-16 h-16 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">¡Pedido confirmado!</h1>
        <p className="text-zinc-400 text-sm">
          Orden <span className="font-semibold text-zinc-200">#{orden.numero}</span>
        </p>
        {orden.telefonoGuest && (
          <p className="text-zinc-500 text-xs mt-1">
            Te vamos a contactar por WhatsApp al{' '}
            <span className="text-zinc-300 font-medium">{orden.telefonoGuest}</span>
          </p>
        )}
      </div>

      {/* Detalle */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" /> Productos
        </h2>
        <div className="flex flex-col gap-3">
          {orden.items.map(item => (
            <div key={item.id} className="flex gap-3 items-center">
              <img
                src={item.producto.imagenes?.[0]?.url ?? '/placeholder.png'}
                alt={item.producto.nombre}
                className="w-12 h-12 rounded-lg object-cover bg-zinc-800 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{item.producto.nombre}</p>
                <p className="text-xs text-zinc-500">
                  T: {item.variante.talle}{item.variante.color ? ` · ${item.variante.color}` : ''} · x{item.cantidad}
                </p>
              </div>
              <span className="text-sm font-semibold text-zinc-200 shrink-0">
                {formatPrecio(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-800 mt-4 pt-3 flex flex-col gap-1 text-sm">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal</span><span>{formatPrecio(orden.subtotal)}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Envío</span>
            <span>{Number(orden.costoEnvio) === 0 ? 'Gratis' : formatPrecio(orden.costoEnvio)}</span>
          </div>
          <div className="flex justify-between font-bold text-zinc-100 text-base mt-1">
            <span>Total</span><span>{formatPrecio(orden.total)}</span>
          </div>
        </div>
      </div>

      {/* Entrega */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-1">Entrega</h2>
        <p className="text-sm text-zinc-400">{orden.entrega.nombre}</p>
        {orden.domicilio && (
          <p className="text-xs text-zinc-500 mt-1">
            {orden.domicilio.calle} {orden.domicilio.numero}
            {orden.domicilio.piso ? `, ${orden.domicilio.piso}` : ''} — {orden.domicilio.ciudad}
            {orden.domicilio.cp ? ` (${orden.domicilio.cp})` : ''}
          </p>
        )}
      </div>

      <div className="text-center">
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-blue-500 transition-colors"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}
