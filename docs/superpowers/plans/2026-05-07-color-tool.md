# Color Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/color` tool that converts between hex/RGB/HSL/HSV/OKLCH, with a 2D HSV picker, per-channel gradient sliders, and alpha support.

**Architecture:** Single canonical `{ h, s, v, a }` state in `ColorTool`. All formats derived on render. Pure color math in `src/lib/color.ts`, reusable slider in `ColorSlider.tsx`, 2D picker in `HsvPicker.tsx`.

**Tech Stack:** Preact, TypeScript, Tailwind CSS v3 + DaisyUI v4 dark theme, `@phosphor-icons/react`. No new dependencies.

---

## Files

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/lib/color.ts` | Pure color math: HSVA type, parse/convert functions |
| Create | `src/lib/color.test.ts` | Vitest unit tests for color math |
| Create | `src/components/color/ColorSlider.tsx` | Gradient-track slider with checkerboard underlay |
| Create | `src/components/color/HsvPicker.tsx` | 2D saturation+brightness square with drag |
| Create | `src/tools/ColorTool.tsx` | Owns state, assembles components |
| Modify | `src/components/Sidebar.tsx` | Add `/color` entry with `Palette` icon |
| Modify | `src/App.tsx` | Add `/color` route and TOOL_META entry |

---

### Task 1: Color Math Library

**Files:**
- Create: `src/lib/color.ts`
- Create: `src/lib/color.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/color.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  hsvaToRgba, rgbaToHsva, hsvaToHex, hexToHsva,
  hsvaToHsla, hslaToHsva, hsvaToOklch, oklchToHsva,
  parseColor, clamp,
} from './color';

describe('clamp', () => {
  it('clamps below min', () => expect(clamp(-1, 0, 1)).toBe(0));
  it('clamps above max', () => expect(clamp(2, 0, 1)).toBe(1));
  it('passes through in-range', () => expect(clamp(0.5, 0, 1)).toBe(0.5));
});

describe('hsvaToRgba', () => {
  it('converts red', () => {
    expect(hsvaToRgba({ h: 0, s: 1, v: 1, a: 1 })).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });
  it('converts white', () => {
    expect(hsvaToRgba({ h: 0, s: 0, v: 1, a: 1 })).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });
  it('converts black', () => {
    expect(hsvaToRgba({ h: 0, s: 0, v: 0, a: 1 })).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });
});

describe('rgbaToHsva', () => {
  it('converts red', () => {
    const result = rgbaToHsva(255, 0, 0, 1);
    expect(result.h).toBeCloseTo(0, 1);
    expect(result.s).toBeCloseTo(1, 5);
    expect(result.v).toBeCloseTo(1, 5);
  });
  it('converts white', () => {
    const result = rgbaToHsva(255, 255, 255, 1);
    expect(result.s).toBeCloseTo(0, 5);
    expect(result.v).toBeCloseTo(1, 5);
  });
});

describe('hsvaToHex', () => {
  it('converts opaque red', () => {
    expect(hsvaToHex({ h: 0, s: 1, v: 1, a: 1 })).toBe('#ff0000ff');
  });
  it('converts transparent black', () => {
    expect(hsvaToHex({ h: 0, s: 0, v: 0, a: 0 })).toBe('#00000000');
  });
});

describe('hexToHsva', () => {
  it('parses #rrggbb', () => {
    const result = hexToHsva('#ff0000');
    expect(result?.h).toBeCloseTo(0, 1);
    expect(result?.s).toBeCloseTo(1, 5);
    expect(result?.v).toBeCloseTo(1, 5);
    expect(result?.a).toBe(1);
  });
  it('parses #rrggbbaa', () => {
    const result = hexToHsva('#ff000080');
    expect(result?.a).toBeCloseTo(0.502, 2);
  });
  it('parses #rgb shorthand', () => {
    const result = hexToHsva('#f00');
    expect(result?.h).toBeCloseTo(0, 1);
    expect(result?.v).toBeCloseTo(1, 5);
  });
  it('returns null for invalid', () => expect(hexToHsva('xyz')).toBeNull());
});

