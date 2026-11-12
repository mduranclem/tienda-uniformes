import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatPrecio, normalizarTexto } from '../../lib/utils'
import Spinner from '../../components/ui/Spinner'
import { Plus, Search, Star, X, ImageOff } from 'lucide-react'

// Los productos de la sección "Destacados" de la portada, en un solo lugar:
// ver cuáles están, sacar uno, sumar uno ya cargado o cargar uno nuevo. Es lo
// mismo que la estrella de Admin › Productos, pero sin tener que buscar en la
// lista entera.

function Foto({ producto, className }) {
  const url = producto.imagenes?.[0]?.url
  return url
    ? <img src={url} alt="" className={`object-cover bg-zinc-800 ${className}`} />
    : <div className={`flex items-center justify-center bg-zinc-800 text-zinc-600 ${className}`}><ImageOff className="h-5 w-5" /></div>
}

export default function AdminDestacadosPage() {
  const { sesion } = useAuth()
  const token = sesion?.access_token
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [guardandoId, setGuardandoId] = useState(null)

  // Solo la primera carga muestra el spinner: después de marcar o quitar uno
  // se refresca en silencio para no perder lo que estabas buscando.
  const primeraCarga = useRef(true)
  async function cargar() {
    if (primeraCarga.current) setCargando(true)
    try { setProductos(await adminApi.listarProductos(token)) }
    finally { primeraCarga.current = false; setCargando(false) }
  }

  useEffect(() => { if (token) cargar() }, [token])

  async function cambiar(producto, destacado) {
    setGuardandoId(producto.id)
    try {
      await adminApi.actualizarProducto(token, producto.id, { destacado })
      await cargar()
    } catch (err) { alert(err.message) }
    finally { setGuardandoId(null) }
  }

  const destacados = productos.filter(p => p.destacado)
  const termino = normalizarTexto(busqueda)
  const candidatos = termino
    ? productos
        .filter(p => !p.destacado)
        .filter(p => [p.nombre, p.tipo, p.colegio?.nombre].some(t => t && normalizarTexto(t).includes(termino)))
        .slice(0, 12)
    : []

  if (cargando) {
    return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Productos destacados</h1>
          <p className="text-sm text-zinc-500">
            Se ven en la portada, debajo del carrusel. Sin ninguno, la sección no aparece.
          </p>
        </div>
        <Link to="/admin/productos?nuevo=destacado" className="btn-primario flex shrink-0 items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Cargar producto nuevo
        </Link>
      </div>

      {/* En la portada */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          En la portada ({destacados.length})
        </h2>
        {destacados.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
            Todavía no hay productos destacados. Buscá uno abajo o cargá uno nuevo.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {destacados.map(p => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <Foto producto={p} className="h-14 w-14 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">{p.nombre}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {p.colegio?.nombre ?? 'Liso'} · {formatPrecio(p.precioOferta ?? p.precio)}
                    {!p.activo && <span className="text-amber-400"> · oculto en la tienda</span>}
                  </p>
                  <Link to={`/admin/productos?abrir=${p.id}`} className="text-xs text-blue-400 hover:text-blue-300">
                    Fotos y stock
                  </Link>
                </div>
                <button
                  onClick={() => cambiar(p, false)}
                  disabled={guardandoId === p.id}
                  className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-40"
                >
                  <X className="h-3.5 w-3.5" /> Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Agregar uno ya cargado */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Agregar un producto ya cargado</h2>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por producto, categoría o colegio..."
            className="input w-full pl-9"
          />
        </div>
        {termino && !candidatos.length && (
          <p className="px-1 text-sm text-zinc-500">Ningún producto coincide con la búsqueda.</p>
        )}
        <ul className="flex flex-col gap-2">
          {candidatos.map(p => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <Foto producto={p} className="h-12 w-12 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-100">{p.nombre}</p>
                <p className="truncate text-xs text-zinc-500">{p.colegio?.nombre ?? 'Liso'} · {formatPrecio(p.precioOferta ?? p.precio)}</p>
              </div>
              <button
                onClick={() => cambiar(p, true)}
                disabled={guardandoId === p.id}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-500/40 px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/10 disabled:opacity-40"
              >
                <Star className="h-3.5 w-3.5" /> Destacar
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
