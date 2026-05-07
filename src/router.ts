import { useState, useEffect } from 'preact/hooks'

export function useRoute(): string {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const handler = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])
  return path
}

export function navigate(path: string): void {
  history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
