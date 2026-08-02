import { ipcMain } from 'electron'
import { desc, eq, isNull } from 'drizzle-orm'
import { IpcChannels } from '@shared/ipc'
import type {
  ImportMapping,
  ImportPreview,
  ImportResult,
  LeadInput,
  LeadConvertResult,
} from '@shared/types'
import { sanitizeCell } from '@shared/imports'
import { getDb } from '../db'
import { leads, contacts, deals, pipelineStages, dealLog } from '../db/schema'
import { readRowsFromFile, pickImportFile } from '../importFile'
import { recordUndo } from './undo'

export function registerLeadsIpc(): void {
  ipcMain.handle(IpcChannels.leads.list, () => {
    return getDb()
      .select()
      .from(leads)
      .where(isNull(leads.deletedAt))
      .orderBy(desc(leads.updatedAt))
      .all()
  })

  ipcMain.handle(IpcChannels.leads.create, (_event, input: LeadInput) => {
    return getDb()
      .insert(leads)
      .values({
        ...input,
        status: input.status ?? 'new',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
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
    const db = getDb()
    const lead = db.select().from(leads).where(eq(leads.id, id)).get()
    if (lead && lead.deletedAt === null) {
      recordUndo('lead', id, lead.name || lead.email || `#${id}`)
      db.update(leads)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(leads.id, id))
        .run()
    }
  })

  ipcMain.handle(IpcChannels.leads.convert, (_event, id: number): LeadConvertResult => {
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

      // Create a deal from the lead in the first pipeline stage.
      const firstStage = tx
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.isWon, false))
        .orderBy(pipelineStages.position)
        .limit(1)
        .get()
      const deal = tx
        .insert(deals)
        .values({
          title: lead.name,
          value: lead.expectedValue ?? 0,
          stageId: firstStage?.id ?? null,
          contactId: contact.id,
          leadId: lead.id,
          probability: firstStage?.position === 0 ? 10 : 0,
          expectedCloseDate: lead.expectedCloseDate ?? null,
          owner: lead.owner ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get()
      tx.insert(dealLog).values({ dealId: deal.id, action: 'created', createdAt: now }).run()

      tx.update(leads)
        .set({ convertedContactId: contact.id, updatedAt: now })
        .where(eq(leads.id, id))
        .run()
      tx.delete(leads).where(eq(leads.id, id)).run()

      return { contact, deal }
    })
  })

  ipcMain.handle(IpcChannels.leads.importParse, (): Promise<ImportPreview> => {
    return pickImportFile('Import leads')
  })

  ipcMain.handle(
    IpcChannels.leads.importRun,
    async (_event, filePath: string, mapping: ImportMapping): Promise<ImportResult> => {
      const db = getDb()
      const rows = await readRowsFromFile(filePath)

      if (rows.length < 2) return { imported: 0, skipped: 0 }

      const header = rows[0]
      const fieldIndex = (field: keyof ImportMapping): number | null => {
        const idx = mapping[field]
        return idx !== null && idx !== undefined && idx >= 0 && idx < header.length ? idx : null
      }
      const cell = (row: string[], field: keyof ImportMapping): string => {
        const idx = fieldIndex(field)
        return idx === null ? '' : sanitizeCell(row[idx])
      }

      let imported = 0
      let skipped = 0
      const now = new Date()

      for (const row of rows.slice(1)) {
        const name = cell(row, 'name')
        const phone = cell(row, 'phone')
        const email = cell(row, 'email')
        const source = cell(row, 'source')
        const owner = cell(row, 'owner')
        const expectedValue = Number(cell(row, 'expectedValue')) || null

        if (!name && !phone && !email) {
          skipped++
          continue
        }

        db.insert(leads)
          .values({
            name: name || email || phone || '(imported)',
            phone: phone || null,
            email: email || null,
            source: source || null,
            owner: owner || null,
            expectedValue,
            status: 'new',
            createdAt: now,
            updatedAt: now,
          })
          .run()
        imported++
      }

      return { imported, skipped }
    },
  )
}
