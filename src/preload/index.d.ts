import type { CrmApi } from './index'

declare global {
  interface Window {
    crm: CrmApi
  }
}

export {}
