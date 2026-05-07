import { useState } from 'preact/hooks'
import { useToolHistory } from '../hooks/useToolHistory'
import { HistoryPanel } from '../components/HistoryPanel'
import { buildUrl, parseUrlForBuilder, type Param } from '../url-utils'

export function UrlBuilder() {
  const [baseUrl, setBaseUrl] = useState('')
  const [params, setParams] = useState<Param[]>([
    { id: crypto.randomUUID(), key: '', value: '', isJson: false, error: null },
  ])
  const [copied, setCopied] = useState(false)
  const { history, push, clear } = useToolHistory('webtools:url-builder:history')

  const updateParam = (id: string, patch: Partial<Param>) =>
    setParams(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)))

  const addParam = () =>
    setParams(prev => [
      ...prev,
      { id: crypto.randomUUID(), key: '', value: '', isJson: false, error: null },
    ])

  const removeParam = (id: string) =>
    setParams(prev => prev.filter(p => p.id !== id))

  const handleBaseUrlInput = (value: string) => {
    const parsed = parseUrlForBuilder(value)
    if (parsed && parsed.params.length > 0) {
      setBaseUrl(parsed.baseUrl)
      setParams(
        parsed.params.map(({ key, value: v }) => ({
          id: crypto.randomUUID(),
          key,
          value: v,
          isJson: false,
          error: null,
        }))
      )
    } else {
      setBaseUrl(value)
    }
  }

  const encodeParamValue = (id: string, value: string) => {
    updateParam(id, { value: encodeURIComponent(value), error: null })
  }

  const decodeParamValue = (id: string, value: string) => {
    try {
      updateParam(id, { value: decodeURIComponent(value), error: null })
    } catch {
      updateParam(id, { error: 'Invalid percent-encoding' })
    }
  }

  const { url: builtUrl, error } = buildUrl(baseUrl, params)

  const copy = async () => {
    if (!builtUrl) return
    await navigator.clipboard.writeText(builtUrl)
    push({ value: builtUrl, timestamp: Date.now() })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadFromHistory = (value: string) => {
    const parsed = parseUrlForBuilder(value)
    if (parsed && parsed.params.length > 0) {
      setBaseUrl(parsed.baseUrl)
      setParams(
        parsed.params.map(({ key, value: v }) => ({
          id: crypto.randomUUID(),
          key,
          value: v,
          isJson: false,
          error: null,
        }))
      )
    } else {
      setBaseUrl(value)
      setParams([{ id: crypto.randomUUID(), key: '', value: '', isJson: false, error: null }])
    }
  }

  return (
    <div class="space-y-4">
      <div>
        <label class="label label-text text-sm font-medium">Base URL</label>
        <input
          type="text"
          class="input input-bordered w-full font-mono focus:border-primary"
          placeholder="https://example.com/api  — paste a full URL to auto-fill params"
          value={baseUrl}
          onInput={e => handleBaseUrlInput((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="space-y-2">
        <label class="label label-text text-sm font-medium">Query Params</label>
        {params.map(p => (
          <div key={p.id} class="space-y-1">
            <div class="flex gap-2 items-start">
              <input
                type="text"
                class="input input-bordered input-sm font-mono w-36 shrink-0 focus:border-primary"
                placeholder="key"
                value={p.key}
                onInput={e =>
                  updateParam(p.id, { key: (e.target as HTMLInputElement).value })
                }
              />
              <textarea
                class="textarea textarea-bordered textarea-sm font-mono flex-1 min-h-[2.5rem] resize-y focus:border-primary"
                placeholder={p.isJson ? '{"key": "value"}' : 'value'}
                value={p.value}
                onInput={e =>
                  updateParam(p.id, {
                    value: (e.target as HTMLTextAreaElement).value,
                    error: null,
                  })
                }
              />
              <div class="flex flex-col gap-1 shrink-0 pt-1">
                <label class="flex items-center gap-1 cursor-pointer text-xs text-base-content/60">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-xs"
                    checked={p.isJson}
                    onChange={e =>
                      updateParam(p.id, { isJson: (e.target as HTMLInputElement).checked })
                    }
                  />
                  JSON
                </label>
                <button
                  class="btn btn-ghost btn-xs text-base-content/50"
                  title="Encode value"
                  onClick={() => encodeParamValue(p.id, p.value)}
                >
                  Enc
                </button>
                <button
                  class="btn btn-ghost btn-xs text-base-content/50"
                  title="Decode value"
                  onClick={() => decodeParamValue(p.id, p.value)}
                >
                  Dec
                </button>
                <button
                  class="btn btn-ghost btn-xs text-error"
                  onClick={() => removeParam(p.id)}
                  disabled={params.length === 1}
                >
                  ✕
                </button>
              </div>
            </div>
            {p.error && (
              <p class="text-xs text-error ml-[9.5rem]">{p.error}</p>
            )}
          </div>
        ))}
        <button class="btn btn-ghost btn-sm" onClick={addParam}>
          + Add param
        </button>
      </div>

      {error && (
        <div role="alert" class="alert alert-error text-sm py-2">
          <span>{error}</span>
        </div>
      )}

      {builtUrl && !error && (
        <div class="space-y-2">
          <pre class="bg-base-200 rounded-xl p-3 text-sm font-mono break-all whitespace-pre-wrap border border-base-300">
            {builtUrl}
          </pre>
          <button class="btn btn-sm btn-ghost" onClick={copy}>
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
        </div>
      )}

      <HistoryPanel history={history} onSelect={loadFromHistory} onClear={clear} />
    </div>
  )
}
