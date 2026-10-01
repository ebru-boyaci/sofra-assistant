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

See `docs/decisions.md` and `src/` feature / domain / infrastructure folders.
