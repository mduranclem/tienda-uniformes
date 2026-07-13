// Helper genérico para webhooks salientes: POST con reintentos y backoff
// exponencial. Nunca lanza — devuelve true/false para que el llamador pueda
// hacer fire-and-forget sin romper el flujo principal.

const BACKOFF_MS = [500, 1000, 2000]

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function postConReintentos(url, payload, { tag = 'webhook' } = {}) {
  if (!url) return false

  for (let intento = 1; intento <= BACKOFF_MS.length; intento++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        return true
      }
      console.error(`[${tag}] Intento ${intento}/${BACKOFF_MS.length} respondió ${res.status}`)
    } catch (err) {
      console.error(`[${tag}] Intento ${intento}/${BACKOFF_MS.length} falló:`, err.message)
    }

    if (intento < BACKOFF_MS.length) {
      await esperar(BACKOFF_MS[intento - 1])
    }
  }

  console.error(`[${tag}] Se agotaron los reintentos para ${url}`)
  return false
}

module.exports = { postConReintentos }
