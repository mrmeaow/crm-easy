import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels } from '../shared/ipc'
import type {
  Activity,
  ActivityInput,
  Contact,
  ContactInput,
  CustomFieldDef,
  CustomFieldDefInput,
  CustomFieldValue,
  Deal,
  DealInput,
  DealLogEntry,
  DealSettleInput,
  EntityType,
  ExportRequest,
  ExportResult,
  ImportMapping,
  ImportPreview,
  ImportResult,
  Lead,
  LeadConvertResult,
  LeadInput,
  MergeGroup,
  Note,
  NoteInput,
  PipelineStage,
  PipelineStageInput,
  SearchResults,
  SettingsRecord,
  Tag,
  TagInput,
  Task,
  TaskInput,
  UndoEntity,
  UndoEntry,
} from '../shared/types'

const api = {
  contacts: {
    list: (): Promise<Contact[]> => ipcRenderer.invoke(IpcChannels.contacts.list),
    create: (input: ContactInput): Promise<Contact> =>
      ipcRenderer.invoke(IpcChannels.contacts.create, input),
    update: (id: number, input: Partial<ContactInput>): Promise<Contact> =>
      ipcRenderer.invoke(IpcChannels.contacts.update, id, input),
    remove: (id: number): Promise<void> => ipcRenderer.invoke(IpcChannels.contacts.remove, id),
    mergeGroups: (): Promise<MergeGroup[]> => ipcRenderer.invoke(IpcChannels.contacts.mergeGroups),
    merge: (masterId: number, duplicateIds: number[]): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.contacts.merge, masterId, duplicateIds),
    importParse: (): Promise<ImportPreview> => ipcRenderer.invoke(IpcChannels.contacts.importParse),
    importRun: (filePath: string, mapping: ImportMapping): Promise<ImportResult> =>
      ipcRenderer.invoke(IpcChannels.contacts.importRun, filePath, mapping),
  },
  activities: {
    list: (entityType: string, entityId: number): Promise<Activity[]> =>
      ipcRenderer.invoke(IpcChannels.activities.list, entityType, entityId),
    create: (input: ActivityInput): Promise<Activity> =>
      ipcRenderer.invoke(IpcChannels.activities.create, input),
  },
  notes: {
    list: (entityType: string, entityId: number): Promise<Note[]> =>
      ipcRenderer.invoke(IpcChannels.notes.list, entityType, entityId),
    create: (input: NoteInput): Promise<Note> =>
      ipcRenderer.invoke(IpcChannels.notes.create, input),
  },
  leads: {
    list: (): Promise<Lead[]> => ipcRenderer.invoke(IpcChannels.leads.list),
    create: (input: LeadInput): Promise<Lead> =>
      ipcRenderer.invoke(IpcChannels.leads.create, input),
    update: (id: number, input: Partial<LeadInput>): Promise<Lead> =>
      ipcRenderer.invoke(IpcChannels.leads.update, id, input),
    remove: (id: number): Promise<void> => ipcRenderer.invoke(IpcChannels.leads.remove, id),
    move: (id: number, stageId: number): Promise<Lead> =>
      ipcRenderer.invoke(IpcChannels.leads.move, id, stageId),
    convert: (id: number): Promise<LeadConvertResult> =>
      ipcRenderer.invoke(IpcChannels.leads.convert, id),
    importParse: (): Promise<ImportPreview> => ipcRenderer.invoke(IpcChannels.leads.importParse),
    importRun: (filePath: string, mapping: ImportMapping): Promise<ImportResult> =>
      ipcRenderer.invoke(IpcChannels.leads.importRun, filePath, mapping),
  },
  stages: {
    list: (): Promise<PipelineStage[]> => ipcRenderer.invoke(IpcChannels.stages.list),
    create: (input: PipelineStageInput): Promise<PipelineStage> =>
      ipcRenderer.invoke(IpcChannels.stages.create, input),
    update: (id: number, input: PipelineStageInput): Promise<PipelineStage> =>
      ipcRenderer.invoke(IpcChannels.stages.update, id, input),
    remove: (id: number): Promise<void> => ipcRenderer.invoke(IpcChannels.stages.remove, id),
    reorder: (orderedIds: number[]): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.stages.reorder, orderedIds),
  },
  deals: {
    list: (): Promise<Deal[]> => ipcRenderer.invoke(IpcChannels.deals.list),
    create: (input: DealInput): Promise<Deal> =>
      ipcRenderer.invoke(IpcChannels.deals.create, input),
    update: (id: number, input: Partial<DealInput>): Promise<Deal> =>
      ipcRenderer.invoke(IpcChannels.deals.update, id, input),
    remove: (id: number): Promise<void> => ipcRenderer.invoke(IpcChannels.deals.remove, id),
    settle: (input: DealSettleInput): Promise<Deal> =>
      ipcRenderer.invoke(IpcChannels.deals.settle, input),
    history: (id: number): Promise<DealLogEntry[]> =>
      ipcRenderer.invoke(IpcChannels.deals.history, id),
  },
  tasks: {
    list: (): Promise<Task[]> => ipcRenderer.invoke(IpcChannels.tasks.list),
    create: (input: TaskInput): Promise<Task> =>
      ipcRenderer.invoke(IpcChannels.tasks.create, input),
    update: (id: number, input: Partial<TaskInput>): Promise<Task> =>
      ipcRenderer.invoke(IpcChannels.tasks.update, id, input),
    remove: (id: number): Promise<void> => ipcRenderer.invoke(IpcChannels.tasks.remove, id),
  },
  tags: {
    list: (): Promise<Tag[]> => ipcRenderer.invoke(IpcChannels.tags.list),
    create: (input: TagInput): Promise<Tag> => ipcRenderer.invoke(IpcChannels.tags.create, input),
    forContact: (contactId: number): Promise<Tag[]> =>
      ipcRenderer.invoke(IpcChannels.tags.forContact, contactId),
    assign: (contactId: number, tagIds: number[]): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.tags.assign, contactId, tagIds),
  },
  customFields: {
    listDefs: (entityType?: EntityType): Promise<CustomFieldDef[]> =>
      ipcRenderer.invoke(IpcChannels.customFields.listDefs, entityType),
    createDef: (input: CustomFieldDefInput): Promise<CustomFieldDef> =>
      ipcRenderer.invoke(IpcChannels.customFields.createDef, input),
    deleteDef: (id: number): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.customFields.deleteDef, id),
    listValues: (entityType: EntityType, entityId: number): Promise<CustomFieldValue[]> =>
      ipcRenderer.invoke(IpcChannels.customFields.listValues, entityType, entityId),
    saveValues: (
      entityType: EntityType,
      entityId: number,
      values: Array<{ defId: number; value: string | null }>,
    ): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.customFields.saveValues, entityType, entityId, values),
  },
  search: {
    query: (query: string): Promise<SearchResults> =>
      ipcRenderer.invoke(IpcChannels.search.query, query),
  },
  undo: {
    list: (): Promise<UndoEntry[]> => ipcRenderer.invoke(IpcChannels.undo.list),
    restore: (entity: UndoEntity, id: number): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.undo.restore, entity, id),
  },
  settings: {
    get: (): Promise<SettingsRecord> => ipcRenderer.invoke(IpcChannels.settings.get),
    set: (key: string, value: string): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.settings.set, key, value),
    hasPin: (): Promise<boolean> => ipcRenderer.invoke(IpcChannels.settings.hasPin),
    setPin: (pin: string): Promise<void> => ipcRenderer.invoke(IpcChannels.settings.setPin, pin),
    verifyPin: (pin: string): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.settings.verifyPin, pin),
    encryptPassphrase: (passphrase: string): Promise<string> =>
      ipcRenderer.invoke(IpcChannels.settings.encryptPassphrase, passphrase),
  },
  export: {
    run: (request: ExportRequest): Promise<ExportResult> =>
      ipcRenderer.invoke(IpcChannels.export.run, request),
  },
  backup: {
    create: (): Promise<ExportResult> => ipcRenderer.invoke(IpcChannels.backup.create),
    restore: (passphrase?: string | null): Promise<{ restored: boolean; error?: string }> =>
      ipcRenderer.invoke(IpcChannels.backup.restore, passphrase ?? null),
  },
  reports: {
    activities: (from: number, to: number): Promise<Activity[]> =>
      ipcRenderer.invoke(IpcChannels.reports.activities, from, to),
  },
} as const

export type CrmApi = typeof api

contextBridge.exposeInMainWorld('crm', api)
