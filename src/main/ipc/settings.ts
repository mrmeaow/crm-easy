import { ipcMain, safeStorage } from 'electron'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { IpcChannels } from '@shared/ipc'
import type { SettingsRecord } from '@shared/types'
import { getSettingsRecord, setSetting } from '../settings'

const PIN_KEY = 'appPin'

export function hashPin(pin: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(pin, salt, 32)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export function verifyPin(pin: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  try {
    const hash = scryptSync(pin, Buffer.from(saltHex, 'hex'), 32)
    return timingSafeEqual(hash, Buffer.from(hashHex, 'hex'))
  } catch {
    return false
  }
}

export function registerSettingsIpc(): void {
  ipcMain.handle(IpcChannels.settings.get, (): SettingsRecord => {
    return getSettingsRecord()
  })

  ipcMain.handle(IpcChannels.settings.set, (_event, key: string, value: string) => {
    setSetting(key, value)
  })

  ipcMain.handle(IpcChannels.settings.hasPin, (): boolean => {
    return Boolean(getSettingsRecord()[PIN_KEY])
  })

  ipcMain.handle(IpcChannels.settings.setPin, (_event, pin: string) => {
    const trimmed = pin.trim()
    if (trimmed === '') {
      setSetting(PIN_KEY, '')
      return
    }
    if (trimmed.length < 4) throw new Error('PIN_TOO_SHORT')
    setSetting(PIN_KEY, hashPin(trimmed))
  })

  ipcMain.handle(IpcChannels.settings.verifyPin, (_event, pin: string): boolean => {
    const stored = getSettingsRecord()[PIN_KEY]
    if (!stored) return true
    return verifyPin(pin.trim(), stored)
  })

  ipcMain.handle(IpcChannels.settings.encryptPassphrase, (_event, passphrase: string): string => {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('ENCRYPTION_UNAVAILABLE')
    return Buffer.from(safeStorage.encryptString(passphrase)).toString('base64')
  })
}
