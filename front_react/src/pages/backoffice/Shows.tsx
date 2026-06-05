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
import ShowForm from '@/components/backoffice/ShowForm'
import { useShowStore } from '@/stores/showStore'
import { useVenueStore } from '@/stores/venueStore'
import { Show } from '@portfolio/shared'
import type { ShowData, ShowWithCreator } from '@portfolio/shared'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BackofficeShows() {
  const showStore = useShowStore()
  const venueStore = useVenueStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Show | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ShowWithCreator | null>(null)

  useEffect(() => {
    showStore.loadBackoffice()
    venueStore.load()
  }, [])

  async function handleCreate(data: Omit<ShowData, 'id' | 'venue'>) {
    await showStore.create(data)
    if (!showStore.error) { setCreateOpen(false); showStore.loadBackoffice() }
  }

  async function handleEdit(data: Omit<ShowData, 'id' | 'venue'>) {
    if (!editTarget) return
    await showStore.update(editTarget.id, data)
    if (!showStore.error) { setEditTarget(null); showStore.loadBackoffice() }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await showStore.remove(deleteTarget.id)
    if (!showStore.error) { setDeleteTarget(null); showStore.loadBackoffice() }
  }

  const columns: GridColDef<ShowWithCreator>[] = [
    {
      field: 'date', headerName: 'Date', flex: 1, sortable: true,
      valueFormatter: (v) => formatDate(v as string),
    },
    { field: 'label', headerName: 'Concert', flex: 1, sortable: true, valueFormatter: (v) => v || '—' },
    {
      field: 'venue', headerName: 'Lieu', flex: 1.5, sortable: false,
      valueGetter: (_v, row) => row.venue ? `${row.venue.name} — ${row.venue.city}` : '—',
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
          <IconButton size="small" onClick={() => setEditTarget(new Show(row))}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}><DeleteIcon fontSize="small" /></IconButton>
        </>
      ),
    },
  ]

  return (
    <AdminLayout>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Concerts</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Ajouter un concert
        </Button>
      </Box>

      {showStore.error && <Alert severity="error" sx={{ mb: 2 }}>{showStore.error}</Alert>}

      <DataGrid
        rows={showStore.backofficeShows}
        columns={columns}
        loading={showStore.loading}
        autoHeight
        disableRowSelectionOnClick
        initialState={{ sorting: { sortModel: [{ field: 'date', sort: 'desc' }] } }}
        sx={{ backgroundColor: 'background.paper' }}
      />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          <ShowForm venues={venueStore.venues} loading={showStore.loading} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
        <DialogContent>
          {editTarget && (
            <ShowForm
              initial={editTarget}
              venues={venueStore.venues}
              loading={showStore.loading}
              onSubmit={handleEdit}
              onCancel={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContentText sx={{ px: 3 }}>
          Supprimer le concert <strong>{deleteTarget?.label || 'sans titre'}</strong> ?<br />
          Cette action est irréversible.
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Annuler</Button>
          <Button color="error" onClick={handleDelete} disabled={showStore.loading}>Supprimer</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  )
}
