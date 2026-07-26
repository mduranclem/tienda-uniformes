import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatPrecio, TALLES_STANDARD } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { Plus, Pencil, Check, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

function SeccionBandas({ categoriaId, bandas, token, onActualizado }) {
  const [tallesSeleccionados, setTallesSeleccionados] = useState([])
  const [precioNueva, setPrecioNueva] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function toggleTalle(talle) {
    setTallesSeleccionados(s => s.includes(talle) ? s.filter(t => t !== talle) : [...s, talle])
  }

  async function agregarBanda(e) {
    e.preventDefault()
    if (!tallesSeleccionados.length || !precioNueva) return
    setError(''); setGuardando(true)
    try {
      await adminApi.crearBanda(token, categoriaId, {
        talles: tallesSeleccionados,
        precio: parseFloat(precioNueva),
      })
      setTallesSeleccionados([]); setPrecioNueva('')
      onActualizado()
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  async function eliminarBanda(bandaId) {
    if (!confirm('¿Eliminar esta banda de precio?')) return
    try { await adminApi.eliminarBanda(token, bandaId); onActualizado() }
    catch (err) { alert(err.message) }
  }

  return (
    <div>
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Precios por talle</p>

      <div className="flex flex-col gap-1.5 mb-3">
        {bandas.length === 0 ? (
          <p className="text-xs text-amber-400/70 italic">Sin precios cargados</p>
        ) : (
          bandas.map(b => (
            <div key={b.id} className="flex items-center justify-between gap-2 bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-1.5">
              <div className="flex flex-wrap items-center gap-1">
                {b.talles.map(t => (
                  <span key={t} className="text-[10px] font-medium bg-zinc-700 text-zinc-300 rounded px-1.5 py-0.5">{t}</span>
                ))}
                <span className="text-sm text-zinc-100 font-medium ml-1">{formatPrecio(b.precio)}</span>
              </div>
              <button onClick={() => eliminarBanda(b.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={agregarBanda} className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {TALLES_STANDARD.map(talle => (
            <button
              type="button"
              key={talle}
              onClick={() => toggleTalle(talle)}
              className={`text-xs font-medium rounded px-2 py-1 border transition-colors ${
                tallesSeleccionados.includes(talle)
                  ? 'bg-blue-600/20 border-blue-600/40 text-blue-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {talle}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number" min="0" step="0.01"
            value={precioNueva}
            onChange={e => setPrecioNueva(e.target.value)}
            placeholder="Precio $"
            className="input text-sm py-1.5 flex-1"
          />
          <button
            type="submit"
            disabled={guardando || !tallesSeleccionados.length || !precioNueva}
            className="flex items-center gap-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-3 py-1.5 rounded disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3 h-3" /> Agregar banda
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </div>
  )
}

function FilaCategoria({ categoria, token, editandoId, editNombre, setEditandoId, setEditNombre, guardarEdicion, toggleActivo, eliminar }) {
  const [expandido, setExpandido] = useState(false)
  const [bandas, setBandas] = useState([])
  const [cargandoBandas, setCargandoBandas] = useState(false)

  async function cargarBandas() {
    setCargandoBandas(true)
    const data = await adminApi.listarBandas(token, categoria.id)
    setBandas(data); setCargandoBandas(false)
  }

  useEffect(() => { if (expandido) cargarBandas() }, [expandido])

  return (
    <>
      <tr className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
        <td className="px-4 py-3">
          {editandoId === categoria.id ? (
            <div className="flex items-center gap-2">
              <input
                value={editNombre}
                onChange={e => setEditNombre(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(categoria.id); if (e.key === 'Escape') setEditandoId(null) }}
                autoFocus
                className="input text-sm py-1 w-40"
              />
              <button onClick={() => guardarEdicion(categoria.id)} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
              <button onClick={() => setEditandoId(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <span className="text-sm font-medium text-zinc-100">{categoria.nombre}</span>
          )}
        </td>
        <td className="px-4 py-3">
          <Badge variante={categoria.activo ? 'green' : 'default'}>{categoria.activo ? 'Activa' : 'Inactiva'}</Badge>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setEditandoId(categoria.id); setEditNombre(categoria.nombre) }}
              className="p-1.5 text-zinc-500 hover:text-blue-400 rounded transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleActivo(categoria)}
              className="p-1.5 text-zinc-500 hover:text-yellow-400 rounded text-xs font-medium transition-colors"
            >
              {categoria.activo ? 'Desactivar' : 'Activar'}
            </button>
            <button
              onClick={() => eliminar(categoria.id)}
              className="p-1.5 text-zinc-500 hover:text-red-400 rounded transition-colors text-xs"
            >
              Eliminar
            </button>
            <button onClick={() => setExpandido(!expandido)} className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded transition-colors">
              {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </td>
      </tr>
      {expandido && (
        <tr className="border-b border-zinc-800 bg-zinc-800/20">
          <td colSpan={3} className="px-6 py-4">
            {cargandoBandas ? (
              <div className="flex justify-center py-6"><Spinner className="w-6 h-6" /></div>
            ) : (
              <div className="max-w-md">
                <SeccionBandas categoriaId={categoria.id} bandas={bandas} token={token} onActualizado={cargarBandas} />
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

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
        <p className="text-sm text-zinc-500 mt-0.5">
          Tipos de prenda disponibles para los productos. Expandí una categoría para cargar sus precios por talle.
        </p>
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
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
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
                <FilaCategoria
                  key={cat.id}
                  categoria={cat}
                  token={token}
                  editandoId={editandoId}
                  editNombre={editNombre}
                  setEditandoId={setEditandoId}
                  setEditNombre={setEditNombre}
                  guardarEdicion={guardarEdicion}
                  toggleActivo={toggleActivo}
                  eliminar={eliminar}
                />
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
