import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TIPOS = ['VENTA', 'INGRESO', 'AJUSTE', 'DEVOLUCION']

const BADGE_POR_TIPO = {
  VENTA: 'bg-red-500/20 text-red-400',
  INGRESO: 'bg-green-500/20 text-green-400',
  AJUSTE: 'bg-yellow-500/20 text-yellow-400',
  DEVOLUCION: 'bg-blue-500/20 text-blue-400',
}

const LIMIT = 20

export default function AdminMovimientosStockPage() {
  const { sesion } = useAuth()
  const token = sesion?.access_token

  const [puntosVenta, setPuntosVenta] = useState([])
  const [productos, setProductos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [cargando, setCargando] = useState(true)

  const [filtros, setFiltros] = useState({ puntoDeVentaId: '', productoId: '', tipo: '', desde: '', hasta: '' })

  useEffect(() => {
    if (!token) return
    adminApi.listarPuntosVenta(token).then(setPuntosVenta)
    adminApi.listarProductos(token).then(setProductos)
  }, [token])

  useEffect(() => {
    if (!token) return
    setCargando(true)
    adminApi.listarMovimientosStock(token, { ...filtros, page, limit: LIMIT })
      .then(r => { setMovimientos(r.data); setTotal(r.total) })
      .finally(() => setCargando(false))
  }, [token, filtros, page])

  function setFiltro(k, v) {
    setPage(1)
    setFiltros(f => ({ ...f, [k]: v }))
  }

  const totalPaginas = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-100">Movimientos de stock</h1>
        <p className="text-sm text-zinc-500">{total} movimientos</p>
      </div>

      {/* Filtros */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <select value={filtros.puntoDeVentaId} onChange={e => setFiltro('puntoDeVentaId', e.target.value)} className="input">
          <option value="">Todos los puntos de venta</option>
          {puntosVenta.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select value={filtros.productoId} onChange={e => setFiltro('productoId', e.target.value)} className="input">
          <option value="">Todos los productos</option>
          {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select value={filtros.tipo} onChange={e => setFiltro('tipo', e.target.value)} className="input">
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="date" value={filtros.desde} onChange={e => setFiltro('desde', e.target.value)} className="input" />
        <input type="date" value={filtros.hasta} onChange={e => setFiltro('hasta', e.target.value)} className="input" />
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Punto de venta</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Producto</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Talle</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide text-right">Cantidad</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Nota</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map(m => (
                <tr key={m.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{m.puntoDeVenta?.nombre}</td>
                  <td className="px-4 py-3 text-sm text-zinc-100">{m.variante?.producto?.nombre}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {m.variante?.talle}{m.variante?.color ? ` / ${m.variante.color}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${BADGE_POR_TIPO[m.tipo]}`}>
                      {m.tipo}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm font-semibold text-right ${m.cantidad < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{m.nota ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!movimientos.length && (
            <div className="text-center py-16 text-zinc-600 text-sm">No hay movimientos con estos filtros</div>
          )}

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secundario flex items-center gap-1 text-xs px-3 py-1.5 disabled:opacity-40">
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              <span className="text-xs text-zinc-500">Página {page} de {totalPaginas}</span>
              <button onClick={() => setPage(p => Math.min(totalPaginas, p + 1))} disabled={page === totalPaginas}
                className="btn-secundario flex items-center gap-1 text-xs px-3 py-1.5 disabled:opacity-40">
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
