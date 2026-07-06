import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, TrendingUp, X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils'

export function AppShell() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      <div className={cn('lg:hidden', open ? 'block' : 'hidden')}>
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
        <aside className="fixed inset-y-0 left-0 w-64 z-50 animate-in">
          <Sidebar onNavigate={() => setOpen(false)} />
        </aside>
      </div>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4">
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)]"
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--brand)] text-white">
            <TrendingUp size={15} />
          </div>
          <span className="font-semibold">Timeline</span>
        </div>
      </header>

      {/* Content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
