# WebTools Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add client-side routing, a left sidebar, a landing page, promote URL Builder to a top-level tool, add Decode URL Params, add per-param encode/decode in URL Builder, and refresh styling to indigo.

**Architecture:** Zero-dependency custom router using `popstate` + `history.pushState`. `Sidebar.tsx` replaces `TabBar.tsx`. URL utility functions are extracted to `src/url-utils.ts` for testability. `UrlBuilder` moves to its own file and route.

**Tech Stack:** Preact, TypeScript, Vite 5, Tailwind CSS v3, DaisyUI v4, Vitest

---

## File Map

| File | Action |
|---|---|
| `vitest.config.ts` | Create |
| `package.json` | Modify — add test script |
| `src/router.ts` | Create |
| `src/router.test.ts` | Create |
| `src/url-utils.ts` | Create |
| `src/url-utils.test.ts` | Create |
| `tailwind.config.js` | Modify — indigo primary |
| `src/index.css` | Modify — breathe animation |
| `src/components/Sidebar.tsx` | Create |
| `src/components/TabBar.tsx` | Delete |
| `src/App.tsx` | Modify — routing + layout |
| `src/tools/Landing.tsx` | Create |
| `src/tools/UrlBuilder.tsx` | Create |
| `src/tools/UrlEncoder.tsx` | Modify — remove builder tab, add Decode URL Params |
| `src/tools/JsonViewer.tsx` | Unchanged |
| `src/tools/JwtViewer.tsx` | Unchanged |

---

### Task 1: Configure Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install vitest and jsdom**

```bash
npm install --save-dev vitest jsdom
```

- [ ] **Step 2: Create vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 3: Add test script to package.json**

The `"scripts"` section in `package.json` should become:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "test": "vitest run"
}
```

- [ ] **Step 4: Verify vitest runs without error**

```bash
npm test
```

Expected: exits cleanly — "No test files found" or "0 tests passed". No config errors.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest with jsdom"
```

---

### Task 2: Router

**Files:**
- Create: `src/router.ts`
- Create: `src/router.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/router.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { navigate } from './router'

describe('navigate', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/')
  })

  it('updates pathname', () => {
    navigate('/url-encoder')
    expect(window.location.pathname).toBe('/url-encoder')
  })

  it('dispatches a popstate event', () => {
    const handler = vi.fn()
    window.addEventListener('popstate', handler)
    navigate('/json')
    expect(handler).toHaveBeenCalledOnce()
    window.removeEventListener('popstate', handler)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test
```

Expected: FAIL — "Cannot find module './router'".

- [ ] **Step 3: Implement router.ts**

Create `src/router.ts`:

```typescript
import { useState, useEffect } from 'preact/hooks'

export function useRoute(): string {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const handler = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])
  return path
}

export function navigate(path: string): void {
  history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm test
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/router.ts src/router.test.ts
git commit -m "feat: add custom spa router"
```

---

### Task 3: URL utilities

**Files:**
- Create: `src/url-utils.ts`
- Create: `src/url-utils.test.ts`

This extracts `encodeUrlParams` and `buildUrl` from `UrlEncoder.tsx` (they will be deleted from there in Task 8), adds `decodeUrlParams` and `parseUrlForBuilder`, and defines the shared `Param` interface.

- [ ] **Step 1: Write failing tests**

