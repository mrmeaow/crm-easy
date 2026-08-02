import { ipcMain, BrowserWindow } from 'electron'
import { IpcChannels } from '@shared/ipc'
import { createBackup, restoreBackup } from '../backup'

export function registerBackupIpc(): void {
  ipcMain.handle(IpcChannels.backup.create, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { saved: false }
    return createBackup(win)
  })

  ipcMain.handle(IpcChannels.backup.restore, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { restored: false }
    const result = await restoreBackup(win)
    if (result.restored) {
      win.webContents.reload()
    }
    return result
  })
}
