function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function dateToInput(value: Date): string {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

export function inputToDate(value: string): Date | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function datetimeToLocalInput(value: Date): string {
  return `${dateToInput(value)}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

export function localInputToDate(value: string): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
