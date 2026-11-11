import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bannersApi } from '../../services/api'

// Destacados de la portada: flyers de promos y liquidaciones que se cargan
// desde Admin > Destacados.
//
// La imagen va entera (sin recorte): son piezas con texto y precio, y cortarle
// un borde se come justo lo que hay que leer. En el celular cada una ocupa casi
// todo el ancho y asoma la siguiente, para que se note que se puede deslizar.

function Imagen({ slide, prioridad }) {
  return (
    <img
      src={slide.url}
      alt={slide.titulo ?? ''}
      loading={prioridad ? 'eager' : 'lazy'}
      fetchPriority={prioridad ? 'high' : undefined}
      decoding="async"
      className="block h-auto w-full rounded-2xl border border-zinc-800 bg-zinc-900"
    />
  )
}

function Destacado({ slide, prioridad }) {
  const imagen = <Imagen slide={slide} prioridad={prioridad} />
  const clases = 'block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marca-claro)]'
  if (!slide.enlace) return imagen
  // Las rutas de la tienda navegan sin recargar; las direcciones de afuera
  // abren en otra pestaña para no sacar al cliente de la tienda.
  return slide.enlace.startsWith('/')
    ? <Link to={slide.enlace} className={clases}>{imagen}</Link>
    : <a href={slide.enlace} target="_blank" rel="noopener noreferrer" className={clases}>{imagen}</a>
}

export default function Destacados() {
  const [slides, setSlides] = useState([])

  useEffect(() => {
    bannersApi.listar().then(setSlides).catch(() => setSlides([]))
  }, [])

  if (!slides.length) return null

  if (slides.length === 1) {
    return (
      <section aria-label="Destacados" className="mx-auto max-w-md px-4 pt-4">
        <Destacado slide={slides[0]} prioridad />
      </section>
    )
  }

  return (
    <section aria-label="Destacados" className="mx-auto max-w-6xl pt-4">
      <ul className="flex snap-x snap-mandatory items-start gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 scrollbar-hide">
        {slides.map((slide, i) => (
          <li key={slide.id} className="w-[85%] shrink-0 snap-start sm:w-[45%] lg:w-[calc((100%-1.5rem)/3)]">
            <Destacado slide={slide} prioridad={i === 0} />
          </li>
        ))}
      </ul>
    </section>
  )
}
