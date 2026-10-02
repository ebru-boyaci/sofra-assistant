const ALLOWED_PROTOCOLS = /^(https?:|mailto:)/i

export function isAllowedMarkdownUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) return false
  try {
    const parsed = new URL(trimmed)
    return ALLOWED_PROTOCOLS.test(`${parsed.protocol}`)
  } catch {
    return false
  }
}

export function sanitizeMarkdownUrl(url: string): string {
  return isAllowedMarkdownUrl(url) ? url.trim() : ''
}

export function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
