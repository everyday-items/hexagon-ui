# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hexagon Dev UI - A real-time debugging interface for the Hexagon AI Agent Framework. Provides event streaming, metrics monitoring, and agent execution visualization.

## Common Commands

```bash
npm run dev         # Start dev server at http://localhost:5173
npm run build       # Type check (vue-tsc) + production build
npm run preview     # Preview production build locally
npm run typecheck   # Run TypeScript type checking only
npm run copy        # Deploy built assets to ../observe/devui/static/
```

Note: The `lint` script is defined but ESLint is not installed as a dependency.

## Architecture

**Tech Stack**: Vue 3 + TypeScript + Vite

**Core Structure**:
- `src/App.vue` - Single-file root component containing the entire UI (three-panel layout: event sidebar, detail viewer, metrics panel)
- `src/composables/useSSE.ts` - SSE connection management for real-time event streaming from `/events` endpoint
- `src/composables/useMetrics.ts` - Metrics polling from `/api/metrics` (1s interval)
- `src/types/event.ts` - TypeScript interfaces for 14 event types (agent, LLM, tool, retriever, graph, state, error)

**Backend Integration**:
- Requires Hexagon backend at `localhost:8080`
- Vite proxies `/api/*` and `/events/*` to the backend during development
- Event buffer limited to 1000 items with auto-reconnect (3s delay)

**Path Alias**: `@` maps to `./src`
