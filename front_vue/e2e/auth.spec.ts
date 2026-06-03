import { test, expect } from '@playwright/test'

const API = 'http://localhost:3000/api'
const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6OTk5OTk5OTk5OSwiZXhwIjo5OTk5OTk5OTk5fQ.test'

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    // Mock GET /api/shows pour éviter les erreurs réseau sur HomeView
    await page.route(`${API}/shows`, route =>
      route.fulfill({ json: [] })
    )
  })

  test('login sans MFA → redirige vers backoffice', async ({ page }) => {
    await page.route(`${API}/auth/login`, route =>
      route.fulfill({ json: { token: JWT } })
    )

    await page.goto('/login')
    await expect(page.getByText('Connexion')).toBeVisible()

    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('password123')
    await page.locator('button', { hasText: 'Se connecter' }).click()

    await expect(page).toHaveURL(/\/backoffice\/venues/)
  })

  test('login avec MFA → affiche l\'étape code', async ({ page }) => {
    await page.route(`${API}/auth/login`, route =>
      route.fulfill({ status: 206, json: { mfaRequired: true, userId: 1, message: 'MFA required' } })
    )

    await page.goto('/login')
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('password123')
    await page.locator('button', { hasText: 'Se connecter' }).click()

    await expect(page.getByText('Vérification MFA')).toBeVisible()
    await expect(page.getByText('Google Authenticator')).toBeVisible()
  })

  test('MFA complet → accès backoffice', async ({ page }) => {
    await page.route(`${API}/auth/login`, route =>
      route.fulfill({ status: 206, json: { mfaRequired: true, userId: 1 } })
    )
    await page.route(`${API}/mfa/verify`, route =>
      route.fulfill({ json: { verified: true, token: JWT } })
    )
    await page.route(`${API}/venues`, route =>
      route.fulfill({ json: [] })
    )

    await page.goto('/login')
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('password123')
    await page.locator('button', { hasText: 'Se connecter' }).click()

    await expect(page.getByText('Vérification MFA')).toBeVisible()

    // Saisie du code MFA via les inputs OTP
    const otpInputs = page.locator('input[type="number"], input[inputmode="numeric"]')
    const count = await otpInputs.count()
    if (count >= 6) {
      for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).fill(String(i + 1))
      }
    } else {
      await otpInputs.first().fill('123456')
    }

    await page.locator('button', { hasText: 'Vérifier' }).click()
    await expect(page).toHaveURL(/\/backoffice\/venues/)
  })

  test('mauvais credentials → message d\'erreur générique', async ({ page }) => {
    await page.route(`${API}/auth/login`, route =>
      route.fulfill({ status: 401, json: { error: 'Identifiants invalides' } })
    )

    await page.goto('/login')
    await page.locator('input[type="email"]').fill('wrong@example.com')
    await page.locator('input[type="password"]').fill('wrongpass')
    await page.locator('button', { hasText: 'Se connecter' }).click()

    await expect(page.getByText('Identifiants invalides')).toBeVisible()
  })

  test('accès /backoffice sans token → redirect /login', async ({ page }) => {
    // Vider le sessionStorage
    await page.addInitScript(() => sessionStorage.clear())

    await page.goto('/backoffice/venues')
    await expect(page).toHaveURL(/\/login/)
  })

  test('logout → retour sur /login', async ({ page }) => {
    await page.route(`${API}/auth/login`, route =>
      route.fulfill({ json: { token: JWT } })
    )
    await page.route(`${API}/venues`, route =>
      route.fulfill({ json: [] })
    )

    // Login
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('password123')
    await page.locator('button', { hasText: 'Se connecter' }).click()
    await expect(page).toHaveURL(/\/backoffice\/venues/)

    // Logout
    await page.locator('button', { hasText: 'Déconnexion' }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
