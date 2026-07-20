import { useEffect, useState, Fragment } from 'react'
import { adminApi, colegiosApi, categoriasApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { formatPrecio, infoCuotas } from '../../lib/utils'
import { comprimirImagen } from '../../lib/imageCompress'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { Plus, Pencil, Trash2, Upload, X, ChevronDown, ChevronUp, Check } from 'lucide-react'

const TALLES_STANDARD = ['4', '6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL', 'ESP']

function Campo({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  )
}

function ModalProducto({ producto, colegios, categorias, token, onGuardado, onCerrar }) {
  const editando = !!producto
  const [form, setForm] = useState({
    nombre: producto?.nombre ?? '',
    descripcion: producto?.descripcion ?? '',
    tipo: producto?.tipo ?? (categorias[0]?.nombre ?? 'REMERA'),
    precio: producto?.precio ?? '',
    precioOferta: producto?.precioOferta ?? '',
    cuotas: producto?.cuotas ?? '',
    financiacion: producto?.cuotasRecargo ? 'recargo' : 'sin_interes',
    cuotasRecargo: producto?.cuotasRecargo ?? '',
    colegioId: producto?.colegioId ?? '',
    activo: producto?.activo ?? true,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function set(campo, valor) { setForm(f => ({ ...f, [campo]: valor })) }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setGuardando(true)
    try {
      const { financiacion, ...resto } = form
      const data = {
        ...resto,
        precio: parseFloat(form.precio),
        precioOferta: form.precioOferta ? parseFloat(form.precioOferta) : null,
        cuotas: form.cuotas ? parseInt(form.cuotas) : null,
        cuotasRecargo: form.cuotas && financiacion === 'recargo' && form.cuotasRecargo
          ? parseFloat(form.cuotasRecargo)
          : null,
      }
      if (editando) await adminApi.actualizarProducto(token, producto.id, data)
      else await adminApi.crearProducto(token, data)
      onGuardado()
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="font-bold text-zinc-100">{editando ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onCerrar}><X className="w-5 h-5 text-zinc-500 hover:text-zinc-200" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <Campo label="Nombre *">
            <input required value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="input" placeholder="Ej: Remera Manga Corta" />
          </Campo>
          <Campo label="Descripción">
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              rows={2} className="input resize-none" placeholder="Descripción del producto..." />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Categoría">
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="input">
                {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
            </Campo>
            <Campo label="Precio *">
              <input required type="number" min="0" step="0.01" value={form.precio}
                onChange={e => set('precio', e.target.value)} className="input" placeholder="8500" />
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Precio oferta">
              <input type="number" min="0" step="0.01" value={form.precioOferta}
                onChange={e => set('precioOferta', e.target.value)} className="input" placeholder="Vacío = sin oferta" />
            </Campo>
            <Campo label="Cuotas">
              <select value={form.cuotas} onChange={e => set('cuotas', e.target.value)} className="input">
                <option value="">No mostrar</option>
                <option value="3">3 cuotas</option>
                <option value="6">6 cuotas</option>
                <option value="9">9 cuotas</option>
                <option value="12">12 cuotas</option>
              </select>
            </Campo>
          </div>
          {form.cuotas && (
            <div className="flex flex-col gap-2 bg-zinc-800/50 border border-zinc-700/60 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Financiación">
                  <select value={form.financiacion} onChange={e => set('financiacion', e.target.value)} className="input">
                    <option value="sin_interes">Sin interés</option>
                    <option value="recargo">Con recargo</option>
                  </select>
                </Campo>
                {form.financiacion === 'recargo' && (
                  <Campo label="Recargo (%)">
                    <input type="number" min="0" max="100" step="0.1" value={form.cuotasRecargo}
                      onChange={e => set('cuotasRecargo', e.target.value)} className="input" placeholder="15" />
                  </Campo>
                )}
              </div>
              {(() => {
                const base = parseFloat(form.precioOferta) || parseFloat(form.precio)
                const preview = infoCuotas(
                  base,
                  parseInt(form.cuotas),
                  form.financiacion === 'recargo' ? parseFloat(form.cuotasRecargo) || 0 : null
                )
                return preview ? (
                  <p className="text-sm text-green-400">
                    Vista previa: <span className="font-medium">{preview.texto}</span>
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500">Ingresá el precio para ver la vista previa.</p>
                )
              })()}
            </div>
          )}
          <Campo label="Colegio">
            <select value={form.colegioId} onChange={e => set('colegioId', e.target.value)} className="input">
              <option value="">— Liso (sin colegio) —</option>
              {colegios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Campo>
          {editando && (
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} className="accent-blue-500" />
              Producto activo (visible en la tienda)
            </label>
          )}
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCerrar} className="btn-secundario">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primario">
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

let _rowKey = 0
function nuevoId() { return ++_rowKey }

function FilaProducto({ producto, colegios, categorias, token, onActualizado }) {
  const [expandido, setExpandido] = useState(false)
  const [editando, setEditando] = useState(false)
  const [subiendoImg, setSubiendoImg] = useState(false)

  // Edición de variantes existentes
  const [stockEdit, setStockEdit] = useState({})
  const [precioEdit, setPrecioEdit] = useState({})

  // Filas nuevas pendientes por talle: { [talle]: [{ _id, color, stock, precio }] }
  const [nuevasPorTalle, setNuevasPorTalle] = useState({})

  // Nuevo color
  const [nuevoColorNombre, setNuevoColorNombre] = useState('')
  const [guardandoColor, setGuardandoColor] = useState(false)

  function agregarFilaNueva(talle) {
    setNuevasPorTalle(s => ({
      ...s,
      [talle]: [...(s[talle] ?? []), { _id: nuevoId(), color: '', stock: '', precio: '' }],
    }))
  }

  function actualizarFilaNueva(talle, id, campo, valor) {
    setNuevasPorTalle(s => ({
      ...s,
      [talle]: s[talle].map(r => r._id === id ? { ...r, [campo]: valor } : r),
    }))
  }

  function quitarFilaNueva(talle, id) {
    setNuevasPorTalle(s => ({
      ...s,
      [talle]: s[talle].filter(r => r._id !== id),
    }))
  }

  async function guardarFilaNueva(talle, id) {
    const fila = (nuevasPorTalle[talle] ?? []).find(r => r._id === id)
    if (!fila || !fila.color) return
    try {
      await adminApi.crearVariante(token, producto.id, {
        talle,
        color: fila.color,
        stock: Number(fila.stock || 0),
        precio: fila.precio ? parseFloat(fila.precio) : null,
      })
      quitarFilaNueva(talle, id)
      onActualizado()
    } catch (err) { alert(err.message) }
  }

  async function agregarColor(e) {
    e.preventDefault()
    const nombre = nuevoColorNombre.trim()
    if (!nombre) return
    setGuardandoColor(true)
    try {
      await adminApi.agregarColor(token, producto.id, nombre)
      setNuevoColorNombre('')
      onActualizado()
    } catch (err) { alert(err.message) }
    finally { setGuardandoColor(false) }
  }

  async function eliminarColor(colorId) {
    if (!confirm('¿Eliminar este color? Las variantes ya creadas con ese color no se modifican.')) return
    await adminApi.eliminarColor(token, colorId)
    onActualizado()
  }

  async function subirImagen(e) {
    const file = e.target.files[0]; if (!file) return
    setSubiendoImg(true)
    try {
      const comprimida = await comprimirImagen(file)
      const ext = comprimida.name.split('.').pop()
      const path = `productos/${producto.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('productos').upload(path, comprimida, { upsert: true, cacheControl: '31536000' })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(path)
      await adminApi.agregarImagen(token, producto.id, { url: publicUrl, orden: producto.imagenes.length })
      onActualizado()
    } catch (err) { alert('Error al subir imagen: ' + err.message) }
    finally { setSubiendoImg(false) }
  }

  async function eliminarImagen(imagenId) {
    if (!confirm('¿Eliminar imagen?')) return
    await adminApi.eliminarImagen(token, imagenId); onActualizado()
  }

  async function guardarStock(varianteId) {
    const stock = stockEdit[varianteId]; if (stock === undefined) return
    await adminApi.actualizarVariante(token, varianteId, { stock: Number(stock) })
    setStockEdit(s => { const n = { ...s }; delete n[varianteId]; return n })
    onActualizado()
  }

  async function guardarPrecio(varianteId) {
    const precio = precioEdit[varianteId]; if (precio === undefined) return
    await adminApi.actualizarVariante(token, varianteId, { precio: precio === '' ? null : precio })
    setPrecioEdit(s => { const n = { ...s }; delete n[varianteId]; return n })
    onActualizado()
  }

  async function eliminarVariante(varianteId) {
    if (!confirm('¿Eliminar variante?')) return
    await adminApi.eliminarVariante(token, varianteId); onActualizado()
  }

  async function cambiarColorImagen(imagenId, color) {
    await adminApi.actualizarImagen(token, imagenId, { color: color || null }); onActualizado()
  }

  async function toggleActivo() {
    await adminApi.actualizarProducto(token, producto.id, { activo: !producto.activo }); onActualizado()
  }

  const customTalles = [...new Set(producto.variantes.map(v => v.talle))].filter(t => !TALLES_STANDARD.includes(t))
  const todosTalles = [...TALLES_STANDARD, ...customTalles]
  const coloresProducto = producto.colores ?? []

  return (
    <>
      <tr className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={producto.imagenes[0]?.url ?? '/placeholder.png'}
              className="w-10 h-10 object-cover rounded-lg bg-zinc-800 shrink-0" alt="" />
            <div>
              <p className="text-sm font-medium text-zinc-100">{producto.nombre}</p>
              <p className="text-xs text-zinc-500">{producto.colegio?.nombre ?? 'Liso'} · {producto.tipo}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-zinc-300">{formatPrecio(producto.precio)}</td>
        <td className="px-4 py-3">
          <Badge variante={producto.activo ? 'green' : 'default'}>{producto.activo ? 'Activo' : 'Inactivo'}</Badge>
        </td>
        <td className="px-4 py-3 text-sm text-zinc-400">
          {producto.variantes.reduce((a, v) => a + v.stock, 0)} uds
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setEditando(true)} className="p-1.5 text-zinc-500 hover:text-blue-400 rounded transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={toggleActivo} className="p-1.5 text-zinc-500 hover:text-yellow-400 rounded text-xs font-medium transition-colors">
              {producto.activo ? 'Ocultar' : 'Activar'}
            </button>
            <button onClick={async () => {
              if (!confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) return
              try { await adminApi.eliminarProducto(token, producto.id); onActualizado() }
              catch (err) { alert(err.message) }
            }} className="p-1.5 text-zinc-500 hover:text-red-400 rounded transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={() => setExpandido(!expandido)} className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded transition-colors">
              {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </td>
      </tr>

      {expandido && (
        <tr className="border-b border-zinc-800 bg-zinc-800/30">
          <td colSpan={5} className="px-6 py-4">
            <div className="flex flex-col gap-6">

              {/* Fila superior: Colores + Imágenes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* ── Colores del producto ── */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                    Colores del producto
                  </p>

                  {/* Tags de colores existentes */}
                  <div className="flex flex-wrap gap-1.5 mb-3 min-h-[2rem]">
                    {coloresProducto.length === 0 ? (
                      <p className="text-xs text-amber-400/70 italic">Sin colores — cargá al menos uno para poder asignar stock</p>
                    ) : (
                      coloresProducto.map(c => (
                        <span key={c.id} className="inline-flex items-center gap-1 bg-zinc-700/60 border border-zinc-600 text-zinc-200 text-xs rounded-full px-2.5 py-0.5">
                          {c.nombre}
                          <button onClick={() => eliminarColor(c.id)} className="text-zinc-500 hover:text-red-400 transition-colors -mr-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Agregar color nuevo */}
                  <form onSubmit={agregarColor} className="flex items-center gap-2">
                    <input
                      value={nuevoColorNombre}
                      onChange={e => setNuevoColorNombre(e.target.value)}
                      placeholder="ej: azul marino, blanco..."
                      className="flex-1 text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-600"
                    />
                    <button
                      type="submit"
                      disabled={guardandoColor || !nuevoColorNombre.trim()}
                      className="flex items-center gap-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-2.5 py-1.5 rounded disabled:opacity-40 transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-3 h-3" /> Agregar
                    </button>
                  </form>
                </div>

                {/* ── Imágenes ── */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Imágenes</p>
                  <div className="flex flex-wrap gap-3">
                    {producto.imagenes.map(img => (
                      <div key={img.id} className="relative group flex flex-col items-center gap-1">
                        <div className="relative">
                          <img src={img.url} className="w-16 h-16 object-cover rounded-lg border border-zinc-700" alt="" />
                          <button onClick={() => eliminarImagen(img.id)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        {coloresProducto.length > 0 && (
                          <select value={img.color ?? ''} onChange={e => cambiarColorImagen(img.id, e.target.value)}
                            className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-300 rounded px-1 py-0.5 w-16 focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="">Todos</option>
                            {coloresProducto.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                          </select>
                        )}
                      </div>
                    ))}
                    <label className="w-16 h-16 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                      {subiendoImg ? <Spinner /> : <Upload className="w-5 h-5 text-zinc-500" />}
                      <input type="file" accept="image/*" className="hidden" onChange={subirImagen} />
                    </label>
                  </div>
                </div>
              </div>

              {/* ── Tabla de variantes ── */}
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Stock por talle y color</p>

                {coloresProducto.length === 0 && (
                  <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-3">
                    Primero agregá los colores del producto arriba.
                  </p>
                )}

                <div className="rounded-lg border border-zinc-700 overflow-hidden">
                  {/* Cabecera */}
                  <div className="grid grid-cols-[3rem_1fr_3.5rem_5rem_2.5rem] gap-1 px-3 py-1.5 bg-zinc-800/60 text-[10px] text-zinc-500 font-semibold uppercase tracking-wide">
                    <span>Talle</span>
                    <span>Color</span>
                    <span className="text-center">Stock</span>
                    <span className="text-center">Precio $</span>
                    <span />
                  </div>

                  <div className="divide-y divide-zinc-800/40">
                    {todosTalles.map(talle => {
                      const variantesDelTalle = producto.variantes.filter(v => v.talle === talle)
                      const filasNuevas = nuevasPorTalle[talle] ?? []

                      return (
                        <Fragment key={talle}>
                          {/* Variantes guardadas */}
                          {variantesDelTalle.map(v => (
                            <div key={v.id} className="grid grid-cols-[3rem_1fr_3.5rem_5rem_2.5rem] gap-1 items-center px-3 py-1.5">
                              <span className="text-xs font-bold text-zinc-200">{talle}</span>
                              <span className="text-xs text-zinc-300 truncate">{v.color ?? <span className="text-zinc-600 italic">—</span>}</span>
                              <input
                                type="number" min="0"
                                value={stockEdit[v.id] ?? v.stock}
                                onChange={e => setStockEdit(s => ({ ...s, [v.id]: e.target.value }))}
                                onBlur={() => guardarStock(v.id)}
                                className="w-full text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-1.5 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <input
                                type="number" min="0" step="0.01"
                                value={precioEdit[v.id] ?? (v.precio != null ? Number(v.precio) : '')}
                                onChange={e => setPrecioEdit(s => ({ ...s, [v.id]: e.target.value }))}
                                onBlur={() => guardarPrecio(v.id)}
                                placeholder={String(Number(producto.precio))}
                                className="w-full text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-1.5 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-600"
                              />
                              <button onClick={() => eliminarVariante(v.id)} className="text-zinc-700 hover:text-red-400 transition-colors flex justify-center">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          {/* Filas nuevas pendientes */}
                          {filasNuevas.map(fila => (
                            <div key={fila._id} className="grid grid-cols-[3rem_1fr_3.5rem_5rem_2.5rem] gap-1 items-center px-3 py-1.5 bg-blue-950/20 border-l-2 border-blue-600/40">
                              <span className="text-xs text-blue-400 font-bold">{talle}</span>
                              {/* Select de color en vez de input libre */}
                              <select
                                autoFocus
                                value={fila.color}
                                onChange={e => actualizarFilaNueva(talle, fila._id, 'color', e.target.value)}
                                className="w-full text-xs bg-zinc-800 border border-blue-600/40 text-zinc-100 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">— color —</option>
                                {coloresProducto.map(c => (
                                  <option key={c.id} value={c.nombre}>{c.nombre}</option>
                                ))}
                              </select>
                              <input
                                type="number" min="0"
                                placeholder="0"
                                value={fila.stock}
                                onChange={e => actualizarFilaNueva(talle, fila._id, 'stock', e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && guardarFilaNueva(talle, fila._id)}
                                className="w-full text-xs bg-zinc-800 border border-blue-600/40 text-zinc-100 rounded px-1.5 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-600"
                              />
                              <input
                                type="number" min="0" step="0.01"
                                placeholder="base"
                                value={fila.precio}
                                onChange={e => actualizarFilaNueva(talle, fila._id, 'precio', e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && guardarFilaNueva(talle, fila._id)}
                                className="w-full text-xs bg-zinc-800 border border-blue-600/40 text-zinc-100 rounded px-1.5 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-600"
                              />
                              <div className="flex items-center gap-0.5 justify-center">
                                <button onClick={() => guardarFilaNueva(talle, fila._id)} disabled={!fila.color} className="text-green-400 hover:text-green-300 disabled:opacity-30 transition-colors">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => quitarFilaNueva(talle, fila._id)} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Botón + color para este talle */}
                          <div className="flex items-center px-3 py-1 bg-zinc-900/30">
                            <span className="text-xs text-zinc-600 w-12 shrink-0">
                              {variantesDelTalle.length === 0 && filasNuevas.length === 0 ? talle : ''}
                            </span>
                            <button
                              onClick={() => agregarFilaNueva(talle)}
                              disabled={coloresProducto.length === 0}
                              className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              color para talle {talle}
                            </button>
                          </div>
                        </Fragment>
                      )
                    })}
                  </div>
                </div>

                <p className="text-[10px] text-zinc-600 mt-1.5">
                  Precio vacío = usa el precio base ({formatPrecio(producto.precio)})
                </p>
              </div>

            </div>
          </td>
        </tr>
      )}

      {editando && (
        <ModalProducto producto={producto} colegios={colegios} categorias={categorias} token={token}
          onGuardado={() => { setEditando(false); onActualizado() }}
          onCerrar={() => setEditando(false)} />
      )}
    </>
  )
}

export default function AdminProductosPage() {
  const { sesion } = useAuth()
  const token = sesion?.access_token
  const [productos, setProductos] = useState([])
  const [colegios, setColegios] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalNuevo, setModalNuevo] = useState(false)

  async function cargar() {
    setCargando(true)
    const [prods, cols, cats] = await Promise.all([
      adminApi.listarProductos(token),
      colegiosApi.listar(),
      categoriasApi.listar(),
    ])
    setProductos(prods); setColegios(cols); setCategorias(cats); setCargando(false)
  }

  useEffect(() => { if (token) cargar() }, [token])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Productos</h1>
          <p className="text-sm text-zinc-500">{productos.length} productos en total</p>
        </div>
        <button onClick={() => setModalNuevo(true)} className="btn-primario flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo producto
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Producto</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Precio</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Stock</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <FilaProducto key={p.id} producto={p} colegios={colegios} categorias={categorias} token={token} onActualizado={cargar} />
              ))}
            </tbody>
          </table>
          {!productos.length && (
            <div className="text-center py-16 text-zinc-600 text-sm">No hay productos aún</div>
          )}
        </div>
      )}

      {modalNuevo && (
        <ModalProducto colegios={colegios} categorias={categorias} token={token}
          onGuardado={() => { setModalNuevo(false); cargar() }}
          onCerrar={() => setModalNuevo(false)} />
      )}
    </div>
  )
}