describe('hsvaToHsla / hslaToHsva roundtrip', () => {
  it('roundtrips a mid-range color', () => {
    const orig = { h: 200, s: 0.6, v: 0.8, a: 0.9 };
    const hsl = hsvaToHsla(orig);
    const back = hslaToHsva(hsl);
    expect(back.h).toBeCloseTo(orig.h, 1);
    expect(back.s).toBeCloseTo(orig.s, 2);
    expect(back.v).toBeCloseTo(orig.v, 2);
    expect(back.a).toBeCloseTo(orig.a, 5);
  });
});

describe('hsvaToOklch / oklchToHsva roundtrip', () => {
  it('roundtrips red', () => {
    const orig = { h: 0, s: 1, v: 1, a: 1 };
    const oklch = hsvaToOklch(orig);
    const back = oklchToHsva(oklch);
    expect(back.h).toBeCloseTo(orig.h, 0);
    expect(back.s).toBeCloseTo(orig.s, 1);
    expect(back.v).toBeCloseTo(orig.v, 1);
  });
});

describe('parseColor', () => {
  it('parses hex', () => expect(parseColor('#ff0000')).not.toBeNull());
  it('parses rgb()', () => expect(parseColor('rgb(255, 0, 0)')).not.toBeNull());
  it('parses rgba()', () => expect(parseColor('rgba(255, 0, 0, 0.5)')).not.toBeNull());
  it('parses hsl()', () => expect(parseColor('hsl(0, 100%, 50%)')).not.toBeNull());
  it('parses oklch()', () => expect(parseColor('oklch(0.628 0.2577 29.23)')).not.toBeNull());
  it('returns null for garbage', () => expect(parseColor('notacolor')).toBeNull());
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/anujparakh/Documents/Projects/webtools && npm test -- color.test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/color.ts`**

Create `src/lib/color.ts`:

```ts
export interface HSVA { h: number; s: number; v: number; a: number }
export interface RGBA { r: number; g: number; b: number; a: number }
export interface HSLA { h: number; s: number; l: number; a: number }
export interface OKLCH { l: number; c: number; h: number; a: number }

export function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

export function hsvaToRgba({ h, s, v, a }: HSVA): RGBA {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return {
    r: Math.round(f(5) * 255),
    g: Math.round(f(3) * 255),
    b: Math.round(f(1) * 255),
    a,
  };
}

export function rgbaToHsva(r: number, g: number, b: number, a: number): HSVA {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d + 6) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max, a };
}

