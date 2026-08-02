import { app, dialog, safeStorage, type BrowserWindow } from 'electron'
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
  writeFileSync,
  readFileSync,
} from 'node:fs'
import { join } from 'node:path'
import type { ExportResult } from '@shared/types'
import { dueTimeInPeriod, periodKey } from '@shared/schedule'
import { decryptBackup, encryptBackup } from '@shared/crypto'
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

  const settings = getSettings()
  if (settings['backupEncryption'] === 'true') {
    const passphrase = backupPassphrase(settings)
    if (!passphrase) {
      await dialog.showErrorBox(
        'Encryption unavailable',
        'Backup encryption is enabled but no passphrase is set. Set one in Settings > Data Safety.',
      )
      return { saved: false }
    }
    const blob = Buffer.from(getDb().$client.serialize())
    writeFileSync(result.filePath, encryptBackup(blob, passphrase))
  } else {
    await getDb().$client.backup(result.filePath)
  }
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

/** Count applied migrations from the drizzle journal table inside a SQLite file. */
function schemaVersionOf(blob: Buffer): number | null {
  let db: Database.Database | null = null
  try {
    db = new Database(blob, { readonly: true })
    const row = db.prepare('SELECT COUNT(*) AS c FROM drizzle').get() as { c: number } | undefined
    return row ? row.c : null
  } catch {
    return null
  } finally {
    if (db) db.close()
  }
}

export async function restoreBackup(
  win: BrowserWindow,
  passphrase: string | null,
): Promise<{ restored: boolean; error?: string }> {
  const result = await dialog.showOpenDialog(win, {
    title: 'CRM-Easy Restore',
    properties: ['openFile'],
    filters: [{ name: 'Database backup', extensions: ['db'] }],
  })
  if (result.canceled || !result.filePaths[0]) return { restored: false }

  let backupBytes: Buffer = Buffer.from(readFileSync(result.filePaths[0]))

  // Encrypted backups start with our magic instead of the SQLite header.
  if (!backupBytes.toString('latin1', 0, 16).startsWith(SQLITE_HEADER)) {
    if (!passphrase) return { restored: false, error: 'NEED_PASSPHRASE' }
    const plain = decryptBackup(backupBytes, passphrase)
    if (!plain) return { restored: false, error: 'BAD_PASSPHRASE' }
    backupBytes = plain
  }

  const current = new Database(resolveDbPath(), { readonly: true })
  let currentVersion: number
  try {
    const row = current.prepare('SELECT COUNT(*) AS c FROM drizzle').get() as { c: number }
    currentVersion = row.c
  } finally {
    current.close()
  }
  const backupVersion = schemaVersionOf(backupBytes) ?? 0
  if (backupVersion < currentVersion) {
    return {
      restored: false,
      error: 'OUTDATED_BACKUP',
    }
  }

  const dbPath = resolveDbPath()
  closeDatabase()

  const safetyCopy = `${dbPath}.pre-restore-${Date.now()}`
  copyFileSync(dbPath, safetyCopy)
  writeFileSync(dbPath, backupBytes)

  initDatabase()
  return { restored: true }
}

/** Encrypted (safeStorage) backup passphrase from settings, or null if unset. */
export function backupPassphrase(settings: Record<string, string | undefined>): string | null {
  const stored = settings['backupPassphraseEnc']
  if (!stored) return null
  try {
    return safeStorage.decryptString(Buffer.from(stored, 'base64'))
  } catch {
    return null
  }
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
    .filter((path) => isSqliteFile(path)) // skip encrypted backups (magic header)
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
  return candidates[0] ?? null
}

export function createBackupTo(folder: string): string {
  mkdirSync(folder, { recursive: true })
  const filePath = join(folder, backupFileName())
  const settings = getSettings()
  if (settings['backupEncryption'] === 'true') {
    const passphrase = backupPassphrase(settings)
    if (passphrase) {
      const blob = Buffer.from(getDb().$client.serialize())
      writeFileSync(filePath, encryptBackup(blob, passphrase))
      return filePath
    }
  }
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