Create `src/url-utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { encodeUrlParams, decodeUrlParams, buildUrl, parseUrlForBuilder } from './url-utils'

describe('encodeUrlParams', () => {
  it('normalizes percent-encoding in param values', () => {
    const result = encodeUrlParams('https://example.com?q=hello%20world')
    // URLSearchParams encodes spaces as +
    expect(result).toContain('q=hello+world')
  })

  it('throws for non-URL input', () => {
    expect(() => encodeUrlParams('not a url')).toThrow()
  })
})

describe('decodeUrlParams', () => {
  it('decodes percent-encoded param keys and values', () => {
    const result = decodeUrlParams('https://example.com?q=hello%20world&foo=bar%21')
    expect(result).toBe('https://example.com/?q=hello world&foo=bar!')
  })

  it('returns input URL with normalized path when no query string', () => {
    const result = decodeUrlParams('https://example.com/path')
    expect(result).toBe('https://example.com/path')
  })

  it('throws for non-URL input', () => {
    expect(() => decodeUrlParams('not a url')).toThrow()
  })
})

describe('buildUrl', () => {
  it('appends encoded params to a base URL', () => {
    const result = buildUrl('https://example.com', [
      { id: '1', key: 'foo', value: 'bar', isJson: false, error: null },
    ])
    expect(result).toEqual({ url: 'https://example.com?foo=bar', error: null })
  })

  it('returns base URL when no params have keys', () => {
    const result = buildUrl('https://example.com', [
      { id: '1', key: '', value: '', isJson: false, error: null },
    ])
    expect(result).toEqual({ url: 'https://example.com', error: null })
  })

  it('returns error for invalid JSON param value', () => {
    const result = buildUrl('https://example.com', [
      { id: '1', key: 'data', value: '{bad json', isJson: true, error: null },
    ])
    expect(result.error).not.toBeNull()
    expect(result.url).toBeNull()
  })
})

describe('parseUrlForBuilder', () => {
  it('splits a URL with query string into base and params', () => {
    const result = parseUrlForBuilder('https://example.com?foo=bar&baz=qux')
    expect(result).toEqual({
      baseUrl: 'https://example.com',
      params: [
        { key: 'foo', value: 'bar' },
        { key: 'baz', value: 'qux' },
      ],
    })
  })

  it('returns null when no ? present', () => {
    expect(parseUrlForBuilder('https://example.com/path')).toBeNull()
  })

  it('handles partial URLs without a valid scheme', () => {
    const result = parseUrlForBuilder('/api/endpoint?token=abc')
    expect(result).toEqual({
      baseUrl: '/api/endpoint',
      params: [{ key: 'token', value: 'abc' }],
    })
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test
```

Expected: FAIL — "Cannot find module './url-utils'".

- [ ] **Step 3: Implement url-utils.ts**

Create `src/url-utils.ts`:

```typescript
export interface Param {
  id: string
  key: string
  value: string
  isJson: boolean
  error: string | null
}

export function encodeUrlParams(input: string): string {
  const url = new URL(input)
  const rebuilt = new URL(url.origin + url.pathname)
  url.searchParams.forEach((value, key) => {
    rebuilt.searchParams.set(key, value)
  })
  if (url.hash) rebuilt.hash = url.hash
  return rebuilt.toString()
}

export function decodeUrlParams(input: string): string {
  const url = new URL(input)
  if (!url.search) return url.origin + url.pathname + url.hash
  const pairs = url.search.slice(1).split('&').map(pair => {
    const eqIdx = pair.indexOf('=')
    if (eqIdx === -1) return decodeURIComponent(pair)
    return `${decodeURIComponent(pair.slice(0, eqIdx))}=${decodeURIComponent(pair.slice(eqIdx + 1))}`
  })
  return url.origin + url.pathname + '?' + pairs.join('&') + url.hash
}

export function buildUrl(
  baseUrl: string,
  params: Param[]
): { url: string | null; error: string | null } {
  const active = params.filter(p => p.key.trim())
  if (!active.length) return { url: baseUrl || null, error: null }
  try {
    const parts = active.map(p => {
      const encodedValue = p.isJson
        ? encodeURIComponent(JSON.stringify(JSON.parse(p.value)))
        : encodeURIComponent(p.value)
      return `${encodeURIComponent(p.key)}=${encodedValue}`
    })
    const sep = baseUrl.includes('?') ? '&' : '?'
    return { url: baseUrl + sep + parts.join('&'), error: null }
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : 'Build failed' }
  }
}

export function parseUrlForBuilder(
  raw: string
): { baseUrl: string; params: Array<{ key: string; value: string }> } | null {
  if (!raw.includes('?')) return null
  const qIdx = raw.indexOf('?')
  const baseUrl = raw.slice(0, qIdx)
  const search = raw.slice(qIdx + 1)
  try {
    const parsed = new URLSearchParams(search)
    const params = [...parsed.entries()].map(([key, value]) => ({ key, value }))
    return { baseUrl, params }
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm test
```

Expected: All url-utils tests pass (router tests still pass too).

