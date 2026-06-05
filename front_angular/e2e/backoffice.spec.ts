import { test, expect } from '@playwright/test'

const API = 'http://localhost:3000/api'
const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6OTk5OTk5OTk5OSwiZXhwIjo5OTk5OTk5OTk5fQ.test'

const mockVenues = [
  { id: 1, name: 'Le Zénith', city: 'Paris', address1: null, address2: null, zipCode: null, createdBy: null, createdAt: new Date().toISOString() },
]

test.describe('Backoffice — Venues', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((token) => sessionStorage.setItem('token', token), JWT)
    await page.route(`${API}/venues`, route => route.fulfill({ json: mockVenues }))
    await page.route(`${API}/backoffice/venues`, route => route.fulfill({ json: mockVenues }))
    await page.route(`${API}/shows`, route => route.fulfill({ json: [] }))
    await page.route(`${API}/backoffice/shows`, route => route.fulfill({ json: [] }))
  })

  test('affiche le tableau des lieux', async ({ page }) => {
    await page.goto('/backoffice/venues')
    await expect(page.getByText('Le Zénith')).toBeVisible()
  })

  test("ouvre le dialog Angular Material au clic sur 'Ajouter un lieu'", async ({ page }) => {
    await page.goto('/backoffice/venues')
    await page.getByTestId('add-venue-btn').click()
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.getByTestId('venue-dialog-title')).toBeVisible()
  })
})
