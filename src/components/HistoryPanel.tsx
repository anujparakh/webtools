import { useState } from "preact/hooks";
import type { HistoryEntry } from "../hooks/useToolHistory";

interface HistoryPanelProps {
  history: HistoryEntry[];
  onSelect: (value: string) => void;
  onClear: () => void;
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function truncate(str: string, max = 80): string {
  const single = str.replace(/\s+/g, " ").trim();
  return single.length > max ? single.slice(0, max) + "…" : single;
}

export function HistoryPanel({
  history,
  onSelect,
  onClear,
}: HistoryPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div class="mt-4 border border-base-300 rounded-lg bg-base-100">
      <button
        class="w-full flex items-center justify-between px-4 py-2 text-sm text-base-content/70 hover:text-base-content transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span class="font-medium">
          History {history.length > 0 && `(${history.length})`}
        </span>
        <span class="text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div class="border-t border-base-300">
          {history.length === 0 ? (
            <p class="px-4 py-3 text-sm text-base-content/40 italic">
              No history yet
            </p>
          ) : (
            <>
              <div class="max-h-48 overflow-y-auto">
                {history.map((entry, i) => (
                  <button
                    key={i}
                    class="w-full text-left px-4 py-2 text-sm hover:bg-base-300 transition-colors flex items-center justify-between gap-4 group"
                    onClick={() => onSelect(entry.value)}
                  >
                    <span class="font-mono text-base-content/80 truncate flex-1">
                      {truncate(entry.label ?? entry.value)}
                    </span>
                    <span class="text-xs text-base-content/40 shrink-0">
                      {timeAgo(entry.timestamp)}
                    </span>
                  </button>
                ))}
              </div>
              <div class="border-t border-base-300 px-4 py-2">
                <button
                  class="text-xs text-error hover:underline"
                  onClick={onClear}
                >
                  Clear history
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
