import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { WHATSAPP_URL } from '../lib/contacto'

const PREGUNTAS = [
  {
    q: '¿Cómo hago mi pedido?',
    a: 'Elegí los productos que querés, seleccioná talle y color, y agregarlos al carrito. Cuando estés listo, hacé click en "Finalizar compra" y completá tus datos. Podés comprar sin registrarte.',
  },
  {
    q: '¿Cómo sé qué talle me queda?',
    a: 'En la página de cada producto vas a encontrar una guía de talles. Si tenés dudas, escribinos por WhatsApp y te asesoramos sin compromiso.',
  },
  {
    q: '¿Puedo cambiar una prenda?',
    a: 'Aceptamos cambios dentro de las 48 horas de recibido el pedido, siempre que se trate de una falla de fábrica o de un error nuestro. En ese caso te cambiamos la prenda sin costo. No se aceptan cambios cuando la prenda presenta signos de uso o mal cuidado: lavado incorrecto, enganches, manchas, roturas o deformaciones. Ante cualquier problema, escribinos por WhatsApp con fotos de la prenda y lo resolvemos.',
  },
  {
    q: '¿Cómo puedo pagar?',
    a: 'Aceptamos pagos con tarjeta de crédito y débito, transferencia bancaria y billeteras virtuales. Todos los pagos son procesados de forma segura.',
  },
  {
    q: '¿Hacen envíos a todo el país?',
    a: 'Sí, enviamos a todo el país a través de correo privado. El costo de envío se calcula al momento del checkout según tu localidad.',
  },
  {
    q: '¿Tienen descuentos?',
    a: 'La primera compra tiene un 20% de descuento que se aplica automáticamente. También publicamos promos por temporada. Seguinos en redes para enterarte primero.',
  },
]

function Item({ pregunta, respuesta }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="border-b border-zinc-800 last:border-0">
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left text-zinc-100 hover:text-white transition-colors"
      >
        <span className="font-medium text-sm sm:text-base">{pregunta}</span>
        {abierto
          ? <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        }
      </button>
      {abierto && (
        <p className="pb-4 text-sm text-zinc-400 leading-relaxed pr-6">
          {respuesta}
        </p>
      )}
    </div>
  )
}

export default function FaqPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-100 mb-2">Preguntas frecuentes</h1>
      <p className="text-zinc-500 text-sm mb-8">Todo lo que necesitás saber antes de comprar.</p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5">
        {PREGUNTAS.map((item, i) => (
          <Item key={i} pregunta={item.q} respuesta={item.a} />
        ))}
      </div>

      <p className="text-center text-zinc-500 text-sm mt-8">
        ¿No encontraste tu respuesta?{' '}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-400 hover:text-green-300 font-medium"
        >
          Escribinos por WhatsApp
        </a>
      </p>
    </div>
  )
}
