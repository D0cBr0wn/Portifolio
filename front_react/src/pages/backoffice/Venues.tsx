import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Dialog, DialogContent, DialogContentText,
  DialogTitle, DialogActions, IconButton, Typography,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AdminLayout from '@/components/layout/AdminLayout'
import VenueForm from '@/components/backoffice/VenueForm'
import { useVenueStore } from '@/stores/venueStore'
import type { VenueWithCreator, VenueData } from '@portfolio/shared'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Venues() {
  const store = useVenueStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<VenueWithCreator | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<VenueWithCreator | null>(null)

  useEffect(() => {
    store.loadBackoffice()
    store.load()
  }, [])

  async function handleCreate(data: Omit<VenueData, 'id'>) {
    await store.create(data)
    if (!store.error) { setCreateOpen(false); store.loadBackoffice() }
  }

  async function handleEdit(data: Omit<VenueData, 'id'>) {
    if (!editTarget) return
    await store.update(editTarget.id, data)
    if (!store.error) { setEditTarget(null); store.loadBackoffice() }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await store.remove(deleteTarget.id)
    if (!store.error) { setDeleteTarget(null); store.loadBackoffice() }
  }

  const columns: GridColDef<VenueWithCreator>[] = [
    { field: 'name', headerName: 'Nom', flex: 1, sortable: true },
    { field: 'city', headerName: 'Ville', flex: 1, sortable: true },
    {
      field: 'address', headerName: 'Adresse', flex: 1.5, sortable: false,
      valueGetter: (_v, row) => [row.address1, row.zipCode, row.city].filter(Boolean).join(', ') || '—',
    },
    {
      field: 'createdBy', headerName: 'Créé par', flex: 1, sortable: false,
      valueGetter: (_v, row) => row.createdBy?.email || '—',
    },
    {
      field: 'createdAt', headerName: 'Créé le', flex: 1, sortable: true,
      valueFormatter: (v) => formatDate(v as string),
    },
    {
      field: 'actions', headerName: '', width: 90, sortable: false,
      renderCell: ({ row }) => (
        <>
          <IconButton size="small" onClick={() => setEditTarget(row)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}><DeleteIcon fontSize="small" /></IconButton>
        </>
      ),
    },
  ]

  return (
    <AdminLayout>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Lieux de concerts</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} data-testid="add-venue-btn">
          Ajouter un lieu
        </Button>
      </Box>

      {store.error && <Alert severity="error" sx={{ mb: 2 }}>{store.error}</Alert>}

      <DataGrid
        rows={store.backofficeVenues}
        columns={columns}
        loading={store.loading}
        autoHeight
        disableRowSelectionOnClick
        sx={{ backgroundColor: 'background.paper' }}
      />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          <VenueForm loading={store.loading} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
        <DialogContent>
          {editTarget && (
            <VenueForm initial={editTarget} loading={store.loading} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContentText sx={{ px: 3 }}>
          Supprimer le lieu <strong>{deleteTarget?.name}</strong> ?<br />
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
