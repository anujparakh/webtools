import { useState } from 'preact/hooks'
import { useToolHistory } from '../hooks/useToolHistory'
import { HistoryPanel } from '../components/HistoryPanel'
import { encodeUrlParams, decodeUrlParams } from '../url-utils'

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
        class="textarea textarea-bordered w-full font-mono h-32 resize-y focus:border-primary"
        placeholder="Paste text or URL here…"
        value={input}
        onInput={e => onInputChange((e.target as HTMLTextAreaElement).value)}
      />
      <div class="flex flex-wrap gap-2">
        <button class="btn btn-sm btn-primary" onClick={() => run(() => encodeURIComponent(input))}>
          Encode Full
        </button>
        <button class="btn btn-sm btn-outline" onClick={() => run(() => encodeUrlParams(input))}>
          Encode URL Params
        </button>
        <button class="btn btn-sm btn-outline" onClick={() => run(() => decodeUrlParams(input))}>
          Decode URL Params
        </button>
        <button class="btn btn-sm btn-outline" onClick={() => run(() => decodeURIComponent(input))}>
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

export function UrlEncoder() {
  const [input, setInput] = useState('')
  const { history, push, clear } = useToolHistory('webtools:url:history')

  return (
    <div>
      <EncoderDecoder
        input={input}
        onInputChange={setInput}
        onHistoryPush={value => push({ value, timestamp: Date.now() })}
      />
      <HistoryPanel
        history={history}
        onSelect={value => setInput(value)}
        onClear={clear}
      />
    </div>
  )
}
