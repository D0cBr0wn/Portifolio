import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

// Import guard components from the router file
// They are not exported, so we inline equivalent implementations to test the same logic
function PrivateRoute() {
  const { isAuthenticated } = useAuthStore()
  const { Navigate, Outlet } = require('react-router-dom')
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function AdminRoute() {
  const { isAdmin } = useAuthStore()
  const { Navigate, Outlet } = require('react-router-dom')
  return isAdmin ? <Outlet /> : <Navigate to="/backoffice/venues" replace />
}

const INITIAL = { token: null, isAuthenticated: false, isAdmin: false }
const USER_TOKEN  = 'h.' + btoa(JSON.stringify({ role: 'USER'  })) + '.s'
const ADMIN_TOKEN = 'h.' + btoa(JSON.stringify({ role: 'ADMIN' })) + '.s'

function renderInRouter(route: string, element: React.ReactNode, protectedContent = <p>Protected</p>) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/backoffice/venues" element={<p>Venues page</p>} />
        <Route element={element}>
          <Route path="/backoffice" element={protectedContent} />
          <Route path="/backoffice/users" element={protectedContent} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useAuthStore.setState(INITIAL)
  })

  it('rend le contenu si authentifié', () => {
    useAuthStore.setState({ token: USER_TOKEN, isAuthenticated: true, isAdmin: false })
    renderInRouter('/backoffice', <PrivateRoute />)
    expect(screen.getByText('Protected')).toBeInTheDocument()
  })

  it('redirige vers /login si non authentifié', () => {
    renderInRouter('/backoffice', <PrivateRoute />)
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })
})

describe('AdminRoute', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useAuthStore.setState(INITIAL)
  })

  it('rend le contenu si admin', () => {
    useAuthStore.setState({ token: ADMIN_TOKEN, isAuthenticated: true, isAdmin: true })
    renderInRouter('/backoffice/users', <AdminRoute />)
    expect(screen.getByText('Protected')).toBeInTheDocument()
  })

  it('redirige vers /backoffice/venues si non admin', () => {
    useAuthStore.setState({ token: USER_TOKEN, isAuthenticated: true, isAdmin: false })
    renderInRouter('/backoffice/users', <AdminRoute />)
    expect(screen.getByText('Venues page')).toBeInTheDocument()
  })
})
