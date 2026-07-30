// Agenda de entregas a domicilio en Rosario.
//
// Se reparte de lunes a viernes, entre las 10 y las 16, y nunca el mismo día:
// la primera fecha disponible es siempre la siguiente jornada hábil, para poder
// organizar el recorrido.
//
// Todo se calcula en hora argentina de forma explícita. El servidor corre en
// UTC, así que un pedido hecho a las 22:00 de Argentina ya es el día siguiente
// en UTC: sin convertir la zona, el sistema ofrecería fechas corridas un día.
// Es un error que no aparece probando de tarde y sí aparece en producción de
// noche.
//
// Las fechas se representan al mediodía UTC. Argentina es UTC-3 todo el año
// (no tiene horario de verano), así que el mediodía UTC son las 09:00 locales:
// suficientemente lejos de ambos bordes del día como para que ninguna
// conversión cambie la fecha del calendario.

const ZONA = 'America/Argentina/Buenos_Aires'

const FRANJAS = ['10-12', '12-14', '14-16']
const DIAS_DISPONIBLES = 14

const UN_DIA_MS = 24 * 60 * 60 * 1000

// "YYYY-MM-DD" del día que es en Argentina en este momento.
function diaCalendarioArgentina(ahora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora)
}

function aFechaUTC(iso) {
  return new Date(`${iso}T12:00:00.000Z`)
}

function aISO(fecha) {
  return fecha.toISOString().slice(0, 10)
}

// Lunes a viernes. getUTCDay() es seguro acá porque la fecha es mediodía UTC.
function esDiaHabil(fecha) {
  const dia = fecha.getUTCDay()
  return dia >= 1 && dia <= 5
}

// Los próximos DIAS_DISPONIBLES días hábiles, empezando por mañana.
function fechasDisponibles(ahora = new Date()) {
  const hoy = aFechaUTC(diaCalendarioArgentina(ahora))
  const fechas = []
  let cursor = hoy

  while (fechas.length < DIAS_DISPONIBLES) {
    cursor = new Date(cursor.getTime() + UN_DIA_MS)
    if (esDiaHabil(cursor)) fechas.push(new Date(cursor))
  }
  return fechas
}

function esFechaValida(fecha, ahora = new Date()) {
  if (!fecha) return false
  const objetivo = fecha instanceof Date ? fecha : new Date(fecha)
  if (Number.isNaN(objetivo.getTime())) return false
  const iso = aISO(objetivo)
  return fechasDisponibles(ahora).some(f => aISO(f) === iso)
}

function esFranjaValida(franja) {
  return FRANJAS.includes(franja)
}

// "jueves 30 de julio", para los mensajes de WhatsApp.
function formatearFecha(fecha) {
  const objetivo = fecha instanceof Date ? fecha : new Date(fecha)
  // timeZone UTC a propósito: la fecha ya representa un día de calendario.
  const texto = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(objetivo)
  return texto.replace(',', '')
}

module.exports = {
  ZONA,
  FRANJAS,
  DIAS_DISPONIBLES,
  diaCalendarioArgentina,
  fechasDisponibles,
  esFechaValida,
  esFranjaValida,
  formatearFecha,
  aISO,
}
