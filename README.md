# Metal Dashboard (Web)

React + Vite dashboard for metals, ETFs, and the optical-cable static research page.

## Local Development

```bash
npm ci
npm run dev
```

Optional API base override:

```bash
VITE_API_BASE=https://your-worker-domain
```

## Build

```bash
npm run build
```

## Refresh Optical Snapshot

Regenerates `src/data/opticalCableSnapshot.ts` from Eastmoney market data:

```bash
npm run refresh:optical-snapshot
```

## GitHub Pages + Actions

This repo includes two workflows:

- `.github/workflows/deploy-pages.yml`
  - Trigger: push to `main` / manual dispatch
  - Builds with `VITE_BASE=/<repo-name>/`
  - Deploys `dist/` to GitHub Pages

- `.github/workflows/refresh-optical-snapshot.yml`
  - Trigger: daily at `01:10 UTC` (09:10 Beijing time) / manual dispatch
  - Refreshes static optical snapshot and commits back to `main`

### Required Repo Settings

1. GitHub Pages source: set to **GitHub Actions**.
2. Repository secret: `VITE_API_BASE`
   - Example: `https://<your-worker-domain>`
   - Used at build time so frontend API requests point to your Worker backend.
