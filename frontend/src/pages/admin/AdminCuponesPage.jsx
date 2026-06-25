import { useEffect, useState } from 'react'
import { adminApi, colegiosApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { Plus, X } from 'lucide-react'

function ModalCupon({ colegios, token, onGuardado, onCerrar }) {
  const [form, setForm] = useState({
    codigo: '', tipo: 'PORCENTAJE', valor: '', aplicaA: 'TODO',
    colegioId: '', usosMax: '', minimoCompra: '', desde: '', hasta: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await adminApi.crearCupon(token, {
        ...form,
        valor: parseFloat(form.valor),
        usosMax: form.usosMax ? parseInt(form.usosMax) : null,
        minimoCompra: form.minimoCompra ? parseFloat(form.minimoCompra) : null,
        colegioId: form.colegioId || null,
        desde: form.desde || null,
        hasta: form.hasta || null,
      })
      onGuardado()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-gray-900">Nuevo cupón</h2>
          <button onClick={onCerrar}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Código *</label>
            <input required value={form.codigo} onChange={e => set('codigo', e.target.value.toUpperCase())}
              className="input font-mono" placeholder="VERANO20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Tipo</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="input">
                <option value="PORCENTAJE">Porcentaje (%)</option>
                <option value="MONTO_FIJO">Monto fijo ($)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Valor *</label>
              <input required type="number" min="0" step="0.01" value={form.valor}
                onChange={e => set('valor', e.target.value)} className="input" placeholder="20" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Aplica a</label>
            <select value={form.aplicaA} onChange={e => set('aplicaA', e.target.value)} className="input">
              <option value="TODO">Todo el carrito</option>
              <option value="COLEGIO">Un colegio específico</option>
            </select>
          </div>
          {form.aplicaA === 'COLEGIO' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Colegio</label>
              <select value={form.colegioId} onChange={e => set('colegioId', e.target.value)} className="input">
                <option value="">— Seleccionar —</option>
                {colegios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Usos máximos</label>
              <input type="number" min="1" value={form.usosMax} onChange={e => set('usosMax', e.target.value)}
                className="input" placeholder="Sin límite" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Compra mínima</label>
              <input type="number" min="0" value={form.minimoCompra} onChange={e => set('minimoCompra', e.target.value)}
                className="input" placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Desde</label>
              <input type="date" value={form.desde} onChange={e => set('desde', e.target.value)} className="input" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Hasta</label>
              <input type="date" value={form.hasta} onChange={e => set('hasta', e.target.value)} className="input" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCerrar} className="btn-secundario">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primario">
              {guardando ? 'Creando...' : 'Crear cupón'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminCuponesPage() {
  const { sesion } = useAuth()
  const token = sesion?.access_token
  const [cupones, setCupones] = useState([])
  const [colegios, setColegios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalNuevo, setModalNuevo] = useState(false)

  async function cargar() {
    setCargando(true)
    const [cups, cols] = await Promise.all([adminApi.listarCupones(token), colegiosApi.listar()])
    setCupones(cups)
    setColegios(cols)
    setCargando(false)
  }

  useEffect(() => { if (token) cargar() }, [token])

  async function toggleActivo(cupon) {
    await adminApi.actualizarCupon(token, cupon.id, { activo: !cupon.activo })
    cargar()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cupones</h1>
          <p className="text-sm text-gray-500">{cupones.length} cupones</p>
        </div>
        <button onClick={() => setModalNuevo(true)} className="btn-primario flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo cupón
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descuento</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usos</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vencimiento</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {cupones.map(c => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm font-bold text-gray-900">{c.codigo}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {c.tipo === 'PORCENTAJE' ? `${c.valor}%` : `$${c.valor}`}
                    {c.aplicaA !== 'TODO' && <span className="text-xs text-gray-400 ml-1">· {c.colegio?.nombre ?? c.aplicaA}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {c.usosActuales}{c.usosMax ? `/${c.usosMax}` : ''}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {c.hasta ? new Date(c.hasta).toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variante={c.activo ? 'green' : 'default'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActivo(c)} className="text-sm text-blue-600 hover:underline">
                      {c.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cupones.length && (
            <div className="text-center py-16 text-gray-400 text-sm">No hay cupones aún</div>
          )}
        </div>
      )}

      {modalNuevo && (
        <ModalCupon colegios={colegios} token={token}
          onGuardado={() => { setModalNuevo(false); cargar() }}
          onCerrar={() => setModalNuevo(false)} />
      )}
    </div>
  )
}
