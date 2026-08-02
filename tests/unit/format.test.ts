import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, formatNumber } from '@shared/format'

describe('format', () => {
  const date = new Date(2026, 7, 2, 14, 30)

  it('formats dates per locale', () => {
    expect(formatDate(date, 'en-US')).toBe('Aug 2, 2026')
    expect(formatDate(date, 'bn-BD')).toContain('২০২৬')
  })

  it('formats numbers with Bangla locale', () => {
    expect(formatNumber(12345, 'en-US')).toBe('12,345')
    expect(formatNumber(12345, 'bn-BD')).toBe('১২,৩৪৫')
  })

  it('formats currency per locale and currency code', () => {
    expect(formatCurrency(1250, 'USD', 'en-US')).toContain('$1,250')
    const bdt = formatCurrency(1250, 'BDT', 'bn-BD')
    expect(bdt).toContain('৳')
  })
})
