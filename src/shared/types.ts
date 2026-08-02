export interface Contact {
  id: number
  firstName: string
  lastName: string | null
  phone: string | null
  email: string | null
  company: string | null
  address: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ContactInput {
  firstName: string
  lastName?: string | null
  phone?: string | null
  email?: string | null
  company?: string | null
  address?: string | null
  notes?: string | null
}

export interface PipelineStage {
  id: number
  name: string
  position: number
  color: string | null
  isWon: boolean
  isLost: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PipelineStageInput {
  name: string
  color?: string | null
}

export interface Lead {
  id: number
  name: string
  phone: string | null
  email: string | null
  source: string | null
  status: string
  owner: string | null
  expectedValue: number | null
  expectedCloseDate: Date | null
  stageId: number | null
  convertedContactId: number | null
  createdAt: Date
  updatedAt: Date
}

export interface LeadInput {
  name: string
  phone?: string | null
  email?: string | null
  source?: string | null
  status?: string
  owner?: string | null
  expectedValue?: number | null
  expectedCloseDate?: Date | null
  stageId?: number | null
}

export interface Deal {
  id: number
  title: string
  value: number
  stageId: number | null
  contactId: number | null
  leadId: number | null
  probability: number
  expectedCloseDate: Date | null
  owner: string | null
  wonAt: Date | null
  lostReason: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DealInput {
  title: string
  value?: number
  stageId?: number | null
  contactId?: number | null
  leadId?: number | null
  probability?: number
  expectedCloseDate?: Date | null
  owner?: string | null
}

export interface DealSettleInput {
  id: number
  outcome: 'won' | 'lost'
  actualValue?: number
  reason?: string | null
}

export interface LeadConvertResult {
  contact: Contact
  deal: Deal
}

export interface Task {
  id: number
  title: string
  dueAt: Date | null
  reminderAt: Date | null
  reminderSentAt: Date | null
  done: boolean
  completedAt: Date | null
  contactId: number | null
  dealId: number | null
  createdAt: Date
  updatedAt: Date
}

export interface TaskInput {
  title: string
  dueAt?: Date | null
  reminderAt?: Date | null
  contactId?: number | null
  dealId?: number | null
  done?: boolean
  completedAt?: Date | null
}

export type EntityType = 'contact' | 'lead' | 'deal'

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'other'

export interface Activity {
  id: number
  entityType: EntityType
  entityId: number
  type: string
  subject: string
  detail: string | null
  happenedAt: Date
}

export interface ActivityInput {
  entityType: EntityType
  entityId: number
  type: string
  subject: string
  detail?: string | null
}

export interface Note {
  id: number
  body: string
  entityType: EntityType
  entityId: number
  createdAt: Date
  updatedAt: Date
}

export interface NoteInput {
  body: string
  entityType: EntityType
  entityId: number
}

export interface MergeGroup {
  key: string
  contactIds: number[]
}

export type ImportField =
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'email'
  | 'company'
  | 'address'
  | 'notes'
  | 'name'
  | 'source'
  | 'owner'
  | 'expectedValue'

export type ImportMapping = Record<ImportField, number | null>

export interface ImportPreview {
  canceled: boolean
  filePath?: string
  fileName?: string
  headers?: string[]
  rows?: string[][]
  totalRows?: number
}

export interface ImportResult {
  imported: number
  skipped: number
}

export interface ExportColumn {
  key: string
  header: string
}

export interface ExportRequest {
  fileName: string
  columns: ExportColumn[]
  rows: (string | number)[][]
}

export type ExportResult = { saved: boolean; path?: string }

export type SettingsKey = 'language' | 'theme' | 'currency'

export type SettingsRecord = Record<string, string>

export interface Tag {
  id: number
  name: string
  color: string | null
  createdAt: Date
  updatedAt: Date
}

export interface TagInput {
  name: string
  color?: string | null
}

export type CustomFieldType = 'text' | 'number' | 'date' | 'select'

export interface CustomFieldDef {
  id: number
  entityType: EntityType
  label: string
  type: CustomFieldType
  options: string[] | null
  position: number
  createdAt: Date
  updatedAt: Date
}

export interface CustomFieldDefInput {
  entityType: EntityType
  label: string
  type: CustomFieldType
  options?: string[] | null
}

export interface CustomFieldValue {
  id: number
  defId: number
  entityId: number
  value: string | null
}

export type DealLogAction = 'created' | 'stage_change' | 'won' | 'lost' | 'value_change'

export interface DealLogEntry {
  id: number
  dealId: number
  action: DealLogAction
  fromStageId: number | null
  toStageId: number | null
  note: string | null
  createdAt: Date
}

export interface SearchResults {
  contacts: Pick<Contact, 'id' | 'firstName' | 'lastName' | 'phone' | 'email' | 'company'>[]
  leads: Pick<Lead, 'id' | 'name' | 'phone' | 'email'>[]
  deals: Pick<Deal, 'id' | 'title' | 'value'>[]
  tasks: Pick<Task, 'id' | 'title' | 'dueAt' | 'done'>[]
  notes: Pick<Note, 'id' | 'body' | 'entityType' | 'entityId'>[]
}

export type UndoEntity = 'contact' | 'lead' | 'deal' | 'task'

export interface UndoEntry {
  entity: UndoEntity
  id: number
  label: string
  createdAt: Date
}

export type ImportEntity = 'contact' | 'lead'

export interface ReportTotals {
  count: number
  sum?: number
}

export interface DealStats {
  totalDeals: number
  wonDeals: number
  lostDeals: number
  totalValue: number
  wonValue: number
  lostValue: number
  pipelineByStage: Array<{ stageId: number; stageName: string; count: number; value: number }>
}

export interface LeadStats {
  totalLeads: number
  convertedLeads: number
  bySource: Array<{ source: string; count: number }>
}
