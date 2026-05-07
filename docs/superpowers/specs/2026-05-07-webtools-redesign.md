# WebTools Redesign — 2026-05-07

## Overview

Redesign the WebTools app to add client-side routing, promote URL Builder to a top-level tool, add a landing page, move navigation to a left sidebar, improve URL encoding/decoding capabilities, and refresh the visual style.

---

## Routes

| Path           | Component    | Notes                                   |
| -------------- | ------------ | --------------------------------------- |
| `/`            | `Landing`    | New — tagline + 4 tool buttons          |
| `/url-encoder` | `UrlEncoder` | Existing, minus URL Builder sub-tab     |
| `/url-builder` | `UrlBuilder` | Promoted from sub-tab inside UrlEncoder |
| `/json`        | `JsonViewer` | Unchanged                               |
| `/jwt`         | `JwtViewer`  | Unchanged                               |

No redirect from `/` — it is its own page.

---

## Routing Implementation

Zero-dependency custom router (~25 lines):

- A `useRoute` hook wraps `useState` + `useEffect` listening to `popstate`
- A `navigate(path)` helper calls `history.pushState` then dispatches a `popstate` event
- `App` reads current path and renders the matching component
- `vite.config.ts` adds `server: { historyApiFallback: true }` for dev
- Production hosting must redirect all paths to `index.html` (standard SPA config)

---

## Layout

### Desktop (md and above)

```
┌──────────────┬──────────────────────────────┐
│  Sidebar     │  Main content                │
│  ~200px      │  flex-1, scrollable          │
│              │                              │
│  [Logo/Name] │                              │
│              │                              │
│  URL Encoder │                              │
│  URL Builder │                              │
│  JSON Viewer │                              │
│  JWT Viewer  │                              │
└──────────────┴──────────────────────────────┘
```

- Sidebar: `base-200` background, fixed height, active item highlighted with indigo accent
- Active nav item: filled indigo pill background, white text
- Inactive: muted text, hover lightens

### Mobile (below md)

- Sidebar collapses to a horizontal top bar
- Tool name links become a scrollable horizontal row of tabs

---

## Landing Page (`/`)

- App title: "Web Tools"
- One-line description: "A collection of browser-based utilities for developers."
- Four buttons, one per tool, arranged in a 2×2 grid (1 column on mobile):
  - URL Encoder
  - URL Builder
  - JSON Viewer
  - JWT Viewer
- Each button shows tool name + a short subtitle (e.g., "Encode, decode, and inspect URLs")
- Clicking navigates to the tool's path
- Some pulsing animation on each of the 4 buttons and headline would be good. Very slow, should look simple and good

---

## URL Encoder (`/url-encoder`)

Removes the "URL Builder" sub-tab. Remaining sub-mode: Encoder / Decoder.

**New button added: "Decode URL Params"**

- Input: a full URL string (e.g., `https://example.com?q=hello%20world&foo=bar%21`)
- Operation: parse the URL, decode each param value (`decodeURIComponent`), rebuild the URL with decoded values displayed
- Placed alongside existing "Encode Full", "Encode URL Params", "Decode" buttons
- Errors handled the same way as existing buttons (show alert, clear output)

---

## URL Builder (`/url-builder`)

Promoted to top-level. All existing functionality retained.

**New: Auto-populate from paste**

- When the user types or pastes into the Base URL field and the value contains `?`:
  - Split on first `?`: left side → base URL field
  - Right side: parse as `URLSearchParams`, populate the params table (one row per key/value pair)
  - Existing param rows are replaced when a full URL with params is detected
- Trigger: `onInput` handler, fires whenever Base URL field changes

**New: Per-param encode/decode buttons**

- Each param row gains two small buttons next to the existing remove (✕) button:
  - **Enc** — runs `encodeURIComponent` on the current value, updates the field in-place
  - **Dec** — runs `decodeURIComponent` on the current value, updates the field in-place (shows error state on failure)
- Buttons are icon-sized (`btn-xs`), placed in the existing actions column

---

## Styling

**Color palette change:**

- Replace DaisyUI default primary (teal) with indigo (`#6366f1`)
- Done by extending `tailwind.config.js` with a custom DaisyUI theme override for `primary` and `primary-content`

**Component polish:**

- Tool content areas use `rounded-xl border border-base-300` card containers instead of bare textareas
- Section headers (used in JWT viewer and URL Builder) get consistent `text-xs uppercase tracking-widest text-base-content/50` treatment
- Buttons: primary actions use `btn-primary` (indigo), secondary/utility actions use `btn-ghost` or `btn-outline`
- Textarea and input borders: slightly more visible on focus (`focus:border-primary`)

**No theme switcher** — stays dark only.

---

## File Structure Changes

```
src/
  router.ts               # new — useRoute hook + navigate helper
  components/
    Sidebar.tsx           # new — replaces TabBar
    TabBar.tsx            # deleted
    HistoryPanel.tsx      # unchanged
  tools/
    Landing.tsx           # new
    UrlEncoder.tsx        # modified — remove UrlBuilder section, add Decode URL Params
    UrlBuilder.tsx        # new — extracted from UrlEncoder.tsx
    JsonViewer.tsx        # unchanged
    JwtViewer.tsx         # unchanged
  App.tsx                 # modified — use router, render Sidebar + routed content
  index.css               # unchanged
```

---

## Out of Scope

- Light/dark theme toggle
- History panel changes
- Any changes to JSON Viewer or JWT Viewer logic
- Server-side deployment configuration (noted as a prerequisite for production, not implemented here)
