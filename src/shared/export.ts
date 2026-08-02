export function toExportDate(value: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(
    value.getHours(),
  )}:${pad(value.getMinutes())}`
}

export function exportFileName(entity: string, extension: string, now = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours(),
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return `${entity}-export-${stamp}.${extension}`
}

export function toCsvValue(value: string | number): string {
  const text = String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function weightedForecast(
  deals: { value: number; probability: number; stageId: number | null }[],
  openStageIds: ReadonlySet<number>,
): number {
  return deals
    .filter((deal) => deal.stageId !== null && openStageIds.has(deal.stageId))
    .reduce((sum, deal) => sum + (deal.value * deal.probability) / 100, 0)
}
