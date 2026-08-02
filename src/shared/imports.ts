import type { ImportEntity, ImportField, ImportMapping } from './types'

/** Parse CSV text into rows. Handles quoted fields, escaped quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushField = (): void => {
    row.push(field)
    field = ''
  }
  const pushRow = (): void => {
    pushField()
    if (row.some((cell) => cell.trim() !== '')) rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      pushField()
    } else if (ch === '\n') {
      pushRow()
    } else if (ch === '\r') {
      // swallow; \r\n handled by \n
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) pushRow()
  return rows
}

export type ContactImportField =
  'firstName' | 'lastName' | 'phone' | 'email' | 'company' | 'address' | 'notes'

export type LeadImportField = 'name' | 'phone' | 'email' | 'source' | 'expectedValue' | 'owner'

/** Import fields per entity. The identity fields come first. */
/** Import fields for contacts (used by the renderer import modal). */
export const CONTACT_IMPORT_FIELDS: ContactImportField[] = [
  'firstName',
  'lastName',
  'phone',
  'email',
  'company',
  'address',
  'notes',
]

/** Import fields per entity. */
export const IMPORT_FIELDS: Record<ImportEntity, ImportField[]> = {
  contact: CONTACT_IMPORT_FIELDS,
  lead: ['name', 'phone', 'email', 'source', 'expectedValue', 'owner'] satisfies LeadImportField[],
}

const HEADER_ALIASES: Record<string, string[]> = {
  firstName: [
    'firstname',
    'first name',
    'first_name',
    'name',
    'full name',
    'fullname',
    'given name',
    'fname',
  ],
  lastName: ['lastname', 'last name', 'last_name', 'surname', 'family name', 'lname'],
  phone: [
    'phone',
    'phone number',
    'mobile',
    'mobile number',
    'cell',
    'telephone',
    'tel',
    'contact',
  ],
  email: ['email', 'e-mail', 'email address', 'e mail', 'mail', 'email id'],
  company: [
    'company',
    'organization',
    'organisation',
    'org',
    'company name',
    'business',
    'employer',
  ],
  address: ['address', 'street', 'street address', 'address line', 'location'],
  notes: ['notes', 'note', 'remarks', 'comment', 'comments', 'description'],
  source: ['source', 'lead source', 'origin', 'channel'],
  expectedValue: ['expected value', 'expected_value', 'value', 'amount', 'deal size'],
  owner: ['owner', 'assigned to', 'assignee', 'sales rep', 'agent'],
}

const HEADER_LOOKUP = new Map<string, string>(
  Object.entries(HEADER_ALIASES).flatMap(([field, aliases]) =>
    aliases.map((alias) => [alias, field]),
  ),
)

/** Automatically map headers to fields via alias matching. */
export function autoMapColumns(headers: string[], entity: ImportEntity = 'contact'): ImportMapping {
  const fields = IMPORT_FIELDS[entity]
  const mapping = Object.fromEntries(fields.map((f) => [f, null])) as ImportMapping
  headers.forEach((header, index) => {
    const normalized = header.trim().toLowerCase().replace(/\s+/g, ' ')
    const field = HEADER_LOOKUP.get(normalized)
    if (field && field in mapping && mapping[field as ImportField] === null) {
      mapping[field as ImportField] = index
    }
  })
  return mapping
}

export function sanitizeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return String(value)
  return String(value).trim()
}