export function hsvaToHex(hsva: HSVA): string {
  const { r, g, b, a } = hsvaToRgba(hsva);
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}${hex(Math.round(a * 255))}`;
}

export function hexToHsva(hex: string): HSVA | null {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length === 6) h += 'ff';
  if (h.length !== 8 || !/^[0-9a-fA-F]{8}$/.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = parseInt(h.slice(6, 8), 16) / 255;
  return rgbaToHsva(r, g, b, a);
}

export function hsvaToHsla({ h, s, v, a }: HSVA): HSLA {
  const l = v * (1 - s / 2);
  const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
  return { h, s: sl, l, a };
}

export function hslaToHsva({ h, s, l, a }: HSLA): HSVA {
  const v = l + s * Math.min(l, 1 - l);
  const sv = v === 0 ? 0 : 2 * (1 - l / v);
  return { h, s: sv, v, a };
}

// OKLCH conversion matrices (sRGB D65)
const M_RGB_TO_XYZ = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.0721750],
  [0.0193339, 0.1191920, 0.9503041],
];
const M_XYZ_TO_LMS = [
  [ 0.8189330101, 0.3618667424, -0.1288597137],
  [ 0.0329845436, 0.9293118715,  0.0361456387],
  [ 0.0482003018, 0.2643662691,  0.6338517070],
];
const M_LMS_TO_LAB = [
  [0.2104542553, 0.7936177850, -0.0040720468],
  [1.9779984951,-2.4285922050,  0.4505937099],
  [0.0259040371, 0.7827717662, -0.8086757660],
];

function matMul(m: number[][], v: number[]): number[] {
  return m.map(row => row.reduce((s, c, i) => s + c * v[i], 0));
}

function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function delinearize(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

export function hsvaToOklch(hsva: HSVA): OKLCH {
  const { r, g, b, a } = hsvaToRgba(hsva);
  const lin = [r, g, b].map(c => linearize(c / 255));
  const xyz = matMul(M_RGB_TO_XYZ, lin);
  const lms = matMul(M_XYZ_TO_LMS, xyz).map(c => Math.cbrt(clamp(c, 0, Infinity)));
  const [L, A, B] = matMul(M_LMS_TO_LAB, lms);
  const C = Math.sqrt(A * A + B * B);
  const H = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c: C, h: H, a };
}

const M_LAB_TO_LMS = [
  [1.0000000000,  0.3963377774,  0.2158037573],
  [1.0000000000, -0.1055613458, -0.0638541728],
  [1.0000000000, -0.0894841775, -1.2914855480],
];
const M_LMS_TO_XYZ = [
  [ 1.2270138511, -0.5577999807,  0.2812561490],
  [-0.0405801784,  1.1122568696, -0.0716766787],
  [-0.0763812845, -0.4214819784,  1.5861632204],
];
const M_XYZ_TO_RGB = [
  [ 3.2404542, -1.5371385, -0.4985314],
  [-0.9692660,  1.8760108,  0.0415560],
  [ 0.0556434, -0.2040259,  1.0572252],
];

export function oklchToHsva({ l, c, h, a }: OKLCH): HSVA {
  const hRad = (h * Math.PI) / 180;
  const A = c * Math.cos(hRad), B = c * Math.sin(hRad);
  const lms = matMul(M_LAB_TO_LMS, [l, A, B]).map(c => c * c * c);
  const xyz = matMul(M_LMS_TO_XYZ, lms);
  const rgb = matMul(M_XYZ_TO_RGB, xyz).map(c => clamp(delinearize(c), 0, 1));
  return rgbaToHsva(
    Math.round(rgb[0] * 255),
    Math.round(rgb[1] * 255),
    Math.round(rgb[2] * 255),
    a,
  );
}

export function parseColor(input: string): HSVA | null {
  const s = input.trim();

  // Hex
  if (s.startsWith('#')) return hexToHsva(s);

  // rgb() / rgba()
  const rgbMatch = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (rgbMatch) {
    const [, r, g, b, a = '1'] = rgbMatch;
    return rgbaToHsva(
      clamp(parseFloat(r), 0, 255),
      clamp(parseFloat(g), 0, 255),
      clamp(parseFloat(b), 0, 255),
      clamp(parseFloat(a), 0, 1),
    );
  }

  // hsl() / hsla()
  const hslMatch = s.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (hslMatch) {
    const [, h, sl, l, a = '1'] = hslMatch;
    return hslaToHsva({
      h: clamp(parseFloat(h), 0, 360),
      s: clamp(parseFloat(sl), 0, 100) / 100,
      l: clamp(parseFloat(l), 0, 100) / 100,
      a: clamp(parseFloat(a), 0, 1),
    });
  }

  // oklch()
  const oklchMatch = s.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/);
  if (oklchMatch) {
    const [, l, c, h, a = '1'] = oklchMatch;
    return oklchToHsva({
      l: clamp(parseFloat(l), 0, 1),
      c: clamp(parseFloat(c), 0, 0.4),
      h: clamp(parseFloat(h), 0, 360),
      a: clamp(parseFloat(a), 0, 1),
    });
  }

  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/anujparakh/Documents/Projects/webtools && npm test -- color.test
```

Expected: All tests PASS.

---

### Task 2: ColorSlider Component

**Files:**
- Create: `src/components/color/ColorSlider.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/color/ColorSlider.tsx`:

