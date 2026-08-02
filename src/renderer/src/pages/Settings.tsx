import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CURRENCIES, useSettings, type Theme } from '../store/settings'
import type { Language } from '../i18n'

const THEME_OPTIONS: { value: Theme; labelKey: string }[] = [
  { value: 'light', labelKey: 'settings.themeLight' },
  { value: 'dark', labelKey: 'settings.themeDark' },
  { value: 'system', labelKey: 'settings.themeSystem' },
]

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'বাংলা' },
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
  const [schedule, setSchedule] = useState<BackupSchedule>(DEFAULT_BACKUP_SCHEDULE)

  useEffect(() => {
    void window.crm.settings.get().then((record) => {
      setSchedule({
        enabled: record['autoBackupEnabled'] === 'true',
        frequency: record['autoBackupFrequency'] === 'weekly' ? 'weekly' : 'daily',
        time: record['autoBackupTime'] ?? '09:00',
        retention: record['autoBackupRetention'] ?? '7',
        folder: record['autoBackupFolder'] ?? '',
      })
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
    setBackupBusy(true)
    setBackupMessage(null)
    setBackupError(null)
    try {
      const result = await window.crm.backup.restore()
      if (result.restored) setBackupMessage(t('backup.restored'))
      else if (result.error === 'INVALID_BACKUP') setBackupError(t('backup.invalid'))
    } finally {
      setBackupBusy(false)
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>{t('settings.title')}</h1>
      </header>

      <div className="settings-list">
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
        </div>

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

        <div className="card setting-row">
          <div className="setting-info">
            <strong>{t('settings.data')}</strong>
            <p className="muted">{t('settings.dataHint')}</p>
          </div>
        </div>

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
