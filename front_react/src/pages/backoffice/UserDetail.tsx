import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Card, CardActions, CardContent, Chip,
  CircularProgress, IconButton, InputAdornment, MenuItem,
  Skeleton, Snackbar, TextField, Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ShieldIcon from '@mui/icons-material/Shield'
import ShieldOffIcon from '@mui/icons-material/ShieldOutlined'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '@/components/layout/AdminLayout'
import { useUserStore } from '@/stores/userStore'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const store = useUserStore()

  const [selectedRole, setSelectedRole] = useState<'USER' | 'ADMIN'>('USER')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [snackbar, setSnackbar] = useState('')

  function notify(msg: string) { setSnackbar(msg) }

  useEffect(() => {
    if (!id) return
    store.loadUser(parseInt(id, 10))
    store.clearError()
  }, [id])

  useEffect(() => {
    if (store.currentUser) setSelectedRole(store.currentUser.role)
  }, [store.currentUser])

  async function handleUpdateRole() {
    if (!store.currentUser) return
    await store.updateRole(store.currentUser.id, selectedRole)
    if (!store.error) notify('Rôle mis à jour.')
  }

  async function handleUpdatePassword() {
    if (!store.currentUser) return
    await store.updatePassword(store.currentUser.id, newPassword)
    if (!store.error) { setNewPassword(''); notify('Mot de passe modifié.') }
  }

  async function handleRequireMfa() {
    if (!store.currentUser) return
    await store.requireMfa(store.currentUser.id)
    if (!store.error) notify("MFA activé — l'utilisateur devra le configurer à sa prochaine connexion.")
  }

  async function handleDisableMfa() {
    if (!store.currentUser) return
    await store.disableMfa(store.currentUser.id)
    if (!store.error) notify('MFA désactivé.')
  }

  const user = store.currentUser

  return (
    <AdminLayout>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} variant="text" onClick={() => navigate('/backoffice/users')}>
          Retour
        </Button>
        <Typography variant="h5">Gestion utilisateur</Typography>
      </Box>

      {store.error && (
        <Alert severity="error" onClose={() => store.clearError()} sx={{ mb: 2 }}>
          {store.error}
        </Alert>
      )}

      {store.loading && !user ? (
        <Skeleton variant="rectangular" height={300} />
      ) : user ? (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Informations</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography><strong>Email :</strong> {user.email}</Typography>
                <Typography><strong>Inscrit le :</strong> {formatDate(user.createdAt)}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <strong>Rôle :</strong>
                  <Chip label={user.role} color={user.role === 'ADMIN' ? 'primary' : 'default'} size="small" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <strong>MFA :</strong>
                  {user.mfaEnabled
                    ? <><ShieldIcon color="success" fontSize="small" /> Activé</>
                    : <><ShieldOffIcon fontSize="small" sx={{ color: 'text.disabled' }} /> Non configuré</>
                  }
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Modifier le rôle</Typography>
              <TextField
                select label="Rôle" variant="outlined" size="small" sx={{ minWidth: 200 }}
                value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as 'USER' | 'ADMIN')}
              >
                <MenuItem value="USER">USER</MenuItem>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
              </TextField>
            </CardContent>
            <CardActions>
              <Button variant="contained" disabled={store.loading || selectedRole === user.role} onClick={handleUpdateRole}>
                {store.loading ? <CircularProgress size={20} color="inherit" /> : 'Enregistrer'}
              </Button>
            </CardActions>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Modifier le mot de passe</Typography>
              <TextField
                label="Nouveau mot de passe" variant="outlined" size="small" sx={{ minWidth: 300 }}
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small">
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </CardContent>
            <CardActions>
              <Button variant="contained" disabled={store.loading || newPassword.length < 6} onClick={handleUpdatePassword}>
                {store.loading ? <CircularProgress size={20} color="inherit" /> : 'Modifier'}
              </Button>
            </CardActions>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Authentification multi-facteurs</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {user.mfaEnabled
                  ? "Le MFA est actif. Désactiver forcera l'utilisateur à reconfigurer son authenticator s'il est remis en place."
                  : "Forcer le MFA : l'utilisateur devra configurer son authenticator à sa prochaine connexion."}
              </Typography>
            </CardContent>
            <CardActions>
              {!user.mfaEnabled ? (
                <Button variant="outlined" color="warning" disabled={store.loading} onClick={handleRequireMfa}>
                  Forcer le MFA
                </Button>
              ) : (
                <Button variant="outlined" color="error" disabled={store.loading} onClick={handleDisableMfa}>
                  Désactiver le MFA
                </Button>
              )}
            </CardActions>
          </Card>
        </>
      ) : null}

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </AdminLayout>
  )
}