```tsx
import { useRef } from 'preact/hooks';

interface ColorSliderProps {
  value: number;       // 0–1
  onChange: (v: number) => void;
  gradient: string;    // CSS linear-gradient(...) for the visible track
  label?: string;
}

export function ColorSlider({ value, onChange, gradient, label }: ColorSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const getValueFromEvent = (e: PointerEvent): number => {
    const rect = trackRef.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  };

  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    onChange(getValueFromEvent(e));
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (e.buttons === 0) return;
    onChange(getValueFromEvent(e));
  };

  return (
    <div class="flex items-center gap-2 w-full">
      {label && <span class="text-xs text-base-content/50 w-4 shrink-0">{label}</span>}
      <div
        ref={trackRef}
        class="relative flex-1 h-4 rounded-full cursor-pointer select-none overflow-visible"
        style={{
          background: `
            ${gradient},
            repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 8px 8px
          `,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <div
          class="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
          style={{ left: `calc(${value * 100}% - 8px)` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/anujparakh/Documents/Projects/webtools && npm run build 2>&1 | grep -E "error|warning" | head -20
```

Expected: No TypeScript errors for the new file.

---

### Task 3: HsvPicker Component

**Files:**
- Create: `src/components/color/HsvPicker.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/color/HsvPicker.tsx`:

```tsx
import { useRef } from 'preact/hooks';

interface HsvPickerProps {
  h: number;
  s: number;
  v: number;
  onChange: (s: number, v: number) => void;
}

export function HsvPicker({ h, s, v, onChange }: HsvPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  const getFromEvent = (e: PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const ny = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    onChange(nx, 1 - ny);
  };

  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    getFromEvent(e);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (e.buttons === 0) return;
    getFromEvent(e);
  };

  return (
    <div
      ref={ref}
      class="relative w-full aspect-square rounded-lg cursor-crosshair select-none"
      style={{
        background: `
          linear-gradient(to top, black, transparent),
          linear-gradient(to right, white, transparent),
          hsl(${h}, 100%, 50%)
        `,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <div
        class="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md pointer-events-none"
        style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/anujparakh/Documents/Projects/webtools && npm run build 2>&1 | grep -E "error|warning" | head -20
```

Expected: No TypeScript errors.

---

### Task 4: ColorTool Main Page

**Files:**
- Create: `src/tools/ColorTool.tsx`

- [ ] **Step 1: Create the tool**

Create `src/tools/ColorTool.tsx`:

