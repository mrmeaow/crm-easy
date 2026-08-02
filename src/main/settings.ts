import { getDb } from './db'
import { settings } from './db/schema'

export type SettingsRecord = Record<string, string>

export function getSettingsRecord(): SettingsRecord {
  const rows = getDb().select().from(settings).all()
  return Object.fromEntries(rows.map((row) => [row.key, row.value]))
}

export function getSetting(key: string): string | undefined {
  return getSettingsRecord()[key]
}

export function setSetting(key: string, value: string): void {
  getDb()
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run()
}
