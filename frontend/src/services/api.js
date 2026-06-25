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

// ── Usuarios ──────────────────────────────────────────────────────────────────
export const usuariosApi = {
  sync: (token) =>
    request('/usuarios/sync', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
  me: (token) =>
    request('/usuarios/me', { headers: { Authorization: `Bearer ${token}` } }),
}
