# WebTools

A collection of browser-based developer utilities. No installs, no sign-ups — everything runs in your browser.

**Try it here: https://webtools.anujparakh.dev/**

## Tools

| Tool | Description |
|---|---|
| **URL Encoder/Decoder** | Encode or decode URL-encoded strings and query parameters. |
| **URL Builder** | Construct URLs by adding, editing, and toggling query parameters individually. Supports JSON values for complex params. |
| **JSON Viewer** | Pretty-print, validate, sort keys, and fold/unfold JSON with syntax highlighting. |
| **JWT Viewer** | Decode and inspect JWT tokens — view the header, payload, and signature at a glance. |

## Running locally

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # type-check + production build
npm test         # run unit tests
npm run test:e2e # Playwright integration tests — builds first (~1 min)
```

Useful Playwright CLI flags (append after `npm run test:e2e --`):

| Flag | Effect |
|---|---|
| `--headed` | Show the browser window |
| `--ui` | Open interactive UI mode — pick and watch tests run |
| `--debug` | Open Playwright Inspector to step through tests |
| `--grep "pattern"` | Run only tests whose name matches the pattern |
| `e2e/foo.spec.ts` | Run a single test file |
| `--workers 1` | Run tests serially (useful when debugging flaky tests) |
