import { ipcMain } from 'electron'
import { eq, desc, inArray } from 'drizzle-orm'
import { IpcChannels } from '@shared/ipc'
import type { Tag, TagInput } from '@shared/types'
import { getDb } from '../db'
import { tags, contactTags } from '../db/schema'

export function registerTagsIpc(): void {
  ipcMain.handle(IpcChannels.tags.list, (): Tag[] => {
    return getDb().select().from(tags).orderBy(desc(tags.createdAt)).all()
  })

  ipcMain.handle(IpcChannels.tags.create, (_event, input: TagInput): Tag => {
    const now = new Date()
    return getDb()
      .insert(tags)
      .values({
        name: input.name.trim(),
        color: input.color ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get()
  })

  ipcMain.handle(IpcChannels.tags.forContact, (_event, contactId: number): Tag[] => {
    const db = getDb()
    const ids = db
      .select({ tagId: contactTags.tagId })
      .from(contactTags)
      .where(eq(contactTags.contactId, contactId))
      .all()
      .map((row) => row.tagId)
    if (ids.length === 0) return []
    return db.select().from(tags).where(inArray(tags.id, ids)).all()
  })

  ipcMain.handle(IpcChannels.tags.assign, (_event, contactId: number, tagIds: number[]): void => {
    const db = getDb()
    db.delete(contactTags).where(eq(contactTags.contactId, contactId)).run()
    if (tagIds.length > 0) {
      db.insert(contactTags)
        .values(tagIds.map((tagId) => ({ contactId, tagId })))
        .run()
    }
  })
}
