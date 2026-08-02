import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc'
import type { SettingsRecord } from '@shared/types'
import { getSettingsRecord, setSetting } from '../settings'

export function registerSettingsIpc(): void {
  ipcMain.handle(IpcChannels.settings.get, (): SettingsRecord => {
    return getSettingsRecord()
  })

  ipcMain.handle(IpcChannels.settings.set, (_event, key: string, value: string) => {
    setSetting(key, value)
  })
}
