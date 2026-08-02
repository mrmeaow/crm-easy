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
  'firstName' | 'lastName' | 'phone' | 'email' | 'company' | 'address' | 'notes'

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
