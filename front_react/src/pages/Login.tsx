import { useEffect, useRef, useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  IconButton, InputAdornment, TextField, Typography,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

type Step = 'credentials' | 'mfa' | 'mfa-setup'

export default function Login() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)

  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaSetupCode, setMfaSetupCode] = useState('')
  const [qrCodeDataURL, setQrCodeDataURL] = useState('')
  const [pendingSetupToken, setPendingSetupToken] = useState('')
  const [pendingUserId, setPendingUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [errors, setErrors] = useState({ email: '', password: '' })

  const mfaInputRef = useRef<HTMLInputElement>(null)
  const mfaSetupInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'mfa') mfaInputRef.current?.focus()
    if (step === 'mfa-setup') mfaSetupInputRef.current?.focus()
  }, [step])

  function validate(): boolean {
    const e = { email: '', password: '' }
    if (!email) e.email = "L'email est requis"
    if (!password) e.password = 'Le mot de passe est requis'
    setErrors(e)
    return !e.email && !e.password
  }

  async function submitCredentials(evt: React.FormEvent) {
    evt.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    try {
      const res = await authService.login(email, password)
      if (res.mfaSetupRequired && res.setupToken) {
        setPendingSetupToken(res.setupToken)
        setStep('mfa-setup')
        const setup = await authService.setupMfaWithToken(res.setupToken)
        setQrCodeDataURL(setup.qrCodeDataURL)
      } else if (res.mfaRequired && res.userId) {
        setPendingUserId(res.userId)
        setStep('mfa')
      } else if (res.token) {
        setToken(res.token)
        navigate('/backoffice/venues')
      }
    } catch {
      setServerError('Identifiants invalides.')
    } finally {
      setLoading(false)
    }
  }

  async function submitMfaSetup(evt: React.FormEvent) {
    evt.preventDefault()
    if (!pendingSetupToken || mfaSetupCode.length < 6) return
    setLoading(true)
    setServerError('')
    try {
      const res = await authService.confirmMfaWithToken(mfaSetupCode, pendingSetupToken)
      setToken(res.token)
      navigate('/backoffice/venues')
    } catch {
      setServerError('Code invalide. Réessayez.')
      setMfaSetupCode('')
    } finally {
      setLoading(false)
    }
  }

  async function submitMfa(evt: React.FormEvent) {
    evt.preventDefault()
    if (!pendingUserId || mfaCode.length < 6) return
    setLoading(true)
    setServerError('')
    try {
      const res = await authService.verifyMfa(pendingUserId, mfaCode)
      setToken(res.token)
      navigate('/backoffice/venues')
    } catch {
      setServerError('Code invalide. Réessayez.')
      setMfaCode('')
    } finally {
      setLoading(false)
    }
  }

  const stepTitle = step === 'credentials' ? 'Connexion' : step === 'mfa' ? 'Vérification MFA' : 'Configuration MFA'

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a' }}>
      <Card sx={{ width: '100%', maxWidth: 420 }} elevation={8}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 400, color: 'secondary.main', mb: 3 }}>
            {stepTitle}
          </Typography>

          {step === 'credentials' && (
            <Box component="form" onSubmit={submitCredentials}>
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
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Se connecter'}
              </Button>
            </Box>
          )}

          {step === 'mfa-setup' && (
            <Box component="form" onSubmit={submitMfaSetup}>
              {!qrCodeDataURL ? (
                <>
                  <Typography sx={{ color: '#aaa', fontSize: '0.9rem', mb: 2 }}>
                    Votre administrateur a activé le MFA sur votre compte. Chargement du QR code…
                  </Typography>
                  <CircularProgress sx={{ display: 'block', mx: 'auto' }} />
                </>
              ) : (
                <>
                  <Typography sx={{ color: '#aaa', fontSize: '0.9rem', mb: 2 }}>
                    Scannez ce QR code avec Google Authenticator ou une application TOTP compatible, puis entrez le code généré.
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <img src={qrCodeDataURL} alt="QR Code MFA" width={180} height={180} />
                  </Box>
                  <OtpInput value={mfaSetupCode} onChange={setMfaSetupCode} inputRef={mfaSetupInputRef} />
                  {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
                  <Button type="submit" variant="contained" fullWidth size="large" disabled={loading || mfaSetupCode.length < 6}>
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Confirmer'}
                  </Button>
                </>
              )}
            </Box>
          )}

          {step === 'mfa' && (
            <Box component="form" onSubmit={submitMfa}>
              <Typography sx={{ color: '#aaa', fontSize: '0.9rem', mb: 2 }}>
                Saisissez le code à 6 chiffres affiché dans votre application Google Authenticator.
              </Typography>
              <OtpInput value={mfaCode} onChange={setMfaCode} inputRef={mfaInputRef} />
              {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading || mfaCode.length < 6}>
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Vérifier'}
              </Button>
              <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={() => setStep('credentials')}>
                Retour
              </Button>
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography component={Link} to="/register" sx={{ fontSize: '0.75rem', color: '#888', textDecoration: 'none', '&:hover': { color: '#aaa' } }}>
              Créer un compte (démo)
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

function OtpInput({ value, onChange, inputRef }: {
  value: string
  onChange: (v: string) => void
  inputRef?: React.RefObject<HTMLInputElement>
}) {
  return (
    <TextField
      inputRef={inputRef}
      label="Code à 6 chiffres"
      fullWidth variant="outlined" size="small"
      value={value}
      onChange={(e) => {
        const v = e.target.value.replace(/\D/g, '').slice(0, 6)
        onChange(v)
      }}
      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
      sx={{ mb: 3, letterSpacing: '0.5em', '& input': { textAlign: 'center', fontSize: '1.5rem' } }}
    />
  )
}
