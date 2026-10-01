/** Minúsculas e sem acento: "infancia" acha "Infância". */
export const normalizar = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export const MAX_RESULTADOS = 6
