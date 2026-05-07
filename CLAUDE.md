# WebTools

A collection of browser-based developer utilities built with Preact, TypeScript, Vite, Tailwind CSS, and DaisyUI (dark theme, indigo primary).

## Stack

- **Preact** — UI framework (use `class` not `className`, `preact/hooks` not `react`)
- **Tailwind CSS v3 + DaisyUI v4** — styling, dark theme only
- **Vite 5** — dev server and build
- **Vitest** — unit tests for pure functions

## Tools (routes)

| Path | Component | File |
|---|---|---|
| `/` | Landing page | `src/tools/Landing.tsx` |
| `/url-encoder` | URL Encoder/Decoder | `src/tools/UrlEncoder.tsx` |
| `/url-builder` | URL Builder | `src/tools/UrlBuilder.tsx` |
| `/json` | JSON Viewer | `src/tools/JsonViewer.tsx` |
| `/jwt` | JWT Viewer | `src/tools/JwtViewer.tsx` |

## Key files

- `src/router.ts` — custom SPA router (`useRoute`, `navigate`)
- `src/url-utils.ts` — shared URL utility functions (tested)
- `src/components/Sidebar.tsx` — left rail (desktop) / top bar (mobile) nav
- `src/components/HistoryPanel.tsx` — shared history UI used by each tool
- `src/hooks/useToolHistory.ts` — localStorage-backed history hook

## Dev commands

```bash
npm run dev      # start dev server at localhost:5173
npm run build    # type-check + production build
npm test         # run vitest unit tests
```

## Rules

- Do NOT make extra git commits for anything, let the user do this.
- Write tests for new pure utility functions in `src/url-utils.ts` or similar; skip tests for UI/component code.
- All routes are client-side only. The dev server handles SPA fallback automatically.
