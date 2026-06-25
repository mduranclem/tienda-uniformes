import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatPrecio } from '../../lib/utils'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'

const ESTADOS = ['PENDIENTE', 'PAGADA', 'PREPARANDO', 'LISTA', 'ENTREGADA', 'CANCELADA']

const BADGE_ESTADO = {
  PENDIENTE: 'yellow',
  PAGADA: 'blue',
  PREPARANDO: 'blue',
  LISTA: 'green',
  ENTREGADA: 'green',
  CANCELADA: 'red',
}

const SIGUIENTE_ESTADO = {
  PENDIENTE: 'PAGADA',
  PAGADA: 'PREPARANDO',
  PREPARANDO: 'LISTA',
  LISTA: 'ENTREGADA',
}

function ModalOrden({ ordenId, token, onCerrar, onActualizado }) {
  const [orden, setOrden] = useState(null)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    adminApi.obtenerOrden(token, ordenId).then(setOrden)
  }, [ordenId])

  async function cambiarEstado() {
    if (!nuevoEstado) return
    setGuardando(true)
    await adminApi.cambiarEstadoOrden(token, ordenId, nuevoEstado, nota)
    setGuardando(false)
    onActualizado()
    onCerrar()
  }

  if (!orden) return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <Spinner className="w-10 h-10" />
    </div>
  )

  const cliente = orden.usuario?.nombre ?? orden.usuario?.email ?? orden.nombreGuest ?? orden.emailGuest ?? 'Invitado'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-bold text-gray-900">Orden #{orden.numero}</h2>
            <p className="text-xs text-gray-500">{cliente}</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Estado actual */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Estado actual:</span>
            <Badge variante={BADGE_ESTADO[orden.estado]}>{orden.estado}</Badge>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Productos</p>
            <div className="flex flex-col gap-1.5">
              {orden.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm text-gray-700">
                  <span>{item.producto.nombre} · Talle {item.variante.talle} × {item.cantidad}</span>
                  <span className="font-medium">{formatPrecio(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="border-t pt-3 flex flex-col gap-1 text-sm text-gray-600">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrecio(orden.subtotal)}</span></div>
            {Number(orden.descuento) > 0 && <div className="flex justify-between text-green-600"><span>Descuento</span><span>−{formatPrecio(orden.descuento)}</span></div>}
            <div className="flex justify-between"><span>Envío ({orden.entrega?.nombre})</span><span>{formatPrecio(orden.costoEnvio)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t">
              <span>Total</span><span>{formatPrecio(orden.total)}</span>
            </div>
          </div>

          {/* Historial */}
          {orden.historial?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Historial</p>
              {orden.historial.map(h => (
                <div key={h.id} className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Badge variante={BADGE_ESTADO[h.estado]}>{h.estado}</Badge>
                  <span>{new Date(h.createdAt).toLocaleDateString('es-AR')}</span>
                  {h.nota && <span>· {h.nota}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Cambiar estado */}
          {orden.estado !== 'ENTREGADA' && orden.estado !== 'CANCELADA' && (
            <div className="border-t pt-3 flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-700">Cambiar estado</p>
              <select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)} className="input">
                <option value="">— Seleccionar —</option>
                {ESTADOS.filter(e => e !== orden.estado).map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
              <textarea value={nota} onChange={e => setNota(e.target.value)}
                placeholder="Nota interna (opcional)" rows={2} className="input resize-none text-sm" />
              <button onClick={cambiarEstado} disabled={!nuevoEstado || guardando} className="btn-primario">
                {guardando ? 'Guardando...' : 'Confirmar cambio'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminOrdenesPage() {
  const { sesion } = useAuth()
  const token = sesion?.access_token
  const [ordenes, setOrdenes] = useState([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null)

  async function cargar() {
    setCargando(true)
    const r = await adminApi.listarOrdenes(token, { estado: filtroEstado })
    setOrdenes(r.data)
    setTotal(r.total)
    setCargando(false)
  }

  useEffect(() => { if (token) cargar() }, [token, filtroEstado])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Órdenes</h1>
          <p className="text-sm text-gray-500">{total} en total</p>
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="input w-auto">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map(o => {
                const cliente = o.usuario?.nombre ?? o.usuario?.email ?? o.nombreGuest ?? o.emailGuest ?? 'Invitado'
                return (
                  <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">#{o.numero}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[160px] truncate">{cliente}</td>
                    <td className="px-4 py-3"><Badge variante={BADGE_ESTADO[o.estado]}>{o.estado}</Badge></td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatPrecio(o.total)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setOrdenSeleccionada(o.id)} className="text-sm text-blue-600 hover:underline font-medium">
                        Ver
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!ordenes.length && (
            <div className="text-center py-16 text-gray-400 text-sm">No hay órdenes aún</div>
          )}
        </div>
      )}

      {ordenSeleccionada && (
        <ModalOrden ordenId={ordenSeleccionada} token={token}
          onCerrar={() => setOrdenSeleccionada(null)}
          onActualizado={cargar} />
      )}
    </div>
  )
}
