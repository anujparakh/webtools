import { useState, useEffect } from 'preact/hooks';
import { useToolHistory } from '../hooks/useToolHistory';
import { HistoryPanel } from '../components/HistoryPanel';
import { HsvPicker } from '../components/color/HsvPicker';
import { ColorSlider } from '../components/color/ColorSlider';
import {
  type HSVA,
  type HSLA,
  type OKLCH,
  hsvaToRgba, rgbaToHsva, hsvaToHex, hsvaToHsla, hslaToHsva,
  hsvaToOklch, oklchToHsva, parseColor, clamp,
} from '../lib/color';

const DEFAULT_HSVA: HSVA = { h: 210, s: 0.7, v: 0.9, a: 1 };

function toHexDisplay(hsva: HSVA): string {
  return hsvaToHex(hsva).slice(1);
}

const CHECKER = 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 16px 16px';
const HUE_GRADIENT = 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';

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
      <span class="text-xs text-base-content/50 w-5 shrink-0 text-right">{label}</span>
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

function swatchBg(hsva: HSVA): string {
  const { r, g, b, a } = hsvaToRgba(hsva);
  return `rgba(${r},${g},${b},${a}), ${CHECKER}`;
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
    setHexError(false);
  }, [hsva]);

  const update = (next: HSVA) => setHsva(next);

  const rgba = hsvaToRgba(hsva);
  const hsla = hsvaToHsla(hsva);
  const oklch = hsvaToOklch(hsva);

  const handleHexInput = (raw: string) => {
    setHexDraft(raw);
    const parsed = parseColor('#' + raw);
    if (parsed) { setHsva(parsed); setHexError(false); }
    else setHexError(true);
  };

  const handleHexBlur = () => {
    const parsed = parseColor('#' + hexDraft);
    if (parsed) { setHsva(parsed); setHexError(false); }
    else { setHexError(true); setHexDraft(toHexDisplay(hsva)); }
  };

  const rgbGrad = (ch: 'r' | 'g' | 'b') => {
    const r0 = ch === 'r' ? 0 : rgba.r;
    const g0 = ch === 'g' ? 0 : rgba.g;
    const b0 = ch === 'b' ? 0 : rgba.b;
    const r1 = ch === 'r' ? 255 : rgba.r;
    const g1 = ch === 'g' ? 255 : rgba.g;
    const b1 = ch === 'b' ? 255 : rgba.b;
    return `linear-gradient(to right, rgb(${r0},${g0},${b0}), rgb(${r1},${g1},${b1}))`;
  };

  const alphaGrad = () =>
    `linear-gradient(to right, rgba(${rgba.r},${rgba.g},${rgba.b},0), rgb(${rgba.r},${rgba.g},${rgba.b}))`;

  const hslSGrad = (h: number, l: number) =>
    `linear-gradient(to right, hsl(${h},0%,${l * 100}%), hsl(${h},100%,${l * 100}%))`;
  const hslLGrad = (h: number, s: number) =>
    `linear-gradient(to right, hsl(${h},${s * 100}%,0%), hsl(${h},${s * 100}%,50%), hsl(${h},${s * 100}%,100%))`;
  const hsvSGrad = (h: number, v: number) =>
    `linear-gradient(to right, hsl(${h},0%,${v * 50}%), hsl(${h},100%,${v * 50}%))`;
  const hsvVGrad = (h: number) =>
    `linear-gradient(to right, black, hsl(${h},100%,50%))`;

  const updateHsla = (next: HSLA) => update(hslaToHsva(next));
  const updateOklch = (next: OKLCH) => update(oklchToHsva(next));

  const save = () => {
    setSavedHsva(hsva);
    push({ value: hsvaToHex(hsva), timestamp: Date.now() });
  };

  return (
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left column: visual controls */}
        <div class="space-y-3">
          <HsvPicker
            h={hsva.h} s={hsva.s} v={hsva.v}
            onChange={(s, v) => update({ ...hsva, s, v })}
          />

          <ColorSlider
            value={hsva.h / 360}
            onChange={(v) => update({ ...hsva, h: v * 360 })}
            gradient={HUE_GRADIENT}
          />

          <ColorSlider
            value={hsva.a}
            onChange={(v) => update({ ...hsva, a: v })}
            gradient={alphaGrad()}
          />

          {/* Swatches */}
          <div class="flex items-end gap-3">
            <div class="space-y-1 flex-1">
              <span class="text-xs text-base-content/40">Previous</span>
              <button
                class="w-full h-10 rounded-lg border border-base-300 cursor-pointer"
                style={{ background: swatchBg(savedHsva) }}
                title="Restore previous color"
                onClick={() => update(savedHsva)}
              />
            </div>
            <div class="space-y-1 flex-1">
              <span class="text-xs text-base-content/40">Current</span>
              <div
                class="w-full h-10 rounded-lg border border-base-300"
                style={{ background: swatchBg(hsva) }}
              />
            </div>
            <button class="btn btn-xs btn-ghost" onClick={save}>Save</button>
          </div>

          {/* HEX */}
          <div class="space-y-1">
            <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">HEX</span>
            <div class="flex items-center gap-1">
              <span class="text-base-content/40 font-mono">#</span>
              <input
                class={`input input-bordered input-sm font-mono flex-1 ${hexError ? 'input-error' : ''}`}
                value={hexDraft}
                onInput={(e) => handleHexInput((e.target as HTMLInputElement).value)}
                onBlur={handleHexBlur}
                spellcheck={false}
              />
            </div>
          </div>
        </div>

        {/* Right column: channel sliders */}
        <div class="space-y-4">

          {/* RGB */}
          <div class="space-y-2">
            <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">RGB</span>
            <SliderRow
              label="R" value={rgba.r / 255} gradient={rgbGrad('r')}
              displayValue={String(rgba.r)}
              onChange={(v) => update(rgbaToHsva(Math.round(v * 255), rgba.g, rgba.b, rgba.a))}
              onDisplayChange={(raw) => { const n = parseInt(raw); if (!isNaN(n)) update(rgbaToHsva(clamp(n, 0, 255), rgba.g, rgba.b, rgba.a)); }}
            />
            <SliderRow
              label="G" value={rgba.g / 255} gradient={rgbGrad('g')}
              displayValue={String(rgba.g)}
              onChange={(v) => update(rgbaToHsva(rgba.r, Math.round(v * 255), rgba.b, rgba.a))}
              onDisplayChange={(raw) => { const n = parseInt(raw); if (!isNaN(n)) update(rgbaToHsva(rgba.r, clamp(n, 0, 255), rgba.b, rgba.a)); }}
            />
            <SliderRow
              label="B" value={rgba.b / 255} gradient={rgbGrad('b')}
              displayValue={String(rgba.b)}
              onChange={(v) => update(rgbaToHsva(rgba.r, rgba.g, Math.round(v * 255), rgba.a))}
              onDisplayChange={(raw) => { const n = parseInt(raw); if (!isNaN(n)) update(rgbaToHsva(rgba.r, rgba.g, clamp(n, 0, 255), rgba.a)); }}
            />
            <SliderRow
              label="A" value={hsva.a} gradient={alphaGrad()}
              displayValue={(hsva.a * 100).toFixed(0) + '%'}
              onChange={(v) => update({ ...hsva, a: v })}
              onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) update({ ...hsva, a: clamp(n / 100, 0, 1) }); }}
            />
          </div>

          {/* HSL */}
          <div class="space-y-2">
            <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">HSL</span>
            <SliderRow
              label="H" value={hsla.h / 360} gradient={HUE_GRADIENT}
              displayValue={hsla.h.toFixed(0) + '°'}
              onChange={(v) => updateHsla({ ...hsla, h: v * 360 })}
              onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) updateHsla({ ...hsla, h: clamp(n, 0, 360) }); }}
            />
            <SliderRow
              label="S" value={hsla.s} gradient={hslSGrad(hsla.h, hsla.l)}
              displayValue={(hsla.s * 100).toFixed(0) + '%'}
              onChange={(v) => updateHsla({ ...hsla, s: v })}
              onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) updateHsla({ ...hsla, s: clamp(n / 100, 0, 1) }); }}
            />
            <SliderRow
              label="L" value={hsla.l} gradient={hslLGrad(hsla.h, hsla.s)}
              displayValue={(hsla.l * 100).toFixed(0) + '%'}
              onChange={(v) => updateHsla({ ...hsla, l: v })}
              onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) updateHsla({ ...hsla, l: clamp(n / 100, 0, 1) }); }}
            />
          </div>

          {/* HSV */}
          <div class="space-y-2">
            <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">HSV</span>
            <SliderRow
              label="H" value={hsva.h / 360} gradient={HUE_GRADIENT}
              displayValue={hsva.h.toFixed(0) + '°'}
              onChange={(v) => update({ ...hsva, h: v * 360 })}
              onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) update({ ...hsva, h: clamp(n, 0, 360) }); }}
            />
            <SliderRow
              label="S" value={hsva.s} gradient={hsvSGrad(hsva.h, hsva.v)}
              displayValue={(hsva.s * 100).toFixed(0) + '%'}
              onChange={(v) => update({ ...hsva, s: v })}
              onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) update({ ...hsva, s: clamp(n / 100, 0, 1) }); }}
            />
            <SliderRow
              label="V" value={hsva.v} gradient={hsvVGrad(hsva.h)}
              displayValue={(hsva.v * 100).toFixed(0) + '%'}
              onChange={(v) => update({ ...hsva, v })}
              onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) update({ ...hsva, v: clamp(n / 100, 0, 1) }); }}
            />
          </div>

          {/* Advanced / OKLCH */}
          <div>
            <button
              class="flex items-center gap-1.5 text-xs text-base-content/50 hover:text-base-content transition-colors"
              onClick={() => setShowAdvanced(x => !x)}
            >
              <span class={`inline-block transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
              Advanced
            </button>
            {showAdvanced && (
              <div class="space-y-2 mt-3">
                <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">OKLCH</span>
                <SliderRow
                  label="L" value={oklch.l}
                  gradient={`linear-gradient(to right, oklch(0 ${oklch.c.toFixed(3)} ${oklch.h.toFixed(1)}), oklch(1 ${oklch.c.toFixed(3)} ${oklch.h.toFixed(1)}))`}
                  displayValue={oklch.l.toFixed(3)}
                  onChange={(v) => updateOklch({ ...oklch, l: v })}
                  onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) updateOklch({ ...oklch, l: clamp(n, 0, 1) }); }}
                  inputWidth="w-16"
                />
                <SliderRow
                  label="C" value={oklch.c / 0.4}
                  gradient={`linear-gradient(to right, oklch(${oklch.l.toFixed(3)} 0 ${oklch.h.toFixed(1)}), oklch(${oklch.l.toFixed(3)} 0.4 ${oklch.h.toFixed(1)}))`}
                  displayValue={oklch.c.toFixed(3)}
                  onChange={(v) => updateOklch({ ...oklch, c: v * 0.4 })}
                  onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) updateOklch({ ...oklch, c: clamp(n, 0, 0.4) }); }}
                  inputWidth="w-16"
                />
                <SliderRow
                  label="H" value={oklch.h / 360} gradient={HUE_GRADIENT}
                  displayValue={oklch.h.toFixed(1) + '°'}
                  onChange={(v) => updateOklch({ ...oklch, h: v * 360 })}
                  onDisplayChange={(raw) => { const n = parseFloat(raw); if (!isNaN(n)) updateOklch({ ...oklch, h: clamp(n, 0, 360) }); }}
                  inputWidth="w-16"
                />
              </div>
            )}
          </div>

        </div>
      </div>

      <HistoryPanel
        history={history}
        onSelect={(val) => { const parsed = parseColor(val); if (parsed) update(parsed); }}
        onClear={clear}
      />
    </div>
  );
}
