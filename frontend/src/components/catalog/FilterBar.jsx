const TIPOS = [
  { value: '', label: 'Todos' },
  { value: 'REMERA', label: 'Remeras' },
  { value: 'BUZO', label: 'Buzos' },
  { value: 'PANTALON', label: 'Pantalones' },
  { value: 'CAMPERA', label: 'Camperas' },
  { value: 'OTRO', label: 'Otros' },
]

export default function FilterBar({ colegios, filtros, onChange }) {
  function pillClass(activo) {
    return `px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
      activo
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-blue-500 hover:text-blue-400'
    }`
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Fila 1: filtro por colegio */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => onChange({ colegioId: '', tipo: filtros.tipo })}
          className={pillClass(!filtros.colegioId)}
        >
          Todos
        </button>
        <button
          onClick={() => onChange({ colegioId: 'lisos', tipo: filtros.tipo })}
          className={pillClass(filtros.colegioId === 'lisos')}
        >
          Lisos
        </button>
        {colegios.map(c => (
          <button
            key={c.id}
            onClick={() => onChange({ colegioId: c.id, tipo: filtros.tipo })}
            className={pillClass(filtros.colegioId === c.id)}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {/* Fila 2: tipo de prenda + ordenar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TIPOS.map(t => (
            <button
              key={t.value}
              onClick={() => onChange({ colegioId: filtros.colegioId, tipo: t.value })}
              className={pillClass(filtros.tipo === t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={filtros.orden ?? ''}
          onChange={e => onChange({ colegioId: filtros.colegioId, tipo: filtros.tipo, orden: e.target.value })}
          className="flex-shrink-0 bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">Novedades</option>
          <option value="precio_asc">Menor precio</option>
          <option value="precio_desc">Mayor precio</option>
        </select>
      </div>
    </div>
  )
}
