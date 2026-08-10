import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, School, Shirt, MessageCircle } from 'lucide-react'
import { normalizarTexto } from '../../lib/utils'
import { whatsappUrl } from '../../lib/contacto'
import { evento } from '../../lib/analitica'
import { trackContact } from '../../lib/metaPixel'

const OPCION_LISOS = { id: 'lisos', nombre: 'Básicos lisos (sin colegio)' }

export function guardarUltimoColegio(colegio) {
  try {
    localStorage.setItem('ultimoColegio', JSON.stringify({ id: colegio.id, nombre: colegio.nombre }))
  } catch { /* localStorage puede no estar disponible */ }
}

export function leerUltimoColegio() {
  try {
    const raw = localStorage.getItem('ultimoColegio')
    if (!raw) return null
    const c = JSON.parse(raw)
    return c?.id && c?.nombre ? c : null
  } catch {
    return null
  }
}

// Combobox con búsqueda para elegir colegio. Al elegir, navega al catálogo
// filtrado y recuerda la elección para la próxima visita.
export default function ColegioSelector({ colegios, compact = false }) {
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [activa, setActiva] = useState(0)
  const contRef = useRef(null)
  const listaRef = useRef(null)
  const navigate = useNavigate()

  const opciones = [...colegios, OPCION_LISOS].filter(c =>
    normalizarTexto(c.nombre).includes(normalizarTexto(query))
  )

  useEffect(() => { setActiva(0) }, [query, abierto])

  // Medición de búsquedas.
  //
  // El buscador filtra con cada tecla, así que medir "la búsqueda" tal cual
  // pasa llenaría la herramienta de basura: escribir "San Antonio" generaría
  // once eventos, diez de ellos con términos incompletos. Se espera a que la
  // persona deje de tipear y recién ahí se registra lo que quedó escrito.
  //
  // El mínimo de tres letras evita medir tanteos de una o dos.
  const ultimoMedido = useRef(null)
  const hayResultados = opciones.length > 0

  useEffect(() => {
    const termino = query.trim()
    if (termino.length < 3) return

    const t = setTimeout(() => {
      // La misma búsqueda no se cuenta dos veces: borrar una letra y volver a
      // escribirla es la misma intención, no dos.
      const clave = `${normalizarTexto(termino)}|${hayResultados}`
      if (ultimoMedido.current === clave) return
      ultimoMedido.current = clave

      evento(
        hayResultados ? 'busqueda_colegio_exitosa' : 'busqueda_colegio_sin_resultado',
        { colegio_buscado: termino }
      )
    }, 800)

    return () => clearTimeout(t)
  }, [query, hayResultados])

  // Cerrar al tocar/clickear afuera
  useEffect(() => {
    function handler(e) {
      if (contRef.current && !contRef.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [])

  // Mantener visible la opción activa al navegar con teclado
  useEffect(() => {
    listaRef.current?.children[activa]?.scrollIntoView({ block: 'nearest' })
  }, [activa])

  function elegir(colegio) {
    guardarUltimoColegio(colegio)
    setAbierto(false)
    navigate(`/catalogo?colegioId=${encodeURIComponent(colegio.id)}`)
  }

  function onKeyDown(e) {
    if (!abierto && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setAbierto(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiva(i => Math.min(i + 1, opciones.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiva(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (opciones[activa]) elegir(opciones[activa])
    } else if (e.key === 'Escape') {
      setAbierto(false)
    }
  }

  return (
    <div ref={contRef} className="relative w-full sm:max-w-md">
      <label htmlFor="colegio-selector" className={compact ? 'sr-only' : 'block text-sm font-semibold text-white mb-1.5'}>
        ¿De qué colegio sos?
      </label>
      <div className="relative">
        <School className={`absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
        <input
          id="colegio-selector"
          type="text"
          role="combobox"
          aria-expanded={abierto}
          aria-controls="colegio-listbox"
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          onChange={e => { setQuery(e.target.value); setAbierto(true) }}
          onFocus={() => setAbierto(true)}
          onKeyDown={onKeyDown}
          placeholder={compact ? '¿De qué colegio sos?' : 'Buscá tu colegio…'}
          className={`w-full pl-11 pr-10 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            compact ? 'py-2.5 text-sm' : 'py-3.5 text-base shadow-lg'
          }`}
        />
        <ChevronDown
          className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none transition-transform ${abierto ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Sin resultados no es un callejón sin salida: los uniformes se fabrican
          a pedido, así que un colegio que no está en el catálogo es una venta
          posible y no un "no tenemos". Va fuera del listbox porque son botones,
          y un listbox solo debería contener opciones. */}
      {abierto && opciones.length === 0 && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
          <p className="text-sm leading-relaxed text-zinc-300">
            No encontramos ese colegio en el catálogo.{' '}
            <span className="font-semibold text-white">Lo fabricamos especialmente para vos</span>
            {' '}— escribinos por WhatsApp con el nombre del colegio y te confirmamos.
          </p>
          <a
            href={whatsappUrl(
              `Hola! Busqué "${query.trim()}" en la tienda y no aparece. ¿Pueden fabricar el uniforme de ese colegio?`
            )}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              // Se mide antes de que el navegador cambie de pestaña, mientras
              // esta página sigue viva.
              evento('contact_whatsapp_fallback', { colegio_buscado: query.trim() })
              trackContact({ content_name: query.trim() })
              setAbierto(false)
            }}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-green-500"
          >
            <MessageCircle className="h-4 w-4 flex-shrink-0" />
            Consultar por WhatsApp
          </a>
          <p className="mt-3 text-sm text-zinc-400">Mientras tanto, mirá los básicos lisos.</p>
          <button
            type="button"
            onClick={() => elegir(OPCION_LISOS)}
            className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            <Shirt className="h-4 w-4 flex-shrink-0" />
            Ver básicos lisos
          </button>
        </div>
      )}

      {abierto && opciones.length > 0 && (
        <ul
          id="colegio-listbox"
          ref={listaRef}
          role="listbox"
          className="absolute z-30 mt-2 w-full max-h-64 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl"
        >
          {opciones.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === activa}>
              <button
                type="button"
                onClick={() => elegir(c)}
                onMouseEnter={() => setActiva(i)}
                className={`w-full flex items-center gap-2.5 text-left px-4 py-3.5 min-h-[48px] text-base transition-colors ${
                  i === activa ? 'bg-zinc-800 text-white' : 'text-zinc-300'
                }`}
              >
                {c.id === 'lisos'
                  ? <Shirt className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  : <School className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                <span className="truncate">{c.nombre}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
