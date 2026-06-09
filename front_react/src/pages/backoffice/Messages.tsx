import { useEffect, useState } from 'react'
import {
  Alert, Box, Dialog, DialogContent, DialogTitle, IconButton, Typography,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import CloseIcon from '@mui/icons-material/Close'
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

  useEffect(() => {
    contactService.getMessages()
      .then(setMessages)
      .catch(() => setError('Impossible de charger les messages.'))
      .finally(() => setLoading(false))
  }, [])

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
  ]

  return (
    <AdminLayout>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Messages de contact</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} data-testid="messages-error">{error}</Alert>}

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
      </Dialog>
    </AdminLayout>
  )
}
