# Sofra client

Web client for the Sofra frontend case study.

## Run

From repo root (two terminals):

```bash
npm start          # mock on http://localhost:4000
npm run client     # Vite on http://localhost:5173 (proxies /api → :4000)
```

Or from this folder: `npm run dev`

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + production build |
| `npm run test` | Vitest |
| `npm run lint` | Oxlint |
| `npm run preview` | Preview production build |

## Layout

`src/` is split into `app`, `features`, `domain`, `infrastructure`, `shared`, and `security`.

## Markdown security (`src/security`)

Untrusted CommonMark from `text.markdown` is rendered with **`react-markdown`**.

Defaults we rely on / override:

| Concern | Choice |
|---|---|
| Raw HTML | Not enabled: we do **not** use `rehype-raw`, so HTML in the source stays text |
| Link protocols | `urlTransform` allowlist: only `http:`, `https:`, `mailto:` — `javascript:`, `data:`, etc. become non-links |
| External links | `http(s)` open in a new tab with `rel="noopener noreferrer"` and a visible ↗ marker |
| Images | Custom `img` renderer — **no** network fetch; alt text stub only |
| Notes / non-markdown | `order_summary.note` and shell order notes stay plain text (React text nodes), never markdown |

`sc_17` payloads (`html_in_note`, `javascript_link`, `remote_image`) must leave `security_beacons === 0` in the mock ledger.

## Audit inspector (`features/audit`)

Every assistant turn keeps the stream `audit` record plus Zod validation failures.

- **Where it lives:** sidebar inspector only (developers / reviewers).
- **What it shows:** `decision`, `reason`, `intent`, `tools_called`, `kb_doc_ids`, request id, turn status, and per-block validation failures (including rejected malformed confirmations).
- **Product UI decision:** we do **not** surface `audit.decision` in the chat transcript. Users already see the outcome through blocks (`verification_gate`, `confirmation_prompt`, plain text). Repeating internal decision labels in chat would double-signal, leak protocol vocabulary, and compete with the generative UI. The inspector remains the place for that taxonomy.
