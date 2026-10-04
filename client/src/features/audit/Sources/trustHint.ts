export type KbTrustFields = {
  id: string
  title: string
  tags: string[]
  date: string | null
}

export function kbTrustHint(doc: KbTrustFields): string | null {
  const tags = doc.tags.map((t) => t.toLocaleLowerCase('en-US'))
  const title = doc.title.toLocaleLowerCase('en-US')
  const id = doc.id.toLocaleLowerCase('en-US')

  if (
    tags.includes('archive') ||
    title.includes('(legacy)') ||
    title.includes('archive') ||
    id.endsWith('_old') ||
    id.endsWith('_v0')
  ) {
    return 'This document looks archived or superseded. Prefer a current source when one is also cited.'
  }

  if (doc.date == null || doc.date === '') {
    return 'This document has no date. Treat it as weaker evidence than a dated policy.'
  }

  return null
}

export function kbTrustBadge(doc: KbTrustFields): 'Archived' | 'Undated' | null {
  const hint = kbTrustHint(doc)
  if (hint == null) return null
  if (hint.includes('no date')) return 'Undated'
  return 'Archived'
}
