import {
  AppBar, Box, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography, Button,
} from '@mui/material'
import PlaceIcon from '@mui/icons-material/Place'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import ShieldIcon from '@mui/icons-material/Shield'
import PeopleIcon from '@mui/icons-material/People'
import { NavLink, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'
import TechBadge from '@/components/TechBadge'

const DRAWER_WIDTH = 240

interface Props {
  children: ReactNode
}

const navItems = [
  { label: 'Lieux', icon: <PlaceIcon />, to: '/backoffice/venues' },
  { label: 'Concerts', icon: <MusicNoteIcon />, to: '/backoffice/shows' },
  { label: 'Sécurité MFA', icon: <ShieldIcon />, to: '/backoffice/mfa-setup' },
]

export default function AdminLayout({ children }: Props) {
  const { logout, isAdmin } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Portfolio — Backoffice
          </Typography>
          <Button color="inherit" onClick={handleLogout}>Déconnexion</Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List>
          {navItems.map((item) => (
            <ListItem key={item.to} disablePadding>
              <ListItemButton
                component={NavLink}
                to={item.to}
                sx={{
                  '&.active': { backgroundColor: 'rgba(98, 0, 238, 0.12)', color: 'primary.main' },
                  '&.active .MuiListItemIcon-root': { color: 'primary.main' },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
          {isAdmin && (
            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/backoffice/users"
                sx={{
                  '&.active': { backgroundColor: 'rgba(98, 0, 238, 0.12)', color: 'primary.main' },
                  '&.active .MuiListItemIcon-root': { color: 'primary.main' },
                }}
              >
                <ListItemIcon><PeopleIcon /></ListItemIcon>
                <ListItemText primary="Utilisateurs" />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>

      <TechBadge />
    </Box>
  )
}
