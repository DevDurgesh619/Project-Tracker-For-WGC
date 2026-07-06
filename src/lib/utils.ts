import {
  differenceInCalendarDays,
  differenceInHours,
  differenceInMinutes,
  format,
  formatDistanceToNowStrict,
  isToday,
  parseISO,
} from 'date-fns'

/** Conditional className joiner (clsx-lite). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Safe parse: accepts Date | ISO string. */
export function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value
}

export function fmtDate(value: string | Date | null, pattern = 'MMM d'): string {
  if (!value) return '—'
  return format(toDate(value), pattern)
}

export function fmtDateLong(value: string | Date | null): string {
  if (!value) return '—'
  return format(toDate(value), 'EEE, MMM d, yyyy')
}

export function fmtRelative(value: string | Date | null): string {
  if (!value) return '—'
  const d = toDate(value)
  if (isToday(d)) return 'Today'
  return formatDistanceToNowStrict(d, { addSuffix: true })
}

/** Whole calendar days from today (negative = past). */
export function daysFromToday(value: string | Date | null): number | null {
  if (!value) return null
  return differenceInCalendarDays(toDate(value), new Date())
}

/** Human duration between two ISO datetimes. */
export function fmtDuration(
  start: string | null,
  end: string | null,
): string {
  if (!start || !end) return '—'
  const a = toDate(start)
  const b = toDate(end)
  const mins = differenceInMinutes(b, a)
  if (mins < 60) return `${Math.max(mins, 0)}m`
  const hours = differenceInHours(b, a)
  if (hours < 24) return `${hours}h ${mins % 60}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

export function durationHours(
  start: string | null,
  end: string | null,
): number | null {
  if (!start || !end) return null
  return Math.max(0, differenceInMinutes(toDate(end), toDate(start)) / 60)
}

/** Inclusive total days from start to end-or-today. */
export function totalDays(start: string, end: string | null): number {
  const endDate = end ? toDate(end) : new Date()
  return Math.max(1, differenceInCalendarDays(endDate, toDate(start)) + 1)
}

export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 100)
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/** crypto.randomUUID with a fallback for older runtimes. */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function nowISO(): string {
  return new Date().toISOString()
}

/** Today as a date-only ISO string ("YYYY-MM-DD"). */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Offset today's date by n days, date-only ISO. */
export function dayOffsetISO(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return format(d, 'yyyy-MM-dd')
}

/** Offset a given date-only ISO string by n days. */
export function addDaysISO(dateISO: string, n: number): string {
  const d = toDate(dateISO)
  d.setDate(d.getDate() + n)
  return format(d, 'yyyy-MM-dd')
}

/** Calendar days from one date to another (toISO - fromISO). */
export function diffDaysISO(fromISO: string, toISO: string): number {
  return differenceInCalendarDays(toDate(toISO), toDate(fromISO))
}
