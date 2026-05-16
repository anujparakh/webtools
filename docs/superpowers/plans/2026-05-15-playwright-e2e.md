# Playwright E2E Test Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Playwright integration tests for all five pages, running against the production build in GitHub Actions on every push and pull request.

**Architecture:** Playwright is configured to build and serve the app with `npm run build && npm run preview` before running tests. All tests live in `e2e/` and use Chromium. GitHub Actions runs tests on push/PR and uploads `test-results/` as an artifact on failure.

**Tech Stack:** `@playwright/test`, Chromium, GitHub Actions, `vite preview` (port 4173)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `playwright.config.ts` | Create | Playwright config: webServer, baseURL, screenshot on failure |
| `e2e/landing.spec.ts` | Create | Tests for the landing page |
| `e2e/url-encoder.spec.ts` | Create | Tests for the URL Encoder tool |
| `e2e/url-builder.spec.ts` | Create | Tests for the URL Builder tool |
| `e2e/json-viewer.spec.ts` | Create | Tests for the JSON Viewer tool |
| `e2e/jwt-viewer.spec.ts` | Create | Tests for the JWT Viewer tool |
| `.github/workflows/test.yml` | Create | CI workflow to run tests on push/PR |
| `package.json` | Modify | Add `test:e2e` script |
| `README.md` | Modify | Add `test:e2e` to running locally section |

---

### Task 1: Install Playwright and configure

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`

- [ ] **Step 1: Install Playwright**

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

Expected: exits 0, `@playwright/test` appears in `devDependencies` in `package.json`.

- [ ] **Step 2: Add `test:e2e` script to `package.json`**

In `package.json`, add to the `"scripts"` block:
```json
"test:e2e": "playwright test"
```

- [ ] **Step 3: Create `playwright.config.ts` at the project root**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 4: Create the `e2e/` directory**

```bash
mkdir e2e
```

- [ ] **Step 5: Verify Playwright can resolve the config**

```bash
npm run test:e2e -- --list
```

Expected: prints `No tests found` or an empty list. No config errors.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts package.json e2e/
git commit -m "chore: install and configure Playwright"
```

---

### Task 2: Landing page tests

**Files:**
- Create: `e2e/landing.spec.ts`

- [ ] **Step 1: Write the tests**

```ts
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
  await page.getByText('URL Encoder').click();
  await expect(page).toHaveURL('/url-encoder');
});

test('navigates to URL Builder', async ({ page }) => {
  await page.goto('/');
  await page.getByText('URL Builder').click();
  await expect(page).toHaveURL('/url-builder');
});

test('navigates to JSON Viewer', async ({ page }) => {
  await page.goto('/');
  await page.getByText('JSON Viewer').click();
  await expect(page).toHaveURL('/json');
});

test('navigates to JWT Viewer', async ({ page }) => {
  await page.goto('/');
  await page.getByText('JWT Viewer').click();
  await expect(page).toHaveURL('/jwt');
});
```

- [ ] **Step 2: Run the tests**

```bash
npm run test:e2e -- e2e/landing.spec.ts
```

Expected: 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/landing.spec.ts
git commit -m "test(e2e): add landing page tests"
```

---

### Task 3: URL Encoder tests

**Files:**
- Create: `e2e/url-encoder.spec.ts`

The URL Encoder has a textarea (placeholder "Paste text or URL here…"), Encode/Decode buttons, and an output block.

- [ ] **Step 1: Write the tests**

```ts
import { test, expect } from '@playwright/test';

test('encodes a string with special characters', async ({ page }) => {
  await page.goto('/url-encoder');
  await page.getByPlaceholder('Paste text or URL here…').fill('hello world');
  await page.getByRole('button', { name: 'Encode', exact: true }).click();
  await expect(page.getByText('hello%20world')).toBeVisible();
});

test('decodes a URL-encoded string', async ({ page }) => {
  await page.goto('/url-encoder');
  await page.getByPlaceholder('Paste text or URL here…').fill('hello%20world');
  await page.getByRole('button', { name: 'Decode', exact: true }).click();
  await expect(page.getByText('hello world')).toBeVisible();
});

