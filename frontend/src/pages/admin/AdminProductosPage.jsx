import { useEffect, useState } from 'react'
import { adminApi, colegiosApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { formatPrecio } from '../../lib/utils'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { Plus, Pencil, Trash2, Upload, X, ChevronDown, ChevronUp } from 'lucide-react'

const TIPOS = ['REMERA', 'BUZO', 'PANTALON', 'CAMPERA', 'OTRO']
const TALLES_COMUNES = ['2', '4', '6', '8', '10', '12', '14', 'XS', 'S', 'M', 'L', 'XL', 'XXL']

function Campo({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  )
}

function ModalProducto({ producto, colegios, token, onGuardado, onCerrar }) {
  const editando = !!producto
  const [form, setForm] = useState({
    nombre: producto?.nombre ?? '',
    descripcion: producto?.descripcion ?? '',
    tipo: producto?.tipo ?? 'REMERA',
    precio: producto?.precio ?? '',
    precioOferta: producto?.precioOferta ?? '',
    cuotas: producto?.cuotas ?? '',
    colegioId: producto?.colegioId ?? '',
    activo: producto?.activo ?? true,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function set(campo, valor) { setForm(f => ({ ...f, [campo]: valor })) }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setGuardando(true)
    try {
      const data = {
        ...form,
        precio: parseFloat(form.precio),
        precioOferta: form.precioOferta ? parseFloat(form.precioOferta) : null,
        cuotas: form.cuotas ? parseInt(form.cuotas) : null,
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
            <Campo label="Tipo">
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="input">
                {TIPOS.map(t => <option key={t}>{t}</option>)}
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
            <Campo label="Cuotas sin interés">
              <select value={form.cuotas} onChange={e => set('cuotas', e.target.value)} className="input">
                <option value="">No mostrar</option>
                <option value="3">3 cuotas</option>
                <option value="6">6 cuotas</option>
                <option value="9">9 cuotas</option>
                <option value="12">12 cuotas</option>
              </select>
            </Campo>
          </div>
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

function FilaProducto({ producto, colegios, token, onActualizado }) {
  const [expandido, setExpandido] = useState(false)
  const [editando, setEditando] = useState(false)
  const [subiendoImg, setSubiendoImg] = useState(false)
  const [stockEdit, setStockEdit] = useState({})
  const [precioEdit, setPrecioEdit] = useState({})
  // Para agregar talle dentro de un color existente
  const [nuevoTallePorColor, setNuevoTallePorColor] = useState({})
  // Para agregar un color nuevo (con su primer talle)
  const [nuevoColor, setNuevoColor] = useState('')
  const [nuevoTalle, setNuevoTalle] = useState('')

  async function subirImagen(e) {
    const file = e.target.files[0]; if (!file) return
    setSubiendoImg(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `productos/${producto.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('productos').upload(path, file, { upsert: true })
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

  // Agrega un talle nuevo a un color existente
  async function agregarTalleAColor(color) {
    const talle = (nuevoTallePorColor[color] ?? '').trim()
    if (!talle) return
    await adminApi.crearVariante(token, producto.id, { talle, color, stock: 0 })
    setNuevoTallePorColor(s => { const n = { ...s }; delete n[color]; return n })
    onActualizado()
  }

  // Agrega un color nuevo con su primer talle
  async function agregarColorConTalle() {
    const color = nuevoColor.trim()
    const talle = nuevoTalle.trim()
    if (!color || !talle) return
    await adminApi.crearVariante(token, producto.id, { talle, color, stock: 0 })
    setNuevoColor(''); setNuevoTalle(''); onActualizado()
  }

  async function cambiarColorImagen(imagenId, color) {
    await adminApi.actualizarImagen(token, imagenId, { color: color || null }); onActualizado()
  }

  async function eliminarVariante(varianteId) {
    if (!confirm('¿Eliminar variante?')) return
    await adminApi.eliminarVariante(token, varianteId); onActualizado()
  }

  async function toggleActivo() {
    await adminApi.actualizarProducto(token, producto.id, { activo: !producto.activo }); onActualizado()
  }

  const coloresUnicos = [...new Set(producto.variantes.map(v => v.color).filter(Boolean))]
  const sinColor = producto.variantes.filter(v => v.color === null)

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
              try {
                await adminApi.eliminarProducto(token, producto.id)
                onActualizado()
              } catch (err) {
                alert(err.message)
              }
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Imágenes */}
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Imágenes</p>
                <div className="flex flex-wrap gap-3 mb-2">
                  {producto.imagenes.map(img => {
                    return (
                      <div key={img.id} className="relative group flex flex-col items-center gap-1">
                        <div className="relative">
                          <img src={img.url} className="w-16 h-16 object-cover rounded-lg border border-zinc-700" alt="" />
                          <button onClick={() => eliminarImagen(img.id)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        {coloresUnicos.length > 0 && (
                          <select value={img.color ?? ''} onChange={e => cambiarColorImagen(img.id, e.target.value)}
                            className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-300 rounded px-1 py-0.5 w-16 focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="">Todos</option>
                            {coloresUnicos.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        )}
                      </div>
                    )
                  })}
                  <label className="w-16 h-16 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                    {subiendoImg ? <Spinner /> : <Upload className="w-5 h-5 text-zinc-500" />}
                    <input type="file" accept="image/*" className="hidden" onChange={subirImagen} />
                  </label>
                </div>
              </div>

              {/* Variantes agrupadas por color → talles */}
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Colores y talles</p>

                {coloresUnicos.length === 0 && sinColor.length === 0 && (
                  <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-3">
                    Sin colores cargados — el producto no se puede agregar al carrito.
                  </p>
                )}

                {/* Variantes sin color (legacy) */}
                {sinColor.length > 0 && (
                  <div className="rounded-lg border border-zinc-600/50 overflow-hidden mb-2">
                    <div className="bg-zinc-700/30 px-3 py-1.5">
                      <span className="text-xs font-bold text-zinc-400 italic">Sin color asignado</span>
                    </div>
                    <div className="flex flex-col divide-y divide-zinc-800">
                      {sinColor.map(v => (
                        <div key={v.id} className="flex items-center gap-2 px-3 py-2">
                          <span className="text-xs text-zinc-400 w-16">Talle {v.talle}</span>
                          <input type="number" min="0"
                            value={stockEdit[v.id] ?? v.stock}
                            onChange={e => setStockEdit(s => ({ ...s, [v.id]: e.target.value }))}
                            onBlur={() => guardarStock(v.id)}
                            className="w-16 text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input type="number" min="0" step="0.01"
                            value={precioEdit[v.id] ?? (v.precio != null ? Number(v.precio) : '')}
                            onChange={e => setPrecioEdit(s => ({ ...s, [v.id]: e.target.value }))}
                            onBlur={() => guardarPrecio(v.id)}
                            placeholder={String(Number(producto.precio))}
                            className="w-24 text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-600"
                          />
                          <button onClick={() => eliminarVariante(v.id)} className="text-zinc-700 hover:text-red-400 ml-auto transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colores con talles adentro */}
                <div className="flex flex-col gap-2 mb-3">
                  {coloresUnicos.map(color => {
                    const variantesDeColor = producto.variantes.filter(v => v.color === color)
                    return (
                      <div key={color} className="rounded-lg border border-zinc-700 overflow-hidden">
                        {/* Header del color */}
                        <div className="bg-zinc-700/40 px-3 py-1.5 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full border border-zinc-500 shrink-0" />
                          <span className="text-xs font-bold text-zinc-200">{color}</span>
                          <span className="text-[10px] text-zinc-600 ml-auto">{variantesDeColor.length} talle{variantesDeColor.length !== 1 ? 's' : ''}</span>
                        </div>

                        {/* Cabecera columnas */}
                        <div className="flex items-center gap-2 px-3 pt-1.5 pb-0.5">
                          <span className="text-[10px] text-zinc-600 w-16">Talle</span>
                          <span className="text-[10px] text-zinc-600 w-16 text-center">Stock</span>
                          <span className="text-[10px] text-zinc-600 w-24 text-center">Precio ($)</span>
                        </div>

                        {/* Filas de talles */}
                        <div className="flex flex-col divide-y divide-zinc-800/70">
                          {variantesDeColor.map(v => (
                            <div key={v.id} className="flex items-center gap-2 px-3 py-1.5">
                              <span className="text-xs text-zinc-300 font-medium w-16">{v.talle}</span>
                              <input type="number" min="0"
                                value={stockEdit[v.id] ?? v.stock}
                                onChange={e => setStockEdit(s => ({ ...s, [v.id]: e.target.value }))}
                                onBlur={() => guardarStock(v.id)}
                                className="w-16 text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <input type="number" min="0" step="0.01"
                                value={precioEdit[v.id] ?? (v.precio != null ? Number(v.precio) : '')}
                                onChange={e => setPrecioEdit(s => ({ ...s, [v.id]: e.target.value }))}
                                onBlur={() => guardarPrecio(v.id)}
                                placeholder={String(Number(producto.precio))}
                                className="w-24 text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-600"
                              />
                              <button onClick={() => eliminarVariante(v.id)} className="text-zinc-700 hover:text-red-400 ml-auto transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Agregar talle a este color */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/30">
                          <span className="text-[10px] text-zinc-600 shrink-0">+ talle:</span>
                          <select
                            value={nuevoTallePorColor[color] ?? ''}
                            onChange={e => setNuevoTallePorColor(s => ({ ...s, [color]: e.target.value }))}
                            className="flex-1 text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Talle...</option>
                            {TALLES_COMUNES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <button
                            onClick={() => agregarTalleAColor(color)}
                            disabled={!nuevoTallePorColor[color]}
                            className="text-[10px] bg-zinc-700 text-zinc-300 px-2 py-1 rounded hover:bg-zinc-600 disabled:opacity-40 transition-colors whitespace-nowrap"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <p className="text-[10px] text-zinc-600 mb-2">
                  Precio vacío = usa el precio base ({formatPrecio(producto.precio)})
                </p>

                {/* Agregar color nuevo */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wide w-full">Nuevo color:</span>
                  <input
                    type="text"
                    placeholder="ej: azul marino"
                    value={nuevoColor}
                    onChange={e => setNuevoColor(e.target.value)}
                    className="flex-1 min-w-[90px] text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-600"
                  />
                  <select
                    value={nuevoTalle}
                    onChange={e => setNuevoTalle(e.target.value)}
                    className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Talle...</option>
                    {TALLES_COMUNES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button
                    onClick={agregarColorConTalle}
                    disabled={!nuevoColor.trim() || !nuevoTalle}
                    className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded hover:bg-blue-500 disabled:opacity-40 transition-colors whitespace-nowrap"
                  >
                    Agregar color
                  </button>
                </div>
              </div>

            </div>
          </td>
        </tr>
      )}

      {editando && (
        <ModalProducto producto={producto} colegios={colegios} token={token}
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
  const [cargando, setCargando] = useState(true)
  const [modalNuevo, setModalNuevo] = useState(false)

  async function cargar() {
    setCargando(true)
    const [prods, cols] = await Promise.all([adminApi.listarProductos(token), colegiosApi.listar()])
    setProductos(prods); setColegios(cols); setCargando(false)
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
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
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
                <FilaProducto key={p.id} producto={p} colegios={colegios} token={token} onActualizado={cargar} />
              ))}
            </tbody>
          </table>
          {!productos.length && (
            <div className="text-center py-16 text-zinc-600 text-sm">No hay productos aún</div>
          )}
        </div>
      )}

      {modalNuevo && (
        <ModalProducto colegios={colegios} token={token}
          onGuardado={() => { setModalNuevo(false); cargar() }}
          onCerrar={() => setModalNuevo(false)} />
      )}
    </div>
  )
}
