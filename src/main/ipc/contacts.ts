import { ipcMain, dialog, BrowserWindow } from 'electron'
import { desc, eq, inArray, and } from 'drizzle-orm'
import { IpcChannels } from '@shared/ipc'
import type {
  ContactInput,
  ImportMapping,
  ImportPreview,
  ImportResult,
  MergeGroup,
} from '@shared/types'
import { parseCsv, sanitizeCell } from '@shared/imports'
import { getDb } from '../db'
import { contacts, activities, notes, tasks, deals, leads, contactTags } from '../db/schema'
import { readFileSync } from 'node:fs'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s().-]/g, '').replace(/^\+/, '')
}

function firstNonNull(values: (string | null | undefined)[]): string | null | undefined {
  return values.find((v) => v !== null && v !== undefined && v.trim() !== '')
}

async function readRowsFromFile(filePath: string): Promise<string[][]> {
  if (filePath.toLowerCase().endsWith('.csv')) {
    return parseCsv(readFileSync(filePath, 'utf8'))
  }
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  const worksheet = workbook.worksheets[0]
  if (!worksheet) return []
  const rows: string[][] = []
  worksheet.eachRow((row) => {
    const cells = row.values as (string | number | Date)[]
    rows.push(cells.slice(1).map(sanitizeCell))
  })
  return rows
}

async function pickImportFile(): Promise<ImportPreview> {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const result = win
    ? await dialog.showOpenDialog(win, {
        title: 'Import contacts',
        properties: ['openFile'],
        filters: [
          { name: 'Spreadsheets', extensions: ['csv', 'xlsx'] },
          { name: 'All files', extensions: ['*'] },
        ],
      })
    : { canceled: true, filePaths: [] as string[] }

  if (result.canceled || result.filePaths.length === 0) return { canceled: true }

  const filePath = result.filePaths[0]
  const fileName = filePath.split(/[\\/]/).pop() ?? filePath

  const rows = await readRowsFromFile(filePath)
  if (rows.length < 2)
    return { canceled: true, filePath, fileName, headers: rows[0] ?? [], rows: [], totalRows: 0 }

  const headers = rows[0]
  const totalRows = rows.length - 1
  return {
    canceled: false,
    filePath,
    fileName,
    headers,
    rows: rows.slice(1, Math.min(31, rows.length)),
    totalRows,
  }
}

