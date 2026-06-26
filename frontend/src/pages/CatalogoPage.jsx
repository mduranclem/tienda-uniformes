import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { colegiosApi, productosApi } from '../services/api'
import ProductGrid from '../components/catalog/ProductGrid'
import FilterBar from '../components/catalog/FilterBar'
import { Search, ChevronLeft, X } from 'lucide-react'

export default function CatalogoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [productos, setProductos] = useState([])
  const [colegios, setColegios] = useState([])
  const [total, setTotal] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [inputBusqueda, setInputBusqueda] = useState(searchParams.get('q') ?? '')

  const filtros = {
    colegioId: searchParams.get('colegioId') ?? '',
    tipo: searchParams.get('tipo') ?? '',
    orden: searchParams.get('orden') ?? '',
  }

  useEffect(() => {
    colegiosApi.listar().then(r => setColegios(r.data ?? r))
  }, [])

  // Debounce: actualiza la URL 500ms después de que el usuario deja de escribir
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams)
      if (inputBusqueda) next.set('q', inputBusqueda)
      else next.delete('q')
      setSearchParams(next, { replace: true })
    }, 500)
    return () => clearTimeout(t)
  }, [inputBusqueda])

  useEffect(() => {
    setCargando(true)
    const params = {}
    if (filtros.colegioId && filtros.colegioId !== 'lisos') params.colegioId = filtros.colegioId
    if (filtros.colegioId === 'lisos') params.lisos = '1'
    if (filtros.tipo) params.tipo = filtros.tipo
    if (filtros.orden) params.orden = filtros.orden
    const q = searchParams.get('q')
    if (q) params.q = q

    productosApi.listar(params)
      .then(r => {
        setProductos(r.data ?? r)
        setTotal(r.total ?? null)
      })
      .finally(() => setCargando(false))
  }, [searchParams])

  function handleFiltros(nuevos) {
    const next = new URLSearchParams(searchParams)
    Object.entries(nuevos).forEach(([k, v]) => {
      if (v) next.set(k, v)
      else next.delete(k)
    })
    setSearchParams(next)
  }

  function limpiarBusqueda() {
    setInputBusqueda('')
  }

  const hayFiltros = filtros.colegioId || filtros.tipo || filtros.orden || searchParams.get('q')

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors mb-4">
        <ChevronLeft className="w-4 h-4" />
        Volver al inicio
      </Link>
      <h1 className="text-2xl font-bold text-zinc-100 mb-4">Catálogo</h1>

      {/* Buscador — siempre visible */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
        <input
          type="search"
          value={inputBusqueda}
          onChange={e => setInputBusqueda(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full pl-9 pr-10 py-2.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {inputBusqueda && (
          <button
            onClick={limpiarBusqueda}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-4">
        <FilterBar colegios={colegios} filtros={filtros} onChange={handleFiltros} />
      </div>

      {/* Contador + limpiar filtros */}
      <div className="flex items-center justify-between mb-4 min-h-[1.5rem]">
        {!cargando && total !== null && (
          <p className="text-sm text-zinc-500">
            {total === 0 ? 'Sin resultados' : `${total} producto${total !== 1 ? 's' : ''}`}
          </p>
        )}
        {hayFiltros && (
          <button
            onClick={() => { setInputBusqueda(''); setSearchParams({}); }}
            className="text-xs text-blue-400 hover:text-blue-300 ml-auto"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <ProductGrid productos={productos} cargando={cargando} />
    </div>
  )
}
