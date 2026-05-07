import { useRoute } from './router'
import { Sidebar } from './components/Sidebar'
import { Landing } from './tools/Landing'
import { UrlEncoder } from './tools/UrlEncoder'
import { UrlBuilder } from './tools/UrlBuilder'
import { JsonViewer } from './tools/JsonViewer'
import { JwtViewer } from './tools/JwtViewer'

export function App() {
  const path = useRoute()
  const isLanding = path === '/'

  return (
    <div class="min-h-screen bg-base-100 text-base-content flex flex-col md:flex-row">
      {!isLanding && <Sidebar currentPath={path} />}
      <main class="flex-1 min-w-0">
        {isLanding ? (
          <Landing />
        ) : (
          <div class="px-4 py-6">
            <div class="max-w-3xl mx-auto rounded-xl border border-base-300 bg-base-100 p-6">
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
