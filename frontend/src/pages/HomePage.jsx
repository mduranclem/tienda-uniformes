import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { colegiosApi, productosApi, bannersApi } from '../services/api'
import ProductGrid from '../components/catalog/ProductGrid'
import { ShieldCheck, Truck, BadgeCheck, ChevronLeft, ChevronRight } from 'lucide-react'

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

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-14 sm:pt-8 sm:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

          {/* Texto */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-400 text-sm leading-none">⭐⭐⭐⭐⭐</span>
              <span className="text-xs text-zinc-400">Más de 50 colegios confían en nosotros</span>
            </div>
            <div className="inline-flex">
              <span className="bg-blue-600/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-600/30">
                Nueva colección disponible
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Uniformes oficiales y básicos lisos
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
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

            {/* Trust signals */}
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                <Truck className="w-4 h-4 text-zinc-600" />
                Envíos a todo el país
              </div>
              <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                <BadgeCheck className="w-4 h-4 text-zinc-600" />
                Calidad garantizada
              </div>
              <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                <ShieldCheck className="w-4 h-4 text-zinc-600" />
                Pagos seguros
              </div>
            </div>
          </div>

          {/* Carrusel */}
          <div className="relative">
            {/* Viewport con overflow hidden */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative">
              {/* Track: cada slide ocupa el 100% del viewport */}
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

              {/* Texto overlay */}
              {slidesSrc[idx]?.titulo && (
                <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2">
                  <p className="text-white text-sm font-medium truncate">{slidesSrc[idx].titulo}</p>
                </div>
              )}
            </div>

            {/* Flechas */}
            {total > 1 && (
              <>
                <button
                  onClick={anterior}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={siguiente}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Dots */}
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
  const [colegios, setColegios] = useState([])
  const [banners, setBanners] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    Promise.all([
      productosApi.listar({ limit: 8 }),
      colegiosApi.listar(),
      bannersApi.listar(),
    ])
      .then(([prods, cols, bans]) => {
        setNovedades(prods.data ?? prods)
        setColegios(cols.data ?? cols)
        setBanners(bans)
      })
      .finally(() => setCargando(false))
  }, [])

  return (
    <div>
      <HeroCarrusel slides={banners} />

      {/* Colegios */}
      {colegios.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">Por institución</h2>
          <div className="flex flex-wrap gap-2">
            {colegios.map(c => (
              <Link
                key={c.id}
                to={`/catalogo?colegioId=${c.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-sm font-medium text-zinc-300 hover:border-blue-500 hover:text-blue-400 transition-colors"
              >
                {c.logo && <img src={c.logo} alt="" className="w-5 h-5 rounded-full object-cover" />}
                {c.nombre}
              </Link>
            ))}
            <Link
              to="/catalogo?colegioId=lisos"
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-sm font-medium text-zinc-300 hover:border-blue-500 hover:text-blue-400 transition-colors"
            >
              Lisos
            </Link>
          </div>
        </section>
      )}

      {/* Novedades */}
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-100">Novedades</h2>
          <Link to="/catalogo" className="text-sm text-blue-400 font-medium hover:text-blue-300">
            Ver todo →
          </Link>
        </div>
        <ProductGrid productos={novedades} cargando={cargando} />
      </section>
    </div>
  )
}
