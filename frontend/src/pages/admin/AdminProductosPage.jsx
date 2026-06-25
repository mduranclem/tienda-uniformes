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

function ModalProducto({ producto, colegios, token, onGuardado, onCerrar }) {
  const editando = !!producto
  const [form, setForm] = useState({
    nombre: producto?.nombre ?? '',
    descripcion: producto?.descripcion ?? '',
    tipo: producto?.tipo ?? 'REMERA',
    precio: producto?.precio ?? '',
    colegioId: producto?.colegioId ?? '',
    activo: producto?.activo ?? true,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function set(campo, valor) { setForm(f => ({ ...f, [campo]: valor })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      const data = { ...form, precio: parseFloat(form.precio) }
      if (editando) {
        await adminApi.actualizarProducto(token, producto.id, data)
      } else {
        await adminApi.crearProducto(token, data)
      }
      onGuardado()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-gray-900">{editando ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onCerrar}><X className="w-5 h-5 text-gray-500" /></button>
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
          <Campo label="Colegio">
            <select value={form.colegioId} onChange={e => set('colegioId', e.target.value)} className="input">
              <option value="">— Liso (sin colegio) —</option>
              {colegios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Campo>
          {editando && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} />
              Producto activo (visible en la tienda)
            </label>
          )}
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
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
  const [nuevoTalle, setNuevoTalle] = useState('')

  async function subirImagen(e) {
    const file = e.target.files[0]
    if (!file) return
    setSubiendoImg(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `productos/${producto.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('productos').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(path)
      await adminApi.agregarImagen(token, producto.id, { url: publicUrl, orden: producto.imagenes.length })
      onActualizado()
    } catch (err) {
      alert('Error al subir imagen: ' + err.message)
    } finally {
      setSubiendoImg(false)
    }
  }

  async function eliminarImagen(imagenId) {
    if (!confirm('¿Eliminar imagen?')) return
    await adminApi.eliminarImagen(token, imagenId)
    onActualizado()
  }

  async function guardarStock(varianteId) {
    const stock = stockEdit[varianteId]
    if (stock === undefined) return
    await adminApi.actualizarVariante(token, varianteId, { stock: Number(stock) })
    setStockEdit(s => { const n = { ...s }; delete n[varianteId]; return n })
    onActualizado()
  }

  async function agregarVariante() {
    if (!nuevoTalle.trim()) return
    await adminApi.crearVariante(token, producto.id, { talle: nuevoTalle.trim(), stock: 0 })
    setNuevoTalle('')
    onActualizado()
  }

  async function eliminarVariante(varianteId) {
    if (!confirm('¿Eliminar variante?')) return
    await adminApi.eliminarVariante(token, varianteId)
    onActualizado()
  }

  async function toggleActivo() {
    await adminApi.actualizarProducto(token, producto.id, { activo: !producto.activo })
    onActualizado()
  }

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={producto.imagenes[0]?.url ?? '/placeholder.png'}
              className="w-10 h-10 object-cover rounded-lg bg-gray-100 shrink-0" alt="" />
            <div>
              <p className="text-sm font-medium text-gray-900">{producto.nombre}</p>
              <p className="text-xs text-gray-500">{producto.colegio?.nombre ?? 'Liso'} · {producto.tipo}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-700">{formatPrecio(producto.precio)}</td>
        <td className="px-4 py-3">
          <Badge variante={producto.activo ? 'green' : 'default'}>
            {producto.activo ? 'Activo' : 'Inactivo'}
          </Badge>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {producto.variantes.reduce((a, v) => a + v.stock, 0)} uds
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setEditando(true)} className="p-1.5 text-gray-500 hover:text-blue-600 rounded">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={toggleActivo} className="p-1.5 text-gray-500 hover:text-yellow-600 rounded text-xs font-medium">
              {producto.activo ? 'Ocultar' : 'Activar'}
            </button>
            <button onClick={() => setExpandido(!expandido)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded">
              {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </td>
      </tr>

      {expandido && (
        <tr className="bg-blue-50/40 border-b border-gray-200">
          <td colSpan={5} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Imágenes */}
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Imágenes</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {producto.imagenes.map(img => (
                    <div key={img.id} className="relative group">
                      <img src={img.url} className="w-16 h-16 object-cover rounded-lg border" alt="" />
                      <button onClick={() => eliminarImagen(img.id)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                    {subiendoImg ? <Spinner /> : <Upload className="w-5 h-5 text-gray-400" />}
                    <input type="file" accept="image/*" className="hidden" onChange={subirImagen} />
                  </label>
                </div>
              </div>

              {/* Variantes / Stock */}
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Talles y stock</p>
                <div className="flex flex-col gap-1.5 mb-2">
                  {producto.variantes.map(v => (
                    <div key={v.id} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700 w-10">{v.talle}</span>
                      {v.color && <span className="text-xs text-gray-500 w-16">{v.color}</span>}
                      <input
                        type="number" min="0"
                        value={stockEdit[v.id] ?? v.stock}
                        onChange={e => setStockEdit(s => ({ ...s, [v.id]: e.target.value }))}
                        onBlur={() => guardarStock(v.id)}
                        className="w-16 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-400">uds</span>
                      <button onClick={() => eliminarVariante(v.id)} className="text-gray-300 hover:text-red-500 ml-auto">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <select value={nuevoTalle} onChange={e => setNuevoTalle(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">+ Agregar talle</option>
                    {TALLES_COMUNES.filter(t => !producto.variantes.find(v => v.talle === t)).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button onClick={agregarVariante} disabled={!nuevoTalle}
                    className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded hover:bg-blue-700 disabled:opacity-40">
                    Agregar
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

function Campo({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
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
    const [prods, cols] = await Promise.all([
      adminApi.listarProductos(token),
      colegiosApi.listar(),
    ])
    setProductos(prods)
    setColegios(cols)
    setCargando(false)
  }

  useEffect(() => { if (token) cargar() }, [token])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500">{productos.length} productos en total</p>
        </div>
        <button onClick={() => setModalNuevo(true)} className="btn-primario flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo producto
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <FilaProducto key={p.id} producto={p} colegios={colegios} token={token} onActualizado={cargar} />
              ))}
            </tbody>
          </table>
          {!productos.length && (
            <div className="text-center py-16 text-gray-400 text-sm">No hay productos aún</div>
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
