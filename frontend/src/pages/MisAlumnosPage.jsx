import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { alumnosApi, colegiosApi } from '../services/api'
import Spinner from '../components/ui/Spinner'
import { Plus, Pencil, Trash2, X, GraduationCap, ChevronLeft } from 'lucide-react'

const TIPOS_PRENDA = ['REMERA', 'BUZO', 'PANTALON', 'CAMPERA', 'OTRO']
const TIPO_LABEL = { REMERA: 'Remera', BUZO: 'Buzo', PANTALON: 'Pantalón', CAMPERA: 'Campera', OTRO: 'Otro' }
const TALLES = ['2', '4', '6', '8', '10', '12', '14', 'XS', 'S', 'M', 'L', 'XL', 'XXL']

function ModalAlumno({ alumno, colegios, token, onGuardado, onCerrar }) {
  const editando = !!alumno
  const [nombre, setNombre] = useState(alumno?.nombre ?? '')
  const [colegioId, setColegioId] = useState(alumno?.colegioId ?? '')
  const [talles, setTalles] = useState(() => {
    const m = {}
    alumno?.talles?.forEach(t => { m[t.tipoPrenda] = t.talle })
    return m
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function toggleTalle(tipo, talle) {
    setTalles(prev => ({ ...prev, [tipo]: prev[tipo] === talle ? undefined : talle }))
  }

  async function handleGuardar(e) {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    setError(''); setGuardando(true)
    try {
      let alumnoId
      if (editando) {
        await alumnosApi.actualizar(token, alumno.id, { nombre: nombre.trim(), colegioId: colegioId || null })
        alumnoId = alumno.id
      } else {
        const nuevo = await alumnosApi.crear(token, { nombre: nombre.trim(), colegioId: colegioId || null })
        alumnoId = nuevo.id
      }

      const tallesArray = Object.entries(talles)
        .filter(([, t]) => t)
        .map(([tipoPrenda, talle]) => ({ tipoPrenda, talle }))
      await alumnosApi.actualizarTalles(token, alumnoId, tallesArray)

      onGuardado()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900">
          <h2 className="font-bold text-zinc-100">{editando ? 'Editar alumno' : 'Nuevo alumno'}</h2>
          <button onClick={onCerrar} className="text-zinc-500 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleGuardar} className="p-5 flex flex-col gap-5">
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Nombre del alumno *</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Lucas, Valentina..."
              className="input w-full"
              required
            />
          </div>

          {/* Colegio */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Colegio</label>
            <select
              value={colegioId}
              onChange={e => setColegioId(e.target.value)}
              className="input w-full"
            >
              <option value="">Sin colegio</option>
              {colegios.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Talles */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-zinc-400">Talles por prenda <span className="text-zinc-600 font-normal">(opcional)</span></p>
            {TIPOS_PRENDA.map(tipo => (
              <div key={tipo} className="flex flex-col gap-1.5">
                <p className="text-xs text-zinc-500">{TIPO_LABEL[tipo]}</p>
                <div className="flex flex-wrap gap-1.5">
                  {TALLES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTalle(tipo, t)}
                      className={`min-w-[2.25rem] px-2 py-1 rounded-lg border text-xs font-medium transition-colors ${
                        talles[tipo] === t
                          ? 'border-blue-500 bg-blue-600 text-white'
                          : 'border-zinc-700 text-zinc-400 hover:border-blue-500 hover:text-zinc-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCerrar} className="btn-secundario flex-1 py-2.5">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="btn-primario flex-1 py-2.5 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MisAlumnosPage() {
  const { sesion, cargando: authCargando } = useAuth()
  const navigate = useNavigate()
  const [alumnos, setAlumnos] = useState([])
  const [colegios, setColegios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null) // null | { alumno: null } | { alumno: obj }
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    if (!authCargando && !sesion) navigate('/login', { replace: true })
  }, [sesion, authCargando])

  useEffect(() => {
    if (!sesion?.access_token) return
    cargar()
    colegiosApi.listar().then(r => setColegios(r.data ?? r))
  }, [sesion?.access_token])

  async function cargar() {
    setCargando(true)
    try {
      const data = await alumnosApi.listar(sesion.access_token)
      setAlumnos(data)
    } catch (_) {}
    finally { setCargando(false) }
  }

  async function handleEliminar(id) {
    setEliminando(true)
    try {
      await alumnosApi.eliminar(sesion.access_token, id)
      setAlumnos(prev => prev.filter(a => a.id !== id))
      setConfirmandoEliminar(null)
    } catch (_) {}
    finally { setEliminando(false) }
  }

  if (authCargando || !sesion) {
    return <div className="flex justify-center py-20"><Spinner className="w-10 h-10" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors mb-5">
        <ChevronLeft className="w-4 h-4" />
        Volver al inicio
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-400" />
          <h1 className="text-xl font-bold text-zinc-100">Mis alumnos</h1>
        </div>
        <button
          onClick={() => setModal({ alumno: null })}
          className="btn-primario flex items-center gap-1.5 px-4 py-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo alumno
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-12"><Spinner className="w-8 h-8" /></div>
      ) : alumnos.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-xl">
          <GraduationCap className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Todavía no tenés alumnos guardados.</p>
          <p className="text-zinc-600 text-xs mt-1">Agregá un alumno para guardar sus talles y agilizar futuras compras.</p>
          <button
            onClick={() => setModal({ alumno: null })}
            className="mt-4 btn-primario px-5 py-2 text-sm"
          >
            Agregar alumno
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alumnos.map(alumno => {
            const tallesGuardados = TIPOS_PRENDA.filter(t => alumno.talles.some(x => x.tipoPrenda === t))
            return (
              <div key={alumno.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-100">{alumno.nombre}</p>
                    {alumno.colegio && (
                      <p className="text-xs text-zinc-500 mt-0.5">{alumno.colegio.nombre}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setModal({ alumno })}
                      className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {confirmandoEliminar === alumno.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEliminar(alumno.id)}
                          disabled={eliminando}
                          className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 disabled:opacity-50"
                        >
                          {eliminando ? '...' : 'Sí, eliminar'}
                        </button>
                        <button
                          onClick={() => setConfirmandoEliminar(null)}
                          className="text-xs text-zinc-500 hover:text-zinc-300 px-1 py-1"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmandoEliminar(alumno.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {tallesGuardados.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {TIPOS_PRENDA.map(tipo => {
                      const t = alumno.talles.find(x => x.tipoPrenda === tipo)
                      if (!t) return null
                      return (
                        <span key={tipo} className="inline-flex items-center gap-1 text-xs bg-zinc-800 border border-zinc-700 rounded-full px-2.5 py-1 text-zinc-300">
                          <span className="text-zinc-500">{TIPO_LABEL[tipo]}:</span> {t.talle}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-zinc-600">Sin talles guardados — editá para agregar.</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modal !== null && (
        <ModalAlumno
          alumno={modal.alumno}
          colegios={colegios}
          token={sesion.access_token}
          onGuardado={() => { setModal(null); cargar() }}
          onCerrar={() => setModal(null)}
        />
      )}
    </div>
  )
}
