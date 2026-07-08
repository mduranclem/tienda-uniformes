import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, School, Shirt } from 'lucide-react'
import { normalizarTexto } from '../../lib/utils'

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
export default function ColegioSelector({ colegios }) {
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
      <label htmlFor="colegio-selector" className="block text-sm font-semibold text-white mb-1.5">
        ¿De qué colegio sos?
      </label>
      <div className="relative">
        <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" />
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
          placeholder="Buscá tu colegio…"
          className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
        />
        <ChevronDown
          className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none transition-transform ${abierto ? 'rotate-180' : ''}`}
        />
      </div>

      {abierto && (
        <ul
          id="colegio-listbox"
          ref={listaRef}
          role="listbox"
          className="absolute z-30 mt-2 w-full max-h-64 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl"
        >
          {opciones.length === 0 && (
            <li className="px-4 py-3 text-sm text-zinc-500">
              No encontramos ese colegio. Probá con los básicos lisos.
            </li>
          )}
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
