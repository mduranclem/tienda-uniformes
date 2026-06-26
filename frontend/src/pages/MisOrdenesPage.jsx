import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ordenesApi } from '../services/api'
import Spinner from '../components/ui/Spinner'
import { formatPrecio } from '../lib/utils'
import { ChevronDown, ChevronUp, Package } from 'lucide-react'

const ESTADO_LABEL = {
  PENDIENTE:   { label: 'Pendiente de pago', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  PAGADA:      { label: 'Pagada',             color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  PREPARANDO:  { label: 'Preparando',         color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
  LISTA:       { label: 'Lista para retirar', color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  ENTREGADA:   { label: 'Entregada',          color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30' },
  CANCELADA:   { label: 'Cancelada',          color: 'text-red-400 bg-red-400/10 border-red-400/30' },
}

function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function MisOrdenesPage() {
  const { sesion, authCargando } = useAuth()
  const navigate = useNavigate()
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [expandida, setExpandida] = useState(null)

  useEffect(() => {
    if (!authCargando && !sesion) navigate('/login')
  }, [authCargando, sesion])

  useEffect(() => {
    if (!sesion?.access_token) return
    ordenesApi.misOrdenes(sesion.access_token)
      .then(data => setOrdenes(data))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [sesion?.access_token])

  if (authCargando || cargando) {
    return <div className="flex justify-center py-20"><Spinner className="w-10 h-10" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Mis compras</h1>

      {ordenes.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <Package className="w-12 h-12 text-zinc-600" />
          <p className="text-zinc-400">Todavía no tenés compras registradas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ordenes.map(orden => {
            const est = ESTADO_LABEL[orden.estado] ?? ESTADO_LABEL.PENDIENTE
            const abierta = expandida === orden.id
            return (
              <div key={orden.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {/* Cabecera */}
                <button
                  onClick={() => setExpandida(abierta ? null : orden.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">Pedido #{orden.numero}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{formatFecha(orden.createdAt)}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${est.color}`}>
                      {est.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-semibold text-zinc-100">{formatPrecio(orden.total)}</span>
                    {abierta
                      ? <ChevronUp className="w-4 h-4 text-zinc-500" />
                      : <ChevronDown className="w-4 h-4 text-zinc-500" />
                    }
                  </div>
                </button>

                {/* Detalle expandido */}
                {abierta && (
                  <div className="border-t border-zinc-800 px-5 py-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      {orden.items.map(item => (
                        <div key={item.id} className="flex items-center gap-3">
                          {item.producto.imagenes?.[0]?.url && (
                            <img
                              src={item.producto.imagenes[0].url}
                              alt={item.producto.nombre}
                              className="w-12 h-12 object-cover rounded-lg bg-zinc-800 flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-zinc-200 truncate">{item.producto.nombre}</p>
                            <p className="text-xs text-zinc-500">
                              Talle {item.variante.talle}
                              {item.variante.color ? ` · ${item.variante.color}` : ''}
                              {' · '}x{item.cantidad}
                            </p>
                          </div>
                          <p className="text-sm text-zinc-300 flex-shrink-0">{formatPrecio(item.subtotal)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-zinc-800 pt-3 flex flex-col gap-1 text-sm">
                      {Number(orden.descuento) > 0 && (
                        <div className="flex justify-between text-zinc-500">
                          <span>Descuento</span>
                          <span className="text-green-400">−{formatPrecio(orden.descuento)}</span>
                        </div>
                      )}
                      {Number(orden.costoEnvio) > 0 && (
                        <div className="flex justify-between text-zinc-500">
                          <span>Envío{orden.entrega ? ` (${orden.entrega.nombre})` : ''}</span>
                          <span>{formatPrecio(orden.costoEnvio)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-zinc-100 pt-1">
                        <span>Total</span>
                        <span>{formatPrecio(orden.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
