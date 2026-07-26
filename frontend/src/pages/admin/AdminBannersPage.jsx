import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { comprimirImagen } from '../../lib/imageCompress'
import Spinner from '../../components/ui/Spinner'
import { Trash2, Upload, GripVertical, Eye, EyeOff } from 'lucide-react'

export default function AdminBannersPage() {
  const { sesion } = useAuth()
  const token = sesion?.access_token
  const [slides, setSlides] = useState([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)

  async function cargar() {
    setCargando(true)
    const data = await adminApi.listarBanners(token)
    setSlides(data)
    setCargando(false)
  }

  useEffect(() => { if (token) cargar() }, [token])

  async function subirFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setSubiendo(true)
    try {
      const comprimido = await comprimirImagen(file, { maxAncho: 1920, maxAlto: 1920 })
      const ext = comprimido.name.split('.').pop()
      const path = `banners/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('productos').upload(path, comprimido, { upsert: true, cacheControl: '31536000' })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(path)
      await adminApi.crearBanner(token, { url: publicUrl, orden: slides.length })
      cargar()
    } catch (err) {
      alert('Error al subir: ' + err.message)
    } finally {
      setSubiendo(false)
      e.target.value = ''
    }
  }

  async function toggleActivo(slide) {
    await adminApi.actualizarBanner(token, slide.id, { activo: !slide.activo })
    cargar()
  }

  async function actualizarTitulo(slide, titulo) {
    await adminApi.actualizarBanner(token, slide.id, { titulo })
    cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta imagen del carrusel?')) return
    await adminApi.eliminarBanner(token, id)
    cargar()
  }

  async function moverOrden(id, direccion) {
    const idx = slides.findIndex(s => s.id === id)
    const nuevo = idx + direccion
    if (nuevo < 0 || nuevo >= slides.length) return
    const a = slides[idx]
    const b = slides[nuevo]
    await Promise.all([
      adminApi.actualizarBanner(token, a.id, { orden: b.orden }),
      adminApi.actualizarBanner(token, b.id, { orden: a.orden }),
    ])
    cargar()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Carrusel (Home)</h1>
          <p className="text-sm text-zinc-500">{slides.length} imágenes cargadas</p>
        </div>
        <label className={`btn-primario flex items-center gap-2 cursor-pointer ${subiendo ? 'opacity-50 pointer-events-none' : ''}`}>
          {subiendo ? <Spinner className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
          {subiendo ? 'Subiendo...' : 'Subir foto'}
          <input type="file" accept="image/*" className="hidden" onChange={subirFoto} />
        </label>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : slides.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 text-sm">
          No hay imágenes en el carrusel aún. Subí la primera foto.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {slides.map((slide, i) => (
            <div key={slide.id} className={`bg-zinc-900 border rounded-xl overflow-hidden ${slide.activo ? 'border-zinc-800' : 'border-zinc-800 opacity-50'}`}>
              <div className="aspect-video relative">
                <img src={slide.url} alt={slide.titulo ?? ''} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => toggleActivo(slide)}
                    title={slide.activo ? 'Ocultar' : 'Mostrar'}
                    className="bg-black/60 text-white rounded-lg p-1.5 hover:bg-black/80">
                    {slide.activo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-zinc-400" />}
                  </button>
                  <button onClick={() => eliminar(slide.id)}
                    className="bg-black/60 text-red-400 rounded-lg p-1.5 hover:bg-black/80">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-2">
                <input
                  type="text"
                  defaultValue={slide.titulo ?? ''}
                  onBlur={e => actualizarTitulo(slide, e.target.value)}
                  placeholder="Texto sobre la imagen (opcional)"
                  className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                />
                <div className="flex items-center gap-1 text-xs text-zinc-600">
                  <GripVertical className="w-3.5 h-3.5" />
                  <button disabled={i === 0} onClick={() => moverOrden(slide.id, -1)}
                    className="px-2 py-0.5 rounded hover:bg-zinc-800 disabled:opacity-30">↑</button>
                  <button disabled={i === slides.length - 1} onClick={() => moverOrden(slide.id, 1)}
                    className="px-2 py-0.5 rounded hover:bg-zinc-800 disabled:opacity-30">↓</button>
                  <span className="ml-auto">#{i + 1}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
