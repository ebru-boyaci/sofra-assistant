import { KbDocumentDialog, kbTrustBadge } from '@/features/audit'
import {
  ApiError,
  getKbDocument,
  searchKb,
  type KbSearchHit,
  type KbSearchResponse,
} from '@/infrastructure/api'
import { Button, EmptyState, Skeleton } from '@/shared/ui'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import shell from '../../shell/Shell.module.css'
import styles from './HelpPanel.module.css'

const PAGE_SIZE = 20

async function searchOrLookupById(
  q: string,
  offset: number,
  signal?: AbortSignal,
): Promise<KbSearchResponse> {
  const page = await searchKb({ q, limit: PAGE_SIZE, offset }, signal)
  if (page.total > 0 || offset > 0) return page

  try {
    const doc = await getKbDocument(q, signal)
    const hit: KbSearchHit = {
      id: doc.id,
      title: doc.title,
      category: doc.category,
      date: doc.date,
      tags: doc.tags,
      snippet: doc.body.slice(0, 180),
      score: 1,
    }
    return { total: 1, offset: 0, results: [hit] }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return page
    throw error
  }
}

export function HelpPanel() {
  const [draft, setDraft] = useState('delivery fee')
  const [query, setQuery] = useState('delivery fee')
  const [offset, setOffset] = useState(0)
  const [searchNonce, setSearchNonce] = useState(0)
  const [hits, setHits] = useState<KbSearchHit[]>([])
  const [openId, setOpenId] = useState<string | null>(null)

  const search = useQuery({
    queryKey: ['kb-search', query, offset, searchNonce],
    queryFn: ({ signal }) => searchOrLookupById(query, offset, signal),
    enabled: query.trim().length > 0,
  })

  useEffect(() => {
    if (!search.data) return
    if (offset === 0) {
      setHits(search.data.results)
      return
    }
    setHits((prev) => {
      const seen = new Set(prev.map((hit) => hit.id))
      const extra = search.data.results.filter((hit) => !seen.has(hit.id))
      return extra.length === 0 ? prev : [...prev, ...extra]
    })
  }, [search.data, offset])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next = draft.trim()
    if (!next) return
    setHits([])
    setOffset(0)
    setQuery(next)
    setSearchNonce((value) => value + 1)
  }

  const total = search.data?.total ?? 0
  const canLoadMore = hits.length < total && !search.isFetching
  const showEmpty =
    search.isSuccess &&
    !search.isFetching &&
    hits.length === 0 &&
    query.trim().length > 0

  return (
    <section className={shell.panel} aria-label="Help center">
      <div className={shell.panelHead}>
        <h2 className={shell.panelTitle}>Help</h2>
      </div>

      <p className={styles.hint}>
        Search the Sofra knowledge base. Archived or undated docs are marked —
        prefer a current policy when both appear.
      </p>

      <form className={styles.searchRow} onSubmit={onSubmit}>
        <input
          className={styles.input}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search help… (try istanbul)"
          aria-label="Search help center"
        />
        <Button type="submit" variant="primary" className={styles.submit}>
          Search
        </Button>
      </form>

      {(search.isPending || search.isFetching) && hits.length === 0 && (
        <Skeleton lines={4} label="Searching knowledge base" />
      )}
      {search.isError && (
        <p className={styles.status} role="alert">
          Could not search the knowledge base.
        </p>
      )}

      {showEmpty && (
        <EmptyState title="No results" hint="Try another phrase." />
      )}

      {hits.length > 0 && (
        <>
          <p className={styles.meta} aria-live="polite">
            {total} result{total === 1 ? '' : 's'} for “{query}”
          </p>
          <ul className={styles.list}>
            {hits.map((hit) => {
              const badge = kbTrustBadge(hit)
              return (
                <li key={hit.id}>
                  <button
                    type="button"
                    className={styles.hit}
                    onClick={() => setOpenId(hit.id)}
                  >
                    <div className={styles.hitHead}>
                      <p className={styles.title}>{hit.title}</p>
                      {badge ? (
                        <span className={styles.badge}>{badge}</span>
                      ) : null}
                    </div>
                    <p className={styles.hitMeta}>
                      {hit.id}
                      {hit.category ? ` · ${hit.category}` : ''}
                      {hit.date ? ` · ${hit.date}` : ''}
                    </p>
                    <p className={styles.snippet}>{hit.snippet}</p>
                  </button>
                </li>
              )
            })}
          </ul>
          {canLoadMore ? (
            <Button
              type="button"
              variant="secondary"
              className={styles.more}
              onClick={() => setOffset((value) => value + PAGE_SIZE)}
            >
              Load more
            </Button>
          ) : null}
        </>
      )}

      {openId != null ? (
        <KbDocumentDialog docId={openId} onClose={() => setOpenId(null)} />
      ) : null}
    </section>
  )
}
