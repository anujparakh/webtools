import { useRef } from 'preact/hooks';

interface ColorSliderProps {
  value: number;
  onChange: (v: number) => void;
  gradient: string;
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
        class="relative flex-1 h-4 rounded-full cursor-pointer select-none"
        style={{
          background: `${gradient}, repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 8px 8px`,
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
