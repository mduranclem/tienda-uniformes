import { Banknote } from 'lucide-react'

// Los precios de la tienda son de promo y valen SOLO pagando en efectivo o por
// transferencia. Es una condición del precio, no un detalle del checkout, así
// que va al lado del precio y en grande, no en letra chica.
export default function AvisoPago({ className = '', texto = 'Precio en efectivo o transferencia' }) {
  return (
    <p className={`inline-flex items-center gap-2 rounded-full border border-[var(--marca-claro)]/50 bg-[var(--marca)]/20 px-3 py-1.5 text-sm font-semibold text-[var(--marca-claro)] ${className}`}>
      <Banknote className="h-4 w-4 shrink-0" />
      {texto}
    </p>
  )
}
