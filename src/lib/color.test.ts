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
  it('converts green', () => {
    expect(hsvaToRgba({ h: 120, s: 1, v: 1, a: 1 })).toEqual({ r: 0, g: 255, b: 0, a: 1 });
  });
  it('converts blue', () => {
    expect(hsvaToRgba({ h: 240, s: 1, v: 1, a: 1 })).toEqual({ r: 0, g: 0, b: 255, a: 1 });
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
  it('converts black', () => {
    const result = rgbaToHsva(0, 0, 0, 1);
    expect(result.s).toBeCloseTo(0, 5);
    expect(result.v).toBeCloseTo(0, 5);
  });
});

describe('hsvaToHex', () => {
  it('converts opaque red', () => {
    expect(hsvaToHex({ h: 0, s: 1, v: 1, a: 1 })).toBe('#ff0000ff');
  });
  it('converts transparent black', () => {
    expect(hsvaToHex({ h: 0, s: 0, v: 0, a: 0 })).toBe('#00000000');
  });
  it('converts opaque white', () => {
    expect(hsvaToHex({ h: 0, s: 0, v: 1, a: 1 })).toBe('#ffffffff');
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
  it('returns null for empty', () => expect(hexToHsva('')).toBeNull());
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
  it('roundtrips white', () => {
    const orig = { h: 0, s: 0, v: 1, a: 1 };
    const back = hslaToHsva(hsvaToHsla(orig));
    expect(back.v).toBeCloseTo(1, 5);
    expect(back.s).toBeCloseTo(0, 5);
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
  it('roundtrips blue', () => {
    const orig = { h: 240, s: 1, v: 1, a: 1 };
    const oklch = hsvaToOklch(orig);
    const back = oklchToHsva(oklch);
    expect(back.v).toBeCloseTo(orig.v, 1);
  });
});

describe('parseColor', () => {
  it('parses hex', () => expect(parseColor('#ff0000')).not.toBeNull());
  it('parses rgb()', () => {
    const result = parseColor('rgb(255, 0, 0)');
    expect(result).not.toBeNull();
    expect(result?.v).toBeCloseTo(1, 5);
  });
  it('parses rgba()', () => {
    const result = parseColor('rgba(255, 0, 0, 0.5)');
    expect(result).not.toBeNull();
    expect(result?.a).toBeCloseTo(0.5, 5);
  });
  it('parses hsl()', () => expect(parseColor('hsl(0, 100%, 50%)')).not.toBeNull());
  it('parses oklch()', () => expect(parseColor('oklch(0.628 0.2577 29.23)')).not.toBeNull());
  it('returns null for garbage', () => expect(parseColor('notacolor')).toBeNull());
  it('returns null for empty', () => expect(parseColor('')).toBeNull());
});
