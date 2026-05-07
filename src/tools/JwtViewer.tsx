import { useState } from 'preact/hooks'
import { useToolHistory } from '../hooks/useToolHistory'
import { HistoryPanel } from '../components/HistoryPanel'
import { JsonNode } from './JsonViewer'

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

interface DecodedJwt {
  header: JsonValue
  payload: JsonValue
  signature: string
}

function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4)
  return decodeURIComponent(escape(atob(padded)))
}

function tryDecodeJwt(raw: string): { data: DecodedJwt | null; error: string | null } {
  if (!raw.trim()) return { data: null, error: null }
  const parts = raw.trim().split('.')
  if (parts.length !== 3)
    return { data: null, error: `Invalid JWT: expected 3 dot-separated parts, got ${parts.length}` }
  try {
    return {
      data: {
        header: JSON.parse(base64urlDecode(parts[0])) as JsonValue,
        payload: JSON.parse(base64urlDecode(parts[1])) as JsonValue,
        signature: parts[2],
      },
      error: null,
    }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Decode failed' }
  }
}

const TIMESTAMP_CLAIMS = new Set(['exp', 'nbf', 'iat'])

function ClaimAnnotation({ claimKey, value }: { claimKey: string; value: JsonValue }) {
  if (!TIMESTAMP_CLAIMS.has(claimKey) || typeof value !== 'number') return null
  const date = new Date(value * 1000)
  const isExpired = claimKey === 'exp' && date < new Date()
  return (
    <div class={`text-xs ml-4 mt-0.5 font-mono ${isExpired ? 'text-error' : 'text-base-content/50'}`}>
      → {date.toISOString()}{isExpired ? ' (expired)' : ''}
    </div>
  )
}

function Section({ title, children }: { title: string; children: preact.ComponentChildren }) {
  return (
    <div class="space-y-2">
      <h3 class="text-sm font-semibold text-base-content/60 uppercase tracking-wider">{title}</h3>
      <div class="bg-base-200 rounded-lg p-4 font-mono text-sm overflow-auto max-h-64">
        {children}
      </div>
    </div>
  )
}

export function JwtViewer() {
  const [input, setInput] = useState('')
  const { history, push, clear } = useToolHistory('webtools:jwt:history')

  const { data: decoded, error } = tryDecodeJwt(input)

  if (decoded && input.trim()) {
    // Push to history on successful decode (deduplicated by the hook)
    // Use a ref to avoid pushing on every keystroke — push after a short stable period
    // For simplicity at this scale: just check if it's new in the push function (dedup handles it)
  }

  const handleInput = (value: string) => {
    setInput(value)
    const { data } = tryDecodeJwt(value)
    if (data) push({ value: value.trim(), timestamp: Date.now() })
  }

  const payloadEntries =
    decoded?.payload && typeof decoded.payload === 'object' && !Array.isArray(decoded.payload)
      ? Object.entries(decoded.payload as { [key: string]: JsonValue })
      : null

  return (
    <div>
      <div class="space-y-4">
        <textarea
          class="textarea textarea-bordered w-full font-mono h-28 resize-y break-all"
          placeholder="Paste a JWT token here… e.g. eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.sig"
          value={input}
          onInput={e => handleInput((e.target as HTMLTextAreaElement).value)}
        />

        {error && (
          <div role="alert" class="alert alert-error text-sm py-2">
            <span>{error}</span>
          </div>
        )}

        {decoded && (
          <div class="space-y-4">
            <Section title="Header">
              <JsonNode keyName={null} value={decoded.header} depth={0} />
            </Section>

            <Section title="Payload">
              <div>
                <JsonNode keyName={null} value={decoded.payload} depth={0} />
                {payloadEntries && (
                  <div class="mt-2 space-y-0.5">
                    {payloadEntries.map(([k, v]) => (
                      <ClaimAnnotation key={k} claimKey={k} value={v} />
                    ))}
                  </div>
                )}
              </div>
            </Section>

            <Section title="Signature">
              <pre class="break-all whitespace-pre-wrap text-base-content/60">{decoded.signature}</pre>
              <p class="text-xs text-base-content/40 mt-2 font-sans">
                Signature is not verified — client-side only
              </p>
            </Section>
          </div>
        )}
      </div>

      <HistoryPanel
        history={history}
        onSelect={setInput}
        onClear={clear}
      />
    </div>
  )
}
