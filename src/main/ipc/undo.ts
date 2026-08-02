import { ipcMain } from 'electron'
import { like, or, eq, isNull, isNotNull, and } from 'drizzle-orm'
import { IpcChannels } from '@shared/ipc'
import type { SearchResults, UndoEntity, UndoEntry } from '@shared/types'
import { getDb } from '../db'
import { contacts, leads, deals, tasks, notes } from '../db/schema'

export function registerSearchIpc(): void {
  ipcMain.handle(IpcChannels.search.query, (_event, rawQuery: string): SearchResults => {
    const q = rawQuery.trim().toLowerCase()
    if (q.length < 2) return { contacts: [], leads: [], deals: [], tasks: [], notes: [] }
    const db = getDb()

    const contactsRes = db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        phone: contacts.phone,
        email: contacts.email,
        company: contacts.company,
      })
      .from(contacts)
      .where(
        and(
          isNull(contacts.deletedAt),
          or(
            like(contacts.firstName, `%${q}%`),
            like(contacts.lastName, `%${q}%`),
            like(contacts.email, `%${q}%`),
            like(contacts.phone, `%${q}%`),
            like(contacts.company, `%${q}%`),
          ),
        ),
      )
      .limit(5)
      .all()

    const leadsRes = db
      .select({ id: leads.id, name: leads.name, phone: leads.phone, email: leads.email })
      .from(leads)
      .where(
        and(
          isNull(leads.deletedAt),
          or(like(leads.name, `%${q}%`), like(leads.email, `%${q}%`), like(leads.phone, `%${q}%`)),
        ),
      )
      .limit(5)
      .all()

    const dealsRes = db
      .select({ id: deals.id, title: deals.title, value: deals.value })
      .from(deals)
      .where(and(isNull(deals.deletedAt), like(deals.title, `%${q}%`)))
      .limit(5)
      .all()

    const tasksRes = db
      .select({ id: tasks.id, title: tasks.title, dueAt: tasks.dueAt, done: tasks.done })
      .from(tasks)
      .where(and(isNull(tasks.deletedAt), like(tasks.title, `%${q}%`)))
      .limit(5)
      .all()

    const notesRes = db
      .select({
        id: notes.id,
        body: notes.body,
        entityType: notes.entityType,
        entityId: notes.entityId,
      })
      .from(notes)
      .where(like(notes.body, `%${q}%`))
      .limit(5)
      .all()

    return {
      contacts: contactsRes,
      leads: leadsRes,
      deals: dealsRes,
      tasks: tasksRes,
      notes: notesRes,
    } as unknown as SearchResults
  })
}

// --- Undo: recently soft-deleted records, kept in-memory for the session ---

const undoLog: UndoEntry[] = []

export function recordUndo(entity: UndoEntity, id: number, label: string): void {
  undoLog.unshift({ entity, id, label, createdAt: new Date() })
  if (undoLog.length > 20) undoLog.pop()
}

export function registerUndoIpc(): void {
  ipcMain.handle(IpcChannels.undo.list, (): UndoEntry[] => {
    return undoLog.map((entry) => ({ ...entry }))
  })

  ipcMain.handle(IpcChannels.undo.restore, (_event, entity: UndoEntity, id: number): boolean => {
    const db = getDb()
    const now = new Date()
    const table =
      entity === 'contact'
        ? contacts
        : entity === 'lead'
          ? leads
          : entity === 'deal'
            ? deals
            : tasks
    const updated = db
      .update(table)
      .set({ deletedAt: null, updatedAt: now })
      .where(and(eq(table.id, id), isNotNull(table.deletedAt)))
      .run()
    if (updated.changes === 0) return false
    const idx = undoLog.findIndex((e) => e.entity === entity && e.id === id)
    if (idx !== -1) undoLog.splice(idx, 1)
    return true
  })
}
