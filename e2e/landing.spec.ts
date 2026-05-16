import { test, expect } from '@playwright/test';

test('shows all four tool cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('URL Encoder')).toBeVisible();
  await expect(page.getByText('URL Builder')).toBeVisible();
  await expect(page.getByText('JSON Viewer')).toBeVisible();
  await expect(page.getByText('JWT Viewer')).toBeVisible();
});

test('navigates to URL Encoder', async ({ page }) => {
  await page.goto('/');
  // force: true bypasses Playwright's stability check — the cards have a CSS breathing animation
  await page.getByText('URL Encoder').click({ force: true });
  await expect(page).toHaveURL('/url-encoder');
});

test('navigates to URL Builder', async ({ page }) => {
  await page.goto('/');
  await page.getByText('URL Builder').click({ force: true });
  await expect(page).toHaveURL('/url-builder');
});

test('navigates to JSON Viewer', async ({ page }) => {
  await page.goto('/');
  await page.getByText('JSON Viewer').click({ force: true });
  await expect(page).toHaveURL('/json');
});

test('navigates to JWT Viewer', async ({ page }) => {
  await page.goto('/');
  await page.getByText('JWT Viewer').click({ force: true });
  await expect(page).toHaveURL('/jwt');
});
