export default function FilterBar({ colegios, filtros, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        onClick={() => onChange({ colegioId: '', tipo: '' })}
        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
          !filtros.colegioId && !filtros.tipo
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-blue-500 hover:text-blue-400'
        }`}
      >
        Todos
      </button>
      <button
        onClick={() => onChange({ colegioId: 'lisos', tipo: '' })}
        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
          filtros.colegioId === 'lisos'
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-blue-500 hover:text-blue-400'
        }`}
      >
        Lisos
      </button>
      {colegios.map(c => (
        <button
          key={c.id}
          onClick={() => onChange({ colegioId: c.id, tipo: '' })}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            filtros.colegioId === c.id
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-blue-500 hover:text-blue-400'
          }`}
        >
          {c.nombre}
        </button>
      ))}
    </div>
  )
}
