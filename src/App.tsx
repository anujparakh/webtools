import { useState } from 'preact/hooks'
import { TabBar } from './components/TabBar'
import { UrlEncoder } from './tools/UrlEncoder'
import { JsonViewer } from './tools/JsonViewer'
import { JwtViewer } from './tools/JwtViewer'

type ToolId = 'url' | 'json' | 'jwt'

export function App() {
  const [activeTab, setActiveTab] = useState<ToolId>('url')

  return (
    <div class="min-h-screen bg-base-100 text-base-content">
      <div class="max-w-4xl mx-auto px-4 py-6">
        <h1 class="text-2xl font-bold mb-6">Web Tools</h1>
        <TabBar active={activeTab} onChange={setActiveTab} />
        <div class="mt-6">
          {activeTab === 'url' && <UrlEncoder />}
          {activeTab === 'json' && <JsonViewer />}
          {activeTab === 'jwt' && <JwtViewer />}
        </div>
      </div>
    </div>
  )
}
