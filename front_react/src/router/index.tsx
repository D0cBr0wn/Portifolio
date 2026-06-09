import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import Home from '@/pages/Home'
import Shows from '@/pages/Shows'
import Contact from '@/pages/Contact'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Venues from '@/pages/backoffice/Venues'
import BackofficeShows from '@/pages/backoffice/Shows'
import MfaSetup from '@/pages/backoffice/MfaSetup'
import Users from '@/pages/backoffice/Users'
import UserDetail from '@/pages/backoffice/UserDetail'

function PrivateRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()
  if (isAuthenticated) return <Outlet />
  return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`} replace />
}

function AdminRoute() {
  const isAdmin = useAuthStore((s) => s.isAdmin)
  return isAdmin ? <Outlet /> : <Navigate to="/backoffice/venues" replace />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shows" element={<Shows />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/backoffice" element={<PrivateRoute />}>
          <Route path="venues" element={<Venues />} />
          <Route path="shows" element={<BackofficeShows />} />
          <Route path="mfa-setup" element={<MfaSetup />} />
          <Route element={<AdminRoute />}>
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserDetail />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
