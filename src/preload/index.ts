import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels } from '../shared/ipc'
import type {
  Activity,
  ActivityInput,
  Contact,
  ContactInput,
  Deal,
  DealInput,
  DealSettleInput,
  ExportRequest,
  ExportResult,
  ImportMapping,
  ImportPreview,
  ImportResult,
  Lead,
  LeadInput,
  MergeGroup,
  Note,
  NoteInput,
  PipelineStage,
  PipelineStageInput,
  SettingsRecord,
  Task,
  TaskInput,
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
    convert: (id: number): Promise<Contact> => ipcRenderer.invoke(IpcChannels.leads.convert, id),
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
  },
  tasks: {
    list: (): Promise<Task[]> => ipcRenderer.invoke(IpcChannels.tasks.list),
    create: (input: TaskInput): Promise<Task> =>
      ipcRenderer.invoke(IpcChannels.tasks.create, input),
    update: (id: number, input: Partial<TaskInput>): Promise<Task> =>
      ipcRenderer.invoke(IpcChannels.tasks.update, id, input),
    remove: (id: number): Promise<void> => ipcRenderer.invoke(IpcChannels.tasks.remove, id),
  },
  settings: {
    get: (): Promise<SettingsRecord> => ipcRenderer.invoke(IpcChannels.settings.get),
    set: (key: string, value: string): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.settings.set, key, value),
  },
  export: {
    run: (request: ExportRequest): Promise<ExportResult> =>
      ipcRenderer.invoke(IpcChannels.export.run, request),
  },
  backup: {
    create: (): Promise<ExportResult> => ipcRenderer.invoke(IpcChannels.backup.create),
    restore: (): Promise<{ restored: boolean; error?: string }> =>
      ipcRenderer.invoke(IpcChannels.backup.restore),
  },
} as const

export type CrmApi = typeof api

contextBridge.exposeInMainWorld('crm', api)
