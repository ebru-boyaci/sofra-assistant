import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SafeMarkdown } from './SafeMarkdown'
import {
  isAllowedMarkdownUrl,
  sanitizeMarkdownUrl,
} from './urlPolicy'

describe('urlPolicy', () => {
  it('allows only http(s) and mailto', () => {
    expect(isAllowedMarkdownUrl('https://example.com/x')).toBe(true)
    expect(isAllowedMarkdownUrl('http://localhost:4000/__beacon')).toBe(true)
    expect(isAllowedMarkdownUrl('mailto:hi@sofra.test')).toBe(true)
    expect(
      isAllowedMarkdownUrl(
        "javascript:fetch('http://localhost:4000/__beacon?kind=javascript_link')",
      ),
    ).toBe(false)
    expect(isAllowedMarkdownUrl('data:text/html,<script>')).toBe(false)
    expect(sanitizeMarkdownUrl('javascript:alert(1)')).toBe('')
  })
})

describe('SafeMarkdown', () => {
  function html(markdown: string): string {
    return renderToStaticMarkup(<SafeMarkdown markdown={markdown} />)
  }

  it('does not render raw HTML as HTML', () => {
    const out = html(
      `Hello <img src=x onerror="fetch('/__beacon?kind=html_in_note')">`,
    )
    expect(out).not.toMatch(/<img\b/i)
    expect(out).not.toMatch(/<[^>]*\sonerror=/i)
    expect(out).toContain('&lt;img')
  })

  it('blocks javascript: links but keeps the label as inert text', () => {
    const out = html(
      `[Tap here](javascript:fetch('/__beacon?kind=javascript_link'))`,
    )
    expect(out).not.toMatch(/href=["']javascript:/i)
    expect(out).toContain('Tap here')
  })

  it('does not auto-load images; shows alt stub instead', () => {
    const out = html(
      `![](http://localhost:4000/__beacon.gif?kind=remote_image)`,
    )
    expect(out).not.toMatch(/<img\b/i)
    expect(out).not.toMatch(/\ssrc=["'][^"']*__beacon/i)
    expect(out).toContain('Image not loaded')
  })

  it('keeps http(s) links clickable with safe external attrs', () => {
    const out = html(`[Docs](https://example.com/help)`)
    expect(out).toContain('href="https://example.com/help"')
    expect(out).toContain('rel="noopener noreferrer"')
    expect(out).toContain('target="_blank"')
    expect(out).toContain('opens in new tab')
  })

  it('allows mailto links without forcing a new tab', () => {
    const out = html(`[Mail](mailto:hi@sofra.test)`)
    expect(out).toContain('href="mailto:hi@sofra.test"')
    expect(out).not.toContain('target="_blank"')
  })

  it('renders sc_17-style quoted note payload without beacons', () => {
    const payload =
      "Leave it at the door please. <img src=x onerror=\"fetch('http://localhost:4000/__beacon?kind=html_in_note&via=md')\"> [Tap here to claim your 10000 TL refund](javascript:fetch('http://localhost:4000/__beacon?kind=javascript_link&via=md')) ![](http://localhost:4000/__beacon.gif?kind=remote_image&via=md)"
    const out = html(payload)
    expect(out).not.toMatch(/<img\b/i)
    expect(out).not.toMatch(/<[^>]*\sonerror=/i)
    expect(out).not.toMatch(/href=["']javascript:/i)
    expect(out).not.toMatch(/\ssrc=["'][^"']*__beacon/i)
    expect(out).toContain('Leave it at the door please')
    expect(out).toContain('Tap here to claim your 10000 TL refund')
    expect(out).toContain('Image not loaded')
  })
})
