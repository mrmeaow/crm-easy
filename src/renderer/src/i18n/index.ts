import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import bn from './locales/bn.json'

export const supportedLanguages = ['en', 'bn'] as const
export type Language = (typeof supportedLanguages)[number]

export function isLanguage(value: string): value is Language {
  return (supportedLanguages as readonly string[]).includes(value)
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bn: { translation: bn },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export default i18n
