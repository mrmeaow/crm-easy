import { describe, expect, it } from 'vitest'
import { autoMapColumns, parseCsv, sanitizeCell } from '@shared/imports'

describe('parseCsv', () => {
  it('parses simple rows', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('handles quoted fields with commas and escaped quotes', () => {
    expect(parseCsv('name,note\n"Smith, John","said ""hi"""')).toEqual([
      ['name', 'note'],
      ['Smith, John', 'said "hi"'],
    ])
  })

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('skips fully empty rows', () => {
    expect(parseCsv('a\n\nb\n')).toEqual([['a'], ['b']])
  })

  it('handles trailing comma', () => {
    expect(parseCsv('a,b,\n1,2,')).toEqual([
      ['a', 'b', ''],
      ['1', '2', ''],
    ])
  })
})

describe('autoMapColumns', () => {
  it('maps known aliases', () => {
    const mapping = autoMapColumns(['First Name', 'Phone Number', 'Email', 'Company'])
    expect(mapping.firstName).toBe(0)
    expect(mapping.phone).toBe(1)
    expect(mapping.email).toBe(2)
    expect(mapping.company).toBe(3)
    expect(mapping.lastName).toBeNull()
    expect(mapping.address).toBeNull()
  })

  it('maps variations case-insensitively', () => {
    const mapping = autoMapColumns(['LAST NAME', 'E-MAIL', 'Mobile'])
    expect(mapping.lastName).toBe(0)
    expect(mapping.email).toBe(1)
    expect(mapping.phone).toBe(2)
  })

  it('maps empty header to null', () => {
    const mapping = autoMapColumns(['', 'Notes'])
    expect(mapping.firstName).toBeNull()
    expect(mapping.notes).toBe(1)
  })

  it('first alias wins for a field', () => {
    const mapping = autoMapColumns(['Phone', 'Mobile', 'phone 2'])
    expect(mapping.phone).toBe(0)
  })
})

describe('sanitizeCell', () => {
  it('trims strings and converts numbers', () => {
    expect(sanitizeCell('  abc  ')).toBe('abc')
    expect(sanitizeCell(42)).toBe('42')
    expect(sanitizeCell(null)).toBe('')
    expect(sanitizeCell(undefined)).toBe('')
  })
})
