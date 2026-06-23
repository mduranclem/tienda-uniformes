import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { colegiosApi, productosApi } from '../services/api'
import ProductGrid from '../components/catalog/ProductGrid'
import FilterBar from '../components/catalog/FilterBar'
import { Search } from 'lucide-react'

export default function CatalogoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [productos, setProductos] = useState([])
  const [colegios, setColegios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState(searchParams.get('q') ?? '')

  const filtros = {
    colegioId: searchParams.get('colegioId') ?? '',
    tipo: searchParams.get('tipo') ?? '',
  }

  useEffect(() => {
    colegiosApi.listar().then(r => setColegios(r.data ?? r))
  }, [])

  useEffect(() => {
    setCargando(true)
    const params = {}
    if (filtros.colegioId && filtros.colegioId !== 'lisos') params.colegioId = filtros.colegioId
    if (filtros.colegioId === 'lisos') params.lisos = '1'
    if (filtros.tipo) params.tipo = filtros.tipo
    if (busqueda) params.q = busqueda

    productosApi.listar(params)
      .then(r => setProductos(r.data ?? r))
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

  function handleBusqueda(e) {
    e.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (busqueda) next.set('q', busqueda)
    else next.delete('q')
    setSearchParams(next)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Catálogo</h1>

      {/* Buscador mobile */}
      <form onSubmit={handleBusqueda} className="sm:hidden mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="search"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {/* Filtros */}
      <div className="mb-6">
        <FilterBar colegios={colegios} filtros={filtros} onChange={handleFiltros} />
      </div>

      {/* Resultados */}
      <ProductGrid productos={productos} cargando={cargando} />
    </div>
  )
}
