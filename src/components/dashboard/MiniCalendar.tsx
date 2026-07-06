import { useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useData } from '@/lib/hooks'
import { deadlineStatus } from '@/lib/selectors'
import { cn, toDate } from '@/lib/utils'
import type { Task } from '@/lib/types'

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function MiniCalendar() {
  const data = useData()
  const [cursor, setCursor] = useState(() => new Date())

  const monthStart = startOfMonth(cursor)
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(cursor)),
  })

  function dayColor(day: Date): string | null {
    const due = data.tasks.filter(
      (t) => t.dueDate && isSameDay(toDate(t.dueDate), day),
    )
    if (due.length === 0) return null
    const active = due.filter((t: Task) => t.status !== 'done')
    if (active.some((t) => deadlineStatus(t) === 'overdue' || t.status === 'blocked'))
      return 'var(--danger)'
    if (active.some((t) => deadlineStatus(t) === 'due_soon')) return 'var(--warn)'
    if (active.length > 0) return 'var(--info)'
    return 'var(--ok)'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-sm">{format(cursor, 'MMMM yyyy')}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setCursor((c) => addMonths(c, -1))}
            className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--surface-2)]"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--surface-2)]"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DOW.map((d, i) => (
          <div key={i} className="text-[11px] font-medium text-[var(--faint)] pb-1">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const color = dayColor(day)
          const inMonth = isSameMonth(day, cursor)
          const today = isToday(day)
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'relative aspect-square flex items-center justify-center rounded-lg text-[12.5px]',
                today && 'bg-[var(--brand)] text-white font-semibold',
                !today && inMonth && 'text-[var(--text)]',
                !today && !inMonth && 'text-[var(--faint)]',
              )}
            >
              {format(day, 'd')}
              {color && !today && (
                <span
                  className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
