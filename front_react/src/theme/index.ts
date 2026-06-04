import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#c59a47',
    },
    secondary: {
      main: '#bb86fc',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2a2a2a',
    },
    error: {
      main: '#cf6679',
    },
    warning: {
      main: '#ffb74d',
    },
    success: {
      main: '#81c784',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#2a2a2a',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#222',
          border: '1px solid #333',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#2a2a2a',
        },
      },
    },
  },
})

export default theme
