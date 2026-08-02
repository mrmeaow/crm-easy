import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { app } from 'electron'
import { join, dirname } from 'node:path'
import { mkdirSync } from 'node:fs'
import * as schema from './schema'
import { pipelineStages } from './schema'

export type AppDb = ReturnType<typeof drizzle<typeof schema>>

let db: AppDb | null = null

function createDb(path: string): AppDb {
  const sqlite = new Database(path)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  return drizzle(sqlite, { schema })
}

export function resolveDbPath(): string {
  return join(app.getPath('userData'), 'data', 'crm-easy.db')
}

export function resolveMigrationsFolder(): string {
  if (app.isPackaged) return join(process.resourcesPath, 'drizzle')
  return join(app.getAppPath(), 'drizzle')
}

function seedDefaultPipelineStages(db: AppDb): void {
  const existing = db.select({ id: pipelineStages.id }).from(pipelineStages).limit(1).all()
  if (existing.length > 0) return

  const defaults = [
    { name: 'New', position: 0, color: '#6366f1' },
    { name: 'Contacted', position: 1, color: '#0ea5e9' },
    { name: 'Qualified', position: 2, color: '#f59e0b' },
    { name: 'Proposal', position: 3, color: '#8b5cf6' },
    { name: 'Won', position: 4, color: '#22c55e', isWon: true },
    { name: 'Lost', position: 5, color: '#ef4444', isLost: true },
  ]
  db.insert(pipelineStages).values(defaults).run()
}

export function initDatabase(): AppDb {
  if (db) return db

  const path = resolveDbPath()
  mkdirSync(dirname(path), { recursive: true })

  const instance = createDb(path)
  migrate(instance, { migrationsFolder: resolveMigrationsFolder() })
  seedDefaultPipelineStages(instance)

  db = instance
  return instance
}

export function getDb(): AppDb {
  if (!db) throw new Error('Database not initialized — call initDatabase() first')
  return db
}

export function closeDatabase(): void {
  if (!db) return
  db.$client.close()
  db = null
}
