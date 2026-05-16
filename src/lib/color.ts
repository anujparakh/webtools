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

// sRGB D65 matrices for OKLCH conversion
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

export function oklchToHsva({ l, c, h, a }: OKLCH): HSVA {
  const hRad = (h * Math.PI) / 180;
  const A = c * Math.cos(hRad), B = c * Math.sin(hRad);
  const lms = matMul(M_LAB_TO_LMS, [l, A, B]).map(x => x * x * x);
  const xyz = matMul(M_LMS_TO_XYZ, lms);
  const rgb = matMul(M_XYZ_TO_RGB, xyz).map(x => clamp(delinearize(x), 0, 1));
  return rgbaToHsva(
    Math.round(rgb[0] * 255),
    Math.round(rgb[1] * 255),
    Math.round(rgb[2] * 255),
    a,
  );
}

export function parseColor(input: string): HSVA | null {
  const s = input.trim();

  if (s.startsWith('#')) return hexToHsva(s);

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
