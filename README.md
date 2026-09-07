# InsightForge

**Drop in data. Build the story automatically.**

AI-native infinite canvas for automated data analysis. Upload unfamiliar spreadsheets, get automatic profiling and analysis, and control your analytical workspace manually or via AI.

## Quick start

```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Copy environment config
cp .env.example .env

# Run API (port 8765) + web (port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind, React Flow, TanStack Query
- **Backend:** FastAPI, Pydantic, Polars
- **Storage:** Local filesystem (`data/runtime/`)

## Project structure

```text
apps/web/          Next.js frontend
apps/api/          FastAPI backend
packages/analysis-engine/   Shared Python models & analysis pipeline
data/samples/      Demo and test fixtures
tests/             Unit and E2E tests
```

## Development status

- [x] Phase 1: Monorepo shell, workspace CRUD, three-column UI
- [x] Phase 2: React Flow canvas, commands, context menus, persistence
- [x] Phase 3: Dataset upload + profile preview
- [ ] Phase 4–12: Analysis engine, auto-canvas, agent, polish

See [`insightforge_mvp_build_plan.md`](insightforge_mvp_build_plan.md) for the full roadmap.
