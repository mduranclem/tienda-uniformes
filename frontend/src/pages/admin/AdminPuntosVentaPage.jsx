import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import { Plus, X, Pencil, Trash2, KeyRound, Copy, Check, AlertTriangle } from 'lucide-react'

function ModalPuntoVenta({ punto, token, onGuardado, onCerrar }) {
  const editando = !!punto
  const [nombre, setNombre] = useState(punto?.nombre ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setGuardando(true)
    try {
      if (editando) {
        await adminApi.actualizarPuntoVenta(token, punto.id, { nombre })
        onGuardado(null)
      } else {
        const creado = await adminApi.crearPuntoVenta(token, { nombre })
        onGuardado(creado)
      }
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="font-bold text-zinc-100">{editando ? 'Editar punto de venta' : 'Nuevo punto de venta'}</h2>
          <button onClick={onCerrar}><X className="w-5 h-5 text-zinc-500 hover:text-zinc-200" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Nombre *</label>
            <input required autoFocus value={nombre} onChange={e => setNombre(e.target.value)}
              className="input" placeholder="Ej: Local Centro" />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCerrar} className="btn-secundario">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primario">
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalKeyRevelada({ nombre, apiKey, onCerrar }) {
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(apiKey)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
          <KeyRound className="w-5 h-5 text-blue-400" />
          <h2 className="font-bold text-zinc-100">API key de "{nombre}"</h2>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Copiá esta clave ahora. Por seguridad no se guarda en texto plano — no se va a volver a mostrar.</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-200 break-all">
              {apiKey}
            </code>
            <button onClick={copiar} className="btn-secundario shrink-0 flex items-center gap-1.5 px-3">
              {copiado ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copiado ? 'Copiada' : 'Copiar'}
            </button>
          </div>
          <button onClick={onCerrar} className="btn-primario">Listo, la copié</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPuntosVentaPage() {
  const { sesion } = useAuth()
  const token = sesion?.access_token
  const [puntos, setPuntos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null) // null | 'nuevo' | punto object
  const [keyRevelada, setKeyRevelada] = useState(null) // null | { nombre, apiKey }

  async function cargar() {
    setCargando(true)
    const data = await adminApi.listarPuntosVenta(token)
    setPuntos(data)
    setCargando(false)
  }

  useEffect(() => { if (token) cargar() }, [token])

  function onGuardado(creado) {
    setModal(null)
    if (creado?.apiKey) setKeyRevelada({ nombre: creado.nombre, apiKey: creado.apiKey })
    cargar()
  }

  async function regenerarKey(p) {
    if (!confirm(`¿Regenerar la API key de "${p.nombre}"? La key anterior deja de funcionar inmediatamente.`)) return
    try {
      const { apiKey } = await adminApi.regenerarKeyPuntoVenta(token, p.id)
      setKeyRevelada({ nombre: p.nombre, apiKey })
    } catch (err) { alert(err.message) }
  }

  async function eliminar(p) {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await adminApi.eliminarPuntoVenta(token, p.id)
      cargar()
    } catch (err) { alert(err.message) }
  }

  async function toggleActivo(p) {
    await adminApi.actualizarPuntoVenta(token, p.id, { activo: !p.activo })
    cargar()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Puntos de venta</h1>
          <p className="text-sm text-zinc-500">{puntos.length} puntos de venta</p>
        </div>
        <button onClick={() => setModal('nuevo')} className="btn-primario flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo punto de venta
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Nombre</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">API key</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Creado</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {puntos.map(p => (
                <tr key={p.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-zinc-100">{p.nombre}</td>
                  <td className="px-4 py-3 text-xs font-mono text-zinc-500">••••••••{p.apiKeyUltimos4}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{new Date(p.createdAt).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.activo ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-500'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal(p)} className="p-1.5 text-zinc-500 hover:text-blue-400 rounded transition-colors" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => regenerarKey(p)} className="p-1.5 text-zinc-500 hover:text-amber-400 rounded transition-colors" title="Regenerar API key">
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleActivo(p)} className="p-1.5 text-zinc-500 hover:text-yellow-400 rounded text-xs font-medium transition-colors">
                        {p.activo ? 'Ocultar' : 'Activar'}
                      </button>
                      <button onClick={() => eliminar(p)} className="p-1.5 text-zinc-500 hover:text-red-400 rounded transition-colors" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!puntos.length && (
            <div className="text-center py-16 text-zinc-600 text-sm">No hay puntos de venta cargados aún</div>
          )}
        </div>
      )}

      {modal && (
        <ModalPuntoVenta
          punto={modal === 'nuevo' ? null : modal}
          token={token}
          onGuardado={onGuardado}
          onCerrar={() => setModal(null)}
        />
      )}

      {keyRevelada && (
        <ModalKeyRevelada
          nombre={keyRevelada.nombre}
          apiKey={keyRevelada.apiKey}
          onCerrar={() => setKeyRevelada(null)}
        />
      )}
    </div>
  )
}
