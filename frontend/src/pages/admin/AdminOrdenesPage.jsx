import { useEffect, useState, useRef } from 'react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { entregasApi } from '../../services/api'
import { formatPrecio } from '../../lib/utils'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import ComprobanteOrden from '../../components/admin/ComprobanteOrden'
import { Printer } from 'lucide-react'

const ESTADOS = ['PENDIENTE', 'PAGADA', 'PREPARANDO', 'LISTA', 'ENTREGADA', 'CANCELADA']

const BADGE_ESTADO = {
  PENDIENTE: 'yellow',
  PAGADA: 'blue',
  PREPARANDO: 'blue',
  LISTA: 'green',
  ENTREGADA: 'green',
  CANCELADA: 'red',
}

function ModalOrden({ ordenId, token, onCerrar, onActualizado }) {
  const [orden, setOrden] = useState(null)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { adminApi.obtenerOrden(token, ordenId).then(setOrden) }, [ordenId])

  async function cambiarEstado() {
    if (!nuevoEstado) return
    setGuardando(true)
    await adminApi.cambiarEstadoOrden(token, ordenId, nuevoEstado, nota)
    setGuardando(false); onActualizado(); onCerrar()
  }

  if (!orden) return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <Spinner className="w-10 h-10" />
    </div>
  )

  const cliente = orden.usuario?.nombre ?? orden.usuario?.email ?? orden.nombreGuest ?? orden.emailGuest ?? 'Invitado'
  const email = orden.usuario?.email ?? orden.emailGuest
  const telefono = orden.usuario?.telefono ?? orden.telefonoGuest
  const esEnvio = orden.entrega?.tipo === 'ENVIO'
  const d = orden.domicilio
  const fechaEntrega = orden.entregaFecha
    ? new Date(orden.entregaFecha).toLocaleDateString('es-AR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
    : null

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      {/* Oculta en pantalla; es lo único que sale al imprimir */}
      <ComprobanteOrden orden={orden} />

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-zinc-100">Orden #{orden.numero}</h2>
            <p className="text-xs text-zinc-500">
              {new Date(orden.createdAt).toLocaleString('es-AR')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="btn-secundario flex items-center gap-1.5">
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button onClick={onCerrar} className="text-zinc-500 hover:text-zinc-200 text-2xl leading-none">×</button>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Estado actual:</span>
            <Badge variante={BADGE_ESTADO[orden.estado]}>{orden.estado}</Badge>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Cliente</p>
            <div className="text-sm text-zinc-300 flex flex-col gap-0.5">
              <span>{cliente}{!orden.usuario && <span className="text-zinc-600 text-xs"> · invitado</span>}</span>
              {email && <span className="text-zinc-400">{email}</span>}
              {telefono && <span className="text-zinc-400">WhatsApp {telefono}</span>}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              {esEnvio ? 'Envío' : 'Retiro'}
            </p>
            <div className="text-sm text-zinc-300 flex flex-col gap-0.5">
              <span>{orden.entrega?.nombre}</span>
              {d && (
                <span className="text-zinc-400">
                  {[d.calle, d.numero, d.piso ? `piso ${d.piso}` : null].filter(Boolean).join(' ')}
                  {d.ciudad ? ` — ${d.ciudad}` : ''}{d.cp ? ` (CP ${d.cp})` : ''}
                </span>
              )}
              {fechaEntrega && (
                <span className="text-blue-400 font-medium">
                  📅 {fechaEntrega}{orden.entregaFranja ? ` · ${orden.entregaFranja} hs` : ''}
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Productos</p>
            <div className="flex flex-col gap-1.5">
              {orden.items.map(item => (
                <div key={item.id} className="flex justify-between gap-3 text-sm text-zinc-300">
                  <span className="min-w-0">
                    {item.producto.nombre}
                    <span className="text-zinc-500">
                      {' · '}Talle {item.variante.talle}
                      {item.variante.color ? ` · ${item.variante.color}` : ''}
                      {' × '}{item.cantidad}
                      {' · '}{formatPrecio(item.precioUnit)} c/u
                    </span>
                  </span>
                  <span className="font-medium shrink-0">{formatPrecio(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-3 flex flex-col gap-1 text-sm text-zinc-400">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrecio(orden.subtotal)}</span></div>
            {Number(orden.descuento) > 0 && (
              <div className="flex justify-between text-green-400"><span>Descuento</span><span>−{formatPrecio(orden.descuento)}</span></div>
            )}
            <div className="flex justify-between">
              <span>Envío</span>
              <span>
                {Number(orden.costoEnvio) === 0
                  ? (esEnvio ? <span className="text-amber-400">A cotizar</span> : 'Gratis')
                  : formatPrecio(orden.costoEnvio)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-zinc-100 text-base pt-1 border-t border-zinc-800">
              <span>Total</span><span>{formatPrecio(orden.total)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>Forma de pago</span>
              <span className={orden.metodoPago === 'efectivo' ? 'text-amber-400 font-medium' : ''}>
                {orden.metodoPago === 'efectivo' ? '💵 Efectivo al retirar'
                  : orden.metodoPago === 'mercadopago' ? 'Mercado Pago'
                  : '—'}
              </span>
            </div>
            {orden.cupon?.codigo && (
              <div className="flex justify-between"><span>Cupón</span><span>{orden.cupon.codigo}</span></div>
            )}
          </div>

          {orden.historial?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Historial</p>
              {orden.historial.map(h => (
                <div key={h.id} className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                  <Badge variante={BADGE_ESTADO[h.estado]}>{h.estado}</Badge>
                  <span>{new Date(h.createdAt).toLocaleDateString('es-AR')}</span>
                  {h.nota && <span>· {h.nota}</span>}
                </div>
              ))}
            </div>
          )}

          {orden.estado !== 'ENTREGADA' && orden.estado !== 'CANCELADA' && (
            <div className="border-t border-zinc-800 pt-3 flex flex-col gap-2">
              <p className="text-sm font-medium text-zinc-300">Cambiar estado</p>
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
  const [filtroEntrega, setFiltroEntrega] = useState('') // '' | 'ENVIO' | entregaId
  const [entregas, setEntregas] = useState([])
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null)

  // El spinner de pantalla completa desmonta la tabla y cada fila pierde su
  // estado: se cierra lo que estabas editando y el scroll vuelve arriba. Solo
  // se muestra al entrar; las recargas posteriores a un guardado son silenciosas.
  const primeraCarga = useRef(true)
  async function cargar() {
    if (primeraCarga.current) setCargando(true)
    const r = await adminApi.listarOrdenes(token, { estado: filtroEstado })
    setOrdenes(r.data); setTotal(r.total); primeraCarga.current = false; setCargando(false)
  }

  useEffect(() => { entregasApi.listar().then(setEntregas) }, [])
  useEffect(() => { if (token) cargar() }, [token, filtroEstado])

  const localesRetiro = entregas.filter(e => e.tipo === 'RETIRO')

  const ordenesFiltradas = ordenes.filter(o => {
    if (!filtroEntrega) return true
    if (filtroEntrega === 'ENVIO') return o.entrega?.tipo === 'ENVIO'
    return o.entregaId === filtroEntrega
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Órdenes</h1>
          <p className="text-sm text-zinc-500">{ordenesFiltradas.length} {filtroEntrega ? 'filtradas' : 'en total'}</p>
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="input w-auto">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* Filtros de entrega */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { id: '', label: 'Todos' },
          { id: 'ENVIO', label: '🚚 Envío a domicilio' },
          ...localesRetiro.map(e => ({
            id: e.id,
            label: `📍 ${e.nombre.replace(/^Retiro en local\s*[\(\-]?\s*/i, '').replace(/\)$/, '') || e.nombre}`,
          })),
        ].map(op => (
          <button
            key={op.id}
            onClick={() => setFiltroEntrega(op.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filtroEntrega === op.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-blue-500 hover:text-blue-400'
            }`}
          >
            {op.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">#</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Cliente</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Entrega</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.map(o => {
                const cliente = o.usuario?.nombre ?? o.usuario?.email ?? o.nombreGuest ?? o.emailGuest ?? 'Invitado'
                return (
                  <tr key={o.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-zinc-100">#{o.numero}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-300">{cliente}</p>
                      <div className="mt-1 flex flex-col gap-1">
                        {o.items.map(item => (
                          <p key={item.id} className="text-xs text-zinc-500 leading-snug">
                            {item.producto.nombre} · T:{item.variante.talle}{item.variante.color ? ` ${item.variante.color}` : ''} × {item.cantidad}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {o.entrega?.tipo === 'ENVIO' ? (
                        <div>
                          <p className="text-xs font-medium text-zinc-300">Envío a domicilio</p>
                          {o.domicilio && (
                            <p className="text-xs text-zinc-500 truncate max-w-[160px]">
                              {o.domicilio.calle} {o.domicilio.numero}{o.domicilio.piso ? `, ${o.domicilio.piso}` : ''} — {o.domicilio.ciudad}
                            </p>
                          )}
                          {/* Día y franja acordados, para armar el recorrido */}
                          {o.entregaFecha && (
                            <p className="text-xs font-medium text-blue-400">
                              📅 {new Date(o.entregaFecha).toLocaleDateString('es-AR', {
                                timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short',
                              })} · {o.entregaFranja} hs
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-medium text-zinc-300">Retiro en local</p>
                          <p className="text-xs text-zinc-500 truncate max-w-[160px]">
                            {o.entrega?.nombre?.replace(/^Retiro en local\s*[\(\-]?\s*/i, '').replace(/\)$/, '')}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variante={BADGE_ESTADO[o.estado]}>{o.estado}</Badge>
                      {/* Un pendiente en efectivo espera al cliente en el local,
                          no es un pago que falló */}
                      {o.metodoPago === 'efectivo' && o.estado === 'PENDIENTE' && (
                        <p className="mt-1 text-[11px] font-medium text-amber-400">💵 paga al retirar</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-zinc-100">{formatPrecio(o.total)}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{new Date(o.createdAt).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setOrdenSeleccionada(o.id)} className="text-sm text-blue-400 hover:underline font-medium">
                        Ver
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!ordenesFiltradas.length && (
            <div className="text-center py-16 text-zinc-600 text-sm" colSpan={7}>No hay órdenes aún</div>
          )}
        </div>
      )}

      {ordenSeleccionada && (
        <ModalOrden ordenId={ordenSeleccionada} token={token}
          onCerrar={() => setOrdenSeleccionada(null)} onActualizado={cargar} />
      )}
    </div>
  )
}
