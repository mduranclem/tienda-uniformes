import { Link } from 'react-router-dom'
import { MapPin, MessageCircle, Mail, ShieldCheck } from 'lucide-react'
import { WHATSAPP_URL, WHATSAPP_LEGIBLE, EMAIL_CONTACTO, DIRECCIONES, CIUDAD } from '../../lib/contacto'

const NAVEGACION = [
  { a: '/catalogo', texto: 'Catálogo' },
  { a: '/catalogo?colegioId=lisos', texto: 'Básicos lisos' },
  { a: '/catalogo?colegial=1', texto: 'Ropa colegial' },
  { a: '/talles', texto: 'Guía de talles' },
]

const LEGALES = [
  { a: '/terminos', texto: 'Términos y condiciones' },
  { a: '/cambios', texto: 'Cambios y devoluciones' },
  { a: '/privacidad', texto: 'Política de privacidad' },
]

function Columna({ titulo, className = '', children }) {
  return (
    <div className={className}>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {titulo}
      </h3>
      {children}
    </div>
  )
}

const enlace = 'block py-1 text-sm text-zinc-400 transition-colors hover:text-zinc-100'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-10">

        {/* La columna de contacto va más ancha que las demás: el mail entra en
            una línea en vez de partirse al medio. */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-[1fr_1.5fr_1fr_1.1fr]">

          {/* Marca y locales — ocupa dos columnas porque las direcciones son largas */}
          <div className="col-span-2 md:col-span-1">
            <img src="/logo.webp" alt="InCollege" className="h-9 w-auto" />
            <p className="mt-3 text-sm text-zinc-400">Indumentaria escolar</p>
            <div className="mt-4 flex gap-2 text-sm text-zinc-400">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-600" />
              <div>
                {DIRECCIONES.map(d => <span key={d} className="block">{d}</span>)}
                <span className="block text-zinc-500">{CIUDAD}</span>
              </div>
            </div>
          </div>

          {/* Ancho completo en mobile: el mail es largo y en media columna se
              parte en tres líneas ilegibles. */}
          <Columna titulo="Contacto" className="col-span-2 md:col-span-1">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${enlace} flex items-center gap-2`}
            >
              <MessageCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
              {WHATSAPP_LEGIBLE}
            </a>
            <a href={`mailto:${EMAIL_CONTACTO}`} className={`${enlace} flex items-start gap-2`}>
              <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-600" />
              <span className="break-all">{EMAIL_CONTACTO}</span>
            </a>
            <p className="mt-2 text-xs text-zinc-600">Lunes a viernes de 10 a 16 hs</p>
          </Columna>

          <Columna titulo="Comprar">
            {NAVEGACION.map(l => (
              <Link key={l.a} to={l.a} className={enlace}>{l.texto}</Link>
            ))}
          </Columna>

          <Columna titulo="Información">
            <Link to="/faq" className={enlace}>Preguntas frecuentes</Link>
            {LEGALES.map(l => (
              <Link key={l.a} to={l.a} className={enlace}>{l.texto}</Link>
            ))}
          </Columna>

        </div>

        <div className="mt-9 flex flex-col items-center gap-3 border-t border-zinc-800/80 pt-5 text-xs text-zinc-500 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} InCollege · Indumentaria escolar</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-600" />
            Pagos seguros con Mercado Pago
          </p>
        </div>

      </div>
    </footer>
  )
}
