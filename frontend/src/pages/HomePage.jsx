import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { colegiosApi, productosApi, primeraCompraApi } from '../services/api'
import ProductGrid from '../components/catalog/ProductGrid'
import ColegioSelector from '../components/home/ColegioSelector'
import { useAuth } from '../context/AuthContext'
import { Sparkles, Truck, Store, Lock, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useSwipe } from '../lib/useSwipe'

function CategoriaCard({ to, label, descripcion, img, fallbackBg }) {
  return (
    <Link
      to={to}
      className={`group relative flex-1 overflow-hidden rounded-2xl ${fallbackBg}
                  h-40 sm:h-52
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marca-claro)]`}
    >
      {img && (
        <img
          src={img}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]"
        />
      )}
      {/* Degradado desde abajo: el texto se apoya en la zona oscura en vez de
          velar la foto entera con una capa plana. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <span className="titular block text-2xl text-white sm:text-3xl">{label}</span>
        <span className="mt-1 block text-xs font-medium text-white/70">{descripcion}</span>
      </div>
    </Link>
  )
}

function HeroCarrusel({ slides, imgLisos, imgColegial }) {
  const [idx, setIdx] = useState(0)
  const total = slides.length

  // Auto-advance: usa update funcional para no capturar idx en el closure
  useEffect(() => {
    if (total < 2) return
    const t = setInterval(() => setIdx(i => (i + 1) % total), 4500)
    return () => clearInterval(t)
  }, [total])

  function siguiente() { setIdx(i => (i + 1) % total) }
  function anterior() { setIdx(i => (i - 1 + total) % total) }
  const swipe = useSwipe(siguiente, anterior)

  return (
    <section className="bg-zinc-950 flex flex-col gap-2 pt-3 pb-4">

      {/* Carrusel de fotos de producto — full-bleed, bajo, fade */}
      {/* Las fotos son verticales, de chicos de cuerpo entero, y el contenedor
          es apaisado. En mobile se ancla arriba para que queden cara y torso —
          lo que muestra la prenda— en vez de recortar por el medio. En desktop
          hay alto suficiente para centrar. */}
      <div
        className="relative h-[300px] w-full overflow-hidden bg-zinc-900 sm:h-[380px] lg:h-[450px]"
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        {total === 0 && <div className="absolute inset-0 bg-zinc-900 animate-pulse" />}
        {slides.map((s, i) => (
          <img
            key={s.id ?? i}
            src={s.url}
            alt={s.titulo ?? ''}
            loading={i === 0 ? undefined : 'lazy'}
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 ease-in-out lg:object-center ${
              i === idx ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        {total > 1 && (
          <>
            <button
              onClick={anterior}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={siguiente}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/55 px-2.5 py-1.5 backdrop-blur-sm">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  className={`rounded-full transition-all ${i === idx ? 'bg-white w-4 h-1.5' : 'bg-white/50 w-1.5 h-1.5'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Presentación — el titular a tamaño de cartel, que es la voz que ya
          tiene el logo. Una sola entrada animada en toda la página. */}
      {/* La foto va de borde a borde, pero el texto se alinea con la misma
          grilla que el resto de la página. */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-7 pb-2">
        {/* Gris con un punto de marca: informa sin pelearle a la barra violeta
            del 20%, que es la que tiene que ganar la atención. */}
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-[11px] font-medium text-zinc-300">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--marca-claro)]" />
          Temporada 2026 · Nuevos modelos disponibles
        </span>

        {/* Inter y no Anton: Anton es una tipografía de cartel dibujada para
            mayúsculas y en caja mixta pierde bastante. Anton queda para los
            títulos de sección, que sí van en mayúsculas. */}
        <h1 className="animar-entrada mt-4 text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
          Uniformes oficiales
          <span className="block text-[var(--marca-claro)]">y básicos lisos</span>
        </h1>
        <p className="mt-3 max-w-md text-sm text-zinc-400 sm:text-base">
          Remeras, buzos y más. Encontrá los modelos de tu institución o elegí entre nuestros lisos.
        </p>
      </div>

      {/* Cards de categoría */}
      <div className="mx-auto flex w-full max-w-6xl flex-row gap-3 px-4 pt-3">
        <CategoriaCard
          to="/catalogo?colegioId=lisos"
          label="Lisos"
          descripcion="Sin escudo, para todos los días"
          img={imgLisos}
          fallbackBg="bg-zinc-800"
        />
        <CategoriaCard
          to="/catalogo?colegial=1"
          label="Colegial"
          descripcion="El uniforme de tu institución"
          img={imgColegial}
          fallbackBg="bg-[var(--marca)]"
        />
      </div>

      {/* Trust signals — una sola línea compacta */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-1.5 overflow-x-auto whitespace-nowrap px-4 pt-1 text-[10px] text-emerald-400 sm:text-xs">
        <span className="flex items-center gap-1">
          <Truck className="w-3 h-3 flex-shrink-0" />
          Envío gratis desde 2 prendas
        </span>
        <span className="text-zinc-600">·</span>
        {/* Reemplaza a "Calidad garantizada": era una promesa genérica y este
            lugar es de los pocos que se ven sin scrollear. */}
        <span className="flex items-center gap-1 font-semibold text-violet-300">
          <Store className="w-3 h-3 flex-shrink-0" />
          20% OFF retirando en el local
        </span>
        <span className="text-zinc-600">·</span>
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 flex-shrink-0" />
          Pagos seguros
        </span>
      </div>

      {/* Prueba social. El número sale de los colegios realmente cargados
          (35 hoy): si alguien cuenta los del selector, la cifra tiene que
          sostenerse. */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-1.5 px-4 pt-2 text-[11px] font-medium text-zinc-400 sm:text-xs">
        <Star className="h-3.5 w-3.5 flex-shrink-0 fill-amber-400 text-amber-400" />
        Más de 30 colegios de Rosario confían en nosotros
      </div>
    </section>
  )
}

function SeccionProductos({ titulo, subtitulo, productos, cargando, verTodosHref, colegios }) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-10 md:py-12">
      <div className="mb-1 flex items-end justify-between gap-4">
        <h2 className="titular text-3xl text-zinc-50 md:text-4xl">{titulo}</h2>
        <Link
          to={verTodosHref}
          className="whitespace-nowrap border-b border-transparent text-sm font-semibold text-[var(--marca-claro)] transition-colors hover:border-current"
        >
          Ver todos
        </Link>
      </div>
      <p className="mb-6 text-sm text-zinc-500">{subtitulo}</p>
      {colegios && (
        <div className="mb-5">
          <ColegioSelector colegios={colegios} />
        </div>
      )}
      <ProductGrid productos={productos} cargando={cargando} />
    </section>
  )
}

export default function HomePage() {
  const { usuario } = useAuth()
  const [colegios, setColegios] = useState([])
  const [novedades, setNovedades] = useState([])
  const [colegiales, setColegiales] = useState([])
  const [lisos, setLisos] = useState([])
  const [cargandoColegiales, setCargandoColegiales] = useState(true)
  const [cargandoLisos, setCargandoLisos] = useState(true)
  // Sin sesión no tenemos el email hasta el checkout: se muestra siempre.
  const [mostrarBannerBienvenida, setMostrarBannerBienvenida] = useState(true)

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

  // Con sesión: ocultar el banner si el usuario ya usó el 20% de bienvenida.
  useEffect(() => {
    if (!usuario?.email) { setMostrarBannerBienvenida(true); return }
    primeraCompraApi.verificar(usuario.email)
      .then(r => setMostrarBannerBienvenida(r.aplica))
      .catch(() => setMostrarBannerBienvenida(true))
  }, [usuario])

  const slides = novedades.map(p => ({ id: p.id, url: p.imagenes[0].url, titulo: p.nombre }))
  const imgColegial = colegiales[0]?.imagenes?.[0]?.url
  const imgLisos = lisos[0]?.imagenes?.[0]?.url

  return (
    <div>
      <HeroCarrusel slides={slides} imgLisos={imgLisos} imgColegial={imgColegial} />

      <SeccionProductos
        titulo="Ropa Colegial"
        subtitulo="Encontrá el uniforme de tu institución"
        productos={colegiales}
        cargando={cargandoColegiales}
        verTodosHref="/catalogo?colegial=1"
        colegios={colegios}
      />

      <SeccionProductos
        titulo="Básicos Lisos"
        subtitulo="Remeras y buzos sin escudo, para todos los días"
        productos={lisos}
        cargando={cargandoLisos}
        verTodosHref="/catalogo?colegioId=lisos"
      />

      {/* Banner de cierre — 20% OFF primera compra */}
      {mostrarBannerBienvenida && (
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
      )}
    </div>
  )
}
