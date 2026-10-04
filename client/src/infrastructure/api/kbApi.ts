import { apiJson } from './http'
import type { KbDocument } from './types'

export function getKbDocument(
  id: string,
  signal?: AbortSignal,
): Promise<KbDocument> {
  return apiJson<KbDocument>(`/api/kb/${encodeURIComponent(id)}`, { signal })
}
