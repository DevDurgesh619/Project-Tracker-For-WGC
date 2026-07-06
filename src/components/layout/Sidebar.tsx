import { NavLink } from 'react-router-dom'
import {
  Activity as ActivityIcon,
  CalendarClock,
  CalendarRange,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Moon,
  RotateCcw,
  Sun,
  Sunrise,
  Target,
  TrendingUp,
  UserCircle2,
  ListTodo,
} from 'lucide-react'
import { useData } from '@/lib/hooks'
import { useStore } from '@/lib/store'
import { attentionTasks } from '@/lib/selectors'
import { cloudEnabled } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { CloudBar } from './CloudBar'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/my-day', label: 'My Day', icon: Sunrise },
  { to: '/tasks', label: 'All Tasks', icon: ListChecks },
  { to: '/my-tasks', label: 'My Tasks', icon: ListTodo },
  { to: '/planner', label: 'Planner', icon: CalendarRange },
  { to: '/timeline', label: 'Timeline', icon: TrendingUp },
  { to: '/deadlines', label: 'Deadlines', icon: CalendarClock },
  { to: '/targets', label: 'Targets', icon: Target },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/activity', label: 'Activity', icon: ActivityIcon },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const data = useData()
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const resetDemo = useStore((s) => s.resetDemo)
  const currentUserId = useStore((s) => s.currentUserId)
  const setCurrentUser = useStore((s) => s.setCurrentUser)
  const attention = attentionTasks(data).length

  return (
    <div className="flex h-full flex-col bg-[var(--surface)] border-r border-[var(--border)]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[var(--border)]">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--brand)] text-white shadow-sm">
          <TrendingUp size={18} />
        </div>
        <div>
          <div className="font-semibold leading-tight">Timeline</div>
          <div className="text-[11px] text-[var(--muted)] leading-tight">
            where we stand
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                  : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
              )
            }
          >
            <Icon size={18} />
            <span>{label}</span>
            {to === '/' && attention > 0 && (
              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1.5 text-[11px] font-semibold text-white">
                {attention}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <CloudBar />

      {/* Footer: user switcher + controls */}
      <div className="border-t border-[var(--border)] p-3 space-y-2">
        <label className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2">
          <UserCircle2 size={18} className="text-[var(--muted)] shrink-0" />
          <select
            value={currentUserId}
            onChange={(e) => setCurrentUser(e.target.value)}
            className="w-full bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
            aria-label="View as"
          >
            {data.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.role === 'admin' ? '(admin)' : ''}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-[13px] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          {!cloudEnabled && (
            <button
              onClick={() => {
                if (confirm('Reset all demo data back to the seed?')) resetDemo()
              }}
              title="Reset demo data"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