- [ ] **Step 5: Commit**

```bash
git add src/url-utils.ts src/url-utils.test.ts
git commit -m "feat: extract url utilities with tests"
```

---

### Task 4: Colors and animation

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: Update tailwind.config.js to use indigo as primary**

Replace the entire file contents of `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        dark: {
          ...require('daisyui/src/theming/themes')['dark'],
          'primary': '#6366f1',
          'primary-content': '#ffffff',
        },
      },
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
}
```

- [ ] **Step 2: Add breathe animation to index.css**

Replace the entire file contents of `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .animate-breathe {
    animation: breathe 3s ease-in-out infinite;
  }
}

@keyframes breathe {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.015);
  }
}
```

- [ ] **Step 3: Start dev server and verify indigo buttons appear**

```bash
npm run dev
```

Open `http://localhost:5173`. Primary buttons should now be indigo/violet instead of teal. No build errors.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js src/index.css
git commit -m "style: switch primary color to indigo, add breathe animation"
```

---

### Task 5: Sidebar component

**Files:**
- Create: `src/components/Sidebar.tsx`
- Delete: `src/components/TabBar.tsx`

- [ ] **Step 1: Create Sidebar.tsx**

Create `src/components/Sidebar.tsx`:

```tsx
import { navigate } from '../router'

const TOOLS = [
  { path: '/url-encoder', label: 'URL Encoder' },
  { path: '/url-builder', label: 'URL Builder' },
  { path: '/json', label: 'JSON Viewer' },
  { path: '/jwt', label: 'JWT Viewer' },
]

