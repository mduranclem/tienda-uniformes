import { MessageCircle, Mail, Clock, MapPin } from 'lucide-react'

const WA_URL = 'https://wa.me/5493417434552?text=' + encodeURIComponent('Hola! Tengo una consulta sobre los uniformes')

export default function ContactoPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-100 mb-2">Contacto</h1>
      <p className="text-zinc-500 text-sm mb-8">Estamos para ayudarte. Elegí el canal que más te convenga.</p>

      <div className="flex flex-col gap-4">

        {/* WhatsApp */}
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-green-700 rounded-xl p-5 transition-colors group"
        >
          <div className="w-11 h-11 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
            <MessageCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">WhatsApp</p>
            <p className="text-xs text-zinc-500 mt-0.5">Respondemos en el día en horario comercial</p>
          </div>
        </a>

        {/* Email */}
        <a
          href="mailto:contacto@tiendadeuniformes.store"
          className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-blue-700 rounded-xl p-5 transition-colors group"
        >
          <div className="w-11 h-11 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">Email</p>
            <p className="text-xs text-zinc-500 mt-0.5">contacto@tiendadeuniformes.store</p>
          </div>
        </a>

        {/* Horario */}
        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">Horario de atención</p>
            <p className="text-xs text-zinc-500 mt-0.5">Lunes a viernes de 9 a 18 hs</p>
          </div>
        </div>

        {/* Retiro */}
        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">Retiro en local</p>
            <p className="text-xs text-zinc-500 mt-0.5">Coordinamos por WhatsApp día y horario</p>
          </div>
        </div>

      </div>
    </div>
  )
}
