import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { ordenesApi, pagosApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatPrecio } from '../lib/utils'
import Spinner from '../components/ui/Spinner'
import { CheckCircle2, Package, CreditCard, Clock, XCircle, AlertCircle } from 'lucide-react'

const SANDBOX = import.meta.env.VITE_MP_SANDBOX === 'true'

export default function ConfirmacionPage() {
  const { id } = useParams()
  const { sesion } = useAuth()
  const [searchParams] = useSearchParams()
  const estadoPago = searchParams.get('pago') // aprobado | rechazado | pendiente | null

  const [orden, setOrden] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [pagando, setPagando] = useState(false)
  const [errorPago, setErrorPago] = useState('')

  useEffect(() => {
    ordenesApi.obtener(id, sesion?.access_token ?? null)
      .then(setOrden)
      .finally(() => setCargando(false))
  }, [id])

  async function handlePagar() {
    setPagando(true)
    setErrorPago('')
    try {
      const data = await pagosApi.crearPreferencia(sesion?.access_token ?? null, id)
      const url = SANDBOX ? data.sandbox_init_point : data.init_point
      window.location.href = url
    } catch (err) {
      setErrorPago(err.message || 'Error al iniciar el pago. Intentá de nuevo.')
      setPagando(false)
    }
  }

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

  const yaPagada = orden.estado === 'PAGADA' || estadoPago === 'aprobado'
  const rechazado = estadoPago === 'rechazado'
  const pendiente = estadoPago === 'pendiente'
  const esperandoPago = !yaPagada && !rechazado && !pendiente && orden.estado === 'PENDIENTE'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Banner de estado de pago */}
      {yaPagada && (
        <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 mb-6">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-300">¡Pago recibido!</p>
            <p className="text-xs text-green-400/80 mt-0.5">Tu pedido está confirmado. En breve nos ponemos en contacto.</p>
          </div>
        </div>
      )}
      {rechazado && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6">
          <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">Pago rechazado</p>
            <p className="text-xs text-red-400/80 mt-0.5">El pago no se pudo procesar. Podés intentarlo de nuevo.</p>
          </div>
        </div>
      )}
      {pendiente && (
        <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 mb-6">
          <Clock className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-300">Pago en revisión</p>
            <p className="text-xs text-yellow-400/80 mt-0.5">Mercado Pago está procesando tu pago. Te avisamos cuando se confirme.</p>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          {yaPagada
            ? <CheckCircle2 className="w-16 h-16 text-green-400" />
            : <Package className="w-16 h-16 text-zinc-500" />
          }
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">
          {yaPagada ? '¡Pedido confirmado!' : 'Tu pedido está listo para pagar'}
        </h1>
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

      {/* Detalle de productos */}
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
          {Number(orden.descuento) > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Descuento</span><span>-{formatPrecio(orden.descuento)}</span>
            </div>
          )}
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

      {/* Botón de pago o acciones */}
      <div className="flex flex-col items-center gap-3">

        {esperandoPago && (
          <>
            {errorPago && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 w-full">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorPago}
              </div>
            )}
            <button
              onClick={handlePagar}
              disabled={pagando}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-base transition-colors"
            >
              {pagando ? <Spinner className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
              {pagando ? 'Redirigiendo a Mercado Pago...' : 'Pagar con Mercado Pago'}
            </button>
          </>
        )}

        {(rechazado || pendiente) && (
          <button
            onClick={handlePagar}
            disabled={pagando}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-base transition-colors"
          >
            {pagando ? <Spinner className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            {pagando ? 'Redirigiendo...' : 'Reintentar pago'}
          </button>
        )}

        <Link
          to="/"
          className="text-zinc-400 text-sm font-medium hover:text-zinc-200 transition-colors"
        >
          {yaPagada ? 'Seguir comprando' : 'Volver al inicio'}
        </Link>
      </div>

    </div>
  )
}
