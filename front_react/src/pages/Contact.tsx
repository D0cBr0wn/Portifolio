import { useState } from 'react'
import { Alert, Box, Button, CircularProgress, TextField, Typography } from '@mui/material'
import PublicLayout from '@/components/layout/PublicLayout'
import { contactService } from '@/services/contactService'

interface FormErrors {
  name: string
  email: string
  message: string
}

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<FormErrors>({ name: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')

  function validate(): boolean {
    const e: FormErrors = { name: '', email: '', message: '' }
    if (!name.trim()) e.name = 'Le nom est requis'
    if (!email.trim()) {
      e.email = "L'email est requis"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "L'email n'est pas valide"
    }
    if (!message.trim()) e.message = 'Le message est requis'
    setErrors(e)
    return !e.name && !e.email && !e.message
  }

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    try {
      await contactService.sendMessage({ name: name.trim(), email: email.trim(), message: message.trim() })
      setSuccess(true)
      setName('')
      setEmail('')
      setMessage('')
      setErrors({ name: '', email: '', message: '' })
    } catch {
      setServerError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout>
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h4" sx={{ mb: 3, color: '#fff' }}>Contact</Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} data-testid="success-alert">
            Votre message a bien été envoyé. Merci !
          </Alert>
        )}

        {serverError && (
          <Alert severity="error" sx={{ mb: 3 }} data-testid="server-error">
            {serverError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Nom"
            fullWidth
            variant="outlined"
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#aaa' } }}
            inputProps={{ 'data-testid': 'name-input' }}
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            size="small"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            autoComplete="email"
            sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#aaa' } }}
            inputProps={{ 'data-testid': 'email-input' }}
          />
          <TextField
            label="Message"
            fullWidth
            variant="outlined"
            multiline
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            error={!!errors.message}
            helperText={errors.message}
            sx={{ mb: 3, textarea: { color: '#fff' }, label: { color: '#aaa' } }}
            inputProps={{ 'data-testid': 'message-input' }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            data-testid="submit-btn"
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Envoyer'}
          </Button>
        </Box>
      </Box>
    </PublicLayout>
  )
}
