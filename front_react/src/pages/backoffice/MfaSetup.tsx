import { useState } from 'react'
import {
  Alert, Box, Button, Card, CardActions, CardContent, CircularProgress,
  TextField, Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '@/components/layout/AdminLayout'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

type Step = 'init' | 'qr' | 'done'

export default function MfaSetup() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)
  const [step, setStep] = useState<Step>('init')
  const [qrCodeDataURL, setQrCodeDataURL] = useState('')
  const [secret, setSecret] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function startSetup() {
    setLoading(true)
    setError('')
    try {
      const res = await authService.setupMfa()
      setQrCodeDataURL(res.qrCodeDataURL)
      setSecret(res.secret)
      setStep('qr')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'activation du MFA.")
    } finally {
      setLoading(false)
    }
  }

  async function confirmSetup() {
    if (otpCode.length < 6) return
    setLoading(true)
    setError('')
    try {
      const res = await authService.confirmMfa(otpCode)
      if (res.verified) {
        setToken(res.token)
        setStep('done')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Code invalide. Réessayez.')
      setOtpCode('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Sécurité — Authentification MFA</Typography>
      </Box>

      {step === 'init' && (
        <Card sx={{ maxWidth: 480 }}>
          <CardContent>
            <Typography sx={{ mb: 2 }}>
              Activez l'authentification à deux facteurs (TOTP) pour sécuriser votre compte.
              Vous aurez besoin de l'application <strong>Google Authenticator</strong> ou équivalente.
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          </CardContent>
          <CardActions>
            <Button variant="contained" onClick={startSetup} disabled={loading}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Activer le MFA'}
            </Button>
          </CardActions>
        </Card>
      )}

      {step === 'qr' && (
        <Card sx={{ maxWidth: 480 }}>
          <CardContent>
            <Typography sx={{ mb: 3 }}>Scannez ce QR code avec votre application d'authentification :</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <img src={qrCodeDataURL} alt="QR code MFA" style={{ width: 200, height: 200 }} />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
              Code manuel : <code>{secret}</code>
            </Typography>
            <Typography sx={{ mb: 2 }}>Entrez le code à 6 chiffres pour confirmer :</Typography>
            <TextField
              label="Code à 6 chiffres" fullWidth variant="outlined" size="small"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputProps={{ inputMode: 'numeric', maxLength: 6 }}
              sx={{ mb: 2, '& input': { textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.4rem' } }}
            />
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          </CardContent>
          <CardActions>
            <Button variant="text" onClick={() => setStep('init')}>Annuler</Button>
            <Button variant="contained" onClick={confirmSetup} disabled={loading || otpCode.length < 6}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Confirmer'}
            </Button>
          </CardActions>
        </Card>
      )}

      {step === 'done' && (
        <Card sx={{ maxWidth: 480 }}>
          <CardContent>
            <Alert severity="success">
              MFA activé avec succès ! Votre compte est désormais protégé par un second facteur.
            </Alert>
          </CardContent>
          <CardActions>
            <Button variant="contained" onClick={() => navigate('/backoffice/venues')}>
              Retour au backoffice
            </Button>
          </CardActions>
        </Card>
      )}
    </AdminLayout>
  )
}
