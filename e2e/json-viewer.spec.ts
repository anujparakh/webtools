import { test, expect, type Page } from '@playwright/test';

async function typeIntoEditor(page: Page, text: string) {
  const editor = page.locator('.cm-content');
  await editor.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.type(text);
}

test('accepts valid JSON without showing an error', async ({ page }) => {
  await page.goto('/json');
  await typeIntoEditor(page, '{"a":1,"b":2}');
  await expect(page.getByRole('alert')).not.toBeVisible();
  await expect(page.locator('.cm-content')).toContainText('"a"');
});

test('shows an error alert for invalid JSON when an action is triggered', async ({ page }) => {
  await page.goto('/json');
  await typeIntoEditor(page, '{invalid}');
  await page.getByRole('button', { name: 'Sort' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});

test('sort keys reorders object keys alphabetically', async ({ page }) => {
  await page.goto('/json');
  await typeIntoEditor(page, '{"b":1,"a":2}');
  await page.getByRole('button', { name: 'Sort' }).click();
  const content = await page.locator('.cm-content').innerText();
  const parsed = JSON.parse(content);
  expect(Object.keys(parsed)[0]).toBe('a');
  expect(Object.keys(parsed)[1]).toBe('b');
});

test('minify collapses JSON to a single line', async ({ page }) => {
  await page.goto('/json');
  await typeIntoEditor(page, '{"a": 1, "b": 2}');
  await page.getByRole('button', { name: 'Minify' }).click();
  const content = await page.locator('.cm-content').innerText();
  expect(content.trim()).not.toContain('\n');
});

test('compare mode button switches to the diff view', async ({ page }) => {
  await page.goto('/json');
  await page.getByRole('button', { name: 'Compare' }).click();
  await expect(page.getByRole('button', { name: 'Exit Compare' })).toBeVisible();
});

test('path finder resolves a nested key', async ({ page }) => {
  await page.goto('/json');
  await typeIntoEditor(page, '{"a":{"b":42}}');
  await page.getByPlaceholder('e.g. items[0].name').fill('a.b');
  await expect(page.locator('pre').filter({ hasText: '42' })).toBeVisible();
});
