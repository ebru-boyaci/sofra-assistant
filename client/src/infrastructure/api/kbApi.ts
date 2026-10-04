import { apiJson } from './http'
import type { KbDocument, KbSearchResponse } from './types'

export function getKbDocument(
  id: string,
  signal?: AbortSignal,
): Promise<KbDocument> {
  return apiJson<KbDocument>(`/api/kb/${encodeURIComponent(id)}`, { signal })
}

export function searchKb(
  params: {
    q: string
    category?: string
    limit?: number
    offset?: number
  },
  signal?: AbortSignal,
): Promise<KbSearchResponse> {
  const search = new URLSearchParams()
  search.set('q', params.q)
  if (params.category) search.set('category', params.category)
  if (params.limit != null) search.set('limit', String(params.limit))
  if (params.offset != null) search.set('offset', String(params.offset))
  return apiJson<KbSearchResponse>(`/api/kb/search?${search}`, { signal })
}
