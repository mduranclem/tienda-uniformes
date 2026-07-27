// Normalización de teléfonos argentinos al formato que espera WhatsApp.
//
// El checkout guarda lo que el cliente escriba: "3417434552", "0341 15 743-4552",
// "+54 9 341 743 4552". WhatsApp (y Evolution API) necesitan el número
// internacional sin símbolos: 549 + código de área + abonado.
//
// Reglas del número argentino:
//   - Nacional (área + abonado) son siempre 10 dígitos.
//   - El 0 inicial es de larga distancia y no viaja.
//   - El 15 va después del código de área y tampoco viaja.
//   - Los móviles llevan un 9 entre el país y el área: 54 9 341 7434552.

const PAIS = '54'
const MOVIL = '9'
const LARGO_NACIONAL = 10

// Códigos de área argentinos: 2, 3 o 4 dígitos.
const LARGOS_AREA = [2, 3, 4]

/**
 * @param {string} crudo
 * @returns {string|null} "5493417434552", o null si no se puede interpretar.
 *   Devuelve null en vez de adivinar: mandarle un mensaje a un número
 *   equivocado es peor que no mandarlo.
 */
function aWhatsapp(crudo) {
  let d = String(crudo ?? '').replace(/\D/g, '')
  if (!d) return null

  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith(PAIS)) d = d.slice(PAIS.length)
  if (d.startsWith(MOVIL)) d = d.slice(1)
  if (d.startsWith('0')) d = d.slice(1)

  // Sobran dos dígitos: probablemente sea el 15 después del código de área.
  if (d.length === LARGO_NACIONAL + 2) {
    for (const largo of LARGOS_AREA) {
      if (d.slice(largo, largo + 2) === '15') {
        d = d.slice(0, largo) + d.slice(largo + 2)
        break
      }
    }
  }

  if (d.length !== LARGO_NACIONAL) return null

  return `${PAIS}${MOVIL}${d}`
}

module.exports = { aWhatsapp }
