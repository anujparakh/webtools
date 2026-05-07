import { navigate } from '../router'

const TOOLS = [
  { path: '/url-encoder', label: 'URL Encoder' },
  { path: '/url-builder', label: 'URL Builder' },
  { path: '/json', label: 'JSON Viewer' },
  { path: '/jwt', label: 'JWT Viewer' },
]

interface SidebarProps {
  currentPath: string
}

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <>
      {/* Desktop left rail */}
      <aside class="hidden md:flex flex-col w-52 min-h-screen bg-base-200 border-r border-base-300 p-4 shrink-0">
        <button
          class="text-lg font-bold mb-6 text-left hover:text-primary transition-colors"
          onClick={() => navigate('/')}
        >
          Web Tools
        </button>
        <nav class="flex flex-col gap-1">
          {TOOLS.map(t => (
            <button
              key={t.path}
              class={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                currentPath === t.path
                  ? 'bg-primary text-primary-content font-medium'
                  : 'text-base-content/60 hover:text-base-content hover:bg-base-300'
              }`}
              onClick={() => navigate(t.path)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div class="md:hidden bg-base-200 border-b border-base-300 px-3 py-2">
        <div class="flex items-center gap-2 overflow-x-auto">
          <button
            class="font-bold text-sm shrink-0 mr-1 hover:text-primary transition-colors"
            onClick={() => navigate('/')}
          >
            Web Tools
          </button>
          {TOOLS.map(t => (
            <button
              key={t.path}
              class={`shrink-0 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                currentPath === t.path
                  ? 'bg-primary text-primary-content font-medium'
                  : 'text-base-content/60 hover:text-base-content hover:bg-base-300'
              }`}
              onClick={() => navigate(t.path)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
