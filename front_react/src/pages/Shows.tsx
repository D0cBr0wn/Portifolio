import { useEffect, useMemo } from 'react'
import { Alert, Box, LinearProgress, Typography } from '@mui/material'
import PublicLayout from '@/components/layout/PublicLayout'
import { useShowStore } from '@/stores/showStore'
import type { Show } from '@portfolio/shared'

function formatDate(show: Show): string {
  const d = show.date
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function formatRest(show: Show): string {
  const zip = show.venue?.zipCode ? ` (${show.venue.zipCode})` : ''
  const venue = show.venue ? `${show.venue.name} — ${show.venue.city}${zip}` : '—'
  const details = show.details ? `  ${show.details}` : ''
  return `${venue}${details}`
}

export default function Shows() {
  const { shows, loading, error, load } = useShowStore()

  useEffect(() => { load() }, [load])

  const upcoming = useMemo(() =>
    shows
      .filter((s) => s.date >= new Date())
      .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [shows],
  )

  const past = useMemo(() =>
    shows
      .filter((s) => s.date < new Date())
      .sort((a, b) => b.date.getTime() - a.date.getTime()),
    [shows],
  )

  return (
    <PublicLayout>
      <Typography variant="h4" sx={{ fontWeight: 300, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c59a47', mb: 4 }} data-testid="shows-heading">
        Concerts
      </Typography>

      {loading && <LinearProgress color="primary" sx={{ mb: 4 }} />}
      {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

      {!loading && (
        <>
          {upcoming.length > 0 && (
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mb: 6 }}>
              {upcoming.map((show) => (
                <ShowItem key={show.id} show={show} />
              ))}
            </Box>
          )}

          {past.length > 0 && (
            <>
              <Typography sx={{ fontSize: '1rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#aaa', mb: 2 }}>
                Passés
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, opacity: 0.5 }}>
                {past.map((show) => (
                  <ShowItem key={show.id} show={show} />
                ))}
              </Box>
            </>
          )}

          {!upcoming.length && !past.length && (
            <Typography sx={{ color: '#666', textAlign: 'center', mt: 8 }}>
              Aucun concert pour le moment.
            </Typography>
          )}
        </>
      )}
    </PublicLayout>
  )
}

function ShowItem({ show }: { show: Show }) {
  return (
    <Box
      component="li"
      sx={{
        py: 0.75,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        '&:last-child': { borderBottom: 'none' },
        display: 'flex',
        flexDirection: 'column',
        gap: '0.15rem',
      }}
    >
      <Typography sx={{ fontSize: '1rem', color: '#e0e0e0', fontVariantNumeric: 'tabular-nums' }}>
        <Box component="span" sx={{ color: '#c59a47' }}>{formatDate(show)}</Box>
        {'  '}{formatRest(show)}
      </Typography>
      {show.label && (
        <Typography sx={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>
          {show.label}
        </Typography>
      )}
    </Box>
  )
}