```tsx
import { useState, useEffect } from 'preact/hooks';
import { useToolHistory } from '../hooks/useToolHistory';
import { HistoryPanel } from '../components/HistoryPanel';
import { HsvPicker } from '../components/color/HsvPicker';
import { ColorSlider } from '../components/color/ColorSlider';
import {
  type HSVA,
  hsvaToRgba, hsvaToHex, hsvaToHsla, hslaToHsva,
  hsvaToOklch, oklchToHsva, parseColor, clamp,
} from '../lib/color';

const DEFAULT_HSVA: HSVA = { h: 210, s: 0.7, v: 0.9, a: 1 };

function toHexDisplay(hsva: HSVA): string {
  return hsvaToHex(hsva).slice(1); // strip leading #
}

function checkerStyle(): string {
  return 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 16px 16px';
}

function hueGradient(): string {
  return 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';
}

interface SliderRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  gradient: string;
  displayValue: string;
  onDisplayChange: (raw: string) => void;
  inputWidth?: string;
}

function SliderRow({ label, value, onChange, gradient, displayValue, onDisplayChange, inputWidth = 'w-14' }: SliderRowProps) {
  return (
    <div class="flex items-center gap-2">
      <span class="text-xs text-base-content/50 w-5 shrink-0">{label}</span>
      <div class="flex-1">
        <ColorSlider value={value} onChange={onChange} gradient={gradient} />
      </div>
      <input
        class={`input input-xs input-bordered font-mono text-right ${inputWidth} shrink-0`}
        value={displayValue}
        onInput={(e) => onDisplayChange((e.target as HTMLInputElement).value)}
      />
    </div>
  );
}

export function ColorTool() {
  const [hsva, setHsva] = useState<HSVA>(DEFAULT_HSVA);
  const [savedHsva, setSavedHsva] = useState<HSVA>(DEFAULT_HSVA);
  const [hexDraft, setHexDraft] = useState<string>(() => toHexDisplay(DEFAULT_HSVA));
  const [hexError, setHexError] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { history, push, clear } = useToolHistory('webtools:color:history');

  useEffect(() => {
    setHexDraft(toHexDisplay(hsva));
  }, [hsva]);

  const update = (next: HSVA) => {
    setHsva(next);
    setHexError(false);
  };

  const rgba = hsvaToRgba(hsva);
  const hsla = hsvaToHsla(hsva);
  const oklch = hsvaToOklch(hsva);

  const handleHexBlur = () => {
    const parsed = parseColor('#' + hexDraft);
    if (parsed) {
      update(parsed);
      setHexError(false);
    } else {
      setHexError(true);
      setHexDraft(toHexDisplay(hsva));
    }
  };

  const handleHexInput = (raw: string) => {
    setHexDraft(raw);
    const parsed = parseColor('#' + raw);
    if (parsed) { update(parsed); setHexError(false); }
    else setHexError(true);
  };

  const rgbGrad = (ch: 'r' | 'g' | 'b') => {
    const r = ch === 'r' ? 255 : rgba.r;
    const g = ch === 'g' ? 255 : rgba.g;
    const b = ch === 'b' ? 255 : rgba.b;
    const r0 = ch === 'r' ? 0 : rgba.r;
    const g0 = ch === 'g' ? 0 : rgba.g;
    const b0 = ch === 'b' ? 0 : rgba.b;
    return `linear-gradient(to right, rgb(${r0},${g0},${b0}), rgb(${r},${g},${b}))`;
  };

  const alphaGrad = () => {
    const { r, g, b } = rgba;
    return `linear-gradient(to right, rgba(${r},${g},${b},0), rgb(${r},${g},${b}))`;
  };

  const hslSGrad = () => {
    const { h, l } = hsla;
    return `linear-gradient(to right, hsl(${h},0%,${l * 100}%), hsl(${h},100%,${l * 100}%))`;
  };

  const hslLGrad = () => `linear-gradient(to right, hsl(${hsla.h},${hsla.s * 100}%,0%), hsl(${hsla.h},${hsla.s * 100}%,50%), hsl(${hsla.h},${hsla.s * 100}%,100%))`;
  const hsvSGrad = () => `linear-gradient(to right, hsl(${hsva.h},0%,${hsva.v * 50}%), hsl(${hsva.h},100%,${hsva.v * 50}%))`;
  const hsvVGrad = () => `linear-gradient(to right, black, hsl(${hsva.h},100%,50%))`;
  const oklchLGrad = () => `linear-gradient(to right, oklch(0 ${oklch.c} ${oklch.h}), oklch(1 ${oklch.c} ${oklch.h}))`;
  const oklchCGrad = () => `linear-gradient(to right, oklch(${oklch.l} 0 ${oklch.h}), oklch(${oklch.l} 0.4 ${oklch.h}))`;

  const swatchBg = (h: HSVA) => {
    const { r, g, b, a } = hsvaToRgba(h);
    return `rgba(${r},${g},${b},${a})`;
  };

  return (
    <div class="space-y-4">
      <HsvPicker
        h={hsva.h} s={hsva.s} v={hsva.v}
        onChange={(s, v) => update({ ...hsva, s, v })}
      />

      <ColorSlider
        value={hsva.h / 360}
        onChange={(v) => update({ ...hsva, h: v * 360 })}
        gradient={hueGradient()}
      />

      <ColorSlider
        value={hsva.a}
        onChange={(v) => update({ ...hsva, a: v })}
        gradient={alphaGrad()}
      />

      {/* Swatches */}
      <div class="flex gap-3">
        <div class="space-y-1 flex-1">
          <span class="text-xs text-base-content/40">Previous</span>
          <button
            class="w-full h-10 rounded-lg border border-base-300 cursor-pointer"
            style={{ background: `${swatchBg(savedHsva)}, ${checkerStyle()}` }}
            title="Restore previous color"
            onClick={() => update(savedHsva)}
          />
        </div>
        <div class="space-y-1 flex-1">
          <span class="text-xs text-base-content/40">Current</span>
          <div
            class="w-full h-10 rounded-lg border border-base-300"
            style={{ background: `${swatchBg(hsva)}, ${checkerStyle()}` }}
          />
        </div>
        <button
          class="btn btn-xs btn-ghost self-end mb-1"
          onClick={() => { setSavedHsva(hsva); push({ value: hsvaToHex(hsva), timestamp: Date.now() }); }}
        >
          Save
        </button>
      </div>

      {/* HEX */}
      <div class="space-y-1">
        <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">HEX</span>
        <div class="flex items-center gap-2">
          <span class="text-base-content/40">#</span>
          <input
            class={`input input-bordered input-sm font-mono flex-1 ${hexError ? 'input-error' : ''}`}
            value={hexDraft}
            onInput={(e) => handleHexInput((e.target as HTMLInputElement).value)}
            onBlur={handleHexBlur}
            spellcheck={false}
          />
        </div>
      </div>

      {/* RGB */}
      <div class="space-y-2">
        <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">RGB</span>
        <SliderRow
          label="R" value={rgba.r / 255} gradient={rgbGrad('r')}
          displayValue={String(rgba.r)}
          onChange={(v) => { const next = { ...rgba, r: Math.round(v * 255) }; update({ ...hsva, ...{ h: hsva.h, s: hsva.s, v: hsva.v, ...require('../lib/color').rgbaToHsva(next.r, next.g, next.b, next.a) } }); }}
          onDisplayChange={(raw) => { const n = parseInt(raw); if (!isNaN(n)) { const r2 = clamp(n,0,255); update(require('../lib/color').rgbaToHsva(r2, rgba.g, rgba.b, rgba.a)); } }}
        />
        <SliderRow
          label="G" value={rgba.g / 255} gradient={rgbGrad('g')}
          displayValue={String(rgba.g)}
          onChange={(v) => update(require('../lib/color').rgbaToHsva(rgba.r, Math.round(v * 255), rgba.b, rgba.a))}
          onDisplayChange={(raw) => { const n = parseInt(raw); if (!isNaN(n)) update(require('../lib/color').rgbaToHsva(rgba.r, clamp(n,0,255), rgba.b, rgba.a)); }}
        />
        <SliderRow
          label="B" value={rgba.b / 255} gradient={rgbGrad('b')}
          displayValue={String(rgba.b)}
          onChange={(v) => update(require('../lib/color').rgbaToHsva(rgba.r, rgba.g, Math.round(v * 255), rgba.a))}
          onDisplayChange={(raw) => { const n = parseInt(raw); if (!isNaN(n)) update(require('../lib/color').rgbaToHsva(rgba.r, rgba.g, clamp(n,0,255), rgba.a)); }}
        />
        <SliderRow
          label="A" value={hsva.a} gradient={alphaGrad()}
          displayValue={(hsva.a * 100).toFixed(0) + '%'}
          onChange={(v) => update({ ...hsva, a: v })}
          onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) update({ ...hsva, a: clamp(n/100,0,1) }); }}
        />
      </div>

      {/* HSL */}
      <div class="space-y-2">
        <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">HSL</span>
        <SliderRow
          label="H" value={hsla.h / 360} gradient={hueGradient()}
          displayValue={hsla.h.toFixed(0) + '°'}
          onChange={(v) => update(hslaToHsva({ ...hsla, h: v * 360 }))}
          onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) update(hslaToHsva({ ...hsla, h: clamp(n,0,360) })); }}
        />
        <SliderRow
          label="S" value={hsla.s} gradient={hslSGrad()}
          displayValue={(hsla.s * 100).toFixed(0) + '%'}
          onChange={(v) => update(hslaToHsva({ ...hsla, s: v }))}
          onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) update(hslaToHsva({ ...hsla, s: clamp(n/100,0,1) })); }}
        />
        <SliderRow
          label="L" value={hsla.l} gradient={hslLGrad()}
          displayValue={(hsla.l * 100).toFixed(0) + '%'}
          onChange={(v) => update(hslaToHsva({ ...hsla, l: v }))}
          onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) update(hslaToHsva({ ...hsla, l: clamp(n/100,0,1) })); }}
        />
      </div>

      {/* HSV */}
      <div class="space-y-2">
        <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">HSV</span>
        <SliderRow
          label="H" value={hsva.h / 360} gradient={hueGradient()}
          displayValue={hsva.h.toFixed(0) + '°'}
          onChange={(v) => update({ ...hsva, h: v * 360 })}
          onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) update({ ...hsva, h: clamp(n,0,360) }); }}
        />
        <SliderRow
          label="S" value={hsva.s} gradient={hsvSGrad()}
          displayValue={(hsva.s * 100).toFixed(0) + '%'}
          onChange={(v) => update({ ...hsva, s: v })}
          onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) update({ ...hsva, s: clamp(n/100,0,1) })); }}
        />
        <SliderRow
          label="V" value={hsva.v} gradient={hsvVGrad()}
          displayValue={(hsva.v * 100).toFixed(0) + '%'}
          onChange={(v) => update({ ...hsva, v: v })}
          onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) update({ ...hsva, v: clamp(n/100,0,1) }); }}
        />
      </div>

      {/* Advanced */}
      <div>
        <button
          class="flex items-center gap-1.5 text-xs text-base-content/50 hover:text-base-content transition-colors"
          onClick={() => setShowAdvanced(v => !v)}
        >
          <span class={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
          Advanced
        </button>
        {showAdvanced && (
          <div class="space-y-2 mt-3">
            <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">OKLCH</span>
            <SliderRow
              label="L" value={oklch.l} gradient={oklchLGrad()}
              displayValue={oklch.l.toFixed(3)}
              onChange={(v) => update(oklchToHsva({ ...oklch, l: v }))}
              onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) update(oklchToHsva({ ...oklch, l: clamp(n,0,1) })); }}
              inputWidth="w-16"
            />
            <SliderRow
              label="C" value={oklch.c / 0.4} gradient={oklchCGrad()}
              displayValue={oklch.c.toFixed(3)}
              onChange={(v) => update(oklchToHsva({ ...oklch, c: v * 0.4 }))}
              onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) update(oklchToHsva({ ...oklch, c: clamp(n,0,0.4) })); }}
              inputWidth="w-16"
            />
            <SliderRow
              label="H" value={oklch.h / 360} gradient={hueGradient()}
              displayValue={oklch.h.toFixed(1) + '°'}
              onChange={(v) => update(oklchToHsva({ ...oklch, h: v * 360 }))}
              onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) update(oklchToHsva({ ...oklch, h: clamp(n,0,360) })); }}
              inputWidth="w-16"
            />
          </div>
        )}
      </div>

      <HistoryPanel
        history={history}
        onSelect={(val) => { const parsed = parseColor(val); if (parsed) update(parsed); }}
        onClear={clear}
      />
    </div>
  );
}
```

