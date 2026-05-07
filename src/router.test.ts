import { describe, it, expect, beforeEach, vi } from 'vitest'
import { navigate } from './router'

describe('navigate', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/')
  })

  it('updates pathname', () => {
    navigate('/url-encoder')
    expect(window.location.pathname).toBe('/url-encoder')
  })

  it('dispatches a popstate event', () => {
    const handler = vi.fn()
    window.addEventListener('popstate', handler)
    navigate('/json')
    expect(handler).toHaveBeenCalledOnce()
    window.removeEventListener('popstate', handler)
  })
})
