import { Box, Container } from '@mui/material'
import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import logo from '@/assets/logo.png'
import bgImg from '@/assets/bg.jpg'

interface Props {
  children: ReactNode
}

export default function PublicLayout({ children }: Props) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a', color: '#fff' }}>
      <Box
        component="header"
        sx={{
          height: 300,
          backgroundImage: `url(${bgImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Link to="/">
          <Box component="img" src={logo} alt="Portfolio" sx={{ maxWidth: 400, maxHeight: 200, objectFit: 'contain' }} />
        </Link>
        <Box component="nav" sx={{ display: 'flex', gap: 4 }}>
          <NavLink to="/" end style={navStyle}>Accueil</NavLink>
          <NavLink to="/shows" style={navStyle}>Concerts</NavLink>
          <NavLink to="/contact" style={navStyle}>Contact</NavLink>
        </Box>
      </Box>

      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        {children}
      </Container>

      <Box component="footer" sx={{ py: 2, textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>
        <p>&copy; {new Date().getFullYear()} Portfolio</p>
      </Box>

    </Box>
  )
}

function navStyle({ isActive }: { isActive: boolean }): React.CSSProperties {
  return {
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '1.1rem',
    borderBottom: isActive ? '2px solid #000' : 'none',
  }
}
