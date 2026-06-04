import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, IconButton, Typography,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import ShieldIcon from '@mui/icons-material/Shield'
import ShieldOffIcon from '@mui/icons-material/ShieldOutlined'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '@/components/layout/AdminLayout'
import { useUserStore } from '@/stores/userStore'
import type { UserData } from '@portfolio/shared'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Users() {
  const store = useUserStore()
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null)

  useEffect(() => { store.load() }, [])

  async function handleDelete() {
    if (!deleteTarget) return
    await store.remove(deleteTarget.id)
    if (!store.error) setDeleteTarget(null)
  }

  const columns: GridColDef<UserData>[] = [
    { field: 'email', headerName: 'Email', flex: 2, sortable: true },
    {
      field: 'role', headerName: 'Rôle', flex: 1, sortable: true,
      renderCell: ({ value }) => (
        <Chip label={value} color={value === 'ADMIN' ? 'primary' : 'default'} size="small" />
      ),
    },
    {
      field: 'mfaEnabled', headerName: 'MFA', width: 80, sortable: false,
      renderCell: ({ value }) => value
        ? <ShieldIcon color="success" fontSize="small" />
        : <ShieldOffIcon fontSize="small" sx={{ color: 'text.disabled' }} />,
    },
    {
      field: 'createdAt', headerName: 'Inscrit le', flex: 1, sortable: true,
      valueFormatter: (v) => formatDate(v as string),
    },
    {
      field: 'actions', headerName: '', width: 60, sortable: false,
      renderCell: ({ row }) => (
        <IconButton
          size="small" color="error"
          disabled={row.role === 'ADMIN'}
          onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ]

  return (
    <AdminLayout>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Utilisateurs</Typography>
      </Box>

      {store.error && <Alert severity="error" sx={{ mb: 2 }}>{store.error}</Alert>}

      <DataGrid
        rows={store.users}
        columns={columns}
        loading={store.loading}
        autoHeight
        sx={{ backgroundColor: 'background.paper', cursor: 'pointer' }}
        onRowClick={({ row }) => navigate(`/backoffice/users/${row.id}`)}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContentText sx={{ px: 3 }}>
          Supprimer l'utilisateur <strong>{deleteTarget?.email}</strong> ?<br />
          Cette action est irréversible.
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Annuler</Button>
          <Button color="error" onClick={handleDelete} disabled={store.loading}>Supprimer</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  )
}
