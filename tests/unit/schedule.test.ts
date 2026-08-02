import { describe, expect, it } from 'vitest'
import { dueTimeInPeriod, nextDueTime, periodKey } from '@shared/schedule'

describe('dueTimeInPeriod', () => {
  it('returns the scheduled time within the current day', () => {
    const now = new Date(2026, 7, 2, 12, 0)
    const due = dueTimeInPeriod({ frequency: 'daily', time: '09:00' }, now)
    expect(due.getDate()).toBe(2)
    expect(due.getHours()).toBe(9)
  })

  it('weekly anchors to Sunday of the current week', () => {
    const now = new Date(2026, 7, 4, 10, 0) // Tuesday
    const due = dueTimeInPeriod({ frequency: 'weekly', time: '09:00' }, now)
    expect(due.getDate()).toBe(2) // Sunday Aug 2
    expect(due.getHours()).toBe(9)
  })
})

describe('nextDueTime', () => {
  it('returns today when the time is still ahead', () => {
    const now = new Date(2026, 7, 2, 8, 0) // Aug 2 2026 08:00
    const due = nextDueTime({ frequency: 'daily', time: '09:00' }, now)
    expect(due.getFullYear()).toBe(2026)
    expect(due.getMonth()).toBe(7)
    expect(due.getDate()).toBe(2)
    expect(due.getHours()).toBe(9)
    expect(due.getMinutes()).toBe(0)
  })

  it('rolls to tomorrow when the time already passed', () => {
    const now = new Date(2026, 7, 2, 12, 0)
    const due = nextDueTime({ frequency: 'daily', time: '09:00' }, now)
    expect(due.getDate()).toBe(3)
    expect(due.getHours()).toBe(9)
  })

  it('weekly schedules for the upcoming Sunday', () => {
    // Aug 2 2026 is a Sunday; same-day earlier time rolls to next Sunday.
    const now = new Date(2026, 7, 2, 10, 0)
    const due = nextDueTime({ frequency: 'weekly', time: '09:00' }, now)
    expect(due.getDate()).toBe(9)
    expect(due.getHours()).toBe(9)
  })

  it('weekly keeps this Sunday if time is ahead', () => {
    const now = new Date(2026, 7, 2, 8, 0)
    const due = nextDueTime({ frequency: 'weekly', time: '09:00' }, now)
    expect(due.getDate()).toBe(2)
  })

  it('handles malformed time with defaults', () => {
    const now = new Date(2026, 7, 2, 8, 0)
    const due = nextDueTime({ frequency: 'daily', time: 'garbage' }, now)
    expect(due.getHours()).toBe(9)
    expect(due.getMinutes()).toBe(0)
  })
})

describe('periodKey', () => {
  it('daily keys by date', () => {
    expect(periodKey('daily', new Date(2026, 7, 2, 23, 59))).toBe('2026-8-2')
  })

  it('weekly keys by ISO week', () => {
    expect(periodKey('weekly', new Date(2026, 7, 2, 10, 0))).toBe('2026-W31')
  })
})
