import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { Plus, Pencil, Check, X } from 'lucide-react'

export default function AdminCategoriasPage() {
  const { sesion } = useAuth()
  const token = sesion?.access_token
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [nuevaNombre, setNuevaNombre] = useState('')
  const [guardandoNueva, setGuardandoNueva] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [editNombre, setEditNombre] = useState('')
  const [error, setError] = useState('')

  async function cargar() {
    setCargando(true)
    const cats = await adminApi.listarCategorias(token)
    setCategorias(cats); setCargando(false)
  }

  useEffect(() => { if (token) cargar() }, [token])

  async function crearCategoria(e) {
    e.preventDefault()
    if (!nuevaNombre.trim()) return
    setError(''); setGuardandoNueva(true)
    try {
      await adminApi.crearCategoria(token, { nombre: nuevaNombre.trim() })
      setNuevaNombre(''); cargar()
    } catch (err) { setError(err.message) }
    finally { setGuardandoNueva(false) }
  }

  async function guardarEdicion(id) {
    if (!editNombre.trim()) return
    try {
      await adminApi.actualizarCategoria(token, id, { nombre: editNombre.trim() })
      setEditandoId(null); cargar()
    } catch (err) { alert(err.message) }
  }

  async function toggleActivo(cat) {
    try {
      await adminApi.actualizarCategoria(token, cat.id, { activo: !cat.activo })
      cargar()
    } catch (err) { alert(err.message) }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar categoría? No se puede si tiene productos asociados.')) return
    try { await adminApi.eliminarCategoria(token, id); cargar() }
    catch (err) { alert(err.message) }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-100">Categorías</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Tipos de prenda disponibles para los productos</p>
      </div>

      {/* Formulario nueva categoría */}
      <form onSubmit={crearCategoria} className="flex items-center gap-2 mb-6">
        <input
          value={nuevaNombre}
          onChange={e => setNuevaNombre(e.target.value)}
          placeholder="ej: CHOMBA, CAMISA, SHORT..."
          className="input flex-1"
        />
        <button type="submit" disabled={guardandoNueva || !nuevaNombre.trim()} className="btn-primario flex items-center gap-2 whitespace-nowrap">
          <Plus className="w-4 h-4" />
          {guardandoNueva ? 'Guardando...' : 'Agregar'}
        </button>
      </form>
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {cargando ? (
        <div className="flex justify-center py-12"><Spinner className="w-8 h-8" /></div>
      ) : (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Nombre</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map(cat => (
                <tr key={cat.id} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    {editandoId === cat.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editNombre}
                          onChange={e => setEditNombre(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(cat.id); if (e.key === 'Escape') setEditandoId(null) }}
                          autoFocus
                          className="input text-sm py-1 w-40"
                        />
                        <button onClick={() => guardarEdicion(cat.id)} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditandoId(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-zinc-100">{cat.nombre}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variante={cat.activo ? 'green' : 'default'}>{cat.activo ? 'Activa' : 'Inactiva'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditandoId(cat.id); setEditNombre(cat.nombre) }}
                        className="p-1.5 text-zinc-500 hover:text-blue-400 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActivo(cat)}
                        className="p-1.5 text-zinc-500 hover:text-yellow-400 rounded text-xs font-medium transition-colors"
                      >
                        {cat.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => eliminar(cat.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded transition-colors text-xs"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!categorias.length && (
            <div className="text-center py-12 text-zinc-600 text-sm">No hay categorías aún</div>
          )}
        </div>
      )}
    </div>
  )
}
