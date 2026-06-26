import { ShieldCheck } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center gap-6">
          <img src="/logo.png" alt="InCollege" className="h-40 w-auto opacity-90" />
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-zinc-500">
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-zinc-600" />
              Pagos seguros con Mercado Pago
            </p>
            <span className="hidden sm:block text-zinc-700">·</span>
            <p>© {new Date().getFullYear()} InCollege. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
