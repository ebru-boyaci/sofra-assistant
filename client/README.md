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

## Accessibility

Built for keyboard-only paths (`sc_04`–`sc_05` / `sc_23`):

- **Focus:** `:focus-visible` ring (3px) on all interactive controls; skip link jumps to the composer.
- **Confirm:** real `<button type="button">` in tab order; **never auto-focused** when a prompt appears. Composer Enter submits a message only — it does not confirm.
- **States without colour alone:** gate / confirm / done / error / expired use text labels, icons/marks, and border style (solid / dashed / dotted), not hue alone.
- **After confirm:** prompt stays visible as inert **Confirmed / Done**; execute `nextBlocks` render under the prompt.

## UI polish

- Tokens + IBM Plex (Sans/Mono) loaded in `index.html`; CSS modules only (no inline styles).
- Shared `EmptyState` / `Skeleton` under `shared/ui` for calm empty/loading surfaces.
- Streaming `text` blocks reserve height with pulse lines so layout does not jump.
- Desktop shell: fixed `100dvh` app frame; chat scroll + sticky composer; sidebar independent scroll.

## Scenario walk (Phase 14)

With the mock running (`npm start` from repo root):

```bash
npm run walk              # all 24 rows + ledger checks
npm run walk -- sc_05     # one row
npm run check -- sc_05    # ledger only, after a manual UI pass
```

`scripts/walk-scenarios.mjs` drives chat/execute/status like a well-behaved client and runs `check-ledger` per row. **UI-only** expects (focus ring, keyboard-only Confirm, wallet flash) still need a quick eye-pass in the browser — especially `sc_23`.

## Audit inspector (`features/audit`)

Every assistant turn keeps the stream `audit` record plus Zod validation failures.

- **Where it lives:** sidebar inspector only (developers / reviewers).
- **What it shows:** `decision`, `reason`, `intent`, `tools_called`, `kb_doc_ids`, request id, turn status, and per-block validation failures (including rejected malformed confirmations).
- **Product UI decision:** we do **not** surface `audit.decision` in the chat transcript. Users already see the outcome through blocks (`verification_gate`, `confirmation_prompt`, plain text). Repeating internal decision labels in chat would double-signal, leak protocol vocabulary, and compete with the generative UI. The inspector remains the place for that taxonomy.
