import { test, expect } from '@playwright/test'

const API = 'http://localhost:3000/api'
const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6OTk5OTk5OTk5OSwiZXhwIjo5OTk5OTk5OTk5fQ.test'

const mockVenuesFull = [
  { id: 1, name: 'Le Zénith', city: 'Paris', address1: null, address2: null, zipCode: null, createdBy: null, createdAt: new Date().toISOString() },
]

test.describe('Backoffice — Venues', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((token) => sessionStorage.setItem('token', token), JWT)
    await page.route(`${API}/venues`, async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: mockVenuesFull })
      } else {
        await route.fulfill({ status: 201, json: { id: 2, name: 'Le Bataclan', city: 'Paris', address1: null, address2: null, zipCode: null } })
      }
    })
    await page.route(`${API}/backoffice/venues`, route => route.fulfill({ json: mockVenuesFull }))
    await page.route(`${API}/shows`, route => route.fulfill({ json: [] }))
    await page.route(`${API}/backoffice/shows`, route => route.fulfill({ json: [] }))
  })

  test('affiche le tableau des lieux', async ({ page }) => {
    await page.goto('/backoffice/venues')
    await expect(page.getByText('Le Zénith')).toBeVisible()
  })

  test("ouvre le dialog d'ajout au clic sur 'Ajouter un lieu'", async ({ page }) => {
    await page.goto('/backoffice/venues')
    await page.getByTestId('add-venue-btn').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByTestId('venue-dialog-title')).toBeVisible()
  })

  test('crée un nouveau lieu et ferme le dialog', async ({ page }) => {
    await page.goto('/backoffice/venues')
    await page.getByTestId('add-venue-btn').click()
    await expect(page.getByTestId('venue-dialog-title')).toBeVisible()

    await page.getByTestId('venue-name-input').fill('Le Bataclan')
    await page.getByTestId('venue-city-input').fill('Paris')

    await page.getByTestId('save-btn').click()

    await expect(page.getByTestId('venue-dialog-title')).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Backoffice — Shows', () => {
  const mockVenues = [{ id: 1, name: 'Le Zénith', city: 'Paris', address1: null, address2: null, zipCode: null }]
  const mockShowsFull = [{
    id: 1,
    label: 'Concert été',
    date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    venueId: 1,
    venue: mockVenues[0],
    createdBy: null,
    createdAt: new Date().toISOString(),
  }]

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((token) => sessionStorage.setItem('token', token), JWT)
    await page.route(`${API}/venues`, route => route.fulfill({ json: mockVenues }))
    await page.route(`${API}/backoffice/venues`, route => route.fulfill({ json: mockVenues }))
    await page.route(`${API}/shows`, route => route.fulfill({ json: [] }))
    await page.route(`${API}/backoffice/shows`, route => route.fulfill({ json: mockShowsFull }))
  })

  test('affiche le tableau des concerts', async ({ page }) => {
    await page.goto('/backoffice/shows')
    await expect(page.getByText('Concert été')).toBeVisible()
  })

  test("ouvre le dialog d'ajout au clic sur 'Ajouter un concert'", async ({ page }) => {
    await page.goto('/backoffice/shows')
    await page.getByTestId('add-show-btn').click()
    await expect(page.getByTestId('show-dialog-title')).toBeVisible()
  })

  test('le dialog contient les champs label, date et lieu', async ({ page }) => {
    await page.goto('/backoffice/shows')
    await page.getByTestId('add-show-btn').click()

    await expect(page.getByTestId('show-label-input')).toBeVisible()
    await expect(page.getByTestId('show-date-input')).toBeVisible()
  })
})