export function registerContactsIpc(): void {
  ipcMain.handle(IpcChannels.contacts.list, () => {
    return getDb().select().from(contacts).orderBy(desc(contacts.createdAt)).all()
  })

  ipcMain.handle(IpcChannels.contacts.create, (_event, input: ContactInput) => {
    const now = new Date()
    return getDb()
      .insert(contacts)
      .values({ ...input, createdAt: now, updatedAt: now })
      .returning()
      .get()
  })

  ipcMain.handle(
    IpcChannels.contacts.update,
    (_event, id: number, input: Partial<ContactInput>) => {
      return getDb()
        .update(contacts)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(contacts.id, id))
        .returning()
        .get()
    },
  )

  ipcMain.handle(IpcChannels.contacts.remove, (_event, id: number) => {
    getDb().delete(contacts).where(eq(contacts.id, id)).run()
  })

  ipcMain.handle(IpcChannels.contacts.mergeGroups, (): MergeGroup[] => {
    const all = getDb().select().from(contacts).all()
    const buckets = new Map<string, number[]>()

    for (const contact of all) {
      const keys: string[] = []
      if (contact.email) keys.push(`e:${normalizeEmail(contact.email)}`)
      if (contact.phone) keys.push(`p:${normalizePhone(contact.phone)}`)
      const fullName = `${contact.firstName} ${contact.lastName ?? ''}`.trim().toLowerCase()
      if (fullName) keys.push(`n:${fullName}`)
      if (contact.company) keys.push(`c:${contact.company.trim().toLowerCase()}`)

      for (const key of keys) {
        const ids = buckets.get(key)
        if (ids) ids.push(contact.id)
        else buckets.set(key, [contact.id])
      }
    }

    return [...buckets.entries()]
      .filter(([, ids]) => ids.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 8)
      .map(([key, ids]) => ({ key, contactIds: ids }))
  })

  ipcMain.handle(IpcChannels.contacts.merge, (_event, masterId: number, duplicateIds: number[]) => {
    const db = getDb()
    const master = db.select().from(contacts).where(eq(contacts.id, masterId)).get()
    if (!master) return

    const duplicates = db.select().from(contacts).where(inArray(contacts.id, duplicateIds)).all()

    const values: Partial<ContactInput> = {
      firstName: master.firstName,
      lastName: firstNonNull([master.lastName, ...duplicates.map((d) => d.lastName)]) ?? null,
      phone: firstNonNull([master.phone, ...duplicates.map((d) => d.phone)]) ?? null,
      email: firstNonNull([master.email, ...duplicates.map((d) => d.email)]) ?? null,
      company: firstNonNull([master.company, ...duplicates.map((d) => d.company)]) ?? null,
      address: firstNonNull([master.address, ...duplicates.map((d) => d.address)]) ?? null,
      notes: firstNonNull([master.notes, ...duplicates.map((d) => d.notes)]) ?? null,
    }

    db.update(contacts)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(contacts.id, masterId))
      .run()

    // Re-point foreign keys to the master record.
    db.update(leads)
      .set({ convertedContactId: masterId })
      .where(inArray(leads.convertedContactId, duplicateIds))
      .run()
    db.update(deals)
      .set({ contactId: masterId })
      .where(inArray(deals.contactId, duplicateIds))
      .run()
    db.update(tasks)
      .set({ contactId: masterId })
      .where(inArray(tasks.contactId, duplicateIds))
      .run()
    db.update(activities)
      .set({ entityId: masterId })
      .where(and(eq(activities.entityType, 'contact'), inArray(activities.entityId, duplicateIds)))
      .run()
    db.update(notes)
      .set({ entityId: masterId })
      .where(and(eq(notes.entityType, 'contact'), inArray(notes.entityId, duplicateIds)))
      .run()

    // Carry tags over (dedupe against tags the master already has).
    const masterTagIds = new Set(
      db
        .select({ tagId: contactTags.tagId })
        .from(contactTags)
        .where(eq(contactTags.contactId, masterId))
        .all()
        .map((row) => row.tagId),
    )
    const duplicateTagIds = db
      .select({ tagId: contactTags.tagId })
      .from(contactTags)
      .where(inArray(contactTags.contactId, duplicateIds))
      .all()
      .map((row) => row.tagId)
      .filter((tagId) => !masterTagIds.has(tagId))
    if (duplicateTagIds.length > 0) {
      db.insert(contactTags)
        .values(duplicateTagIds.map((tagId) => ({ contactId: masterId, tagId })))
        .run()
    }

    db.delete(contacts).where(inArray(contacts.id, duplicateIds)).run()
  })

  ipcMain.handle(IpcChannels.contacts.importParse, (): Promise<ImportPreview> => {
    return pickImportFile()
  })

  ipcMain.handle(
    IpcChannels.contacts.importRun,
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
        const firstName = cell(row, 'firstName')
        const lastName = cell(row, 'lastName')
        const phone = cell(row, 'phone')
        const email = cell(row, 'email')
        const company = cell(row, 'company')
        const address = cell(row, 'address')
        const notesText = cell(row, 'notes')

        // A row is only importable if it carries some identity.
        if (!firstName && !lastName && !phone && !email) {
          skipped++
          continue
        }

        db.insert(contacts)
          .values({
            firstName: firstName || lastName || email || phone || '(imported)',
            lastName: firstName ? lastName || null : null,
            phone: phone || null,
            email: email || null,
            company: company || null,
            address: address || null,
            notes: notesText || null,
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
