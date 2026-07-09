import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { colegiosApi, productosApi } from '../services/api'
import ProductGrid from '../components/catalog/ProductGrid'
import ColegioSelector from '../components/home/ColegioSelector'
import { Sparkles } from 'lucide-react'

function HeroCarrusel({ slides, colegios }) {
  const [idx, setIdx] = useState(0)
  const total = slides.length

  // Auto-advance: usa update funcional para no capturar idx en el closure
  useEffect(() => {
    if (total < 2) return
    const t = setInterval(() => setIdx(i => (i + 1) % total), 4500)
    return () => clearInterval(t)
  }, [total])

  return (
    <section className="bg-zinc-950 flex flex-col gap-2.5 pt-3 pb-4">

      {/* Carrusel de fotos de producto — full-bleed, bajo, fade */}
      <div className="relative w-full h-[180px] sm:h-[250px] lg:h-[350px] overflow-hidden bg-zinc-900">
        {total === 0 && <div className="absolute inset-0 bg-zinc-900 animate-pulse" />}
        {slides.map((s, i) => (
          <img
            key={s.id ?? i}
            src={s.url}
            alt={s.titulo ?? ''}
            loading={i === 0 ? undefined : 'lazy'}
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out ${
              i === idx ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        {total > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Ver foto ${i + 1}`}
                className={`rounded-full transition-all ${i === idx ? 'bg-white w-4 h-1.5' : 'bg-white/50 w-1.5 h-1.5'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selector de colegio — compacto */}
      <div className="px-4">
        <ColegioSelector colegios={colegios} compact />
      </div>

      {/* Botones de categoría */}
      <div className="px-4 flex flex-row gap-3">
        <Link
          to="/catalogo?colegioId=lisos"
          className="flex-1 min-h-[48px] flex items-center justify-center rounded-xl bg-white text-zinc-900 font-bold text-base border border-zinc-200 hover:bg-zinc-100 transition-colors"
        >
          Lisos
        </Link>
        <Link
          to="/catalogo?colegial=1"
          className="flex-1 min-h-[48px] flex items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-base hover:bg-blue-500 transition-colors"
        >
          Colegial
        </Link>
      </div>

      {/* Trust signals — una sola línea compacta */}
      <p className="px-4 text-center text-[10px] sm:text-xs text-zinc-500 whitespace-nowrap overflow-x-auto">
        Envío gratis en Rosario · Calidad garantizada · Pagos seguros
      </p>
    </section>
  )
}

function SeccionProductos({ titulo, subtitulo, productos, cargando, verTodosHref }) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-10 md:py-12">
      <div className="flex items-end justify-between gap-4 mb-1">
        <h2 className="text-xl md:text-2xl font-bold text-zinc-100">{titulo}</h2>
        <Link to={verTodosHref} className="text-sm text-blue-400 font-medium hover:text-blue-300 whitespace-nowrap">
          Ver todos →
        </Link>
      </div>
      <p className="text-sm text-zinc-500 mb-5">{subtitulo}</p>
      <ProductGrid productos={productos} cargando={cargando} />
    </section>
  )
}

export default function HomePage() {
  const [colegios, setColegios] = useState([])
  const [novedades, setNovedades] = useState([])
  const [colegiales, setColegiales] = useState([])
  const [lisos, setLisos] = useState([])
  const [cargandoColegiales, setCargandoColegiales] = useState(true)
  const [cargandoLisos, setCargandoLisos] = useState(true)

  useEffect(() => {
    colegiosApi.listar().then(r => setColegios(r.data ?? r))

    // Fotos del hero: productos activos más recientes (mismo criterio que antes)
    productosApi.listar({ limit: 8 }).then(r => {
      const data = r.data ?? r
      setNovedades(data.filter(p => p.imagenes?.[0]?.url))
    })

    productosApi.listar({ colegial: '1', limit: 6 })
      .then(r => setColegiales(r.data ?? r))
      .finally(() => setCargandoColegiales(false))

    productosApi.listar({ lisos: '1', limit: 6 })
      .then(r => setLisos(r.data ?? r))
      .finally(() => setCargandoLisos(false))
  }, [])

  const slides = novedades.map(p => ({ id: p.id, url: p.imagenes[0].url, titulo: p.nombre }))

  return (
    <div>
      <HeroCarrusel slides={slides} colegios={colegios} />

      <SeccionProductos
        titulo="Ropa Colegial"
        subtitulo="Encontrá el uniforme de tu institución"
        productos={colegiales}
        cargando={cargandoColegiales}
        verTodosHref="/catalogo?colegial=1"
      />

      <SeccionProductos
        titulo="Básicos Lisos"
        subtitulo="Remeras y buzos sin escudo, para todos los días"
        productos={lisos}
        cargando={cargandoLisos}
        verTodosHref="/catalogo?colegioId=lisos"
      />

      {/* Banner de cierre — 20% OFF primera compra */}
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <div className="bg-gradient-to-r from-blue-600/20 to-emerald-600/20 border border-blue-500/20 rounded-2xl px-6 py-8 md:py-10 flex flex-col items-center text-center gap-3">
          <Sparkles className="w-7 h-7 text-blue-400" />
          <h2 className="text-xl md:text-2xl font-bold text-zinc-50">20% OFF en tu primera compra</h2>
          <p className="text-sm text-zinc-400 max-w-md">
            El descuento se aplica automáticamente al finalizar tu primera compra.
          </p>
          <Link
            to="/catalogo"
            className="inline-block bg-blue-600 text-white font-bold px-8 py-3 rounded-full hover:bg-blue-500 transition-colors text-base mt-1"
          >
            Comprar ahora
          </Link>
        </div>
      </section>
    </div>
  )
}
