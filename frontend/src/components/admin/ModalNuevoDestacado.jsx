import { useEffect, useMemo, useState } from 'react'
import { adminApi, colegiosApi, categoriasApi } from '../../services/api'
import { supabase } from '../../lib/supabaseClient'
import { comprimirImagen } from '../../lib/imageCompress'
import { formatPrecio, TALLES_STANDARD } from '../../lib/utils'
import Spinner from '../ui/Spinner'
import { ImagePlus, X } from 'lucide-react'

// Alta de un producto destacado en un solo paso: flyer, nombre, colegio,
// categoría, precio, color y stock por talle. Crea el producto ya marcado como
// destacado, con el flyer como foto principal y listo para venderse, sin pasar
// por Admin › Productos.
//
// El precio de lista sale de la categoría (es el mismo para todas las prendas
// de ese tipo). Un precio más bajo se guarda como oferta, y la tienda muestra
// el de la categoría tachado al lado.

function Campo({ label, ayuda, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      {children}
      {ayuda && <p className="text-[11px] text-zinc-500">{ayuda}</p>}
    </div>
  )
}

export default function ModalNuevoDestacado({ token, onCreado, onCerrar }) {
  const [colegios, setColegios] = useState([])
  const [categorias, setCategorias] = useState([])
  const [archivo, setArchivo] = useState(null)
  const [vistaPrevia, setVistaPrevia] = useState(null)
  const [form, setForm] = useState({
    nombre: '', descripcion: '', colegioId: '', tipo: '', precio: '', color: 'Blanco',
  })
  const [stock, setStock] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    colegiosApi.listar().then(r => setColegios(r.data ?? r))
    categoriasApi.listar().then(r => setCategorias((r.data ?? r).filter(c => c.precio != null)))
  }, [])

  useEffect(() => () => { if (vistaPrevia) URL.revokeObjectURL(vistaPrevia) }, [vistaPrevia])

  const categoria = categorias.find(c => c.nombre === form.tipo)
  const precioLista = categoria ? Number(categoria.precio) : null
  const variantes = useMemo(
    () => TALLES_STANDARD.filter(t => Number(stock[t]) > 0).map(t => ({ talle: t, stock: Number(stock[t]) })),
    [stock],
  )

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setError('')
  }

  function elegirCategoria(tipo) {
    const cat = categorias.find(c => c.nombre === tipo)
    setForm(f => ({ ...f, tipo, precio: cat ? String(Number(cat.precio)) : '' }))
    setError('')
  }

  function elegirFlyer(e) {
    const file = e.target.files[0]
    if (!file) return
    setArchivo(file)
    setVistaPrevia(URL.createObjectURL(file))
    setError('')
  }

  function validar() {
    if (!archivo) return 'Subí el flyer o la foto del producto.'
    if (!form.nombre.trim()) return 'Poné el nombre del producto.'
    if (!categoria) return 'Elegí la categoría.'
    const precio = Number(form.precio)
    if (!(precio > 0)) return 'Poné el precio.'
    if (precio > precioLista) {
      return `El precio no puede ser mayor al de la categoría (${formatPrecio(precioLista)}). Si subió, cambialo en Categorías.`
    }
    if (!form.color.trim()) return 'Poné el color.'
    if (!variantes.length) return 'Cargá el stock de al menos un talle.'
    return null
  }

  async function guardar(e) {
    e.preventDefault()
    const problema = validar()
    if (problema) { setError(problema); return }
    setGuardando(true); setError('')
    try {
      const comprimido = await comprimirImagen(archivo)
      const ext = comprimido.name.split('.').pop()
      const path = `productos/destacados/${Date.now()}.${ext}`
      const { error: errSubida } = await supabase.storage.from('productos')
        .upload(path, comprimido, { upsert: true, cacheControl: '31536000' })
      if (errSubida) throw errSubida
      const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(path)

      const precio = Number(form.precio)
      const color = form.color.trim()
      const producto = await adminApi.crearProducto(token, {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        tipo: form.tipo,
        colegioId: form.colegioId || null,
        precioOferta: precio < precioLista ? precio : null,
        destacado: true,
        imagenes: [{ url: publicUrl, orden: 0, alt: form.nombre.trim() }],
        variantes: variantes.map(v => ({ ...v, color })),
      })
      // La ficha pide elegir color: sin el color declarado no se puede comprar.
      await adminApi.agregarColor(token, producto.id, color)
      onCreado(producto)
    } catch (err) {
      setError(err.message || 'No se pudo guardar. Probá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="font-bold text-zinc-100">Nuevo producto destacado</h2>
          <button onClick={onCerrar} aria-label="Cerrar"><X className="h-5 w-5 text-zinc-500 hover:text-zinc-200" /></button>
        </div>

        <form onSubmit={guardar} className="flex flex-col gap-4 p-5">
          {/* Flyer */}
          <label className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed ${vistaPrevia ? 'border-zinc-700' : 'border-zinc-700 hover:border-zinc-500'} bg-zinc-800/40`}>
            {vistaPrevia ? (
              <>
                <img src={vistaPrevia} alt="" className="max-h-72 w-full object-contain" />
                <span className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2 py-1 text-xs text-zinc-200">Cambiar</span>
              </>
            ) : (
              <span className="flex flex-col items-center gap-2 py-10 text-sm text-zinc-400">
                <ImagePlus className="h-7 w-7" />
                Subí el flyer o la foto
              </span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={elegirFlyer} />
          </label>

          <Campo label="Nombre *">
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} className="input" placeholder="Ej: Chomba colegial Stella Maris" />
          </Campo>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Campo label="Colegio">
              <select value={form.colegioId} onChange={e => set('colegioId', e.target.value)} className="input">
                <option value="">— Liso (sin colegio) —</option>
                {colegios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </Campo>
            <Campo label="Categoría *">
              <select value={form.tipo} onChange={e => elegirCategoria(e.target.value)} className="input">
                <option value="">— Elegí —</option>
                {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
            </Campo>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Campo
              label="Precio *"
              ayuda={precioLista != null && Number(form.precio) > 0 && Number(form.precio) < precioLista
                ? `En la tienda se ve ${formatPrecio(precioLista)} tachado`
                : precioLista != null ? `Precio de la categoría: ${formatPrecio(precioLista)}` : null}
            >
              <input type="number" min="0" step="100" inputMode="numeric" value={form.precio}
                onChange={e => set('precio', e.target.value)} className="input" placeholder="25000" />
            </Campo>
            <Campo label="Color *">
              <input value={form.color} onChange={e => set('color', e.target.value)} className="input" placeholder="Blanco" />
            </Campo>
          </div>

          <Campo label="Stock por talle *" ayuda="Dejá vacíos los talles que no hay.">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {TALLES_STANDARD.map(t => (
                <label key={t} className="flex flex-col items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-800/40 px-1 py-1.5">
                  <span className="text-xs font-bold text-zinc-300">{t}</span>
                  <input
                    type="number" min="0" inputMode="numeric"
                    value={stock[t] ?? ''}
                    onChange={e => { setStock(s => ({ ...s, [t]: e.target.value })); setError('') }}
                    aria-label={`Stock talle ${t}`}
                    className="w-full rounded border border-zinc-700 bg-zinc-800 px-1 py-1 text-center text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>
          </Campo>

          <Campo label="Descripción">
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2}
              className="input resize-none" placeholder="Opcional" />
          </Campo>

          {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCerrar} className="btn-secundario">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primario flex items-center gap-2">
              {guardando && <Spinner className="h-4 w-4" />}
              {guardando ? 'Guardando...' : 'Publicar destacado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
