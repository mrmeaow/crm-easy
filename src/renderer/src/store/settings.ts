import { create } from 'zustand'
import i18n, { isLanguage, type Language } from '../i18n'

export type Theme = 'light' | 'dark' | 'system'

const THEMES: Theme[] = ['light', 'dark', 'system']

const CURRENCIES = ['BDT', 'USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'] as const

export type Currency = (typeof CURRENCIES)[number]

export function isTheme(value: string): value is Theme {
  return (THEMES as string[]).includes(value)
}

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value)
}

export { CURRENCIES }

const SETTINGS_DEFAULTS = {
  language: 'en',
  theme: 'system',
  currency: 'BDT',
} as const

function systemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme): void {
  const resolved = theme === 'system' ? systemTheme() : theme
  document.documentElement.dataset.theme = resolved
}

interface SettingsState {
  hydrated: boolean
  setupComplete: boolean
  language: Language
  theme: Theme
  currency: Currency
  hydrate: (record: Record<string, string>) => void
  setLanguage: (language: Language) => void
  setTheme: (theme: Theme) => void
  setCurrency: (currency: Currency) => void
}

export const useSettings = create<SettingsState>()((set) => ({
  hydrated: false,
  setupComplete: false,
  language: SETTINGS_DEFAULTS.language,
  theme: SETTINGS_DEFAULTS.theme,
  currency: SETTINGS_DEFAULTS.currency,

  hydrate: (record) => {
    const languageValue = record['language']
    const language: Language = isLanguage(languageValue)
      ? languageValue
      : SETTINGS_DEFAULTS.language
    const themeValue = record['theme']
    const theme: Theme = isTheme(themeValue) ? themeValue : SETTINGS_DEFAULTS.theme
    const currencyValue = record['currency']
    const currency: Currency = isCurrency(currencyValue)
      ? currencyValue
      : SETTINGS_DEFAULTS.currency
    void i18n.changeLanguage(language)
    applyTheme(theme)
    set({
      hydrated: true,
      setupComplete: record['setupComplete'] === 'true',
      language,
      theme,
      currency,
    })
  },

  setLanguage: (language) => {
    void i18n.changeLanguage(language)
    void window.crm.settings.set('language', language)
    set({ language })
  },

  setTheme: (theme) => {
    applyTheme(theme)
    void window.crm.settings.set('theme', theme)
    set({ theme })
  },

  setCurrency: (currency) => {
    void window.crm.settings.set('currency', currency)
    set({ currency })
  },
}))
