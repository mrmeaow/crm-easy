import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CURRENCIES, useSettings, type Theme } from '../store/settings'
import type { Language } from '../i18n'
import {
  useCustomFieldDefs,
  useCreateCustomFieldDef,
  useDeleteCustomFieldDef,
} from '../api/customFields'
import type { CustomFieldType, EntityType } from '@shared/types'

const THEME_OPTIONS: { value: Theme; labelKey: string }[] = [
  { value: 'light', labelKey: 'settings.themeLight' },
  { value: 'dark', labelKey: 'settings.themeDark' },
  { value: 'system', labelKey: 'settings.themeSystem' },
]

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'বাংলা' },
]

const CF_TYPES: { value: CustomFieldType; labelKey: string }[] = [
  { value: 'text', labelKey: 'customField.typeText' },
  { value: 'number', labelKey: 'customField.typeNumber' },
  { value: 'date', labelKey: 'customField.typeDate' },
  { value: 'select', labelKey: 'customField.typeSelect' },
]

const ENTITY_TYPE_LABELS: Array<{ value: EntityType; labelKey: string }> = [
  { value: 'contact', labelKey: 'nav.contacts' },
  { value: 'lead', labelKey: 'nav.leads' },
  { value: 'deal', labelKey: 'nav.deals' },
]

interface BackupSchedule {
  enabled: boolean
  frequency: 'daily' | 'weekly'
  time: string
  retention: string
  folder: string
}

const DEFAULT_BACKUP_SCHEDULE: BackupSchedule = {
  enabled: false,
  frequency: 'daily',
  time: '09:00',
  retention: '7',
  folder: '',
}

