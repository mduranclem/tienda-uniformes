import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import PaginaTexto, { Seccion } from '../components/layout/PaginaTexto'
import { tiendaApi } from '../services/api'
import { WHATSAPP_URL } from '../lib/contacto'

export default function TallesPage() {
  const [url, setUrl] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    tiendaApi.tablaTalles()
      .then(r => setUrl(r?.url || null))
      .catch(() => setUrl(null))
      .finally(() => setCargando(false))
  }, [])

  return (
    <PaginaTexto
      titulo="Guía de talles"
      bajada="Medí una prenda que ya uses y compará con la tabla. Ante la duda, conviene el talle mayor."
    >
      <Seccion titulo="Tabla de medidas">
        {cargando && <div className="h-64 animate-pulse rounded-xl bg-zinc-900" />}

        {!cargando && url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={url}
              alt="Tabla de talles de InCollege"
              className="w-full rounded-xl border border-zinc-800 bg-white"
            />
            <span className="mt-2 block text-xs text-zinc-500">
              Tocá la imagen para verla en grande.
            </span>
          </a>
        )}

        {!cargando && !url && (
          <p>
            Estamos actualizando la tabla. Escribinos por WhatsApp y te pasamos las medidas
            del talle que necesites.
          </p>
        )}
      </Seccion>

      <Seccion titulo="Cómo tomar las medidas">
        <p>
          Apoyá la prenda sobre una mesa, bien estirada y sin arrugas. El <strong className="text-zinc-200">ancho</strong> se
          mide de axila a axila, y el <strong className="text-zinc-200">largo</strong> desde el hombro hasta el borde inferior.
          Las medidas de la tabla son de la prenda, no del cuerpo.
        </p>
        <p>
          Los talles del 4 al 16 son de niño y del S al ESP de adulto. Puede haber una
          diferencia de hasta 2 cm por el corte y el lavado de la tela.
        </p>
      </Seccion>

      <Seccion titulo="¿Seguís con dudas?">
        <p>Contanos la edad o el talle que usa hoy y te decimos cuál pedir.</p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-500"
        >
          <MessageCircle className="h-4 w-4" />
          Consultar por WhatsApp
        </a>
      </Seccion>
    </PaginaTexto>
  )
}
