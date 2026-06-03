import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          primary: '#BB86FC',
          secondary: '#03DAC6',
          background: '#1a1a1a',
          surface: '#2a2a2a',
        },
      },
      light: {
        colors: {
          primary: '#6200EE',
          secondary: '#03DAC6',
          background: '#FFFFFF',
          surface: '#F5F5F5',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})
