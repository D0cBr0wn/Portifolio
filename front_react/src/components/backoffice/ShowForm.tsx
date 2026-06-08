import { useEffect, useState } from 'react'
import { Box, Button, Grid, MenuItem, TextField, Typography } from '@mui/material'
import type { ShowData, Venue } from '@portfolio/shared'

interface Props {
  venues: Venue[]
  initial?: ShowData
  loading?: boolean
  onSubmit: (data: Omit<ShowData, 'id' | 'venue'>) => void
  onCancel: () => void
}

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function ShowForm({ venues, initial, loading, onSubmit, onCancel }: Props) {
  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')
  const [venueId, setVenueId] = useState<number | ''>('')
  const [details, setDetails] = useState('')
  const [errors, setErrors] = useState({ date: '', venueId: '' })

  useEffect(() => {
    if (initial) {
      setLabel(initial.label ?? '')
      setDate(toLocalDatetimeString(new Date(initial.date)))
      setVenueId(initial.venueId)
      setDetails(initial.details ?? '')
    }
  }, [initial])

  function validate(): boolean {
    const e = { date: '', venueId: '' }
    if (!date) e.date = 'Champ requis'
    if (!venueId) e.venueId = 'Champ requis'
    setErrors(e)
    return !e.date && !e.venueId
  }

  function submit(evt: React.FormEvent) {
    evt.preventDefault()
    if (!validate()) return
    onSubmit({
      label: label || undefined,
      details: details || undefined,
      date: new Date(date).toISOString(),
      venueId: venueId as number,
    })
    if (!initial) {
      setLabel(''); setDate(''); setVenueId(''); setDetails('')
    }
  }

  return (
    <Box component="form" onSubmit={submit}>
      <Typography variant="h6" sx={{ mb: 3 }} data-testid="show-dialog-title">{initial ? 'Modifier le concert' : 'Nouveau concert'}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={7}>
          <TextField label="Nom du concert" fullWidth variant="outlined" size="small"
            value={label} onChange={(e) => setLabel(e.target.value)}
            inputProps={{ 'data-testid': 'show-label-input' }} />
        </Grid>
        <Grid item xs={12} sm={5}>
          <TextField label="Date *" type="datetime-local" fullWidth variant="outlined" size="small"
            value={date} onChange={(e) => setDate(e.target.value)}
            error={!!errors.date} helperText={errors.date}
            InputLabelProps={{ shrink: true }}
            inputProps={{ 'data-testid': 'show-date-input' }} />
        </Grid>
        <Grid item xs={12}>
          <TextField
            select label="Lieu *" fullWidth variant="outlined" size="small"
            value={venueId} onChange={(e) => setVenueId(Number(e.target.value))}
            error={!!errors.venueId} helperText={errors.venueId || (venues.length === 0 ? 'Aucun lieu disponible — créez-en un d\'abord.' : '')}
            data-testid="show-venue-select"
          >
            {venues.map((v) => (
              <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <TextField label="Détails" fullWidth variant="outlined" size="small" multiline rows={3}
            value={details} onChange={(e) => setDetails(e.target.value)} />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
        <Button type="submit" variant="contained" disabled={loading} data-testid="save-btn">Enregistrer</Button>
        <Button variant="text" onClick={onCancel}>Annuler</Button>
      </Box>
    </Box>
  )
}
