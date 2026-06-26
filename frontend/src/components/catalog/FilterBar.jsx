const TIPOS = [
  { value: '', label: 'Todos' },
  { value: 'REMERA', label: 'Remeras' },
  { value: 'BUZO', label: 'Buzos' },
  { value: 'PANTALON', label: 'Pantalones' },
  { value: 'CAMPERA', label: 'Camperas' },
  { value: 'OTRO', label: 'Otros' },
]

const selectClass = 'flex-shrink-0 bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer'

export default function FilterBar({ colegios, filtros, onChange }) {
  function pillClass(activo) {
    return `px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
      activo
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-blue-500 hover:text-blue-400'
    }`
  }

  return (
    <div className="flex items-center gap-3">
      {/* Tipo de prenda — scrollable a la izquierda */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1 min-w-0">
        {TIPOS.map(t => (
          <button
            key={t.value}
            onClick={() => onChange({ colegioId: filtros.colegioId, tipo: t.value, orden: filtros.orden })}
            className={pillClass(filtros.tipo === t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Dropdowns a la derecha */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <select
          value={filtros.colegioId ?? ''}
          onChange={e => onChange({ colegioId: e.target.value, tipo: filtros.tipo, orden: filtros.orden })}
          className={selectClass}
        >
          <option value="">Todos</option>
          <option value="lisos">Lisos</option>
          {colegios.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        <select
          value={filtros.orden ?? ''}
          onChange={e => onChange({ colegioId: filtros.colegioId, tipo: filtros.tipo, orden: e.target.value })}
          className={selectClass}
        >
          <option value="">Novedades</option>
          <option value="precio_asc">Menor precio</option>
          <option value="precio_desc">Mayor precio</option>
        </select>
      </div>
    </div>
  )
}
