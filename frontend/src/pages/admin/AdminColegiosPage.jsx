import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { comprimirImagen } from '../../lib/imageCompress'
import Spinner from '../../components/ui/Spinner'
import { Plus, X, Pencil, Trash2, Upload } from 'lucide-react'

function ModalColegio({ colegio, token, onGuardado, onCerrar }) {
  const editando = !!colegio
  const [nombre, setNombre] = useState(colegio?.nombre ?? '')
  const [logo, setLogo] = useState(colegio?.logo ?? '')
  const [subiendo, setSubiendo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function subirLogo(file) {
    setSubiendo(true)
    const comprimido = await comprimirImagen(file, { maxAncho: 800, maxAlto: 800 })
    const ext = comprimido.name.split('.').pop()
    const path = `colegios/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('productos').upload(path, comprimido, { upsert: true })
    if (upErr) { setError(upErr.message); setSubiendo(false); return }
    const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(path)
    setLogo(publicUrl)
    setSubiendo(false)
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setGuardando(true)
    try {
      if (editando) await adminApi.actualizarColegio(token, colegio.id, { nombre, logo })
      else await adminApi.crearColegio(token, { nombre, logo })
      onGuardado()
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="font-bold text-zinc-100">{editando ? 'Editar colegio' : 'Nuevo colegio'}</h2>
          <button onClick={onCerrar}><X className="w-5 h-5 text-zinc-500 hover:text-zinc-200" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Nombre del colegio *</label>
            <input required value={nombre} onChange={e => setNombre(e.target.value)}
              className="input" placeholder="Ej: Colegio San Martín" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Logo</label>
            {logo && (
              <div className="flex items-center gap-3 mb-1">
                <img src={logo} alt="Logo" className="h-16 w-16 object-contain rounded-lg bg-zinc-800 p-1" />
                <button type="button" onClick={() => setLogo('')} className="text-xs text-red-400 hover:underline">Quitar</button>
              </div>
            )}
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-zinc-700 hover:border-blue-500 cursor-pointer transition-colors text-sm text-zinc-400">
              <Upload className="w-4 h-4" />
              {subiendo ? 'Subiendo...' : logo ? 'Cambiar logo' : 'Subir logo'}
              <input type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files[0] && subirLogo(e.target.files[0])} />
            </label>
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCerrar} className="btn-secundario">Cancelar</button>
            <button type="submit" disabled={guardando || subiendo} className="btn-primario">
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear colegio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminColegiosPage() {
  const { sesion } = useAuth()
  const token = sesion?.access_token
  const [colegios, setColegios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null) // null | 'nuevo' | colegio object

  async function cargar() {
    setCargando(true)
    const data = await adminApi.listarColegios(token)
    setColegios(data)
    setCargando(false)
  }

  useEffect(() => { if (token) cargar() }, [token])

  async function eliminar(c) {
    if (!confirm(`¿Eliminar "${c.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await adminApi.eliminarColegio(token, c.id)
      cargar()
    } catch (err) { alert(err.message) }
  }

  async function toggleActivo(c) {
    await adminApi.actualizarColegio(token, c.id, { activo: !c.activo })
    cargar()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Colegios</h1>
          <p className="text-sm text-zinc-500">{colegios.length} colegios</p>
        </div>
        <button onClick={() => setModal('nuevo')} className="btn-primario flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo colegio
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Logo</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Nombre</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Slug</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Productos</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {colegios.map(c => (
                <tr key={c.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3">
                    {c.logo
                      ? <img src={c.logo} alt={c.nombre} className="h-10 w-10 object-contain rounded-lg bg-zinc-800 p-0.5" />
                      : <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">—</div>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-100">{c.nombre}</td>
                  <td className="px-4 py-3 text-xs font-mono text-zinc-500">{c.slug}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{c._count.productos}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.activo ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-500'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal(c)} className="p-1.5 text-zinc-500 hover:text-blue-400 rounded transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleActivo(c)} className="p-1.5 text-zinc-500 hover:text-yellow-400 rounded text-xs font-medium transition-colors">
                        {c.activo ? 'Ocultar' : 'Activar'}
                      </button>
                      <button onClick={() => eliminar(c)} className="p-1.5 text-zinc-500 hover:text-red-400 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!colegios.length && (
            <div className="text-center py-16 text-zinc-600 text-sm">No hay colegios cargados aún</div>
          )}
        </div>
      )}

      {modal && (
        <ModalColegio
          colegio={modal === 'nuevo' ? null : modal}
          token={token}
          onGuardado={() => { setModal(null); cargar() }}
          onCerrar={() => setModal(null)}
        />
      )}
    </div>
  )
}
