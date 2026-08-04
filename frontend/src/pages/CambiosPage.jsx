import { Check, X, MessageCircle } from 'lucide-react'
import PaginaTexto, { Seccion } from '../components/layout/PaginaTexto'
import { WHATSAPP_URL, DIRECCIONES } from '../lib/contacto'

function Lista({ items, ok }) {
  const Icono = ok ? Check : X
  return (
    <ul className="space-y-2">
      {items.map(t => (
        <li key={t} className="flex gap-2.5">
          <Icono className={`mt-0.5 h-4 w-4 flex-shrink-0 ${ok ? 'text-green-500' : 'text-red-500'}`} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export default function CambiosPage() {
  return (
    <PaginaTexto
      titulo="Cambios y devoluciones"
      bajada="Cambiamos las prendas con falla de fábrica dentro de las 48 horas de recibido el pedido."
      actualizado="agosto de 2026"
    >
      <Seccion titulo="Sí aceptamos cambio">
        <Lista
          ok
          items={[
            'Fallas de fábrica: costuras abiertas, tela con defecto, estampa mal aplicada.',
            'Errores nuestros: talle, color o modelo distinto al que pediste.',
            'Prendas sin uso, con su etiqueta y en las mismas condiciones en que las recibiste.',
          ]}
        />
      </Seccion>

      <Seccion titulo="No aceptamos cambio">
        <Lista
          items={[
            'Prendas con signos de uso o mal cuidado: lavado incorrecto, enganches, manchas, roturas o deformaciones.',
            'Reclamos hechos después de las 48 horas de recibido el pedido.',
            'Prendas personalizadas con el escudo del colegio, salvo que la falla sea de fábrica.',
          ]}
        />
      </Seccion>

      <Seccion titulo="Cómo hacer el cambio">
        <p>
          Escribinos por WhatsApp dentro de las 48 horas con fotos de la prenda donde se vea la
          falla y el número de pedido. Te confirmamos el cambio y coordinamos el retiro o la
          entrega en cualquiera de nuestros locales: {DIRECCIONES.join(' · ')}.
        </p>
        <p>
          Si el cambio corresponde, no tiene costo para vos. Si no tenemos stock del mismo
          artículo, podés elegir otro por el mismo valor o pedir la devolución del importe por el
          mismo medio de pago.
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-500"
        >
          <MessageCircle className="h-4 w-4" />
          Iniciar un cambio
        </a>
      </Seccion>

      <Seccion titulo="Compras a distancia">
        <p>
          Además de esta política, si comprás online tenés derecho a arrepentirte de la compra
          dentro de los 10 días corridos de recibido el pedido, según el artículo 34 de la Ley
          24.240. La prenda tiene que estar sin uso y en su estado original, y no aplica a las
          prendas personalizadas por tratarse de productos hechos a tu pedido.
        </p>
      </Seccion>
    </PaginaTexto>
  )
}
