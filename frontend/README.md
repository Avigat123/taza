# Taza — Frontend

React + Vite + Tailwind dashboard for the Taza fresh-produce intelligence
platform. Built to plug into the backend/ML services your teammates are
building, per the project's `taza/` monorepo structure.

## Getting started

```bash
npm install
npm run dev       # local dev server
npm run build      # production build (already verified to pass)
```

## What's here

- **Dashboard** (`/`) — inventory overview, freshness trend, waste-avoided
  comparison, risk breakdown, priority batches, activity feed
- **Inspect Produce** (`/inspect`) — image upload + quality params ->
  full AI pipeline result (vision detection, freshness score, shelf life,
  spoilage risk)
- **Batches** (`/batches`, `/batches/:id`) — grid/table views with
  produce-type filtering, and a full batch detail page
- **Recommendations** (`/recommendations`) — decision-engine style action
  cards (sell / ship / discount / redirect)
- **Traceability** (`/traceability`) — batch-ID lookup -> digital passport
  with farm-to-retailer timeline
- **Ops Agent** (`/agent`) — chat interface for the AI operations agent

## Connecting to the real backend

Every file under `src/api/` has a `USE_MOCK = true` flag at the top and
inline comments describing the expected REST contract (method, path,
payload shape). Mock data lives in `src/data/mockData.js` and matches
those shapes exactly, so swapping to live data should be:

1. Set `VITE_API_BASE_URL` in a `.env` file (see `src/api/client.js`)
2. Flip `USE_MOCK` to `false` in the relevant `src/api/*.js` file
3. Confirm the real response shape matches what the mock returned

No component code should need to change.

## Design system

- Colors, fonts, and spacing tokens are defined in `tailwind.config.js`
- Palette: warm off-white background, deep forest green brand color,
  amber/red semantic risk colors
- Fonts: Fraunces (headings), Inter (UI text), IBM Plex Mono (all
  numeric/data values — scores, batch IDs, kg, percentages)
- Signature component: `src/components/ui/FreshnessRing.jsx` — a radial
  gauge used consistently for freshness scores across every page

## Adding real photos

See `PHOTO_PLACEHOLDERS.txt` in the project root — every image slot in
the UI is marked in code with a `PHOTO PLACEHOLDER` comment and explained
there.
