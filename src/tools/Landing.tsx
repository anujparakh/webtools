import { navigate } from "../router";

const TOOLS: { path: string; label: string; subtitle: string; color: string; topGradient?: string }[] = [
  {
    path: "/url-encoder",
    label: "URL Encoder",
    subtitle: "Encode, decode, and inspect URLs",
    color: "#06b6d4",
  },
  {
    path: "/url-builder",
    label: "URL Builder",
    subtitle: "Compose URLs with query parameters",
    color: "#8b5cf6",
  },
  {
    path: "/json",
    label: "JSON Viewer",
    subtitle: "Parse, format, and explore JSON",
    color: "#6366f1",
  },
  {
    path: "/jwt",
    label: "JWT Viewer",
    subtitle: "Decode and inspect JWT tokens",
    color: "#3fb950",
  },
  {
    path: "/color",
    label: "Colors",
    subtitle: "Convert between hex, RGB, HSL, HSV, and OKLCH",
    color: "#e879f9",
    topGradient: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6, #ec4899)",
  },
];

export function Landing() {
  return (
    <div class="min-h-screen flex flex-col items-center justify-center py-16 px-4">
      <div class="relative text-center mb-12 animate-breathe">
        {/* Ambient glow behind heading */}
        <div
          class="absolute -inset-8 -z-10 rounded-full blur-3xl opacity-15"
          style={{
            background:
              "radial-gradient(ellipse, #6366f1 0%, #8b5cf6 50%, transparent 70%)",
          }}
        />
        <h1
          class="text-4xl font-bold mb-3"
          style={{
            background: "linear-gradient(to right, #6366f1, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Web Tools
        </h1>
        <p class="text-base-content/60">
          A collection of browser-based utilities for developers.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        {TOOLS.map((tool, i) => (
          <button
            key={tool.path}
            class="animate-breathe bg-base-200 border border-base-300 hover:bg-base-300 hover:border-base-content/20 transition-all p-6 text-left rounded-xl group relative overflow-hidden"
            style={{
              ...(tool.topGradient ? {} : { borderTopColor: tool.color, borderTopWidth: "2px" }),
              animationDelay: `${i * 0.4}s`,
            }}
            onClick={() => navigate(tool.path)}
          >
            {tool.topGradient && (
              <div class="absolute top-0 inset-x-0 h-0.5" style={{ background: tool.topGradient }} />
            )}
            <div
              class="font-semibold mb-1 transition-colors"
              style={{ color: tool.color }}
            >
              {tool.label}
            </div>
            <div class="text-sm text-base-content/50">{tool.subtitle}</div>
          </button>
        ))}
      </div>

      <p class="mt-12 text-xs text-base-content/30">
        Made by{" "}
        <a
          href="https://anujparakh.dev"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-base-content/60 transition-colors underline underline-offset-2"
        >
          Anuj Parakh
        </a>
      </p>
    </div>
  );
}
