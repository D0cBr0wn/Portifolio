import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, IconButton, Typography,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import AdminLayout from '@/components/layout/AdminLayout'
import { contactService } from '@/services/contactService'
import type { ContactMessage } from '@/services/contactService'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function truncate(text: string, max = 60) {
  return text.length > max ? text.slice(0, max) + '…' : text
}

export default function BackofficeMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    contactService.getMessages()
      .then(setMessages)
      .catch(() => setError('Impossible de charger les messages.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await contactService.deleteMessage(deleteTarget.id)
      setMessages(prev => prev.filter(m => m.id !== deleteTarget.id))
      if (selected?.id === deleteTarget.id) setSelected(null)
      setDeleteTarget(null)
    } catch {
      setDeleteError('Impossible de supprimer le message.')
    } finally {
      setDeleting(false)
    }
  }

  const columns: GridColDef<ContactMessage>[] = [
    {
      field: 'createdAt', headerName: 'Date', flex: 1, sortable: true,
      valueFormatter: (v) => formatDate(v as string),
    },
    { field: 'name', headerName: 'Nom', flex: 1, sortable: true },
    { field: 'email', headerName: 'Email', flex: 1.5, sortable: true },
    {
      field: 'message', headerName: 'Message', flex: 2, sortable: false,
      valueFormatter: (v) => truncate(v as string),
    },
    {
      field: 'actions', headerName: '', width: 60, sortable: false,
      renderCell: ({ row }) => (
        <IconButton
          size="small"
          color="error"
          data-testid="delete-row-btn"
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
        <Typography variant="h5">Messages de contact</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} data-testid="messages-error">{error}</Alert>}
      {deleteError && <Alert severity="error" sx={{ mb: 2 }} data-testid="delete-error">{deleteError}</Alert>}

      <DataGrid
        rows={messages}
        columns={columns}
        loading={loading}
        autoHeight
        disableRowSelectionOnClick
        initialState={{ sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] } }}
        sx={{ backgroundColor: 'background.paper', cursor: 'pointer' }}
        onRowClick={({ row }) => setSelected(row)}
        data-testid="messages-grid"
      />

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Message de {selected?.name}
          <IconButton size="small" onClick={() => setSelected(null)} data-testid="close-modal-btn">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {selected?.email} — {selected ? formatDate(selected.createdAt) : ''}
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }} data-testid="modal-message">
            {selected?.message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Fermer</Button>
          <Button color="error" onClick={() => setDeleteTarget(selected)} data-testid="modal-delete-btn">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContentText sx={{ px: 3 }}>
          Supprimer le message de <strong>{deleteTarget?.name}</strong> ?<br />
          Cette action est irréversible.
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} data-testid="cancel-delete-btn">Annuler</Button>
          <Button
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            data-testid="confirm-delete-btn"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  )
}
