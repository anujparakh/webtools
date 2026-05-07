import { useState } from "preact/hooks";
import type { ComponentChildren } from "preact";

export function CopyableBlock({
  text,
  children,
  onCopy,
}: {
  text: string;
  children: ComponentChildren;
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div class="relative">
      {children}
      <button
        class="absolute top-2 right-2 p-1.5 rounded text-base-content/40 hover:text-base-content/80 bg-base-300/60 hover:bg-base-300 transition-colors"
        onClick={copy}
        title={copied ? "Copied!" : "Copy"}
      >
        {copied ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}
