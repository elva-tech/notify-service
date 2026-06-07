# ELVA Notify Frontend

Documentation portal for ELVA Notify Platform v2. Built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, MDX, and Mermaid.

## Source of truth

All documentation content is read from `../docs/**/*.md` at build time. Do not duplicate markdown in this package.

## Manifests

Both generators run automatically before `dev` and `build`:

| Script | Output | Purpose |
|--------|--------|---------|
| `npm run generate:manifest` | `.generated/docs-manifest.json` | Markdown docs search, breadcrumbs, prev/next |
| `npm run generate:openapi` | `.generated/openapi-manifest.json` | API Reference pages and endpoint search |

OpenAPI source: `../backend/openapi/openapi.yaml`

Validate the spec (from repo root or frontend):

```bash
npm run openapi:validate
```

## API Reference

Interactive endpoint explorer: http://localhost:3000/api-reference

Built from the OpenAPI manifest. No Swagger UI on the backend.

## Local development

From repository root (recommended):

```bash
npm install          # root orchestrator (concurrently)
cd backend && npm install
cd frontend && npm install

npm run dev          # backend :4000 + frontend :3000
```

Or run separately:

```bash
npm run backend:dev  # http://localhost:4000
npm run frontend:dev # http://localhost:3000
```

Ensure `backend/.env` sets `PORT=4000` (see `backend/.env.example`).

Copy `frontend/.env.example` to `frontend/.env.local` and set the backend API origin:

```bash
# Local
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# Production
NEXT_PUBLIC_API_BASE_URL=https://api.notify.elvatech.in
```

The playground, platform metadata fetches, and rendered doc examples all use this value.

Open http://localhost:3000 for the landing page, http://localhost:3000/docs for documentation, and http://localhost:3000/api-reference for the API contract explorer.

## Production build

```bash
cd frontend
npm install
npm run build
npm run start
```

Output mode: `standalone` (independent deploy). Not coupled to Express `public/`.

## Deployment targets

| Target | Configuration |
|--------|---------------|
| `docs.notify.elvatech.in` | `NEXT_PUBLIC_BASE_PATH=` (empty) |
| `notify.elvatech.in/docs` | Reverse proxy `/docs` → Next app; optional `NEXT_PUBLIC_BASE_PATH=/docs` if entire app is mounted under prefix |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next dev server on port 3000 |
| `npm run build` | Generate manifest + production build |
| `npm run start` | Start production server |
| `npm run generate:manifest` | Regenerate `.generated/docs-manifest.json` |
| `npm run generate:openapi` | Regenerate `.generated/openapi-manifest.json` |
| `npm run openapi:validate` | Validate `backend/openapi/openapi.yaml` |