function Settings(): React.JSX.Element {
  const { t } = useTranslation()
  const { language, theme, currency, setLanguage, setTheme, setCurrency } = useSettings()
  const [backupBusy, setBackupBusy] = useState(false)
  const [backupMessage, setBackupMessage] = useState<string | null>(null)
  const [backupError, setBackupError] = useState<string | null>(null)
  const [restorePassphrase, setRestorePassphrase] = useState('')
  const [showRestorePassphrase, setShowRestorePassphrase] = useState(false)
  const [schedule, setSchedule] = useState<BackupSchedule>(DEFAULT_BACKUP_SCHEDULE)
  const [encryptionEnabled, setEncryptionEnabled] = useState(false)
  const [encryptionPassphrase, setEncryptionPassphrase] = useState('')
  const [encryptionSaved, setEncryptionSaved] = useState(false)
  const [pinEnabled, setPinEnabled] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinSaved, setPinSaved] = useState(false)

  // Custom field manager state
  const [cfEntityType, setCfEntityType] = useState<EntityType>('contact')
  const [cfLabel, setCfLabel] = useState('')
  const [cfType, setCfType] = useState<CustomFieldType>('text')
  const [cfOptions, setCfOptions] = useState('')
  const defs = useCustomFieldDefs(cfEntityType)
  const createDef = useCreateCustomFieldDef()
  const deleteDef = useDeleteCustomFieldDef()

  useEffect(() => {
    void window.crm.settings.get().then((record) => {
      setSchedule({
        enabled: record['autoBackupEnabled'] === 'true',
        frequency: record['autoBackupFrequency'] === 'weekly' ? 'weekly' : 'daily',
        time: record['autoBackupTime'] ?? '09:00',
        retention: record['autoBackupRetention'] ?? '7',
        folder: record['autoBackupFolder'] ?? '',
      })
      setEncryptionEnabled(record['backupEncryption'] === 'true')
      setPinEnabled(Boolean(record['appPin']))
    })
  }, [])

  function saveSchedule(next: BackupSchedule): void {
    setSchedule(next)
    void window.crm.settings.set('autoBackupEnabled', next.enabled ? 'true' : 'false')
    void window.crm.settings.set('autoBackupFrequency', next.frequency)
    void window.crm.settings.set('autoBackupTime', next.time)
    void window.crm.settings.set('autoBackupRetention', next.retention)
    void window.crm.settings.set('autoBackupFolder', next.folder)
  }

  async function handleCreateBackup(): Promise<void> {
    setBackupBusy(true)
    setBackupMessage(null)
    setBackupError(null)
    try {
      const result = await window.crm.backup.create()
      if (result.saved) setBackupMessage(t('backup.created'))
    } finally {
      setBackupBusy(false)
    }
  }

  async function handleRestore(): Promise<void> {
    if (!window.confirm(t('backup.restoreConfirm'))) return
    if (!showRestorePassphrase) {
      setShowRestorePassphrase(true)
      return
    }
    setBackupBusy(true)
    setBackupMessage(null)
    setBackupError(null)
    try {
      const result = await window.crm.backup.restore(
        showRestorePassphrase && restorePassphrase ? restorePassphrase : null,
      )
      if (result.restored) setBackupMessage(t('backup.restored'))
      else if (result.error === 'NEED_PASSPHRASE') {
        setShowRestorePassphrase(true)
      } else if (result.error === 'BAD_PASSPHRASE') {
        setBackupError(t('backup.badPassphrase'))
      } else if (result.error === 'OUTDATED_BACKUP') {
        setBackupError(t('backup.outdated'))
      } else {
        setBackupError(t('backup.invalid'))
      }
    } finally {
      setBackupBusy(false)
    }
  }

  async function handleSaveEncryption(): Promise<void> {
    if (encryptionEnabled && encryptionPassphrase.length < 6) {
      setBackupError(t('settings.encryptionPassphraseHint'))
      return
    }
    setBackupError(null)
    await window.crm.settings.set('backupEncryption', encryptionEnabled ? 'true' : 'false')
    if (encryptionEnabled && encryptionPassphrase) {
      const enc = await window.crm.settings.encryptPassphrase(encryptionPassphrase)
      await window.crm.settings.set('backupPassphraseEnc', enc)
    } else {
      await window.crm.settings.set('backupPassphraseEnc', '')
    }
    setEncryptionSaved(true)
    setEncryptionPassphrase('')
    setTimeout(() => setEncryptionSaved(false), 2000)
  }

  async function handleSavePin(): Promise<void> {
    setPinError(null)
    try {
      await window.crm.settings.setPin(newPin)
      setPinSaved(true)
      setNewPin('')
      setTimeout(() => setPinSaved(false), 2000)
    } catch (err) {
      setPinError((err as Error).message)
    }
  }

  async function handleAddCustomField(): Promise<void> {
    if (!cfLabel.trim()) return
    const options =
      cfType === 'select'
        ? cfOptions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined
    await createDef.mutateAsync({
      entityType: cfEntityType,
      label: cfLabel.trim(),
      type: cfType,
      options,
    })
    setCfLabel('')
    setCfOptions('')
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>{t('settings.title')}</h1>
      </header>

      <div className="settings-list">
        {/* Language */}
        <div className="card setting-row">
          <div className="setting-info">
            <strong>{t('settings.language')}</strong>
            <p className="muted">{t('settings.languageHint')}</p>
          </div>
          <div className="segmented">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={language === option.value ? 'active' : ''}
                onClick={() => setLanguage(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="card setting-row">
          <div className="setting-info">
            <strong>{t('settings.theme')}</strong>
          </div>
          <div className="segmented">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={theme === option.value ? 'active' : ''}
                onClick={() => setTheme(option.value)}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div className="card setting-row">
          <div className="setting-info">
            <strong>{t('settings.currency')}</strong>
            <p className="muted">{t('settings.currencyHint')}</p>
          </div>
          <select
            className="select"
            value={currency}
            onChange={(event) => {
              const value = event.target.value
              if (CURRENCIES.includes(value as (typeof CURRENCIES)[number])) {
                setCurrency(value as (typeof CURRENCIES)[number])
              }
            }}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        {/* App Lock */}
        <div className="card setting-row">
          <div className="setting-info">
            <strong>{t('settings.appLock')}</strong>
            <p className="muted">
              {pinEnabled ? t('settings.pinEnabled') : t('settings.pinDisabled')}
            </p>
          </div>
          <div className="pin-controls">
            <label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                className="input"
                placeholder={t('settings.enterNewPin')}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                maxLength={8}
              />
            </label>
            <button className="btn btn-primary" onClick={() => void handleSavePin()}>
              {t('settings.savePin')}
            </button>
            {pinSaved && <span className="success-text">{t('common.saved')}</span>}
            {pinError && (
              <span className="error-text">{t(`settings.${pinError}`) || pinError}</span>
            )}
          </div>
        </div>

        {/* Data Safety */}
        <div className="card setting-row">
          <div className="setting-info">
            <strong>{t('settings.dataSafety')}</strong>
            <p className="muted">{t('settings.encryptionHint')}</p>
          </div>
          <label className="switch-row">
            <input
              type="checkbox"
              checked={encryptionEnabled}
              onChange={(e) => setEncryptionEnabled(e.target.checked)}
            />
            <span>{t('settings.encryption')}</span>
          </label>
          {encryptionEnabled && (
            <div className="encryption-fields">
              <input
                type="password"
                className="input"
                placeholder={t('settings.encryptionPassphrase')}
                value={encryptionPassphrase}
                onChange={(e) => setEncryptionPassphrase(e.target.value)}
              />
              <button className="btn btn-primary" onClick={() => void handleSaveEncryption()}>
                {t('common.save')}
              </button>
              {encryptionSaved && <span className="success-text">{t('common.saved')}</span>}
            </div>
          )}
          {backupError && <p className="error-text">{backupError}</p>}
        </div>

        {/* Backup Create */}
        <div className="card setting-row">
          <div className="setting-info">
            <strong>{t('backup.title')}</strong>
            <p className="muted">{t('backup.hint')}</p>
            {backupMessage && <p className="success-text">{backupMessage}</p>}
            {backupError && <p className="error-text">{backupError}</p>}
          </div>
          <div className="form-actions">
            <button
              className="btn btn-primary"
              disabled={backupBusy}
              onClick={() => void handleCreateBackup()}
            >
              {t('backup.create')}
            </button>
            <button className="btn" disabled={backupBusy} onClick={() => void handleRestore()}>
              {t('backup.restore')}
            </button>
          </div>
          {showRestorePassphrase && (
            <div className="form-row" style={{ marginTop: '0.75rem' }}>
              <input
                type="password"
                className="input"
                placeholder={t('backup.passphrasePlaceholder')}
                value={restorePassphrase}
                onChange={(e) => setRestorePassphrase(e.target.value)}
              />
              <button
                className="btn btn-primary"
                disabled={backupBusy}
                onClick={() => void handleRestore()}
              >
                {t('backup.restore')}
              </button>
            </div>
          )}
        </div>

        {/* Backup Schedule */}
        <div className="card setting-row">
          <div className="setting-info">
            <strong>{t('backup.scheduleTitle')}</strong>
            <p className="muted">{t('backup.scheduleHint')}</p>
          </div>
          <div className="schedule-controls">
            <label className="switch-row">
              <input
                type="checkbox"
                checked={schedule.enabled}
                onChange={(event) => saveSchedule({ ...schedule, enabled: event.target.checked })}
              />
              <span>{t('backup.scheduleEnabled')}</span>
            </label>
            {schedule.enabled && (
              <>
                <label>
                  <span className="muted">{t('backup.scheduleFrequency')}</span>
                  <select
                    className="select"
                    value={schedule.frequency}
                    onChange={(event) =>
                      saveSchedule({
                        ...schedule,
                        frequency: event.target.value === 'weekly' ? 'weekly' : 'daily',
                      })
                    }
                  >
                    <option value="daily">{t('backup.daily')}</option>
                    <option value="weekly">{t('backup.weekly')}</option>
                  </select>
                </label>
                <label>
                  <span className="muted">{t('backup.scheduleTime')}</span>
                  <input
                    type="time"
                    value={schedule.time}
                    onChange={(event) => saveSchedule({ ...schedule, time: event.target.value })}
                  />
                </label>
                <label>
                  <span className="muted">{t('backup.scheduleRetention')}</span>
                  <input
                    type="number"
                    min="1"
                    value={schedule.retention}
                    onChange={(event) =>
                      saveSchedule({ ...schedule, retention: event.target.value })
                    }
                  />
                </label>
                <label className="schedule-folder">
                  <span className="muted">{t('backup.scheduleFolder')}</span>
                  <input
                    placeholder={t('backup.scheduleFolderPlaceholder')}
                    value={schedule.folder}
                    onChange={(event) => saveSchedule({ ...schedule, folder: event.target.value })}
                  />
                </label>
              </>
            )}
          </div>
        </div>

        {/* Custom Fields Manager */}
        <div className="card setting-row">
          <div className="setting-info">
            <strong>{t('settings.customFields')}</strong>
            <p className="muted">{t('settings.customFieldsHint')}</p>
          </div>
          <div className="custom-field-manager">
            <div className="segmented">
              {ENTITY_TYPE_LABELS.map((et) => (
                <button
                  key={et.value}
                  className={cfEntityType === et.value ? 'active' : ''}
                  onClick={() => setCfEntityType(et.value)}
                >
                  {t(et.labelKey)}
                </button>
              ))}
            </div>
            <div className="cf-defs-list">
              {(defs.data ?? []).length === 0 && (
                <p className="muted">{t('customField.noFields')}</p>
              )}
              {(defs.data ?? []).map((def) => (
                <div key={def.id} className="cf-def-row">
                  <span>
                    {def.label}{' '}
                    <span className="muted">
                      (
                      {t(`customField.type${def.type.charAt(0).toUpperCase() + def.type.slice(1)}`)}
                    </span>
                  </span>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => void deleteDef.mutateAsync(def.id)}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              ))}
            </div>
            <div className="cf-add-row">
              <input
                className="input"
                placeholder={t('customField.labelPlaceholder')}
                value={cfLabel}
                onChange={(e) => setCfLabel(e.target.value)}
              />
              <select
                className="select"
                value={cfType}
                onChange={(e) => setCfType(e.target.value as CustomFieldType)}
              >
                {CF_TYPES.map((ft) => (
                  <option key={ft.value} value={ft.value}>
                    {t(ft.labelKey)}
                  </option>
                ))}
              </select>
              {cfType === 'select' && (
                <input
                  className="input"
                  placeholder={t('customField.selectOptionsPlaceholder')}
                  value={cfOptions}
                  onChange={(e) => setCfOptions(e.target.value)}
                />
              )}
              <button
                className="btn btn-primary"
                disabled={!cfLabel.trim() || createDef.isPending}
                onClick={() => void handleAddCustomField()}
              >
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card setting-row">
          <div className="setting-info">
            <strong>{t('settings.about')}</strong>
            <p className="muted">{t('settings.version')} 0.1.0</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Settings
