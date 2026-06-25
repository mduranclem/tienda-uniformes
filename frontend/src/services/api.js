const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ mensaje: res.statusText }))
    throw new Error(error.mensaje || `Error ${res.status}`)
  }
  return res.json()
}

// ── Colegios ────────────────────────────────────────────────────────────────
export const colegiosApi = {
  listar: () => request('/colegios'),
}

// ── Productos ────────────────────────────────────────────────────────────────
export const productosApi = {
  listar: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString()
    return request(`/productos${qs ? `?${qs}` : ''}`)
  },
  obtener: (id) => request(`/productos/${id}`),
}

// ── Carrito ──────────────────────────────────────────────────────────────────
export const carritoApi = {
  obtener: () => request('/carrito'),
  agregar: (varianteId, cantidad) =>
    request('/carrito/items', { method: 'POST', body: JSON.stringify({ varianteId, cantidad }) }),
  actualizar: (varianteId, cantidad) =>
    request(`/carrito/items/${varianteId}`, { method: 'PUT', body: JSON.stringify({ cantidad }) }),
  quitar: (varianteId) => request(`/carrito/items/${varianteId}`, { method: 'DELETE' }),
  merge: () => request('/carrito/merge', { method: 'POST' }),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
function adminRequest(path, options = {}, token) {
  return request(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  })
}

export const adminApi = {
  // Productos
  listarProductos: (token) => adminRequest('/admin/productos', {}, token),
  crearProducto: (token, data) => adminRequest('/admin/productos', { method: 'POST', body: JSON.stringify(data) }, token),
  actualizarProducto: (token, id, data) => adminRequest(`/admin/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  eliminarProducto: (token, id) => adminRequest(`/admin/productos/${id}`, { method: 'DELETE' }, token),
  agregarImagen: (token, productoId, data) => adminRequest(`/admin/productos/${productoId}/imagenes`, { method: 'POST', body: JSON.stringify(data) }, token),
  eliminarImagen: (token, imagenId) => adminRequest(`/admin/productos/imagenes/${imagenId}`, { method: 'DELETE' }, token),
  crearVariante: (token, productoId, data) => adminRequest(`/admin/productos/${productoId}/variantes`, { method: 'POST', body: JSON.stringify(data) }, token),
  actualizarVariante: (token, varianteId, data) => adminRequest(`/admin/variantes/${varianteId}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  eliminarVariante: (token, varianteId) => adminRequest(`/admin/variantes/${varianteId}`, { method: 'DELETE' }, token),
  // Órdenes
  listarOrdenes: (token, params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()
    return adminRequest(`/admin/ordenes${qs ? `?${qs}` : ''}`, {}, token)
  },
  obtenerOrden: (token, id) => adminRequest(`/admin/ordenes/${id}`, {}, token),
  cambiarEstadoOrden: (token, id, estado, nota) => adminRequest(`/admin/ordenes/${id}/estado`, { method: 'PUT', body: JSON.stringify({ estado, nota }) }, token),
  // Cupones
  listarCupones: (token) => adminRequest('/admin/cupones', {}, token),
  crearCupon: (token, data) => adminRequest('/admin/cupones', { method: 'POST', body: JSON.stringify(data) }, token),
  actualizarCupon: (token, id, data) => adminRequest(`/admin/cupones/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  // Entregas
  listarEntregas: (token) => adminRequest('/admin/entregas', {}, token),
  crearEntrega: (token, data) => adminRequest('/admin/entregas', { method: 'POST', body: JSON.stringify(data) }, token),
  actualizarEntrega: (token, id, data) => adminRequest(`/admin/entregas/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
}

// ── Usuarios ──────────────────────────────────────────────────────────────────
export const usuariosApi = {
  sync: (token) =>
    request('/usuarios/sync', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
  me: (token) =>
    request('/usuarios/me', { headers: { Authorization: `Bearer ${token}` } }),
}
