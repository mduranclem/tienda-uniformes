import { useEffect, useState, useRef } from 'react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import { Plus, X, Trash2, FlaskConical } from 'lucide-react'

const formatoPeso = g => (g >= 1000 ? `${g / 1000} kg` : `${g} g`)
const formatoPrecio = v => `$ ${Number(v).toLocaleString('es-AR')}`

// Probar un CP contra las zonas cargadas, sin tener que simular una compra.
function Probador({ token }) {
  const [cp, setCp] = useState('')
  const [peso, setPeso] = useState('1000')
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [probando, setProbando] = useState(false)

  async function probar(e) {
    e.preventDefault()
    setError(''); setResultado(null); setProbando(true)
    try {
      const r = await adminApi.probarEnvio(token, { cp, pesoGramos: Number(peso) })
      setResultado(r.opciones[0])
    } catch (err) { setError(err.message) }
    finally { setProbando(false) }
  }

  return (
    <form onSubmit={probar} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-200 mb-3">
        <FlaskConical className="w-4 h-4 text-zinc-500" /> Probar una cotización
      </h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400">Código postal</label>
          <input required value={cp} onChange={e => setCp(e.target.value)}
            className="input w-32" placeholder="5000" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400">Peso (gramos)</label>
          <input required type="number" min="1" value={peso} onChange={e => setPeso(e.target.value)}
            className="input w-32" />
        </div>
        <button type="submit" disabled={probando} className="btn-secundario">
          {probando ? 'Probando...' : 'Probar'}
        </button>
        {resultado && (
          <p className="text-sm text-zinc-300">
            {resultado.nombre} → <span className="font-semibold text-emerald-400">{formatoPrecio(resultado.precio)}</span>
          </p>
        )}
        {error && <p className="text-sm text-amber-400">{error}</p>}
      </div>
    </form>
  )
}

