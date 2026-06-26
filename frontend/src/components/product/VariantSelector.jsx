export default function VariantSelector({ variantes = [], seleccionada, onChange }) {
  const colores = [...new Set(variantes.map(v => v.color).filter(Boolean))]
  const tieneColores = colores.length > 0
  const colorActual = seleccionada?.color ?? null

  const variantesFiltradas = tieneColores && colorActual
    ? variantes.filter(v => v.color === colorActual)
    : variantes
  const talles = [...new Set(variantesFiltradas.map(v => v.talle))]

  function seleccionarColor(color) {
    const primera = variantes.find(v => v.color === color && v.stock > 0)
      ?? variantes.find(v => v.color === color)
    onChange(primera)
  }

  function seleccionarTalle(talle) {
    onChange(variantesFiltradas.find(v => v.talle === talle))
  }

  return (
    <div className="flex flex-col gap-4">
      {tieneColores && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-zinc-400">
            Color: <span className="text-zinc-100">{colorActual ?? '—'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colores.map(color => {
              const tieneStock = variantes.some(v => v.color === color && v.stock > 0)
              const seleccionado = colorActual === color
              return (
                <button key={color} disabled={!tieneStock} onClick={() => seleccionarColor(color)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    !tieneStock
                      ? 'border-zinc-800 text-zinc-700 cursor-not-allowed line-through'
                      : seleccionado
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-zinc-700 text-zinc-300 hover:border-blue-500'
                  }`}
                >
                  {color}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-400">
          Talle: <span className="text-zinc-100">{seleccionada?.talle ?? '—'}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {talles.map(talle => {
            const variante = variantesFiltradas.find(v => v.talle === talle)
            const sinStock = variante?.stock === 0
            const estaSeleccionado = seleccionada?.talle === talle && seleccionada?.color === colorActual
            return (
              <button key={talle} disabled={sinStock} onClick={() => seleccionarTalle(talle)}
                className={`min-w-[2.75rem] px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                  sinStock
                    ? 'border-zinc-800 text-zinc-700 cursor-not-allowed line-through'
                    : estaSeleccionado
                    ? 'border-blue-500 bg-blue-600 text-white'
                    : 'border-zinc-700 text-zinc-300 hover:border-blue-500'
                }`}
              >
                {talle}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
