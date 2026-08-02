/** Pure scheduling helpers for automatic backups. */

export function getIsoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

export function periodKey(frequency: 'daily' | 'weekly', now: Date): string {
  if (frequency === 'weekly') return `${now.getFullYear()}-W${getIsoWeek(now)}`
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

export interface BackupSchedule {
  frequency: 'daily' | 'weekly'
  time: string
}

/** Next occurrence of the scheduled time (daily, or Sunday for weekly). */
export function nextDueTime(schedule: BackupSchedule, now: Date): Date {
  const due = dueTimeInPeriod(schedule, now)
  if (due.getTime() <= now.getTime()) {
    due.setDate(due.getDate() + (schedule.frequency === 'weekly' ? 7 : 1))
  }
  return due
}

/** The scheduled time for the period containing `now` (no roll-forward). */
export function dueTimeInPeriod(schedule: BackupSchedule, now: Date): Date {
  const [hours = 9, minutes = 0] = schedule.time.split(':').map((part) => Number.parseInt(part, 10))
  const due = new Date(now)
  due.setHours(Number.isNaN(hours) ? 9 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0)
  if (schedule.frequency === 'weekly') {
    // Sunday (0) of the current week.
    due.setDate(due.getDate() - due.getDay())
  }
  return due
}
