import { useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, Checkbox,
  CircularProgress, FormControlLabel, IconButton, InputAdornment, TextField, Typography,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { authService } from '@/services/authService'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({ email: '', password: '', confirm: '' })

  function validate(): boolean {
    const e = { email: '', password: '', confirm: '' }
    if (!email) e.email = "L'email est requis"
    if (!password || password.length < 6) e.password = 'Minimum 6 caractères'
    if (password !== confirm) e.confirm = 'Les mots de passe ne correspondent pas'
    setErrors(e)
    return !e.email && !e.password && !e.confirm
  }

  async function submit(evt: React.FormEvent) {
    evt.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    try {
      await authService.register(email, password, isAdmin)
      setSuccess(true)
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Erreur lors de la création du compte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a' }}>
      <Card sx={{ width: '100%', maxWidth: 420 }} elevation={8}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 400, color: 'secondary.main', mb: 3 }}>
            Créer un compte
          </Typography>

          <Alert severity="warning" variant="outlined" sx={{ mb: 3, fontSize: '0.85rem' }}>
            Cette page est disponible <strong>uniquement pour la démonstration</strong>.<br />
            Elle n'existe pas en production.
          </Alert>

          {success ? (
            <>
              <Alert severity="success" sx={{ mb: 3 }}>
                Compte créé avec succès ! Vous pouvez maintenant vous connecter.
              </Alert>
              <Button variant="contained" fullWidth component={Link} to="/login">
                Se connecter
              </Button>
            </>
          ) : (
            <Box component="form" onSubmit={submit}>
              <TextField
                label="Email" type="email" fullWidth variant="outlined" size="small"
                value={email} onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email} helperText={errors.email}
                autoComplete="email" sx={{ mb: 2 }}
              />
              <TextField
                label="Mot de passe" fullWidth variant="outlined" size="small"
                type={showPassword ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password} helperText={errors.password}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Confirmer le mot de passe" fullWidth variant="outlined" size="small"
                type={showConfirm ? 'text' : 'password'}
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                error={!!errors.confirm} helperText={errors.confirm}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small">
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={<Checkbox checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} color="warning" />}
                label={
                  <Typography sx={{ fontSize: '0.9rem' }}>
                    Créer en tant qu'<strong>ADMIN</strong>{' '}
                    <Typography component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(démo uniquement)</Typography>
                  </Typography>
                }
                sx={{ mb: 2 }}
              />
              {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Créer le compte'}
              </Button>
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography component={Link} to="/login" sx={{ fontSize: '0.75rem', color: '#888', textDecoration: 'none', '&:hover': { color: '#aaa' } }}>
              Déjà un compte ? Se connecter
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
