export default function VariantSelector({ variantes = [], seleccionada, onChange }) {
  // Agrupar talles únicos
  const talles = [...new Set(variantes.map(v => v.talle))]

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-700">
        Talle: <span className="text-gray-900">{seleccionada?.talle ?? '—'}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {talles.map(talle => {
          const variante = variantes.find(v => v.talle === talle)
          const sinStock = variante?.stock === 0
          const estaSeleccionada = seleccionada?.talle === talle

          return (
            <button
              key={talle}
              disabled={sinStock}
              onClick={() => onChange(variante)}
              className={`min-w-[2.75rem] px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                sinStock
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                  : estaSeleccionada
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 text-gray-800 hover:border-blue-500'
              }`}
            >
              {talle}
            </button>
          )
        })}
      </div>
    </div>
  )
}
