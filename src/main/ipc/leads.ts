import { ipcMain } from 'electron'
import { desc, eq } from 'drizzle-orm'
import { IpcChannels } from '@shared/ipc'
import type { Contact, LeadInput } from '@shared/types'
import { getDb } from '../db'
import { leads, contacts } from '../db/schema'

export function registerLeadsIpc(): void {
  ipcMain.handle(IpcChannels.leads.list, () => {
    return getDb().select().from(leads).orderBy(desc(leads.updatedAt)).all()
  })

  ipcMain.handle(IpcChannels.leads.create, (_event, input: LeadInput) => {
    return getDb()
      .insert(leads)
      .values({ ...input, status: 'new', createdAt: new Date(), updatedAt: new Date() })
      .returning()
      .get()
  })

  ipcMain.handle(IpcChannels.leads.update, (_event, id: number, input: Partial<LeadInput>) => {
    return getDb()
      .update(leads)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning()
      .get()
  })

  ipcMain.handle(IpcChannels.leads.move, (_event, id: number, stageId: number) => {
    return getDb()
      .update(leads)
      .set({ stageId, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning()
      .get()
  })

  ipcMain.handle(IpcChannels.leads.remove, (_event, id: number) => {
    getDb().delete(leads).where(eq(leads.id, id)).run()
  })

  ipcMain.handle(IpcChannels.leads.convert, (_event, id: number): Contact => {
    const db = getDb()
    const lead = db.select().from(leads).where(eq(leads.id, id)).get()
    if (!lead) throw new Error('LEAD_NOT_FOUND')

    const now = new Date()
    return db.transaction((tx) => {
      const contact = tx
        .insert(contacts)
        .values({
          firstName: lead.name,
          phone: lead.phone,
          email: lead.email,
          company: null,
          address: null,
          notes: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get()
      tx.update(leads)
        .set({ convertedContactId: contact.id, updatedAt: now })
        .where(eq(leads.id, id))
        .run()
      tx.delete(leads).where(eq(leads.id, id)).run()
      return contact
    })
  })
}
