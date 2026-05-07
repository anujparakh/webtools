import { useState } from 'preact/hooks'
import { useToolHistory } from '../hooks/useToolHistory'
import { HistoryPanel } from '../components/HistoryPanel'
import { CopyableBlock } from '../components/CopyableBlock'

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
  defaultOpen?: boolean
}

export function JsonNode({ keyName, value, depth, defaultOpen }: JsonNodeProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen !== undefined ? defaultOpen : depth < 2)

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
              <JsonNode key={k} keyName={isArray ? null : k} value={v} depth={depth + 1} defaultOpen={defaultOpen} />
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
  const [treeKey, setTreeKey] = useState(0)
  const [treeDefaultOpen, setTreeDefaultOpen] = useState<boolean | undefined>(undefined)
  const { history, push, clear } = useToolHistory('webtools:json:history')

  const parse = () => {
    setParseError(null)
    try {
      const result = JSON.parse(input) as JsonValue
      const formatted = JSON.stringify(result, null, 2)
      setParsed(result)
      setInput(formatted)
      setTreeKey(k => k + 1)
      setTreeDefaultOpen(undefined)
      push({ value: formatted, timestamp: Date.now() })
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON')
      setParsed(null)
    }
  }

  const collapseTree = () => {
    setViewMode('tree')
    setTreeKey(k => k + 1)
    setTreeDefaultOpen(false)
  }

  const getOutput = (): string => {
    if (!parsed) return ''
    if (viewMode === 'formatted') return JSON.stringify(parsed, null, 2)
    if (viewMode === 'minified') return JSON.stringify(parsed)
    return ''
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
          class="textarea textarea-bordered w-full font-mono min-h-[10rem] resize-y"
          placeholder='Paste JSON here… e.g. {"key": "value"}'
          value={input}
          onInput={e => setInput((e.target as HTMLTextAreaElement).value)}
        />

        <div class="flex flex-wrap gap-2">
          <button class="btn-tool" onClick={parse}>Parse</button>
          {parsed && (
            <>
              <button class="btn-tool" style={viewMode === 'tree' ? { opacity: 1 } : { opacity: 0.45 }} onClick={() => setViewMode('tree')}>Tree</button>
              <button class="btn-tool" style={viewMode === 'formatted' ? { opacity: 1 } : { opacity: 0.45 }} onClick={() => setViewMode('formatted')}>Format</button>
              <button class="btn-tool" style={viewMode === 'minified' ? { opacity: 1 } : { opacity: 0.45 }} onClick={() => setViewMode('minified')}>Minify</button>
              <button class="btn-tool" onClick={collapseTree}>Collapse</button>
            </>
          )}
        </div>

        {parseError && (
          <div role="alert" class="alert alert-error text-sm py-2">
            <span>{parseError}</span>
          </div>
        )}

        {parsed !== null && (
          viewMode === 'tree' ? (
            <CopyableBlock text={input}>
              <div class="bg-base-300 rounded-lg p-4 font-mono text-sm overflow-auto max-h-[60vh]">
                <JsonNode key={treeKey} defaultOpen={treeDefaultOpen} keyName={null} value={parsed} depth={0} />
              </div>
            </CopyableBlock>
          ) : (
            <CopyableBlock text={getOutput()}>
              <textarea
                class="textarea textarea-bordered w-full font-mono text-sm min-h-[16rem] resize-y"
                readOnly
                value={getOutput()}
              />
            </CopyableBlock>
          )
        )}
      </div>

      <HistoryPanel history={history} onSelect={loadFromHistory} onClear={clear} />
    </div>
  )
}
