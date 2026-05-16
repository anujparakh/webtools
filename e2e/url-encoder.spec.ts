import { test, expect } from '@playwright/test';

test('encodes a string with special characters', async ({ page }) => {
  await page.goto('/url-encoder');
  await page.getByPlaceholder('Paste text or URL here…').fill('hello world');
  await page.getByRole('button', { name: 'Encode', exact: true }).click();
  await expect(page.locator('textarea[readonly]')).toHaveValue('hello%20world');
});

test('decodes a URL-encoded string', async ({ page }) => {
  await page.goto('/url-encoder');
  await page.getByPlaceholder('Paste text or URL here…').fill('hello%20world');
  await page.getByRole('button', { name: 'Decode', exact: true }).click();
  await expect(page.locator('textarea[readonly]')).toHaveValue('hello world');
});

test('encodes URL params from a full URL', async ({ page }) => {
  await page.goto('/url-encoder');
  await page.getByPlaceholder('Paste text or URL here…').fill('https://example.com?q=hello%20world');
  await page.getByRole('button', { name: 'Encode URL Params' }).click();
  // URLSearchParams normalizes %20 → + when re-encoding
  await expect(page.locator('textarea[readonly]')).toHaveValue(/q=hello\+world/);
});

test('shows an error alert on invalid percent-encoded input', async ({ page }) => {
  await page.goto('/url-encoder');
  await page.getByPlaceholder('Paste text or URL here…').fill('%zz');
  await page.getByRole('button', { name: 'Decode', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
