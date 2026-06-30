# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DeepPrism** is an open-source neural network visualization and interpretability platform (named "neuro-viz-studio" in the repo). It enables interactive exploration of deep learning model internals — activations, attention maps, embeddings, gradients, and pruning — via GPU-accelerated browser rendering.

The project is currently at **v0.1 (Foundation)** — the monorepo structure exists but service code has not yet been scaffolded.

## Architecture

Three-tier microservice architecture:

```
Frontend (React + Three.js)  ←→  REST / WebSocket / GraphQL
         ↕
Platform Service (NestJS)    ←→  HTTP / gRPC (future)
         ↕
AI Engine (FastAPI)          ←→  PyTorch · Captum · HuggingFace · Pruning · Streaming
```

### Services

| Service | Path | Port | Responsibility |
|---|---|---|---|
| Frontend | `frontend/` | 5173 | React 19 + Three.js visualization client |
| Platform Service | `backend/platform-service/` | 3000 | Auth, users, projects, workspaces, API gateway |
| AI Engine | `backend/ai-engine/` | 8000 | Model loading, inference, visualization, XAI, pruning |

Supporting infrastructure: PostgreSQL (5432), Redis (6379).

### Frontend internals (planned)
`src/` is organized as: `components/`, `features/`, `hooks/`, `layouts/`, `scenes/`, `shaders/`, `stores/`, `services/`, `types/`, `utils/`. 3D rendering uses React Three Fiber with custom GLSL shaders and instanced mesh for billion-parameter scale.

### AI Engine internals (planned)
`app/` is organized as: `api/`, `core/`, `models/`, `services/`, `visualization/`, `xai/`, `pruning/`, `streaming/`, `main.py`.

## Development Commands

### Frontend
```bash
cd frontend
npm install
npm run dev       # dev server at http://localhost:5173
npm run build
npm run lint
npm run test
```

### Platform Service (NestJS)
```bash
cd backend/platform-service
npm install
npm run start:dev           # dev server at http://localhost:3000
                            # Swagger at http://localhost:3000/api
npm test
npm run test:e2e
npm run test:cov
```

### AI Engine (FastAPI)
```bash
cd backend/ai-engine
uv sync
uv run uvicorn app.main:app --reload   # at http://localhost:8000
                                        # OpenAPI at http://localhost:8000/docs
uv run pytest
uv run pytest --cov=app --cov-report=term-missing
```

### Full stack via Docker (recommended)
```bash
docker compose up --build
docker compose logs -f [service-name]
docker compose down
```

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| 3D / GPU rendering | Three.js, React Three Fiber, GLSL |
| State management | Zustand |
| Platform backend | NestJS, TypeScript, Prisma, PostgreSQL |
| AI backend | FastAPI, Python 3.12+, SQLAlchemy, PostgreSQL |
| ML / XAI | PyTorch, Hugging Face Transformers, Captum |
| Streaming | WebSockets, Apache Arrow (binary serialization) |
| Cache | Redis |
| Python package manager | `uv` (not pip/poetry) |
| Node package manager | `npm` |

## Key Architectural Decisions

- **Binary tensor streaming**: Large tensor data flows over WebSockets serialized with Apache Arrow, not JSON.
- **GPU rendering targets**: 60+ FPS with instanced mesh + frustum culling; avoid per-frame CPU→GPU transfers.
- **XAI via Captum**: Saliency maps, Integrated Gradients, Layer Conductance run in the AI Engine; results are streamed to the frontend.
- **gRPC planned** for Platform Service ↔ AI Engine communication (currently HTTP).
- **`uv` for Python deps**: Use `uv sync` / `uv run` — do not use `pip install` or `python -m` directly.
