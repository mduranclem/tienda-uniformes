import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { colegiosApi, productosApi, bannersApi } from '../services/api'
import ProductGrid from '../components/catalog/ProductGrid'
import FilterBar from '../components/catalog/FilterBar'
import { ShieldCheck, Truck, BadgeCheck, ChevronLeft, ChevronRight, Search } from 'lucide-react'

const PLACEHOLDER = 'https://placehold.co/800x800/18181b/3f3f46?text=+'

function HeroCarrusel({ slides }) {
  const [idx, setIdx] = useState(0)
  const total = slides.length

  // Auto-advance: usa update funcional para no capturar idx en el closure
  useEffect(() => {
    if (total < 2) return
    const t = setInterval(() => setIdx(i => (i + 1) % total), 4500)
    return () => clearInterval(t)
  }, [total])

  function anterior() { setIdx(i => (i - 1 + total) % total) }
  function siguiente() { setIdx(i => (i + 1) % total) }

  const slidesSrc = total > 0 ? slides : [{ url: PLACEHOLDER, titulo: '' }]
  const n = slidesSrc.length

  const bgUrl = slidesSrc[idx]?.url ?? PLACEHOLDER

  return (
    <section className="relative overflow-hidden">
      {/* Fondo imagen + overlay — solo mobile */}
      <div className="absolute inset-0 md:hidden">
        <img src={bgUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Gradiente inferior: funde la imagen hacia el negro de la página */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none z-[1] md:hidden" />

      <div className="relative max-w-6xl mx-auto px-4 pt-6 pb-28 md:pt-8 md:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

          {/* Texto */}
          <div className="relative z-10 flex flex-col gap-5 md:gap-6">
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-400 text-sm leading-none">⭐⭐⭐⭐⭐</span>
              <span className="text-xs text-zinc-300 md:text-zinc-400">Más de 50 colegios confían en nosotros</span>
            </div>
            <div className="inline-flex">
              <span className="bg-blue-600/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-600/30">
                Nueva colección disponible
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Uniformes oficiales y básicos lisos
            </h1>
            <p className="text-zinc-300 md:text-zinc-400 text-lg leading-relaxed">
              Remeras, buzos y más. Encontrá los modelos de tu institución o elegí entre nuestros lisos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/catalogo"
                className="inline-block bg-blue-600 text-white font-bold px-8 py-3 rounded-full hover:bg-blue-500 transition-colors text-base text-center"
              >
                Ver ropa colegial
              </Link>
              <Link
                to="/catalogo?colegioId=lisos"
                className="inline-block bg-zinc-800 text-zinc-200 font-semibold px-8 py-3 rounded-full hover:bg-zinc-700 transition-colors text-base text-center border border-zinc-700"
              >
                Ver lisos
              </Link>
            </div>

            {/* Trust signals — fila única en mobile, wrap en desktop */}
            <div className="flex flex-row gap-3 pt-2 md:flex-wrap md:gap-4">
              <div className="flex items-center gap-1 text-xs md:text-sm text-zinc-300 md:text-zinc-500">
                <Truck className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Envíos</span>
              </div>
              <div className="flex items-center gap-1 text-xs md:text-sm text-zinc-300 md:text-zinc-500">
                <BadgeCheck className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Calidad garantizada</span>
              </div>
              <div className="flex items-center gap-1 text-xs md:text-sm text-zinc-300 md:text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Pagos seguros</span>
              </div>
            </div>
          </div>

          {/* Carrusel — solo desktop */}
          <div className="hidden md:block relative">
            <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative">
              <div
                className="flex h-full transition-transform duration-500 ease-in-out"
                style={{ width: `${n * 100}%`, transform: `translateX(-${(idx * 100) / n}%)` }}
              >
                {slidesSrc.map((s, i) => (
                  <div key={i} className="h-full flex-shrink-0" style={{ width: `${100 / n}%` }}>
                    <img src={s.url} alt={s.titulo ?? ''} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {slidesSrc[idx]?.titulo && (
                <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2">
                  <p className="text-white text-sm font-medium truncate">{slidesSrc[idx].titulo}</p>
                </div>
              )}
            </div>

            {total > 1 && (
              <>
                <button onClick={anterior} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors z-10">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={siguiente} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors z-10">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {total > 1 && (
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`rounded-full transition-all ${i === idx ? 'bg-blue-500 w-4 h-1.5' : 'bg-zinc-700 w-1.5 h-1.5'}`}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const [novedades, setNovedades] = useState([])
  const [total, setTotal] = useState(null)
  const [colegios, setColegios] = useState([])
  const [banners, setBanners] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState({ colegioId: '', tipo: '', orden: '' })
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([colegiosApi.listar(), bannersApi.listar()])
      .then(([cols, bans]) => {
        setColegios(cols.data ?? cols)
        setBanners(bans)
      })
  }, [])

  useEffect(() => {
    setCargando(true)
    const params = { limit: 8 }
    if (filtros.colegioId && filtros.colegioId !== 'lisos') params.colegioId = filtros.colegioId
    if (filtros.colegioId === 'lisos') params.lisos = '1'
    if (filtros.tipo) params.tipo = filtros.tipo
    if (filtros.orden) params.orden = filtros.orden

    productosApi.listar(params)
      .then(r => {
        setNovedades(r.data ?? r)
        setTotal(r.total ?? null)
      })
      .finally(() => setCargando(false))
  }, [filtros])

  function handleBusqueda(e) {
    e.preventDefault()
    if (busqueda.trim()) navigate(`/catalogo?q=${encodeURIComponent(busqueda.trim())}`)
    else navigate('/catalogo')
  }

  function handleFiltros(nuevos) {
    setFiltros(prev => ({ ...prev, ...nuevos }))
  }

  return (
    <div>
      <HeroCarrusel slides={banners} />

      {/* Buscador principal */}
      <section className="max-w-2xl mx-auto px-4 -mt-4 relative z-10 mb-6">
        <form onSubmit={handleBusqueda}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
            <input
              type="search"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar remeras, buzos, colegio..."
              className="w-full pl-12 pr-32 py-3.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
            >
              Buscar
            </button>
          </div>
        </form>
      </section>

      {/* Novedades con filtros */}
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-100">Novedades</h2>
          <Link to="/catalogo" className="text-sm text-blue-400 font-medium hover:text-blue-300">
            Ver todo →
          </Link>
        </div>

        <div className="mb-4">
          <FilterBar colegios={colegios} filtros={filtros} onChange={handleFiltros} />
        </div>

        {!cargando && total !== null && (
          <p className="text-sm text-zinc-500 mb-4">
            {total === 0 ? 'Sin resultados' : `${total} producto${total !== 1 ? 's' : ''}`}
          </p>
        )}

        <ProductGrid productos={novedades} cargando={cargando} />
      </section>
    </div>
  )
}
