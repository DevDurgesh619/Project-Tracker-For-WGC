import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { AllTasks } from './pages/AllTasks'
import { MyTasks } from './pages/MyTasks'
import { MyDay } from './pages/MyDay'
import { Planner } from './pages/Planner'
import { Activity } from './pages/Activity'
import { Timeline } from './pages/Timeline'
import { Deadlines } from './pages/Deadlines'
import { Targets } from './pages/Targets'
import { Projects } from './pages/Projects'
import { ProjectDetail } from './pages/ProjectDetail'
import { Button, EmptyState } from './components/ui'
import { useThemeEffect } from './lib/hooks'
import { initAuth } from './lib/auth'
import { initSync } from './lib/sync'
import './index.css'

// Boot cloud sync + auth (no-ops gracefully when Supabase isn't configured).
initAuth()
void initSync()

function Root() {
  useThemeEffect()
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="my-day" element={<MyDay />} />
          <Route path="tasks" element={<AllTasks />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="planner" element={<Planner />} />
          <Route path="activity" element={<Activity />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="deadlines" element={<Deadlines />} />
          <Route path="targets" element={<Targets />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route
            path="*"
            element={
              <EmptyState
                title="Page not found"
                description="That route doesn't exist."
                action={
                  <Link to="/">
                    <Button variant="primary">Go to dashboard</Button>
                  </Link>
                }
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
