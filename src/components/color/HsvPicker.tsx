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
      class="relative w-full rounded-lg cursor-crosshair select-none"
      style={{
        aspectRatio: '1 / 0.6',
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
