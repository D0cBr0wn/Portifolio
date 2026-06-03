import { test, expect } from '@playwright/test'

const API = 'http://localhost:3000/api'
const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6OTk5OTk5OTk5OSwiZXhwIjo5OTk5OTk5OTk5fQ.test'

test.describe('Backoffice — Venues', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((token) => {
      sessionStorage.setItem('token', token)
    }, JWT)

    await page.route(`${API}/venues`, async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: [{ id: 1, name: 'Le Zénith', city: 'Paris', address1: null, address2: null, zipCode: null }] })
      } else {
        await route.fulfill({ status: 201, json: { id: 2, name: 'Le Bataclan', city: 'Paris', address1: null, address2: null, zipCode: null } })
      }
    })
    await page.route(`${API}/shows`, route => route.fulfill({ json: [] }))
  })

  test('affiche le tableau des lieux', async ({ page }) => {
    await page.goto('/backoffice/venues')
    await expect(page.getByText('Le Zénith')).toBeVisible()
  })

  test("ouvre le dialog d'ajout au clic sur 'Ajouter un lieu'", async ({ page }) => {
    await page.goto('/backoffice/venues')
    await page.getByRole('button', { name: 'Ajouter un lieu' }).click()
    await expect(page.getByText('Nouveau lieu')).toBeVisible()
  })

  test('crée un nouveau lieu et ferme le dialog', async ({ page }) => {
    await page.goto('/backoffice/venues')
    await page.getByRole('button', { name: 'Ajouter un lieu' }).click()
    await expect(page.getByText('Nouveau lieu')).toBeVisible()

    // Remplir les champs (les inputs dans le dialog)
    const dialog = page.locator('.v-dialog--active, [role="dialog"]').filter({ hasText: 'Nouveau lieu' })
    await dialog.locator('input').nth(0).fill('Le Bataclan')
    await dialog.locator('input').nth(1).fill('Paris')

    await dialog.getByRole('button', { name: 'Enregistrer' }).click()

    await expect(page.getByText('Nouveau lieu')).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Backoffice — Shows', () => {
  const mockVenues = [{ id: 1, name: 'Le Zénith', city: 'Paris', address1: null, address2: null, zipCode: null }]

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((token) => {
      sessionStorage.setItem('token', token)
    }, JWT)

    await page.route(`${API}/venues`, route => route.fulfill({ json: mockVenues }))
    await page.route(`${API}/shows`, async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          json: [{
            id: 1,
            label: 'Concert été',
            date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
            venueId: 1,
            venue: mockVenues[0],
          }],
        })
      } else {
        await route.fulfill({ status: 201, json: { id: 2, label: 'Nouveau concert', date: new Date().toISOString(), venueId: 1 } })
      }
    })
  })

  test('affiche le tableau des concerts', async ({ page }) => {
    await page.goto('/backoffice/shows')
    await expect(page.getByText('Concert été')).toBeVisible()
  })

  test("ouvre le dialog d'ajout au clic sur 'Ajouter un concert'", async ({ page }) => {
    await page.goto('/backoffice/shows')
    await page.getByRole('button', { name: 'Ajouter un concert' }).click()
    await expect(page.getByText('Nouveau concert')).toBeVisible()
  })

  test('le dialog contient les champs label, date et lieu', async ({ page }) => {
    await page.goto('/backoffice/shows')
    await page.getByRole('button', { name: 'Ajouter un concert' }).click()

    const dialog = page.locator('.v-dialog--active, [role="dialog"]').filter({ hasText: 'Nouveau concert' })
    // Au moins 2 inputs visibles (label + date)
    await expect(dialog.locator('input').first()).toBeVisible()
    await expect(dialog.locator('input').nth(1)).toBeVisible()
  })
})
