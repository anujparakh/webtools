import { useState } from 'preact/hooks'

export type JsonValue =
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
