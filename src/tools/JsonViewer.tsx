import { useState } from 'preact/hooks'
import { useToolHistory } from '../hooks/useToolHistory'
import { HistoryPanel } from '../components/HistoryPanel'

// ─── JsonNode ─────────────────────────────────────────────────────────────────

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

function isPrimitive(v: JsonValue): boolean {
  return v === null || typeof v !== 'object'
}

function renderPrimitive(v: string | number | boolean | null): string {
  if (v === null) return 'null'
  if (typeof v === 'string') return `"${v}"`
  return String(v)
}

function primitiveClass(v: string | number | boolean | null): string {
  if (v === null) return 'text-gray-500'
  if (typeof v === 'string') return 'text-green-400'
  if (typeof v === 'number') return 'text-blue-400'
  if (typeof v === 'boolean') return 'text-orange-400'
  return ''
}

interface JsonNodeProps {
  keyName: string | null
  value: JsonValue
  depth: number
}

export function JsonNode({ keyName, value, depth }: JsonNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 2)

  const keyEl = keyName !== null ? (
    <span class="text-purple-400">"{keyName}"</span>
  ) : null

  const colon = keyName !== null ? <span class="text-base-content/50">: </span> : null

  if (isPrimitive(value as JsonValue)) {
    const prim = value as string | number | boolean | null
    return (
      <div class="leading-6">
        {keyEl}{colon}
        <span class={primitiveClass(prim)}>{renderPrimitive(prim)}</span>
      </div>
    )
  }

  const isArray = Array.isArray(value)
  const entries = isArray
    ? (value as JsonValue[]).map((v, i) => ({ k: String(i), v }))
    : Object.entries(value as { [key: string]: JsonValue }).map(([k, v]) => ({ k, v }))

  const open = isArray ? '[' : '{'
  const close = isArray ? ']' : '}'
  const summary = isArray
    ? `[ ${entries.length} item${entries.length !== 1 ? 's' : ''} ]`
    : `{ ${entries.length} key${entries.length !== 1 ? 's' : ''} }`

  return (
    <div class="leading-6">
      <span>
        {keyEl}{colon}
        <button
          class="select-none cursor-pointer mr-1 text-base-content/60 hover:text-base-content"
          onClick={() => setIsOpen(o => !o)}
        >
          {isOpen ? '▾' : '▸'}
        </button>
        {!isOpen && (
          <span class="text-base-content/40 text-sm">{summary}</span>
        )}
        {isOpen && <span class="text-base-content/70">{open}</span>}
      </span>
      {isOpen && (
        <>
          <div class="pl-4 border-l border-base-300/50">
            {entries.map(({ k, v }) => (
              <JsonNode key={k} keyName={isArray ? null : k} value={v} depth={depth + 1} />
            ))}
          </div>
          <span class="text-base-content/70">{close}</span>
        </>
      )}
    </div>
  )
}

// ─── JsonViewer ───────────────────────────────────────────────────────────────

type ViewMode = 'tree' | 'formatted' | 'minified'

export function JsonViewer() {
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState<JsonValue | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [copied, setCopied] = useState(false)
  const { history, push, clear } = useToolHistory('webtools:json:history')

  const parse = () => {
    setParseError(null)
    try {
      const result = JSON.parse(input) as JsonValue
      setParsed(result)
      push({ value: input, timestamp: Date.now() })
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON')
      setParsed(null)
    }
  }

  const getOutput = (): string => {
    if (!parsed) return ''
    if (viewMode === 'formatted') return JSON.stringify(parsed, null, 2)
    if (viewMode === 'minified') return JSON.stringify(parsed)
    return ''
  }

  const copy = async () => {
    const text = viewMode === 'tree' ? input : getOutput()
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadFromHistory = (value: string) => {
    setInput(value)
    setParsed(null)
    setParseError(null)
  }

  return (
    <div>
      <div class="space-y-4">
        <textarea
          class="textarea textarea-bordered w-full font-mono h-40 resize-y"
          placeholder='Paste JSON here… e.g. {"key": "value"}'
          value={input}
          onInput={e => setInput((e.target as HTMLTextAreaElement).value)}
        />

        <div class="flex flex-wrap gap-2">
          <button class="btn btn-sm btn-primary" onClick={parse}>Parse</button>
          {parsed && (
            <>
              <button class="btn btn-sm btn-ghost" onClick={() => setViewMode('tree')}>Tree</button>
              <button class="btn btn-sm btn-ghost" onClick={() => setViewMode('formatted')}>Format</button>
              <button class="btn btn-sm btn-ghost" onClick={() => setViewMode('minified')}>Minify</button>
              <button class="btn btn-sm btn-ghost" onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
            </>
          )}
        </div>

        {parseError && (
          <div role="alert" class="alert alert-error text-sm py-2">
            <span>{parseError}</span>
          </div>
        )}

        {parsed !== null && (
          <>
            <div class="flex gap-2 border-b border-base-300 pb-2">
              {(['tree', 'formatted', 'minified'] as ViewMode[]).map(m => (
                <button
                  key={m}
                  class={`text-sm px-2 py-1 rounded transition-colors ${viewMode === m ? 'bg-base-300 text-base-content' : 'text-base-content/50 hover:text-base-content'}`}
                  onClick={() => setViewMode(m)}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            {viewMode === 'tree' ? (
              <div class="bg-base-200 rounded-lg p-4 font-mono text-sm overflow-auto max-h-[60vh]">
                <JsonNode keyName={null} value={parsed} depth={0} />
              </div>
            ) : (
              <textarea
                class="textarea textarea-bordered w-full font-mono text-sm h-64 resize-y bg-base-200"
                readOnly
                value={getOutput()}
              />
            )}
          </>
        )}
      </div>

      <HistoryPanel history={history} onSelect={loadFromHistory} onClear={clear} />
    </div>
  )
}
