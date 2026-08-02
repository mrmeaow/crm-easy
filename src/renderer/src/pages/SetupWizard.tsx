import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CURRENCIES, useSettings, type Theme } from '../store/settings'
import type { Language } from '../i18n'

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'বাংলা' },
]

const THEME_OPTIONS: { value: Theme; labelKey: string }[] = [
  { value: 'light', labelKey: 'settings.themeLight' },
  { value: 'dark', labelKey: 'settings.themeDark' },
  { value: 'system', labelKey: 'settings.themeSystem' },
]

function SetupWizard(): React.JSX.Element {
  const { t } = useTranslation()
  const { language, theme, currency, setLanguage, setTheme, setCurrency } = useSettings()
  const [step, setStep] = useState(0)

  function finish(): void {
    void window.crm.settings.set('setupComplete', 'true')
    useSettings.setState({ setupComplete: true })
  }

  return (
    <div className="wizard-backdrop">
      <div className="card wizard">
        <div className="brand wizard-brand">
          <span className="brand-logo" aria-hidden="true">
            CE
          </span>
          <div className="brand-text">
            <strong>{t('app.name')}</strong>
            <small>{t('app.tagline')}</small>
          </div>
        </div>

        {step === 0 && (
          <div className="wizard-step">
            <h1>{t('wizard.welcome')}</h1>
            <p className="muted">{t('wizard.languageHint')}</p>
            <div className="wizard-options">
              {LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`wizard-option${language === option.value ? ' active' : ''}`}
                  onClick={() => setLanguage(option.value)}
                >
                  <strong>{option.label}</strong>
                  <span className="muted">
                    {option.value === 'en' ? t('wizard.englishDesc') : t('wizard.banglaDesc')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="wizard-step">
            <h1>{t('wizard.themeTitle')}</h1>
            <p className="muted">{t('wizard.themeHint')}</p>
            <div className="wizard-options">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`wizard-option${theme === option.value ? ' active' : ''}`}
                  onClick={() => setTheme(option.value)}
                >
                  <strong>{t(option.labelKey)}</strong>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-step">
            <h1>{t('wizard.currencyTitle')}</h1>
            <p className="muted">{t('wizard.currencyHint')}</p>
            <div className="wizard-options">
              {CURRENCIES.map((code) => (
                <button
                  key={code}
                  className={`wizard-option wizard-option-sm${currency === code ? ' active' : ''}`}
                  onClick={() => setCurrency(code)}
                >
                  <strong>{code}</strong>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-actions wizard-actions">
          {step > 0 && (
            <button className="btn" onClick={() => setStep((s) => s - 1)}>
              {t('wizard.back')}
            </button>
          )}
          {step < 2 ? (
            <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
              {t('wizard.next')}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={finish}>
              {t('wizard.finish')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SetupWizard
