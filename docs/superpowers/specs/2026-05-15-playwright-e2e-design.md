# Playwright E2E Test Setup — Design Spec

**Date:** 2026-05-15

## Overview

Add Playwright integration tests that run against the production build (`vite build && vite preview`) on every push and pull request via GitHub Actions. Screenshots and traces are uploaded as artifacts on failure.

## Setup

- **Playwright** installed as a dev dependency (`@playwright/test`)
- **Browser:** Chromium only
- **Config file:** `playwright.config.ts` at project root
  - `webServer`: runs `npm run build && npm run preview`, waits for `http://localhost:4173`
  - `baseURL`: `http://localhost:4173`
  - `screenshot`: `only-on-failure`
  - `trace`: `on-first-retry`
- **New npm script:** `"test:e2e": "playwright test"`
- **Test directory:** `e2e/` at project root

## Test Files and Cases

### `e2e/landing.spec.ts`
- All 4 tool cards/links are visible
- Each link navigates to the correct route (`/url-encoder`, `/url-builder`, `/json`, `/jwt`)

### `e2e/url-encoder.spec.ts`
- Encoding a string with special characters (`hello world` → `hello%20world`)
- Decoding a URL-encoded string (`hello%20world` → `hello world`)
- Encoding URL params handles a full query string
- Shows error on invalid decode input

### `e2e/url-builder.spec.ts`
- Adding a param updates the output URL
- Toggling a param off removes it from the output URL
- Editing a param value updates the output URL

### `e2e/json-viewer.spec.ts`
- Valid JSON is formatted and displayed correctly
- Invalid JSON shows an error alert
- Sort keys reorders object keys alphabetically
- Minify collapses JSON to a single line
- Compare mode button switches view to the diff editor
- Path finder resolves a nested key (e.g. `a.b`)

### `e2e/jwt-viewer.spec.ts`
- Valid JWT shows decoded header and payload sections
- Invalid token shows an error message
- `exp` claim shows a human-readable date annotation

## GitHub Actions

**File:** `.github/workflows/test.yml`

**Triggers:** push to any branch, pull_request

**Steps:**
1. `actions/checkout@v4`
2. `actions/setup-node@v4` with Node 20, npm cache
3. `npm ci`
4. `npx playwright install chromium`
5. `npm run test:e2e`
6. On failure: upload `test-results/` as artifact named `playwright-results` (retention: 7 days)

## README

Add `npm run test:e2e` to the "Running locally" section with a brief description of what it covers.

## Out of Scope

- Cross-browser testing (Safari, Firefox) — not needed for internal tooling
- Visual regression / screenshot diffing — deferred; failure screenshots are sufficient for now
- Posting screenshots inline to PR descriptions — deferred; artifact links are sufficient
