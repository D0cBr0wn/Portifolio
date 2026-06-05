import { useEffect, useMemo } from 'react'
import { Alert, Box, Button, Card, CardContent, CardHeader, Grid, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import PlaceIcon from '@mui/icons-material/Place'
import PublicLayout from '@/components/layout/PublicLayout'
import { useShowStore } from '@/stores/showStore'

export default function Home() {
  const { shows, error, load } = useShowStore()

  useEffect(() => { load() }, [load])

  const nextShows = useMemo(() =>
    shows
      .filter((s) => s.date >= new Date())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 3),
    [shows],
  )

  return (
    <PublicLayout>
      <Box sx={{ textAlign: 'center', pt: 6, pb: 4 }}>
        <Typography variant="h2" sx={{ fontSize: '3.5rem', fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'primary.main' }}>
          Portfolio
        </Typography>
        <Typography sx={{ fontSize: '1.2rem', color: '#aaa', mt: 1, letterSpacing: '0.05em', maxWidth: 700, mx: 'auto' }}>
          Odyssey Of One, is a raw, minimalist folk music project, built around
          Nico's guitar and voice, formerly the bass player of the post-hardcore
          band TANEN. Listening to Bob Dylan and The Tallest Man On Earth
          introduced him to this introspective, authentic language. On stage, he
          offers a stripped-down, sincere experience: one voice, one guitar, and
          the desire to convey pure, unadorned emotion. The project also stands
          out for its willingness to share the creative process in real time,
          inviting listeners to follow the album's progress via social networks.
          Join the journey.
        </Typography>
      </Box>

      {nextShows.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h6" sx={{ fontSize: '1.4rem', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ddd', mb: 3 }}>
            Prochains concerts
          </Typography>
          <Grid container spacing={2}>
            {nextShows.map((show) => (
              <Grid item xs={12} sm={6} md={4} key={show.id}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader title={show.label} subheader={show.getFormattedDate()} />
                  {show.venue && (
                    <CardContent sx={{ pt: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#aaa', fontSize: '0.9rem' }}>
                        <PlaceIcon fontSize="small" />
                        {show.venue.name} — {show.venue.city}
                      </Box>
                    </CardContent>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
          <Button
            component={Link}
            to="/shows"
            endIcon={<ArrowForwardIcon />}
            sx={{ mt: 3, color: 'primary.main' }}
          >
            Voir tous les concerts
          </Button>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>}
    </PublicLayout>
  )
}