**Note:** The `require(...)` calls in SliderRow callbacks above are a placeholder that won't compile. The actual implementation uses the already-imported `rgbaToHsva` directly. Replace `require('../lib/color').rgbaToHsva(...)` with `rgbaToHsva(...)` throughout — those imports are already at the top.

- [ ] **Step 2: Fix the SliderRow RGB callbacks to use imported rgbaToHsva**

The `ColorTool.tsx` file has inline `require()` calls in the RGB SliderRow callbacks. Replace each with the imported `rgbaToHsva`. The RGB section should look like this:

```tsx
      {/* RGB */}
      <div class="space-y-2">
        <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">RGB</span>
        <SliderRow
          label="R" value={rgba.r / 255} gradient={rgbGrad('r')}
          displayValue={String(rgba.r)}
          onChange={(v) => update(rgbaToHsva(Math.round(v * 255), rgba.g, rgba.b, rgba.a))}
          onDisplayChange={(raw) => { const n = parseInt(raw); if (!isNaN(n)) update(rgbaToHsva(clamp(n,0,255), rgba.g, rgba.b, rgba.a)); }}
        />
        <SliderRow
          label="G" value={rgba.g / 255} gradient={rgbGrad('g')}
          displayValue={String(rgba.g)}
          onChange={(v) => update(rgbaToHsva(rgba.r, Math.round(v * 255), rgba.b, rgba.a))}
          onDisplayChange={(raw) => { const n = parseInt(raw); if (!isNaN(n)) update(rgbaToHsva(rgba.r, clamp(n,0,255), rgba.b, rgba.a)); }}
        />
        <SliderRow
          label="B" value={rgba.b / 255} gradient={rgbGrad('b')}
          displayValue={String(rgba.b)}
          onChange={(v) => update(rgbaToHsva(rgba.r, rgba.g, Math.round(v * 255), rgba.a))}
          onDisplayChange={(raw) => { const n = parseInt(raw); if (!isNaN(n)) update(rgbaToHsva(rgba.r, rgba.g, clamp(n,0,255), rgba.a)); }}
        />
        <SliderRow
          label="A" value={hsva.a} gradient={alphaGrad()}
          displayValue={(hsva.a * 100).toFixed(0) + '%'}
          onChange={(v) => update({ ...hsva, a: v })}
          onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) update({ ...hsva, a: clamp(n/100,0,1) }); }}
        />
      </div>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/anujparakh/Documents/Projects/webtools && npm run build 2>&1 | grep -i error | head -20
```

