import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { colegiosApi, productosApi } from '../services/api'
import ProductGrid from '../components/catalog/ProductGrid'
import ProductCard from '../components/catalog/ProductCard'
import FotoProducto from '../components/catalog/FotoProducto'
import ColegioSelector from '../components/home/ColegioSelector'
import { useRevelar } from '../lib/useRevelar'
import { formatPrecio, titleCase, posicionTalle } from '../lib/utils'
import { Truck, Store, Star, ChevronLeft, ChevronRight, ArrowRight, Shirt, Landmark, PackageCheck } from 'lucide-react'
import { useSwipe } from '../lib/useSwipe'

// ── Hero ──────────────────────────────────────────────────────────────────────
// El carrusel de fotos sigue siendo el fondo de la portada, pero el titular y
// el buscador de colegio van encima, en un solo momento: antes eran tres
// bloques sueltos (fotos, texto, tarjetas) y el primero no decía nada.
//
// El carrusel va en una capa con overflow-hidden y el texto en otra, fuera de
// ella: así la lista del buscador de colegio puede desplegarse por debajo del
// hero sin quedar recortada.
function Hero({ slides, colegios }) {
  const [idx, setIdx] = useState(0)
  const total = slides.length

  // Auto-avance: update funcional para no capturar idx en el closure
  useEffect(() => {
    if (total < 2) return
    const t = setInterval(() => setIdx(i => (i + 1) % total), 5000)
    return () => clearInterval(t)
  }, [total])

  function siguiente() { setIdx(i => (i + 1) % total) }
  function anterior() { setIdx(i => (i - 1 + total) % total) }
  const swipe = useSwipe(siguiente, anterior)

  return (
    <section className="relative isolate z-20">
      <div
        className="absolute inset-0 -z-10 overflow-hidden bg-zinc-900"
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        {total === 0 && <div className="absolute inset-0 animate-pulse bg-zinc-900" />}
        {slides.map((s, i) => (
          <img
            key={s.id ?? i}
            src={s.url}
            alt=""
            loading={i === 0 ? undefined : 'lazy'}
            fetchPriority={i === 0 ? 'high' : undefined}
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover object-top transition-[opacity,transform] duration-[1200ms] ease-out lg:object-[70%_20%] ${
              i === idx ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'
            }`}
          />
        ))}
        {/* Velo: oscuro abajo en mobile (el texto va al pie), y a la izquierda
            en escritorio, donde el texto ocupa la primera mitad. */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/55 to-zinc-950/10 lg:bg-gradient-to-r lg:from-zinc-950/95 lg:via-zinc-950/55 lg:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>

      <div className="mx-auto flex min-h-[520px] w-full max-w-6xl flex-col justify-end px-4 pb-8 pt-40 sm:min-h-[560px] lg:min-h-[600px] lg:justify-center lg:pb-16 lg:pt-16">
        <div className="max-w-xl lg:max-w-3xl">
          <h1 className="titular animar-entrada text-[2.9rem] text-white sm:text-6xl lg:text-7xl">
            Uniformes de tu colegio
            <span className="block text-[var(--marca-claro)]">y básicos lisos</span>
          </h1>
          <p className="animar-entrada-2 mt-4 max-w-md text-base leading-relaxed text-zinc-300">
            Remeras, chombas, buzos y camperas con el escudo de tu institución, a precio de promo.
          </p>

          <div className="animar-entrada-3 mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-sm">
              <ColegioSelector colegios={colegios} />
            </div>
            <Link
              to="/catalogo?colegioId=lisos"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/25 bg-zinc-950/40 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-[background-color,transform] hover:bg-white/10 active:scale-[0.98]"
            >
              Ver lisos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {total > 1 && (
          <div className="mt-8 flex items-center gap-3 lg:absolute lg:bottom-8 lg:right-[max(1rem,calc((100vw-72rem)/2+1rem))] lg:mt-0">
            <button onClick={anterior} aria-label="Foto anterior"
              className="hidden rounded-full border border-white/15 bg-zinc-950/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-zinc-950/80 sm:block">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
            <button onClick={siguiente} aria-label="Foto siguiente"
              className="hidden rounded-full border border-white/15 bg-zinc-950/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-zinc-950/80 sm:block">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Entradas: Colegial / Lisos + beneficios ───────────────────────────────────
function Entrada({ to, titulo, texto, img, className = '' }) {
  return (
    <Link
      to={to}
      className={`group relative isolate flex min-h-44 flex-col justify-end overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:min-h-56
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marca-claro)] ${className}`}
    >
      {img && (
        <img src={img} alt="" loading="lazy" decoding="async"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.05]" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-zinc-950/95 via-zinc-950/40 to-transparent" />
      <span className="titular text-3xl text-white sm:text-4xl">{titulo}</span>
      <span className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-300">
        {texto}
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  )
}

function Entradas({ imgColegial, imgLisos }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 lg:-mt-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Entrada to="/catalogo?colegial=1" titulo="Colegial" texto="Con el escudo de tu institución" img={imgColegial} />
        <Entrada to="/catalogo?colegioId=lisos" titulo="Lisos" texto="Sin escudo, para todos los días" img={imgLisos} />
      </div>

      <ul className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-zinc-300 sm:mt-6 sm:text-sm lg:flex lg:justify-start lg:gap-8 lg:text-left">
        <li className="flex flex-col items-center gap-1.5 lg:flex-row lg:gap-2">
          <Truck className="h-4 w-4 shrink-0 text-[var(--marca-claro)]" />
          Envío gratis desde 2 unidades
        </li>
        <li className="flex flex-col items-center gap-1.5 lg:flex-row lg:gap-2">
          <Store className="h-4 w-4 shrink-0 text-[var(--marca-claro)]" />
          Retiro sin cargo en 3 locales
        </li>
        <li className="flex flex-col items-center gap-1.5 lg:flex-row lg:gap-2">
          <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
          Más de 30 colegios de Rosario
        </li>
      </ul>
    </section>
  )
}

// ── Encabezado de sección ─────────────────────────────────────────────────────
function Encabezado({ titulo, subtitulo, verTodosHref }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="titular text-4xl text-zinc-50 md:text-5xl">{titulo}</h2>
        {subtitulo && <p className="mt-2 text-sm text-zinc-400">{subtitulo}</p>}
      </div>
      {verTodosHref && (
        <Link
          to={verTodosHref}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[var(--marca-claro)]"
        >
          Ver todos
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}

// ── Destacados ────────────────────────────────────────────────────────────────
// Con uno o dos productos, cada uno se muestra en grande: imagen entera (suelen
// ser flyers con texto) y la info al lado. Con más, una fila que se desliza.
function precioDe(producto) {
  const oferta = producto.precioOferta && Number(producto.precioOferta) < Number(producto.precio)
  return { precio: Number(oferta ? producto.precioOferta : producto.precio), lista: oferta ? Number(producto.precio) : null }
}

function DestacadoGrande({ producto }) {
  const ref = useRevelar()
  const { precio, lista } = precioDe(producto)
  const talles = [...new Set((producto.variantes ?? []).filter(v => v.stock > 0).map(v => v.talle))]
    .sort((a, b) => posicionTalle(a) - posicionTalle(b))
  return (
    <Link
      ref={ref}
      to={`/producto/${producto.id}`}
      className="revelar group grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-10"
    >
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <FotoProducto
          url={producto.imagenes?.[0]?.url}
          alt={producto.nombre}
          className="aspect-square w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div>
        {producto.colegio && <p className="text-sm font-medium text-blue-400">{producto.colegio.nombre}</p>}
        <h3 className="titular mt-2 text-4xl text-white sm:text-5xl">{titleCase(producto.nombre)}</h3>
        <div className="mt-5 flex items-baseline gap-3">
          <span className={`text-3xl font-extrabold tracking-tight ${lista ? 'text-red-400' : 'text-white'}`}>{formatPrecio(precio)}</span>
          {lista && <span className="text-base text-zinc-500 line-through">{formatPrecio(lista)}</span>}
        </div>
        {talles.length > 0 && (
          <p className="mt-2 text-sm text-zinc-400">
            {talles.length === 1 ? `Talle ${talles[0]}` : `Talles ${talles[0]} al ${talles[talles.length - 1]}`}
          </p>
        )}
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-[background-color,transform] group-hover:bg-blue-500 group-active:scale-[0.98]">
          Ver producto
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}

function Destacados({ productos }) {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <Encabezado
          titulo="Destacados"
          subtitulo="Promos y liquidaciones de la temporada"
          verTodosHref={productos.length > 2 ? '/catalogo?destacados=1' : null}
        />
        {productos.length <= 2 ? (
          <div className="flex flex-col gap-12">
            {productos.map(p => <DestacadoGrande key={p.id} producto={p} />)}
          </div>
        ) : (
          <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:gap-4">
            {productos.map(p => (
              <li key={p.id} className="flex w-[68%] shrink-0 snap-start sm:w-[40%] lg:w-[calc((100%-3rem)/4)]">
                <ProductCard producto={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

// ── Cómo comprar ──────────────────────────────────────────────────────────────
// La tienda ya no tiene pasarela: conviene contar antes del checkout cómo se
// paga, para que la transferencia no sorprenda al final.
const PASOS = [
  { icono: Shirt, titulo: 'Elegí tu prenda', texto: 'Buscá tu colegio, elegí la prenda, el talle y el color.' },
  { icono: Landmark, titulo: 'Pagá como prefieras', texto: 'Por transferencia con los datos que te mostramos, o en el local al retirar.' },
  { icono: PackageCheck, titulo: 'Recibilo o retiralo', texto: 'Envío a todo el país, o retiro sin cargo en cualquiera de nuestros 3 locales.' },
]

function ComoComprar() {
  const ref = useRevelar()
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <h2 className="titular text-4xl text-zinc-50 md:text-5xl">Cómo comprar</h2>
      <ol ref={ref} className="revelar mt-8 grid gap-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-zinc-800">
        {PASOS.map(({ icono: Icono, titulo, texto }) => (
          <li key={titulo} className="flex gap-4 md:flex-col md:gap-3 md:px-8 md:first:pl-0 md:last:pr-0">
            <Icono className="h-7 w-7 shrink-0 text-[var(--marca-claro)]" strokeWidth={1.75} />
            <div>
              <p className="font-semibold text-zinc-100">{titulo}</p>
              <p className="mt-1 max-w-[34ch] text-sm leading-relaxed text-zinc-400">{texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function SeccionProductos({ titulo, subtitulo, productos, cargando, verTodosHref }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <Encabezado titulo={titulo} subtitulo={subtitulo} verTodosHref={verTodosHref} />
      <ProductGrid productos={productos} cargando={cargando} />
    </section>
  )
}

export default function HomePage() {
  const [colegios, setColegios] = useState([])
  const [novedades, setNovedades] = useState([])
  const [colegiales, setColegiales] = useState([])
  const [lisos, setLisos] = useState([])
  const [destacados, setDestacados] = useState([])
  const [cargandoColegiales, setCargandoColegiales] = useState(true)
  const [cargandoLisos, setCargandoLisos] = useState(true)

  useEffect(() => {
    colegiosApi.listar().then(r => setColegios(r.data ?? r))

    // Fotos del hero: productos activos más recientes (mismo criterio que antes)
    productosApi.listar({ limit: 8 }).then(r => {
      const data = r.data ?? r
      setNovedades(data.filter(p => p.imagenes?.[0]?.url))
    })

    productosApi.listar({ destacados: '1', limit: 8 })
      .then(r => setDestacados(r.data ?? r))
      .catch(() => setDestacados([]))

    productosApi.listar({ colegial: '1', limit: 8 })
      .then(r => setColegiales(r.data ?? r))
      .finally(() => setCargandoColegiales(false))

    productosApi.listar({ lisos: '1', limit: 4 })
      .then(r => setLisos(r.data ?? r))
      .finally(() => setCargandoLisos(false))
  }, [])

  const slides = novedades.map(p => ({ id: p.id, url: p.imagenes[0].url, titulo: p.nombre }))
  const imgColegial = colegiales[0]?.imagenes?.[0]?.url
  const imgLisos = lisos[0]?.imagenes?.[0]?.url

  return (
    <div>
      <Hero slides={slides} colegios={colegios} />
      <Entradas imgColegial={imgColegial} imgLisos={imgLisos} />

      {/* Sin productos marcados como destacados la sección no aparece. */}
      {destacados.length > 0 && <div className="mt-12 md:mt-16"><Destacados productos={destacados} /></div>}

      <SeccionProductos
        titulo="Ropa colegial"
        subtitulo="Lo último de cada institución"
        productos={colegiales}
        cargando={cargandoColegiales}
        verTodosHref="/catalogo?colegial=1"
      />

      <div>
        <ComoComprar />
      </div>

      <SeccionProductos
        titulo="Básicos lisos"
        subtitulo="Remeras y buzos sin escudo, para todos los días"
        productos={lisos}
        cargando={cargandoLisos}
        verTodosHref="/catalogo?colegioId=lisos"
      />
    </div>
  )
}
