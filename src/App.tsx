import { useRoute } from './router'
import { Sidebar } from './components/Sidebar'
import { Landing } from './tools/Landing'
import { UrlEncoder } from './tools/UrlEncoder'
import { UrlBuilder } from './tools/UrlBuilder'
import { JsonViewer } from './tools/JsonViewer'
import { JwtViewer } from './tools/JwtViewer'

const TOOL_META: Record<string, { label: string; color: string }> = {
  '/url-encoder': { label: 'URL Encoder', color: '#6366f1' },
  '/url-builder': { label: 'URL Builder', color: '#8b5cf6' },
  '/json':        { label: 'JSON Viewer', color: '#06b6d4' },
  '/jwt':         { label: 'JWT Viewer',  color: '#3fb950' },
}

export function App() {
  const path = useRoute()
  const isLanding = path === '/'
  const meta = TOOL_META[path]

  return (
    <div class="min-h-screen bg-base-100 text-base-content flex flex-col md:flex-row">
      {!isLanding && <Sidebar currentPath={path} />}
      <main class="flex-1 min-w-0">
        {isLanding ? (
          <Landing />
        ) : (
          <div class="px-4 py-6">
            <div
              class="max-w-3xl mx-auto rounded-xl border border-base-300 bg-base-200 p-6"
              style={meta ? ({ '--card-color': meta.color, borderTopColor: meta.color, borderTopWidth: '2px' }) as any : undefined}
            >
              {meta && (
                <h1 class="text-base font-semibold mb-5" style={{ color: meta.color }}>
                  {meta.label}
                </h1>
              )}
              {path === '/url-encoder' && <UrlEncoder />}
              {path === '/url-builder' && <UrlBuilder />}
              {path === '/json' && <JsonViewer />}
              {path === '/jwt' && <JwtViewer />}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
