import { Link, Route, Switch, useLocation, useRoute } from 'wouter'
import './admin.css'
import { JobDetailPage } from './pages/JobDetailPage'
import { JobsListPage } from './pages/JobsListPage'
import { SessionCreatePage } from './pages/SessionCreatePage'
import { StoriesListPage } from './pages/StoriesListPage'
import { StoryDetailPage } from './pages/StoryDetailPage'

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [location] = useLocation()
  const active =
    href === '/'
      ? location === '/' || location === ''
      : location === href ||
          (href === '/jobs' && location.startsWith('/jobs')) ||
          (href === '/stories' && location.startsWith('/stories'))
  return (
    <Link href={href} className={active ? 'active' : undefined}>
      {children}
    </Link>
  )
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio-layout">
      <aside className="studio-sidebar">
        <h1>Persona Reality Studio</h1>
        <NavLink href="/">Neue Session</NavLink>
        <NavLink href="/stories">Stories</NavLink>
        <NavLink href="/jobs">Alle Jobs</NavLink>
        <a href="/">← Quest Runtime</a>
      </aside>
      {children}
    </div>
  )
}

/** Mounted under <Route path="/admin" nest> — paths here are relative to /admin */
export function AdminApp() {
  return (
    <div className="studio-root">
      <AdminShell>
        <Switch>
          <Route path="/jobs/:jobId" component={JobDetailPage} />
          <Route path="/jobs" component={JobsListPage} />
          <Route path="/stories/:personaId" component={StoryDetailPage} />
          <Route path="/stories" component={StoriesListPage} />
          <Route path="/" component={SessionCreatePage} />
        </Switch>
      </AdminShell>
    </div>
  )
}
