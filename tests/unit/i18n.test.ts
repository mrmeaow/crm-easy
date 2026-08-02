import { describe, expect, it } from 'vitest'
import en from '../../src/renderer/src/i18n/locales/en.json'
import bn from '../../src/renderer/src/i18n/locales/bn.json'

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object') {
      return flattenKeys(value as Record<string, unknown>, path)
    }
    return [path]
  })
}

describe('i18n locale files', () => {
  it('bn.json has exactly the same keys as en.json', () => {
    const enKeys = flattenKeys(en).sort()
    const bnKeys = flattenKeys(bn).sort()
    expect(bnKeys).toEqual(enKeys)
  })

  it('every leaf value is a non-empty string', () => {
    const leafValues = (obj: Record<string, unknown>): string[] =>
      Object.values(obj).flatMap((value) =>
        value !== null && typeof value === 'object'
          ? leafValues(value as Record<string, unknown>)
          : [value as string],
      )
    for (const value of leafValues(en)) {
      expect(value.trim().length).toBeGreaterThan(0)
    }
    for (const value of leafValues(bn)) {
      expect(value.trim().length).toBeGreaterThan(0)
    }
  })
})
