import { useState } from 'preact/hooks'
import { useToolHistory } from '../hooks/useToolHistory'
import { HistoryPanel } from '../components/HistoryPanel'

type Mode = 'encoder' | 'builder'

function encodeUrlParams(input: string): string {
  const url = new URL(input)
  const rebuilt = new URL(url.origin + url.pathname)
  url.searchParams.forEach((value, key) => {
    rebuilt.searchParams.set(key, value)
  })
  if (url.hash) rebuilt.hash = url.hash
  return rebuilt.toString()
}

// ─── Encoder / Decoder ───────────────────────────────────────────────────────

function EncoderDecoder({
  input,
  onInputChange,
  onHistoryPush,
}: {
  input: string
  onInputChange: (v: string) => void
  onHistoryPush: (value: string) => void
}) {
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const run = (fn: () => string) => {
    setError(null)
    try {
      const result = fn()
      setOutput(result)
      onHistoryPush(input)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operation failed')
      setOutput('')
    }
  }

  const copy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div class="space-y-4">
      <textarea
        class="textarea textarea-bordered w-full font-mono h-32 resize-y"
        placeholder="Paste text or URL here…"
        value={input}
        onInput={e => onInputChange((e.target as HTMLTextAreaElement).value)}
      />
      <div class="flex flex-wrap gap-2">
        <button class="btn btn-sm btn-primary" onClick={() => run(() => encodeURIComponent(input))}>
          Encode Full
        </button>
        <button class="btn btn-sm btn-secondary" onClick={() => run(() => encodeUrlParams(input))}>
          Encode URL Params
        </button>
        <button class="btn btn-sm btn-accent" onClick={() => run(() => decodeURIComponent(input))}>
          Decode
        </button>
      </div>
      {error && (
        <div role="alert" class="alert alert-error text-sm py-2">
          <span>{error}</span>
        </div>
      )}
      {output && (
        <div class="space-y-2">
          <textarea
            class="textarea textarea-bordered w-full font-mono h-32 resize-y bg-base-200"
            readOnly
            value={output}
          />
          <button class="btn btn-sm btn-ghost" onClick={copy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── URL Builder ─────────────────────────────────────────────────────────────

interface Param {
  id: string
  key: string
  value: string
  isJson: boolean
}

function buildUrl(baseUrl: string, params: Param[]): { url: string | null; error: string | null } {
  const active = params.filter(p => p.key.trim())
  if (!active.length) return { url: baseUrl || null, error: null }
  try {
    const parts = active.map(p => {
      const encodedValue = p.isJson
        ? encodeURIComponent(JSON.stringify(JSON.parse(p.value)))
        : encodeURIComponent(p.value)
      return `${encodeURIComponent(p.key)}=${encodedValue}`
    })
    const sep = baseUrl.includes('?') ? '&' : '?'
    return { url: baseUrl + sep + parts.join('&'), error: null }
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : 'Build failed' }
  }
}

function UrlBuilder({ onHistoryPush }: { onHistoryPush: (value: string) => void }) {
  const [baseUrl, setBaseUrl] = useState('')
  const [params, setParams] = useState<Param[]>([
    { id: crypto.randomUUID(), key: '', value: '', isJson: false },
  ])
  const [copied, setCopied] = useState(false)

  const updateParam = (id: string, patch: Partial<Param>) =>
    setParams(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)))

  const addParam = () =>
    setParams(prev => [...prev, { id: crypto.randomUUID(), key: '', value: '', isJson: false }])

  const removeParam = (id: string) =>
    setParams(prev => prev.filter(p => p.id !== id))

  const { url: builtUrl, error } = buildUrl(baseUrl, params)

  const copy = async () => {
    if (!builtUrl) return
    await navigator.clipboard.writeText(builtUrl)
    onHistoryPush(builtUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div class="space-y-4">
      <div>
        <label class="label label-text text-sm font-medium">Base URL</label>
        <input
          type="text"
          class="input input-bordered w-full font-mono"
          placeholder="https://example.com/api"
          value={baseUrl}
          onInput={e => setBaseUrl((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="space-y-2">
        <label class="label label-text text-sm font-medium">Query Params</label>
        {params.map(p => (
          <div key={p.id} class="flex gap-2 items-start">
            <input
              type="text"
              class="input input-bordered input-sm font-mono w-36 shrink-0"
              placeholder="key"
              value={p.key}
              onInput={e => updateParam(p.id, { key: (e.target as HTMLInputElement).value })}
            />
            <textarea
              class="textarea textarea-bordered textarea-sm font-mono flex-1 min-h-[2.5rem] resize-y"
              placeholder={p.isJson ? '{"key": "value"}' : 'value'}
              value={p.value}
              onInput={e => updateParam(p.id, { value: (e.target as HTMLTextAreaElement).value })}
            />
            <div class="flex flex-col gap-1 shrink-0 pt-1">
              <label class="flex items-center gap-1 cursor-pointer text-xs text-base-content/60">
                <input
                  type="checkbox"
                  class="checkbox checkbox-xs"
                  checked={p.isJson}
                  onChange={e => updateParam(p.id, { isJson: (e.target as HTMLInputElement).checked })}
                />
                JSON
              </label>
              <button
                class="btn btn-ghost btn-xs text-error"
                onClick={() => removeParam(p.id)}
                disabled={params.length === 1}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button class="btn btn-ghost btn-sm" onClick={addParam}>+ Add param</button>
      </div>

      {error && (
        <div role="alert" class="alert alert-error text-sm py-2">
          <span>{error}</span>
        </div>
      )}

      {builtUrl && !error && (
        <div class="space-y-2">
          <pre class="bg-base-200 rounded-lg p-3 text-sm font-mono break-all whitespace-pre-wrap border border-base-300">
            {builtUrl}
          </pre>
          <button class="btn btn-sm btn-ghost" onClick={copy}>
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function UrlEncoder() {
  const [mode, setMode] = useState<Mode>('encoder')
  const [encoderInput, setEncoderInput] = useState('')
  const { history, push, clear } = useToolHistory('webtools:url:history')

  return (
    <div>
      <div role="tablist" class="tabs tabs-bordered mb-4">
        <button
          role="tab"
          class={`tab ${mode === 'encoder' ? 'tab-active' : ''}`}
          onClick={() => setMode('encoder')}
        >
          Encoder / Decoder
        </button>
        <button
          role="tab"
          class={`tab ${mode === 'builder' ? 'tab-active' : ''}`}
          onClick={() => setMode('builder')}
        >
          URL Builder
        </button>
      </div>

      {mode === 'encoder' ? (
        <EncoderDecoder
          input={encoderInput}
          onInputChange={setEncoderInput}
          onHistoryPush={value => push({ value, timestamp: Date.now() })}
        />
      ) : (
        <UrlBuilder onHistoryPush={value => push({ value, timestamp: Date.now() })} />
      )}

      <HistoryPanel
        history={history}
        onSelect={value => {
          setMode('encoder')
          setEncoderInput(value)
        }}
        onClear={clear}
      />
    </div>
  )
}
