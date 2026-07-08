// Reglas de envío
// El envío dentro de Rosario es siempre gratis.

// Detecta si la ciudad ingresada es Rosario, tolerando mayúsculas, tildes
// y sufijos tipo "Rosario, Santa Fe".
function esRosario(ciudad) {
  if (typeof ciudad !== 'string') return false
  const norm = ciudad.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
  return /\brosario\b/.test(norm)
}

module.exports = { esRosario }
