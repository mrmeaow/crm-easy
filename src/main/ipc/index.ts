import { registerContactsIpc } from './contacts'
import { registerSettingsIpc } from './settings'
import { registerStagesIpc } from './stages'
import { registerLeadsIpc } from './leads'
import { registerDealsIpc } from './deals'
import { registerTasksIpc } from './tasks'
import { registerExportIpc } from './export'
import { registerBackupIpc } from './backup'
import { registerActivitiesIpc } from './activities'
import { registerNotesIpc } from './notes'

export function registerIpc(): void {
  registerContactsIpc()
  registerSettingsIpc()
  registerStagesIpc()
  registerLeadsIpc()
  registerDealsIpc()
  registerTasksIpc()
  registerExportIpc()
  registerBackupIpc()
  registerActivitiesIpc()
  registerNotesIpc()
}
