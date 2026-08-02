import { ipcMain } from 'electron'
import { desc, eq, and } from 'drizzle-orm'
import { IpcChannels } from '@shared/ipc'
import type { EntityType, NoteInput } from '@shared/types'
import { getDb } from '../db'
import { notes } from '../db/schema'

export function registerNotesIpc(): void {
  ipcMain.handle(IpcChannels.notes.list, (_event, entityType: EntityType, entityId: number) => {
    return getDb()
      .select()
      .from(notes)
      .where(and(eq(notes.entityType, entityType), eq(notes.entityId, entityId)))
      .orderBy(desc(notes.createdAt))
      .all()
  })

  ipcMain.handle(IpcChannels.notes.create, (_event, input: NoteInput) => {
    const now = new Date()
    return getDb()
      .insert(notes)
      .values({
        body: input.body,
        entityType: input.entityType,
        entityId: input.entityId,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get()
  })
}
