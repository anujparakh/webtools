type ToolId = 'url' | 'json' | 'jwt'

interface TabBarProps {
  active: ToolId
  onChange: (id: ToolId) => void
}

const TABS: { id: ToolId; label: string }[] = [
  { id: 'url', label: 'URL Encoder' },
  { id: 'json', label: 'JSON Viewer' },
  { id: 'jwt', label: 'JWT Viewer' },
]

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div role="tablist" class="tabs tabs-bordered">
      {TABS.map(t => (
        <button
          key={t.id}
          role="tab"
          class={`tab ${active === t.id ? 'tab-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
