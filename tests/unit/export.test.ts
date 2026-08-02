import { describe, expect, it } from 'vitest'
import { exportFileName, toCsvValue, toExportDate, weightedForecast } from '@shared/export'

describe('toExportDate', () => {
  it('formats as YYYY-MM-DD HH:mm in local time', () => {
    const date = new Date(2026, 7, 2, 9, 5)
    expect(toExportDate(date)).toBe('2026-08-02 09:05')
  })
})

describe('exportFileName', () => {
  it('builds a timestamped file name', () => {
    const name = exportFileName('contacts', 'xlsx', new Date(2026, 0, 5, 9, 0, 7))
    expect(name).toBe('contacts-export-20260105-090007.xlsx')
  })
})

describe('toCsvValue', () => {
  it('keeps plain values unquoted', () => {
    expect(toCsvValue('hello')).toBe('hello')
    expect(toCsvValue(42)).toBe('42')
  })

  it('quotes values containing separators', () => {
    expect(toCsvValue('a,b')).toBe('"a,b"')
    expect(toCsvValue('say "hi"')).toBe('"say ""hi"""')
    expect(toCsvValue('line1\nline2')).toBe('"line1\nline2"')
  })
})

describe('weightedForecast', () => {
  const deals = [
    { value: 100, probability: 50, stageId: 1 },
    { value: 200, probability: 100, stageId: 2 },
    { value: 300, probability: 50, stageId: 3 },
  ]

  it('sums value * probability / 100 for open stages', () => {
    const open = new Set([1, 2])
    expect(weightedForecast(deals, open)).toBe(250)
  })

  it('ignores deals in closed stages', () => {
    const open = new Set([1])
    expect(weightedForecast(deals, open)).toBe(50)
  })

  it('returns 0 when nothing is open', () => {
    expect(weightedForecast(deals, new Set())).toBe(0)
  })
})
