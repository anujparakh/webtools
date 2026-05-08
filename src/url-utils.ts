export interface Param {
  id: string
  key: string
  value: string
  isJson: boolean
  error: string | null
}

export function encodeUrlParams(input: string): string {
  const url = new URL(input)
  const rebuilt = new URL(url.origin + url.pathname)
  url.searchParams.forEach((value, key) => {
    rebuilt.searchParams.set(key, value)
  })
  if (url.hash) rebuilt.hash = url.hash
  return rebuilt.toString()
}

export function decodeUrlParams(input: string): string {
  const url = new URL(input)
  if (!url.search) return url.origin + url.pathname + url.hash
  const pairs = url.search.slice(1).split('&').map(pair => {
    const eqIdx = pair.indexOf('=')
    if (eqIdx === -1) return decodeURIComponent(pair)
    return `${decodeURIComponent(pair.slice(0, eqIdx))}=${decodeURIComponent(pair.slice(eqIdx + 1))}`
  })
  return url.origin + url.pathname + '?' + pairs.join('&') + url.hash
}

export function buildUrl(
  baseUrl: string,
  params: Param[]
): { url: string | null; error: string | null } {
  const active = params.filter(p => p.key.trim())
  if (!active.length) return { url: baseUrl || null, error: null }
  try {
    const parts = active.map(p => {
      let val = p.value;
      if (p.isJson) {
        try { val = JSON.stringify(JSON.parse(p.value)); } catch {}
      }
      return `${encodeURIComponent(p.key)}=${encodeURIComponent(val)}`
    })
    const sep = baseUrl.includes('?') ? '&' : '?'
    return { url: baseUrl + sep + parts.join('&'), error: null }
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : 'Build failed' }
  }
}

export function parseUrlForBuilder(
  raw: string
): { baseUrl: string; params: Array<{ key: string; value: string }> } | null {
  if (!raw.includes('?')) return null
  const qIdx = raw.indexOf('?')
  const baseUrl = raw.slice(0, qIdx)
  const search = raw.slice(qIdx + 1)
  try {
    const parsed = new URLSearchParams(search)
    const params = [...parsed.entries()].map(([key, value]) => ({ key, value }))
    return { baseUrl, params }
  } catch {
    return null
  }
}