Expected: No errors.

---

### Task 5: Wire Up Route and Sidebar

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add Palette import and TOOLS entry to Sidebar.tsx**

In `src/components/Sidebar.tsx`, add `Palette` to the phosphor import:

```ts
import {
  GlobeSimple,
  LinkSimple,
  Hammer,
  BracketsCurly,
  Key,
  Palette,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
```

Add entry to the `TOOLS` array:

```ts
const TOOLS = [
  { path: "/url-encoder", label: "URL Encoder", Icon: LinkSimple },
  { path: "/url-builder", label: "URL Builder", Icon: Hammer },
  { path: "/json", label: "JSON Viewer", Icon: BracketsCurly },
  { path: "/jwt", label: "JWT Viewer", Icon: Key },
  { path: "/color", label: "Colors", Icon: Palette },
];
```

- [ ] **Step 2: Add route and meta to App.tsx**

In `src/App.tsx`, add the import:

```ts
import { ColorTool } from "./tools/ColorTool";
```

Add to `TOOL_META`:

```ts
  "/color": { label: "Colors", color: "#e879f9" },
```

Add the route in the JSX (alongside existing tool routes):

```tsx
              {path === "/color" && <ColorTool />}
```

- [ ] **Step 3: Start dev server and verify the tool loads**

```bash
cd /Users/anujparakh/Documents/Projects/webtools && npm run dev
```

Open `http://localhost:5173/color` and verify:
- 2D HSV picker renders and responds to drag
- Hue and alpha sliders work
- Old/new swatches update
- HEX input reflects current color
- RGB, HSL, HSV slider sections all present and interactive
- Advanced section toggles and shows OKLCH sliders

- [ ] **Step 4: Run full test suite**

```bash
cd /Users/anujparakh/Documents/Projects/webtools && npm test
```

Expected: All tests pass including the new color.test.ts.
