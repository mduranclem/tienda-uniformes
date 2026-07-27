import { useEffect, useState } from 'react'
import { Ruler, X } from 'lucide-react'

// Tabla de talles: botón discreto junto al selector, que abre la imagen en
// grande. Va en modal y no inline para no empujar el botón de comprar hacia
// abajo en mobile, que es desde donde compra la mayoría.
export default function TablaTalles({ url }) {
  const [abierta, setAbierta] = useState(false)

  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierta.
  useEffect(() => {
    if (!abierta) return
    const onKey = e => { if (e.key === 'Escape') setAbierta(false) }
    document.addEventListener('keydown', onKey)
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflowPrevio
    }
  }, [abierta])

  if (!url) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 underline underline-offset-4 decoration-zinc-700 hover:decoration-zinc-500 transition-colors"
      >
        <Ruler className="w-4 h-4" />
        Ver tabla de talles
      </button>

      {abierta && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setAbierta(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Tabla de talles"
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
              <h2 className="font-semibold text-zinc-100">Tabla de talles</h2>
              <button onClick={() => setAbierta(false)} aria-label="Cerrar">
                <X className="w-5 h-5 text-zinc-500 hover:text-zinc-200" />
              </button>
            </div>
            {/* overflow-auto: en mobile la tabla no entra y hay que poder moverla */}
            <div className="overflow-auto p-3">
              <img
                src={url}
                alt="Tabla de talles: medidas de largo y ancho en centímetros por talle"
                className="w-full h-auto rounded-lg"
              />
            </div>
            <p className="px-5 pb-4 pt-1 text-xs text-zinc-500 shrink-0">
              Medidas en centímetros, con una tolerancia de ±1,5 cm.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
