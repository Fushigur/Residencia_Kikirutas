// src/utils/dateFormat.ts
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

/**
 * Recibe '2025-12-01' y devuelve '1 diciembre 2025'
 */
export function formatFechaLarga(fechaISO?: string | null): string {
  if (!fechaISO) return ''

  const limpia = fechaISO.slice(0, 10)              // por si viene con hora
  const [y, m, d] = limpia.split('-')
  const mesIdx = Number(m) - 1

  if (isNaN(mesIdx) || mesIdx < 0 || mesIdx > 11) return fechaISO

  const diaNum = Number(d) || d
  return `${diaNum} ${MESES[mesIdx]} ${y}`
}

export function formatFechaCorta(fechaISO?: string | null): string {
  if (!fechaISO) return ''

  const limpia = fechaISO.slice(0, 10)
  const [y, m, d] = limpia.split('-')

  if (!y || !m || !d) return fechaISO

  const dd = d.padStart(2, '0')
  const mm = m.padStart(2, '0')
  return `${dd}/${mm}/${y}`
}