import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Route, Router, Switch } from 'wouter'
import { App } from './app/App'
import { AdminApp } from './admin/AdminApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Switch>
        <Route path="/admin" nest>
          <AdminApp />
        </Route>
        <Route component={App} />
      </Switch>
    </Router>
  </StrictMode>,
)
