import { test, expect } from '@playwright/test';

// header: {"alg":"HS256","typ":"JWT"}
// payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
// iat: 1516239022 = January 18, 2018 — triggers ClaimAnnotation with year "2018"
const VALID_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ' +
  '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// 5 dot-separated parts instead of 3 — triggers "expected 3 parts" error
const INVALID_TOKEN = 'not.a.valid.jwt.token';

test('decodes a valid JWT and shows Header and Payload sections', async ({ page }) => {
  await page.goto('/jwt');
  await page.getByPlaceholder(/Paste a JWT token here/i).fill(VALID_JWT);
  await expect(page.getByText('Header')).toBeVisible();
  await expect(page.getByText('Payload')).toBeVisible();
  await expect(page.getByText('HS256')).toBeVisible();
  await expect(page.getByText('John Doe')).toBeVisible();
});

test('shows an error alert for an invalid token', async ({ page }) => {
  await page.goto('/jwt');
  await page.getByPlaceholder(/Paste a JWT token here/i).fill(INVALID_TOKEN);
  await expect(page.getByRole('alert')).toBeVisible();
});

test('annotates iat claim with a human-readable date', async ({ page }) => {
  await page.goto('/jwt');
  await page.getByPlaceholder(/Paste a JWT token here/i).fill(VALID_JWT);
  // ClaimAnnotation renders date.toLocaleString() — 1516239022 is Jan 18, 2018
  await expect(page.getByText('2018')).toBeVisible();
});
