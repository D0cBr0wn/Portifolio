import { useEffect, useState } from 'react'
import { Box, Button, Grid, TextField, Typography } from '@mui/material'
import type { Venue, VenueData } from '@portfolio/shared'

interface Props {
  initial?: Venue
  loading?: boolean
  onSubmit: (data: Omit<VenueData, 'id'>) => void
  onCancel: () => void
}

export default function VenueForm({ initial, loading, onSubmit, onCancel }: Props) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [address1, setAddress1] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [errors, setErrors] = useState({ name: '', city: '' })

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setCity(initial.city)
      setAddress1(initial.address1 ?? '')
      setZipCode(initial.zipCode ?? '')
    }
  }, [initial])

  function validate(): boolean {
    const e = { name: '', city: '' }
    if (!name) e.name = 'Champ requis'
    if (!city) e.city = 'Champ requis'
    setErrors(e)
    return !e.name && !e.city
  }

  function submit(evt: React.FormEvent) {
    evt.preventDefault()
    if (!validate()) return
    onSubmit({ name, city, address1: address1 || undefined, zipCode: zipCode || undefined })
    if (!initial) {
      setName(''); setCity(''); setAddress1(''); setZipCode('')
    }
  }

  return (
    <Box component="form" onSubmit={submit}>
      <Typography variant="h6" sx={{ mb: 3 }}>{initial ? 'Modifier le lieu' : 'Nouveau lieu'}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Nom du lieu *" fullWidth variant="outlined" size="small"
            value={name} onChange={(e) => setName(e.target.value)}
            error={!!errors.name} helperText={errors.name} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Ville *" fullWidth variant="outlined" size="small"
            value={city} onChange={(e) => setCity(e.target.value)}
            error={!!errors.city} helperText={errors.city} />
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField label="Adresse" fullWidth variant="outlined" size="small"
            value={address1} onChange={(e) => setAddress1(e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Code postal" fullWidth variant="outlined" size="small"
            value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
        <Button type="submit" variant="contained" disabled={loading}>Enregistrer</Button>
        <Button variant="text" onClick={onCancel}>Annuler</Button>
      </Box>
    </Box>
  )
}
