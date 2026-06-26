import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import { Plus, X } from 'lucide-react'

function ModalEntrega({ token, onGuardado, onCerrar }) {
  const [form, setForm] = useState({ tipo: 'RETIRO', nombre: '', costo: '0' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setGuardando(true)
    try {
      await adminApi.crearEntrega(token, { ...form, costo: parseFloat(form.costo) })
      onGuardado()
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="font-bold text-zinc-100">Nueva opción de entrega</h2>
          <button onClick={onCerrar}><X className="w-5 h-5 text-zinc-500 hover:text-zinc-200" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Tipo</label>
            <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="input">
              <option value="RETIRO">Retiro en local</option>
              <option value="ENVIO">Envío a domicilio</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Nombre / Dirección *</label>
            <input required value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="input" placeholder="Ej: Retiro en local (Av. Corrientes 1234, CABA)" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Costo ($)</label>
            <input type="number" min="0" step="0.01" value={form.costo}
              onChange={e => set('costo', e.target.value)} className="input" placeholder="0 = gratis" />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCerrar} className="btn-secundario">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primario">
              {guardando ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminEntregasPage() {
  const { sesion } = useAuth()
  const token = sesion?.access_token
  const [entregas, setEntregas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalNuevo, setModalNuevo] = useState(false)

  async function cargar() {
    setCargando(true)
    const data = await adminApi.listarEntregas(token)
    setEntregas(data)
    setCargando(false)
  }

  useEffect(() => { if (token) cargar() }, [token])

  async function toggleActivo(entrega) {
    await adminApi.actualizarEntrega(token, entrega.id, { activo: !entrega.activo })
    cargar()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Entregas</h1>
          <p className="text-sm text-zinc-500">{entregas.length} opciones configuradas</p>
        </div>
        <button onClick={() => setModalNuevo(true)} className="btn-primario flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva opción
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Nombre / Dirección</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Costo</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {entregas.map(e => (
                <tr key={e.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-zinc-200">
                    {e.tipo === 'ENVIO' ? '🚚 Envío' : '📍 Retiro'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{e.nombre}</td>
                  <td className="px-4 py-3 text-sm text-zinc-300">
                    {Number(e.costo) === 0 ? <span className="text-green-400">Gratis</span> : `$ ${Number(e.costo).toLocaleString('es-AR')}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${e.activo ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-500'}`}>
                      {e.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActivo(e)} className="text-sm text-blue-400 hover:underline">
                      {e.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!entregas.length && (
            <div className="text-center py-16 text-zinc-600 text-sm">No hay opciones de entrega aún</div>
          )}
        </div>
      )}

      {modalNuevo && (
        <ModalEntrega token={token}
          onGuardado={() => { setModalNuevo(false); cargar() }}
          onCerrar={() => setModalNuevo(false)} />
      )}
    </div>
  )
}