test('encodes URL params preserving structure', async ({ page }) => {
  await page.goto('/url-encoder');
  await page.getByPlaceholder('Paste text or URL here…').fill('a=hello world&b=test');
  await page.getByRole('button', { name: 'Encode URL Params' }).click();
  await expect(page.getByText('a=hello%20world&b=test')).toBeVisible();
});

test('shows an error alert on invalid percent-encoded input', async ({ page }) => {
  await page.goto('/url-encoder');
  await page.getByPlaceholder('Paste text or URL here…').fill('%zz');
  await page.getByRole('button', { name: 'Decode', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
```

- [ ] **Step 2: Run the tests**

```bash
npm run test:e2e -- e2e/url-encoder.spec.ts
```

Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/url-encoder.spec.ts
git commit -m "test(e2e): add URL encoder tests"
```

---

### Task 4: URL Builder tests

**Files:**
- Create: `e2e/url-builder.spec.ts`

The URL Builder has a base URL input, a "key" input and "value" textarea per param, an "+ Add param" button, and a ✕ button to remove a param (disabled when only one row exists).

- [ ] **Step 1: Write the tests**

```ts
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
```

- [ ] **Step 2: Run the tests**

```bash
npm run test:e2e -- e2e/url-builder.spec.ts
```

Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/url-builder.spec.ts
git commit -m "test(e2e): add URL builder tests"
```

---

### Task 5: JSON Viewer tests

**Files:**
- Create: `e2e/json-viewer.spec.ts`

The JSON Viewer uses a CodeMirror editor — a `contenteditable` div with class `cm-content`. Type into it by clicking to focus, then using `page.keyboard.type()`. The editor state starts empty on each page load.

- [ ] **Step 1: Write the tests**

```ts
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
```

- [ ] **Step 2: Run the tests**

```bash
npm run test:e2e -- e2e/json-viewer.spec.ts
```

Expected: 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/json-viewer.spec.ts
git commit -m "test(e2e): add JSON viewer tests"
```

---

### Task 6: JWT Viewer tests

**Files:**
- Create: `e2e/jwt-viewer.spec.ts`

The JWT Viewer has a textarea (placeholder "Paste a JWT token here…") and renders Header, Payload, and Signature sections below when a valid JWT is pasted. Timestamp claims (`exp`, `nbf`, `iat`) get a human-readable date annotation rendered beneath them.

`VALID_JWT` below is the standard jwt.io demo token: header `{"alg":"HS256","typ":"JWT"}`, payload `{"sub":"1234567890","name":"John Doe","iat":1516239022}`. The `iat` value (Jan 18, 2018) triggers a ClaimAnnotation showing "2018".

`INVALID_TOKEN` has 5 dot-separated parts instead of 3, triggering the "expected 3 dot-separated parts" error.

- [ ] **Step 1: Write the tests**

```ts
import { test, expect } from '@playwright/test';

const VALID_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ' +
  '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

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
  // iat: 1516239022 = January 18, 2018 — ClaimAnnotation renders date.toLocaleString()
  await expect(page.getByText('2018')).toBeVisible();
});
```

- [ ] **Step 2: Run the tests**

```bash
npm run test:e2e -- e2e/jwt-viewer.spec.ts
```

Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/jwt-viewer.spec.ts
git commit -m "test(e2e): add JWT viewer tests"
```

---

### Task 7: GitHub Actions workflow

**Files:**
- Create: `.github/workflows/test.yml`

- [ ] **Step 1: Create the workflow file**

```yaml
name: E2E Tests

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results
          path: test-results/
          retention-days: 7
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci: add GitHub Actions workflow for Playwright e2e tests"
```

---

### Task 8: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add `test:e2e` to the running locally section**

Find the existing code block in `README.md`:

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # type-check + production build
npm test         # run unit tests
```

Replace it with:

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # type-check + production build
npm test         # run unit tests
npm run test:e2e # Playwright integration tests — builds first (~1 min)
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add test:e2e command to README"
```
