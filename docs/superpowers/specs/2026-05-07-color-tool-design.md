# Color Tool Design

**Goal:** Add a `/color` tool that lets users enter any color format and see it converted to all others, with a 2D HSV picker, per-channel sliders, and alpha support.

**Architecture:** Single canonical `{ h, s, v, a }` state. All formats are derived on render; any input converts back to HSVA. Four files: color math lib, 2D picker component, reusable slider component, main tool page.

**Tech Stack:** Preact, TypeScript, Tailwind/DaisyUI dark theme, `@phosphor-icons/react`, no new dependencies.

---

## Files

| File | Responsibility |
|------|---------------|
| `src/lib/color.ts` | Pure color math: parse any format string → HSVA; convert HSVA → hex/RGB/HSL/OKLCH; clamp/round helpers |
| `src/components/color/HsvPicker.tsx` | 2D saturation+brightness square + pointer drag logic |
| `src/components/color/ColorSlider.tsx` | Reusable gradient-track slider used for hue, alpha, and all per-channel sliders |
| `src/tools/ColorTool.tsx` | Owns `hsva` state, assembles all sub-components, wires inputs |

Modify:
- `src/components/Sidebar.tsx` — add `/color` entry with `Palette` icon
- `src/App.tsx` — add `/color` route

---

## State

Single state object in `ColorTool`:
```ts
interface HSVA { h: number; s: number; v: number; a: number }
// h: 0–360, s: 0–1, v: 0–1, a: 0–1
```

A second `savedHsva` (set when the tool first loads or the user clicks "save") drives the "old" color preview swatch.

---

## UI Layout

```
┌──────────────────────────────────────┐
│                                      │
│   2D HSV square (~240px, full width) │  drag → set saturation + brightness
│                                      │
│  ████████ Hue slider ████░░░░░░░░░   │
│  ████████ Alpha slider (checkerboard)│
│                                      │
│  [old swatch]  [new swatch]          │  checkerboard bg for both
│                                      │
│  HEX   [#rrggbbaa               ]    │
│                                      │
│  RGB                                 │
│    R [gradient track slider] [  0]   │
│    G [gradient track slider] [  0]   │
│    B [gradient track slider] [  0]   │
│                                      │
│  HSL                                 │
│    H [rainbow]  [  0°]               │
│    S [gray→color] [ 0%]              │
│    L [black→white] [ 0%]             │
│                                      │
│  HSV                                 │
│    H [rainbow]  [  0°]               │
│    S [gray→color] [ 0%]              │
│    V [black→color] [ 0%]             │
│                                      │
│  ▸ Advanced                          │  toggle
│    OKLCH                             │
│      L [dark→light] [0.00]           │
│      C [gray→vivid] [0.00]           │
│      H [rainbow]    [  0°]           │
└──────────────────────────────────────┘
```

---

## Components

### `ColorSlider`

Props:
```ts
interface ColorSliderProps {
  value: number        // 0–1 always (caller normalises)
  onChange: (v: number) => void
  gradient: string     // CSS linear-gradient(...) for the track
  label?: string
}
```

Renders: a full-width track div with the gradient as background, a circular thumb positioned at `value * 100%`. Pointer events on the track div (captured to document on drag). Checkerboard pseudo-element shown when `gradient` includes transparency.

### `HsvPicker`

Props:
```ts
interface HsvPickerProps {
  h: number; s: number; v: number
  onChange: (s: number, v: number) => void
}
```

Renders: a `div` with:
- Base background: `hsl(h, 100%, 50%)`
- Two overlaid CSS gradients: `linear-gradient(to right, white, transparent)` and `linear-gradient(to top, black, transparent)`
- A circular thumb at `(s * 100%, (1-v) * 100%)`
- Pointer events normalised to 0–1 for both axes

### `color.ts` — exported functions

```ts
parseColor(input: string): HSVA | null
hsvaToHex(hsva: HSVA): string          // "#rrggbbaa"
hsvaToRgb(hsva: HSVA): { r,g,b,a }    // 0-255, 0-1
hsvaToHsl(hsva: HSVA): { h,s,l,a }    // h:0-360, s/l:0-100
hsvaToOklch(hsva: HSVA): { l,c,h,a }  // l:0-1, c:0-0.4, h:0-360
rgbToHsva(r,g,b,a): HSVA
```

`parseColor` detects format by pattern matching:
- `#rgb`, `#rrggbb`, `#rrggbbaa` → hex
- `rgb(...)` / `rgba(...)` → RGB
- `hsl(...)` / `hsla(...)` → HSL
- `oklch(...)` → OKLCH
- bare number in a channel field → treated as that channel's unit

---

## Interactions

**2D picker drag:** `pointerdown` on square → `setPointerCapture` → `pointermove` updates `s` and `v` → `pointerup` releases.

**Slider drag:** same pattern on each slider track.

**Text input:** controlled input. On change, validate and update immediately if parseable; if the whole hex field is edited, run `parseColor` on the full string. On blur, reformat to canonical representation.

**Invalid input:** red border on the field, no state update. Does not crash or clear other fields.

**Old/new swatches:** `savedHsva` is set to the initial value on mount. Clicking the old swatch restores it.

**History:** `useToolHistory('webtools:color:history')`. Push on copy-button click, storing the hex string. History panel at the bottom, same as other tools.

---

## Color Math

OKLCH conversion chain:
1. sRGB (0–1) → linear sRGB (remove gamma: `c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4`)
2. linear sRGB → XYZ-D65 (3×3 matrix multiply)
3. XYZ-D65 → OKLab (cube-root nonlinearity + 3×3 matrix)
4. OKLab → OKLCH (`L=L, C=sqrt(a²+b²), H=atan2(b,a)`)

Reverse is the same chain backwards.

---

## Routing & Sidebar

- `Sidebar.tsx`: add `{ path: '/color', label: 'Colors', Icon: Palette }` to `TOOLS` array
- `App.tsx`: add `case '/color': return <ColorTool />`
