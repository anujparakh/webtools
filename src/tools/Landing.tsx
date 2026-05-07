import { navigate } from '../router'

const TOOLS = [
  {
    path: '/url-encoder',
    label: 'URL Encoder',
    subtitle: 'Encode, decode, and inspect URLs',
  },
  {
    path: '/url-builder',
    label: 'URL Builder',
    subtitle: 'Compose URLs with query parameters',
  },
  {
    path: '/json',
    label: 'JSON Viewer',
    subtitle: 'Parse, format, and explore JSON',
  },
  {
    path: '/jwt',
    label: 'JWT Viewer',
    subtitle: 'Decode and inspect JWT tokens',
  },
]

export function Landing() {
  return (
    <div class="min-h-screen flex flex-col items-center justify-center py-16 px-4">
      <div class="text-center mb-12 animate-breathe">
        <h1 class="text-4xl font-bold mb-3">Web Tools</h1>
        <p class="text-base-content/60">A collection of browser-based utilities for developers.</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        {TOOLS.map((tool, i) => (
          <button
            key={tool.path}
            class="animate-breathe bg-base-200 border border-base-300 hover:border-primary hover:bg-base-300 transition-all p-6 text-left rounded-xl"
            style={{ animationDelay: `${i * 0.4}s` }}
            onClick={() => navigate(tool.path)}
          >
            <div class="font-semibold mb-1">{tool.label}</div>
            <div class="text-sm text-base-content/50">{tool.subtitle}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
