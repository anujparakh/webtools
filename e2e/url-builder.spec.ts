import { test, expect } from '@playwright/test';

test('builds a URL from a base and one param', async ({ page }) => {
  await page.goto('/url-builder');
  await page.getByPlaceholder(/paste a full URL/i).fill('https://example.com');
  await page.getByPlaceholder('key').fill('foo');
  await page.getByPlaceholder('value').fill('bar');
  await expect(page.getByText('https://example.com?foo=bar')).toBeVisible();
});

test('adding a second param appends it to the URL', async ({ page }) => {
  await page.goto('/url-builder');
  await page.getByPlaceholder(/paste a full URL/i).fill('https://example.com');
  await page.getByPlaceholder('key').fill('foo');
  await page.getByPlaceholder('value').fill('bar');
  await page.getByRole('button', { name: '+ Add param' }).click();
  await page.getByPlaceholder('key').nth(1).fill('baz');
  await page.getByPlaceholder('value').nth(1).fill('qux');
  await expect(page.getByText('https://example.com?foo=bar&baz=qux')).toBeVisible();
});

test('removing a param drops it from the URL', async ({ page }) => {
  await page.goto('/url-builder');
  await page.getByPlaceholder(/paste a full URL/i).fill('https://example.com');
  await page.getByPlaceholder('key').fill('foo');
  await page.getByPlaceholder('value').fill('bar');
  await page.getByRole('button', { name: '+ Add param' }).click();
  await page.getByPlaceholder('key').nth(1).fill('baz');
  await page.getByPlaceholder('value').nth(1).fill('qux');
  await page.getByRole('button', { name: '✕' }).first().click();
  await expect(page.getByText('https://example.com?baz=qux')).toBeVisible();
});
