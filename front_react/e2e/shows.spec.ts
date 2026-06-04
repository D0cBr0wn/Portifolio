import { test, expect } from '@playwright/test'

const API = 'http://localhost:3000/api'

const mockShows = [
  {
    id: 1, label: 'Concert du Printemps',
    date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    venueId: 1, venue: { id: 1, name: 'Le Zénith', city: 'Paris' },
  },
  {
    id: 2, label: 'Fête de la Musique',
    date: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
    venueId: 2, venue: { id: 2, name: 'Le Bataclan', city: 'Paris' },
  },
]

test.describe('Page publique — Concerts', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${API}/shows`, route => route.fulfill({ json: mockShows }))
  })

  test('accessible sans authentification', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.clear())
    await page.goto('/shows')
    await expect(page).toHaveURL('/shows')
    await expect(page.getByRole('heading', { name: /concerts/i })).toBeVisible()
  })

  test('affiche les concerts', async ({ page }) => {
    await page.goto('/shows')
    await expect(page.getByText('Concert du Printemps')).toBeVisible()
    await expect(page.getByText('Fête de la Musique')).toBeVisible()
  })

  test('affiche les noms de lieux', async ({ page }) => {
    await page.goto('/shows')
    await expect(page.getByText('Le Zénith').first()).toBeVisible()
    await expect(page.getByText('Le Bataclan')).toBeVisible()
  })
})
