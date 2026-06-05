import { test, expect } from '@playwright/test'

const API = 'http://localhost:3000/api'
const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6OTk5OTk5OTk5OSwiZXhwIjo5OTk5OTk5OTk5fQ.test'

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${API}/shows`, route => route.fulfill({ json: [] }))
  })

  test('login sans MFA → redirige vers backoffice', async ({ page }) => {
    await page.route(`${API}/auth/login`, route => route.fulfill({ json: { token: JWT } }))
    await page.route(`${API}/venues`, route => route.fulfill({ json: [] }))
    await page.route(`${API}/backoffice/venues`, route => route.fulfill({ json: [] }))
    await page.route(`${API}/backoffice/shows`, route => route.fulfill({ json: [] }))

    await page.goto('/login')
    await expect(page.getByTestId('login-title')).toBeVisible()

    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('password123')
    await page.getByTestId('login-submit').click()

    await expect(page).toHaveURL(/\/backoffice\/venues/)
  })

  test('login avec MFA → affiche l\'étape code', async ({ page }) => {
    await page.route(`${API}/auth/login`, route =>
      route.fulfill({ status: 206, json: { mfaRequired: true, userId: 1 } })
    )

    await page.goto('/login')
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('password123')
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('login-title')).toContainText('Vérification MFA')
  })

  test('mauvais credentials → message d\'erreur', async ({ page }) => {
    await page.route(`${API}/auth/login`, route =>
      route.fulfill({ status: 401, json: { error: 'Identifiants invalides' } })
    )

    await page.goto('/login')
    await page.getByTestId('email-input').fill('wrong@example.com')
    await page.getByTestId('password-input').fill('wrongpass')
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('server-error')).toBeVisible()
  })

  test('accès /backoffice sans token → redirect /login', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.clear())
    await page.goto('/backoffice/venues')
    await expect(page).toHaveURL(/\/login/)
  })

  test('logout → retour sur /login', async ({ page }) => {
    await page.route(`${API}/auth/login`, route => route.fulfill({ json: { token: JWT } }))
    await page.route(`${API}/venues`, route => route.fulfill({ json: [] }))
    await page.route(`${API}/backoffice/venues`, route => route.fulfill({ json: [] }))
    await page.route(`${API}/backoffice/shows`, route => route.fulfill({ json: [] }))

    await page.goto('/login')
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('password123')
    await page.getByTestId('login-submit').click()
    await expect(page).toHaveURL(/\/backoffice\/venues/)

    await page.getByTestId('logout-btn').click()
    await expect(page).toHaveURL(/\/login/)
  })
})
