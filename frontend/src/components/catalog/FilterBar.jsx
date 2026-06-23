export default function FilterBar({ colegios, filtros, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Todos / Lisos */}
      <button
        onClick={() => onChange({ colegioId: '', tipo: '' })}
        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
          !filtros.colegioId && !filtros.tipo
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
        }`}
      >
        Todos
      </button>
      <button
        onClick={() => onChange({ colegioId: 'lisos', tipo: '' })}
        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
          filtros.colegioId === 'lisos'
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
        }`}
      >
        Lisos
      </button>

      {/* Colegios */}
      {colegios.map(c => (
        <button
          key={c.id}
          onClick={() => onChange({ colegioId: c.id, tipo: '' })}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            filtros.colegioId === c.id
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
          }`}
        >
          {c.nombre}
        </button>
      ))}
    </div>
  )
}
