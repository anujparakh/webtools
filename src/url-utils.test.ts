import { describe, it, expect } from 'vitest'
import { encodeUrlParams, decodeUrlParams, buildUrl, parseUrlForBuilder } from './url-utils'

describe('encodeUrlParams', () => {
  it('normalizes percent-encoding in param values', () => {
    const result = encodeUrlParams('https://example.com?q=hello%20world')
    expect(result).toContain('q=hello+world')
  })

  it('throws for non-URL input', () => {
    expect(() => encodeUrlParams('not a url')).toThrow()
  })
})

describe('decodeUrlParams', () => {
  it('decodes percent-encoded param keys and values', () => {
    const result = decodeUrlParams('https://example.com?q=hello%20world&foo=bar%21')
    expect(result).toBe('https://example.com/?q=hello world&foo=bar!')
  })

  it('returns input URL with normalized path when no query string', () => {
    const result = decodeUrlParams('https://example.com/path')
    expect(result).toBe('https://example.com/path')
  })

  it('throws for non-URL input', () => {
    expect(() => decodeUrlParams('not a url')).toThrow()
  })
})

describe('buildUrl', () => {
  it('appends encoded params to a base URL', () => {
    const result = buildUrl('https://example.com', [
      { id: '1', key: 'foo', value: 'bar', isJson: false, error: null },
    ])
    expect(result).toEqual({ url: 'https://example.com?foo=bar', error: null })
  })

  it('returns base URL when no params have keys', () => {
    const result = buildUrl('https://example.com', [
      { id: '1', key: '', value: '', isJson: false, error: null },
    ])
    expect(result).toEqual({ url: 'https://example.com', error: null })
  })

  it('returns error for invalid JSON param value', () => {
    const result = buildUrl('https://example.com', [
      { id: '1', key: 'data', value: '{bad json', isJson: true, error: null },
    ])
    expect(result.error).not.toBeNull()
    expect(result.url).toBeNull()
  })
})

describe('parseUrlForBuilder', () => {
  it('splits a URL with query string into base and params', () => {
    const result = parseUrlForBuilder('https://example.com?foo=bar&baz=qux')
    expect(result).toEqual({
      baseUrl: 'https://example.com',
      params: [
        { key: 'foo', value: 'bar' },
        { key: 'baz', value: 'qux' },
      ],
    })
  })

  it('returns null when no ? present', () => {
    expect(parseUrlForBuilder('https://example.com/path')).toBeNull()
  })

  it('handles partial URLs without a valid scheme', () => {
    const result = parseUrlForBuilder('/api/endpoint?token=abc')
    expect(result).toEqual({
      baseUrl: '/api/endpoint',
      params: [{ key: 'token', value: 'abc' }],
    })
  })
})