function ModalZona({ token, onGuardado, onCerrar }) {
  const [form, setForm] = useState({ nombre: '', orden: '0', precioKgAdicional: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setGuardando(true)
    try {
      await adminApi.crearZonaEnvio(token, {
        nombre: form.nombre,
        orden: Number(form.orden) || 0,
        precioKgAdicional: form.precioKgAdicional === '' ? null : Number(form.precioKgAdicional),
      })
      onGuardado()
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="font-bold text-zinc-100">Nueva zona de envío</h2>
          <button onClick={onCerrar}><X className="w-5 h-5 text-zinc-500 hover:text-zinc-200" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Nombre *</label>
            <input required value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="input" placeholder="Ej: Córdoba y Buenos Aires interior" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Orden</label>
            <input type="number" value={form.orden} onChange={e => set('orden', e.target.value)} className="input" />
            <p className="text-xs text-zinc-600">Si dos zonas cubren el mismo CP, gana la de orden más bajo.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Precio por kilo adicional ($)</label>
            <input type="number" min="0" step="0.01" value={form.precioKgAdicional}
              onChange={e => set('precioKgAdicional', e.target.value)} className="input" placeholder="Vacío = no se cotiza" />
            <p className="text-xs text-zinc-600">
              Se cobra por cada kilo que supere el escalón más alto. Si lo dejás vacío, un
              pedido más pesado que el tope no se puede comprar.
            </p>
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

function Zona({ zona, token, onCambio }) {
  const [rango, setRango] = useState({ desde: '', hasta: '' })
  const [tarifa, setTarifa] = useState({ pesoHastaG: '', precio: '' })
  const [error, setError] = useState('')

  async function accion(fn) {
    setError('')
    try { await fn(); onCambio() } catch (err) { setError(err.message) }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{zona.nombre}</h3>
          <p className="text-xs text-zinc-500">
            Orden {zona.orden}
            {zona.precioKgAdicional !== null
              ? ` · ${formatoPrecio(zona.precioKgAdicional)} por kilo adicional`
              : ' · sin precio por kilo adicional'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => accion(() => adminApi.actualizarZonaEnvio(token, zona.id, { activo: !zona.activo }))}
            className="text-sm text-blue-400 hover:underline"
          >
            {zona.activo ? 'Desactivar' : 'Activar'}
          </button>
          <button
            onClick={() => accion(() => adminApi.eliminarZonaEnvio(token, zona.id))}
            className="text-zinc-600 hover:text-red-400"
            title="Eliminar zona"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
        {/* Rangos de CP */}
        <div className="p-4">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Códigos postales</h4>
          {zona.rangos.length === 0 && (
            <p className="text-sm text-amber-400 mb-2">Sin rangos: esta zona nunca se va a usar.</p>
          )}
          <ul className="flex flex-col gap-1 mb-3">
            {zona.rangos.map(r => (
              <li key={r.id} className="flex items-center justify-between text-sm text-zinc-300">
                <span>{r.desde} – {r.hasta}</span>
                <button onClick={() => accion(() => adminApi.eliminarRangoCP(token, r.id))}
                  className="text-zinc-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <input type="number" value={rango.desde} onChange={e => setRango(r => ({ ...r, desde: e.target.value }))}
              className="input w-24" placeholder="Desde" />
            <input type="number" value={rango.hasta} onChange={e => setRango(r => ({ ...r, hasta: e.target.value }))}
              className="input w-24" placeholder="Hasta" />
            <button
              className="btn-secundario"
              onClick={() => accion(async () => {
                await adminApi.crearRangoCP(token, zona.id, { desde: Number(rango.desde), hasta: Number(rango.hasta) })
                setRango({ desde: '', hasta: '' })
              })}
            >Agregar</button>
          </div>
        </div>

        {/* Escalones de tarifa */}
        <div className="p-4">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Tarifas por peso</h4>
          {zona.tarifas.length === 0 && (
            <p className="text-sm text-amber-400 mb-2">Sin tarifas: no se puede cotizar a esta zona.</p>
          )}
          <ul className="flex flex-col gap-1 mb-3">
            {zona.tarifas.map(t => (
              <li key={t.id} className="flex items-center justify-between text-sm text-zinc-300">
                <span>Hasta {formatoPeso(t.pesoHastaG)} → <span className="font-medium text-zinc-100">{formatoPrecio(t.precio)}</span></span>
                <button onClick={() => accion(() => adminApi.eliminarTarifaEnvio(token, t.id))}
                  className="text-zinc-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <input type="number" value={tarifa.pesoHastaG} onChange={e => setTarifa(t => ({ ...t, pesoHastaG: e.target.value }))}
              className="input w-24" placeholder="Gramos" />
            <input type="number" step="0.01" value={tarifa.precio} onChange={e => setTarifa(t => ({ ...t, precio: e.target.value }))}
              className="input w-24" placeholder="Precio" />
            <button
              className="btn-secundario"
              onClick={() => accion(async () => {
                await adminApi.crearTarifaEnvio(token, zona.id, {
                  pesoHastaG: Number(tarifa.pesoHastaG),
                  precio: Number(tarifa.precio),
                })
                setTarifa({ pesoHastaG: '', precio: '' })
              })}
            >Agregar</button>
          </div>
        </div>
      </div>

      {error && <p className="px-4 pb-3 text-sm text-red-400">{error}</p>}
      {!zona.activo && (
        <p className="px-4 pb-3 text-xs text-zinc-500">Zona inactiva: no se usa para cotizar.</p>
      )}
    </div>
  )
}

export default function AdminEnviosPage() {
  const { sesion } = useAuth()
  const token = sesion?.access_token
  const [zonas, setZonas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalNuevo, setModalNuevo] = useState(false)

  // El spinner de pantalla completa desmonta la tabla y cada fila pierde su
  // estado: se cierra lo que estabas editando y el scroll vuelve arriba. Solo
  // se muestra al entrar; las recargas posteriores a un guardado son silenciosas.
  const primeraCarga = useRef(true)
  async function cargar() {
    if (primeraCarga.current) setCargando(true)
    setZonas(await adminApi.listarZonasEnvio(token))
    primeraCarga.current = false; setCargando(false)
  }

  useEffect(() => { if (token) cargar() }, [token])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Zonas de envío</h1>
          <p className="text-sm text-zinc-500">{zonas.length} zonas configuradas</p>
        </div>
        <button onClick={() => setModalNuevo(true)} className="btn-primario flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva zona
        </button>
      </div>

      <p className="text-sm text-zinc-500 mb-6 max-w-3xl">
        El envío se cobra según el código postal del cliente y el peso del pedido. Sacá los
        precios reales del cotizador de andreani.com desde el CP 2000 hacia un CP de cada
        zona. Rosario queda siempre gratis y no pasa por acá.
      </p>

      <Probador token={token} />

      {cargando ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : zonas.length === 0 ? (
        <div className="text-center py-16 text-zinc-600 text-sm">
          No hay zonas cargadas. Sin zonas no se puede vender fuera de Rosario.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {zonas.map(z => <Zona key={z.id} zona={z} token={token} onCambio={cargar} />)}
        </div>
      )}

      {modalNuevo && (
        <ModalZona token={token}
          onGuardado={() => { setModalNuevo(false); cargar() }}
          onCerrar={() => setModalNuevo(false)} />
      )}
    </div>
  )
}
