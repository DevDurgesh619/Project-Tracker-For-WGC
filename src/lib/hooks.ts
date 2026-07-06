import { useEffect } from 'react'
import { useStore } from './store'
import { memberById } from './selectors'

/** The full data graph (re-renders on any data change). */
export function useData() {
  return useStore((s) => s.data)
}

export function useCurrentUser() {
  const id = useStore((s) => s.currentUserId)
  const data = useStore((s) => s.data)
  return memberById(data, id)
}

/** Apply the persisted theme to <html> and keep it in sync. */
export function useThemeEffect() {
  const theme = useStore((s) => s.theme)
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])
}