interface SidebarProps {
  currentPath: string
}

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <>
      {/* Desktop left rail */}
      <aside class="hidden md:flex flex-col w-52 min-h-screen bg-base-200 border-r border-base-300 p-4 shrink-0">
        <button
          class="text-lg font-bold mb-6 text-left hover:text-primary transition-colors"
          onClick={() => navigate('/')}
        >
          Web Tools
        </button>
        <nav class="flex flex-col gap-1">
          {TOOLS.map(t => (
            <button
              key={t.path}
              class={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                currentPath === t.path
                  ? 'bg-primary text-primary-content font-medium'
                  : 'text-base-content/60 hover:text-base-content hover:bg-base-300'
              }`}
              onClick={() => navigate(t.path)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div class="md:hidden bg-base-200 border-b border-base-300 px-3 py-2">
        <div class="flex items-center gap-2 overflow-x-auto">
          <button
            class="font-bold text-sm shrink-0 mr-1 hover:text-primary transition-colors"
            onClick={() => navigate('/')}
          >
            Web Tools
          </button>
          {TOOLS.map(t => (
            <button
              key={t.path}
              class={`shrink-0 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                currentPath === t.path
                  ? 'bg-primary text-primary-content font-medium'
                  : 'text-base-content/60 hover:text-base-content hover:bg-base-300'
              }`}
              onClick={() => navigate(t.path)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Delete TabBar.tsx**

```bash
rm src/components/TabBar.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.tsx src/components/TabBar.tsx
git commit -m "feat: add Sidebar component, remove TabBar"
```

---

### Task 6: Landing page

**Files:**
- Create: `src/tools/Landing.tsx`

- [ ] **Step 1: Create Landing.tsx**

```tsx
import { navigate } from '../router'

const TOOLS = [
  {
    path: '/url-encoder',
    label: 'URL Encoder',
    subtitle: 'Encode, decode, and inspect URLs',
  },
  {
    path: '/url-builder',
    label: 'URL Builder',
    subtitle: 'Compose URLs with query parameters',
  },
  {
    path: '/json',
    label: 'JSON Viewer',
    subtitle: 'Parse, format, and explore JSON',
  },
  {
    path: '/jwt',
    label: 'JWT Viewer',
    subtitle: 'Decode and inspect JWT tokens',
  },
]

export function Landing() {
  return (
    <div class="min-h-screen flex flex-col items-center justify-center py-16 px-4">
      <div class="text-center mb-12 animate-breathe">
        <h1 class="text-4xl font-bold mb-3">Web Tools</h1>
        <p class="text-base-content/60">A collection of browser-based utilities for developers.</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        {TOOLS.map((tool, i) => (
          <button
            key={tool.path}
            class="animate-breathe bg-base-200 border border-base-300 hover:border-primary hover:bg-base-300 transition-all p-6 text-left rounded-xl"
            style={{ animationDelay: `${i * 0.4}s` }}
            onClick={() => navigate(tool.path)}
          >
            <div class="font-semibold mb-1">{tool.label}</div>
            <div class="text-sm text-base-content/50">{tool.subtitle}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Start dev server and verify landing page**

```bash
npm run dev
```

Open `http://localhost:5173`. You should see the "Web Tools" headline and 4 tool buttons, all slowly breathing/pulsing. Clicking a button should navigate to that tool.

- [ ] **Step 3: Commit**

```bash
git add src/tools/Landing.tsx
git commit -m "feat: add landing page with animated tool buttons"
```

---

### Task 7: URL Builder (new top-level tool)

**Files:**
- Create: `src/tools/UrlBuilder.tsx`

This is a standalone extraction of the `UrlBuilder` component that was embedded in `UrlEncoder.tsx`, with auto-populate from paste and per-param encode/decode added.

- [ ] **Step 1: Create UrlBuilder.tsx**

```tsx
import { useState } from 'preact/hooks'
import { useToolHistory } from '../hooks/useToolHistory'
import { HistoryPanel } from '../components/HistoryPanel'
import { buildUrl, parseUrlForBuilder, type Param } from '../url-utils'

export function UrlBuilder() {
  const [baseUrl, setBaseUrl] = useState('')
  const [params, setParams] = useState<Param[]>([
    { id: crypto.randomUUID(), key: '', value: '', isJson: false, error: null },
  ])
  const [copied, setCopied] = useState(false)
  const { history, push, clear } = useToolHistory('webtools:url-builder:history')

  const updateParam = (id: string, patch: Partial<Param>) =>
    setParams(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)))

  const addParam = () =>
    setParams(prev => [
      ...prev,
      { id: crypto.randomUUID(), key: '', value: '', isJson: false, error: null },
    ])

  const removeParam = (id: string) =>
    setParams(prev => prev.filter(p => p.id !== id))

  const handleBaseUrlInput = (value: string) => {
    const parsed = parseUrlForBuilder(value)
    if (parsed && parsed.params.length > 0) {
      setBaseUrl(parsed.baseUrl)
      setParams(
        parsed.params.map(({ key, value: v }) => ({
          id: crypto.randomUUID(),
          key,
          value: v,
          isJson: false,
          error: null,
        }))
      )
    } else {
      setBaseUrl(value)
    }
  }

  const encodeParamValue = (id: string, value: string) => {
    updateParam(id, { value: encodeURIComponent(value), error: null })
  }

  const decodeParamValue = (id: string, value: string) => {
    try {
      updateParam(id, { value: decodeURIComponent(value), error: null })
    } catch {
      updateParam(id, { error: 'Invalid percent-encoding' })
    }
  }

  const { url: builtUrl, error } = buildUrl(baseUrl, params)

  const copy = async () => {
    if (!builtUrl) return
    await navigator.clipboard.writeText(builtUrl)
    push({ value: builtUrl, timestamp: Date.now() })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadFromHistory = (value: string) => {
    const parsed = parseUrlForBuilder(value)
    if (parsed && parsed.params.length > 0) {
      setBaseUrl(parsed.baseUrl)
      setParams(
        parsed.params.map(({ key, value: v }) => ({
          id: crypto.randomUUID(),
          key,
          value: v,
          isJson: false,
          error: null,
        }))
      )
    } else {
      setBaseUrl(value)
      setParams([{ id: crypto.randomUUID(), key: '', value: '', isJson: false, error: null }])
    }
  }

  return (
    <div class="space-y-4">
      <div>
        <label class="label label-text text-sm font-medium">Base URL</label>
        <input
          type="text"
          class="input input-bordered w-full font-mono focus:border-primary"
          placeholder="https://example.com/api  — paste a full URL to auto-fill params"
          value={baseUrl}
          onInput={e => handleBaseUrlInput((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="space-y-2">
        <label class="label label-text text-sm font-medium">Query Params</label>
        {params.map(p => (
          <div key={p.id} class="space-y-1">
            <div class="flex gap-2 items-start">
              <input
                type="text"
                class="input input-bordered input-sm font-mono w-36 shrink-0 focus:border-primary"
                placeholder="key"
                value={p.key}
                onInput={e =>
                  updateParam(p.id, { key: (e.target as HTMLInputElement).value })
                }
              />
              <textarea
                class="textarea textarea-bordered textarea-sm font-mono flex-1 min-h-[2.5rem] resize-y focus:border-primary"
                placeholder={p.isJson ? '{"key": "value"}' : 'value'}
                value={p.value}
                onInput={e =>
                  updateParam(p.id, {
                    value: (e.target as HTMLTextAreaElement).value,
                    error: null,
                  })
                }
              />
              <div class="flex flex-col gap-1 shrink-0 pt-1">
                <label class="flex items-center gap-1 cursor-pointer text-xs text-base-content/60">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-xs"
                    checked={p.isJson}
                    onChange={e =>
                      updateParam(p.id, { isJson: (e.target as HTMLInputElement).checked })
                    }
                  />
                  JSON
                </label>
                <button
                  class="btn btn-ghost btn-xs text-base-content/50"
                  title="Encode value"
                  onClick={() => encodeParamValue(p.id, p.value)}
                >
                  Enc
                </button>
                <button
                  class="btn btn-ghost btn-xs text-base-content/50"
                  title="Decode value"
                  onClick={() => decodeParamValue(p.id, p.value)}
                >
                  Dec
                </button>
                <button
                  class="btn btn-ghost btn-xs text-error"
                  onClick={() => removeParam(p.id)}
                  disabled={params.length === 1}
                >
                  ✕
                </button>
              </div>
            </div>
            {p.error && (
              <p class="text-xs text-error ml-[9.5rem]">{p.error}</p>
            )}
          </div>
        ))}
        <button class="btn btn-ghost btn-sm" onClick={addParam}>
          + Add param
        </button>
      </div>

      {error && (
        <div role="alert" class="alert alert-error text-sm py-2">
          <span>{error}</span>
        </div>
      )}

      {builtUrl && !error && (
        <div class="space-y-2">
          <pre class="bg-base-200 rounded-xl p-3 text-sm font-mono break-all whitespace-pre-wrap border border-base-300">
            {builtUrl}
          </pre>
          <button class="btn btn-sm btn-ghost" onClick={copy}>
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
        </div>
      )}

      <HistoryPanel history={history} onSelect={loadFromHistory} onClear={clear} />
    </div>
  )
}
```

- [ ] **Step 2: Start dev server and verify URL Builder**

```bash
npm run dev
```

Navigate to `http://localhost:5173/url-builder`. Verify:
- Pasting `https://example.com?foo=bar&baz=qux` into Base URL splits it into base + 2 param rows
- Enc/Dec buttons update the param value in-place
- Dec on an invalid value (e.g. `hello%GG`) shows an error under that row

- [ ] **Step 3: Commit**

```bash
git add src/tools/UrlBuilder.tsx
git commit -m "feat: add UrlBuilder as top-level tool with auto-populate and per-param encode/decode"
```

---

### Task 8: Update App.tsx

**Files:**
- Modify: `src/App.tsx`

Prerequisites: Tasks 2 (router), 5 (Sidebar), 6 (Landing), 7 (UrlBuilder) must be complete.

- [ ] **Step 1: Replace App.tsx**

Write the full contents of `src/App.tsx`:

```tsx
import { useRoute } from './router'
import { Sidebar } from './components/Sidebar'
import { Landing } from './tools/Landing'
import { UrlEncoder } from './tools/UrlEncoder'
import { UrlBuilder } from './tools/UrlBuilder'
import { JsonViewer } from './tools/JsonViewer'
import { JwtViewer } from './tools/JwtViewer'

export function App() {
  const path = useRoute()
  const isLanding = path === '/'

  return (
    <div class="min-h-screen bg-base-100 text-base-content flex flex-col md:flex-row">
      {!isLanding && <Sidebar currentPath={path} />}
      <main class="flex-1 min-w-0">
        {isLanding ? (
          <Landing />
        ) : (
          <div class="px-4 py-6">
            <div class="max-w-3xl mx-auto rounded-xl border border-base-300 bg-base-100 p-6">
              {path === '/url-encoder' && <UrlEncoder />}
              {path === '/url-builder' && <UrlBuilder />}
              {path === '/json' && <JsonViewer />}
              {path === '/jwt' && <JwtViewer />}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up routing and sidebar layout in App"
```

---

### Task 9: Update URL Encoder

**Files:**
- Modify: `src/tools/UrlEncoder.tsx`

Remove the embedded `UrlBuilder` component and its `Mode` type, import utilities from `url-utils`, and add the Decode URL Params button.

- [ ] **Step 1: Replace UrlEncoder.tsx**

Write the full contents of `src/tools/UrlEncoder.tsx`:

```tsx
import { useState } from 'preact/hooks'
import { useToolHistory } from '../hooks/useToolHistory'
import { HistoryPanel } from '../components/HistoryPanel'
import { encodeUrlParams, decodeUrlParams } from '../url-utils'

function EncoderDecoder({
  input,
  onInputChange,
  onHistoryPush,
}: {
  input: string
  onInputChange: (v: string) => void
  onHistoryPush: (value: string) => void
}) {
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const run = (fn: () => string) => {
    setError(null)
    try {
      const result = fn()
      setOutput(result)
      onHistoryPush(input)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operation failed')
      setOutput('')
    }
  }

  const copy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div class="space-y-4">
      <textarea
        class="textarea textarea-bordered w-full font-mono h-32 resize-y focus:border-primary"
        placeholder="Paste text or URL here…"
        value={input}
        onInput={e => onInputChange((e.target as HTMLTextAreaElement).value)}
      />
      <div class="flex flex-wrap gap-2">
        <button class="btn btn-sm btn-primary" onClick={() => run(() => encodeURIComponent(input))}>
          Encode Full
        </button>
        <button class="btn btn-sm btn-outline" onClick={() => run(() => encodeUrlParams(input))}>
          Encode URL Params
        </button>
        <button class="btn btn-sm btn-outline" onClick={() => run(() => decodeUrlParams(input))}>
          Decode URL Params
        </button>
        <button class="btn btn-sm btn-outline" onClick={() => run(() => decodeURIComponent(input))}>
          Decode
        </button>
      </div>
      {error && (
        <div role="alert" class="alert alert-error text-sm py-2">
          <span>{error}</span>
        </div>
      )}
      {output && (
        <div class="space-y-2">
          <textarea
            class="textarea textarea-bordered w-full font-mono h-32 resize-y bg-base-200"
            readOnly
            value={output}
          />
          <button class="btn btn-sm btn-ghost" onClick={copy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  )
}

export function UrlEncoder() {
  const [input, setInput] = useState('')
  const { history, push, clear } = useToolHistory('webtools:url:history')

  return (
    <div>
      <EncoderDecoder
        input={input}
        onInputChange={setInput}
        onHistoryPush={value => push({ value, timestamp: Date.now() })}
      />
      <HistoryPanel
        history={history}
        onSelect={value => setInput(value)}
        onClear={clear}
      />
    </div>
  )
}
```

- [ ] **Step 2: Run tests to confirm no regressions**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Start dev server and do a full smoke test**

```bash
npm run dev
```

Check each route:
- `http://localhost:5173/` — landing page, 4 animated buttons, clicking each navigates correctly
- `http://localhost:5173/url-encoder` — 4 buttons: Encode Full, Encode URL Params, Decode URL Params, Decode; sidebar visible with URL Encoder highlighted
- `http://localhost:5173/url-builder` — paste a full URL into Base URL field, params populate; Enc/Dec per row work
- `http://localhost:5173/json` — JSON viewer unchanged
- `http://localhost:5173/jwt` — JWT viewer unchanged
- On mobile viewport (DevTools < 768px): sidebar collapses to top bar

- [ ] **Step 4: Build to confirm no TypeScript errors**

```bash
npm run build
```

Expected: exits 0 with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/tools/UrlEncoder.tsx
git commit -m "feat: update UrlEncoder — remove embedded builder, add Decode URL Params"
```
