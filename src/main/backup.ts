import { app, dialog, type BrowserWindow } from 'electron'
import Database from 'better-sqlite3'
import {
  copyFileSync,
  openSync,
  readSync,
  closeSync,
  readdirSync,
  statSync,
  mkdirSync,
  existsSync,
  renameSync,
  unlinkSync,
} from 'node:fs'
import { join } from 'node:path'
import type { ExportResult } from '@shared/types'
import { dueTimeInPeriod, periodKey } from '@shared/schedule'
import { closeDatabase, getDb, initDatabase, resolveDbPath } from './db'
import { getSettingsRecord, setSetting } from './settings'

const SQLITE_HEADER = 'SQLite format 3\x00'

export function backupsFolder(): string {
  const folder = join(app.getPath('userData'), 'backups')
  mkdirSync(folder, { recursive: true })
  return folder
}

export function backupFileName(now = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `crm-easy-backup-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours(),
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}.db`
}

export async function createBackup(win: BrowserWindow): Promise<ExportResult> {
  const result = await dialog.showSaveDialog(win, {
    title: 'CRM-Easy Backup',
    defaultPath: backupFileName(),
    filters: [{ name: 'Database backup', extensions: ['db'] }],
  })
  if (result.canceled || !result.filePath) return { saved: false }

  await getDb().$client.backup(result.filePath)
  return { saved: true, path: result.filePath }
}

function isSqliteFile(path: string): boolean {
  const fd = openSync(path, 'r')
  const buffer = Buffer.alloc(16)
  try {
    readSync(fd, buffer, 0, 16, 0)
  } finally {
    closeSync(fd)
  }
  return buffer.toString('latin1') === SQLITE_HEADER
}

export async function restoreBackup(
  win: BrowserWindow,
): Promise<{ restored: boolean; error?: string }> {
  const result = await dialog.showOpenDialog(win, {
    title: 'CRM-Easy Restore',
    properties: ['openFile'],
    filters: [{ name: 'Database backup', extensions: ['db'] }],
  })
  if (result.canceled || !result.filePaths[0]) return { restored: false }

  const backupPath = result.filePaths[0]
  if (!isSqliteFile(backupPath)) return { restored: false, error: 'INVALID_BACKUP' }

  const dbPath = resolveDbPath()
  closeDatabase()

  const safetyCopy = `${dbPath}.pre-restore-${Date.now()}`
  copyFileSync(dbPath, safetyCopy)
  copyFileSync(backupPath, dbPath)

  initDatabase()
  return { restored: true }
}

export function isIntegrityOk(path: string): boolean {
  const sqlite = new Database(path, { readonly: true })
  try {
    const rows = sqlite.pragma('quick_check') as { quick_check: string }[]
    return rows.length > 0 && rows[0].quick_check === 'ok'
  } finally {
    sqlite.close()
  }
}

export function ensureIntegrity(): boolean {
  const path = resolveDbPath()
  if (!existsSync(path) || isIntegrityOk(path)) return true

  const corrupted = `${path}.corrupted-${Date.now()}`
  try {
    renameSync(path, corrupted)
  } catch {
    return false
  }

  const backup = findLatestBackup()
  if (backup) {
    try {
      copyFileSync(backup, path)
      return true
    } catch {
      return false
    }
  }
  return true
}

export function findLatestBackup(): string | null {
  const folder = backupsFolder()
  const candidates = readdirSync(folder)
    .filter((name) => name.endsWith('.db'))
    .map((name) => join(folder, name))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
  return candidates[0] ?? null
}

export function createBackupTo(folder: string): string {
  mkdirSync(folder, { recursive: true })
  const filePath = join(folder, backupFileName())
  getDb().$client.backup(filePath)
  return filePath
}

function getSettings(): Record<string, string | undefined> {
  return getSettingsRecord()
}

function pruneOldBackups(folder: string, retention: number): void {
  if (retention <= 0) return
  const candidates = readdirSync(folder)
    .filter((name) => name.startsWith('crm-easy-backup-') && name.endsWith('.db'))
    .map((name) => ({
      name,
      path: join(folder, name),
      mtime: statSync(join(folder, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime)
  for (const old of candidates.slice(retention)) {
    try {
      unlinkSync(old.path)
    } catch {
      // best effort
    }
  }
}

let schedulerTimer: NodeJS.Timeout | null = null

function runScheduledBackupIfDue(now: Date): void {
  const settings = getSettings()
  if (settings['autoBackupEnabled'] !== 'true') return

  const frequency = settings['autoBackupFrequency'] === 'weekly' ? 'weekly' : 'daily'
  const time = settings['autoBackupTime'] ?? '09:00'
  const folder = settings['autoBackupFolder'] || backupsFolder()
  const retention = Number.parseInt(settings['autoBackupRetention'] ?? '7', 10)
  const lastRun = settings['autoBackupLastRun'] ?? ''

  const key = periodKey(frequency, now)
  if (lastRun === key) return
  // Catch up: if the scheduled slot for this period already passed (e.g. the app
  // was closed at that time), run now.
  if (now.getTime() < dueTimeInPeriod({ frequency, time }, now).getTime()) return

  try {
    createBackupTo(folder)
    pruneOldBackups(folder, Number.isNaN(retention) ? 7 : retention)
    setSetting('autoBackupLastRun', key)
  } catch (error) {
    console.error('Scheduled backup failed:', error)
  }
}

/** Start the automatic-backup scheduler (checks every 30 minutes). */
export function startBackupScheduler(): void {
  if (schedulerTimer) return
  schedulerTimer = setInterval(() => runScheduledBackupIfDue(new Date()), 30 * 60 * 1000)
  runScheduledBackupIfDue(new Date())
}
