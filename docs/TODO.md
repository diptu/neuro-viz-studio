# DeepPrism — CNN Implementation TODO
> Phase 1: LeNet-5 · Extensible registry pattern throughout · Short tasks, one concern each

---

## Extensibility Contract
All CNN work follows two rules:
- **AI Engine** — new models register in `MODEL_REGISTRY`; new extractors implement `BaseExtractor`
- **Frontend** — new layer types register in `LAYER_RENDERER_REGISTRY`; new panels register in `PANEL_REGISTRY`
No core files need editing to add a new model or layer type.

---

## [A] Shared Contracts  `backend/shared/contracts/`
- [ ] `layer.schema.ts` — `LayerType` enum (Conv2d | MaxPool2d | AvgPool2d | Linear | ReLU | Tanh | Flatten)
- [ ] `layer.schema.ts` — `LayerSchema` { id, type, inputShape, outputShape, params }
- [ ] `model.schema.ts` — `ModelConfig` { id, name, inputShape, layers[], edges[] }
- [ ] `tensor.schema.ts` — `TensorPayload` { layerId, shape, dtype, data: ArrayBuffer }
- [ ] `activation.schema.ts` — `ActivationMap` { layerId, channels: Float32Array[], shape }
- [ ] `inference.schema.ts` — `InferenceRequest` / `InferenceResult`
- [ ] `ws.schema.ts` — discriminated union `StreamMessage` (layer_activation | inference_done | error)

---

## [B] AI Engine — Model Layer  `backend/ai-engine/app/models/`
- [ ] `base.py` — `VisualizableModel(nn.Module)` with hook registry + `get_config() -> ModelConfig`
- [ ] `lenet5.py` — LeNet-5 extending `VisualizableModel` (C1→S2→C3→S4→C5→F6→Output) 🔌 first entry
- [ ] `registry.py` — `MODEL_REGISTRY: dict[str, type[VisualizableModel]]` + `register()` decorator 🔌
- [ ] `registry.py` — register LeNet-5 as `"lenet5"` on import

---

## [C] AI Engine — Service Layer  `backend/ai-engine/app/services/`
- [ ] `hook_service.py` — attach/detach forward hooks per layer, store to `activation_cache`
- [ ] `extraction_service.py` — `BaseExtractor` ABC + Arrow serializer for float32 tensors 🔌
- [ ] `weight_service.py` — serialize conv kernels + fc weights to Arrow
- [ ] `inference_service.py` — orchestrate: load model → attach hooks → forward → collect → serialize

---

## [D] AI Engine — API Layer  `backend/ai-engine/app/api/v1/`
- [ ] `models.py` — `GET /api/v1/models` list registry, `GET /api/v1/models/{id}/config` return graph
- [ ] `inference.py` — `POST /api/v1/models/{id}/infer` run forward pass, return all activations
- [ ] `weights.py` — `GET /api/v1/models/{id}/weights/{layer_id}` return Arrow bytes
- [ ] `ws.py` — `WS /ws/stream/{model_id}` stream activation per layer as forward hook fires
- [ ] `app/core/config.py` — settings (CORS origins, Redis URL, model path)
- [ ] `app/main.py` — FastAPI app factory, register routers, lifespan startup

---

## [E] Platform Backend — Model Registry  `backend/platform-service/src/models/`
- [ ] `prisma/schema.prisma` — `Model`, `Layer`, `InferenceSession` entities
- [ ] `models.dto.ts` — `RegisterModelDto`, `ModelMetaDto`
- [ ] `models.service.ts` — proxy register/list to AI engine, persist metadata in Postgres
- [ ] `models.controller.ts` — `GET/POST /api/v1/models`
- [ ] `models.module.ts` — wire up and export

---

## [F] Frontend — Stores  `frontend/src/stores/`
- [ ] `useModelStore.ts` — active `ModelConfig`, selected `layerId`, layer graph map
- [ ] `useActivationStore.ts` — `Map<layerId, ActivationMap>`, streaming flag
- [ ] `useInferenceStore.ts` — inference status (idle | running | done | error), input image data
- [ ] `useUIStore.ts` — inspector open, active panel, view mode (3d | flat)

---

## [G] Frontend — Services  `frontend/src/services/`
- [ ] `api.ts` — typed fetch client for AI engine (base URL from env)
- [ ] `wsClient.ts` — singleton WebSocket, typed `StreamMessage` dispatch, reconnect logic
- [ ] `tensorDecoder.ts` — `ArrayBuffer → Float32Array[]` channel splitter

---

## [H] Frontend — 3D Scene  `frontend/src/scenes/`
- [ ] `CNNScene.tsx` — R3F `<Canvas>` with `OrbitControls`, ambient + point lights, dark bg
- [ ] `LayerGraph.tsx` — consume `ModelConfig` → assign 3D positions (x = layer index * spacing)
- [ ] `DataFlowAnimator.tsx` — lerp sphere along edge path per active inference step

---

## [I] Frontend — Layer Renderers  `frontend/src/components/layers/`
> Registry is the extension point — add a new entry to render a new layer type 🔌
- [ ] `LayerRendererRegistry.ts` — `Map<LayerType, FC<LayerNodeProps>>` + `register()` helper
- [ ] `LayerNodeProps.ts` — shared props: `{ layer: LayerSchema, activation?: ActivationMap, selected: bool }`
- [ ] `ConvLayerNode.tsx` — stacked `<Plane>` meshes, depth = numFilters, colored by activation mean
- [ ] `PoolLayerNode.tsx` — single compressed plane with downscale indicator
- [ ] `FCLayerNode.tsx` — `<InstancedMesh>` sphere grid, brightness = activation value
- [ ] `ActivationLayerNode.tsx` — thin colored slab (ReLU/Tanh indicator)
- [ ] `ConnectionEdge.tsx` — `<Line>` from `@react-three/drei`, dashed, animates during inference
- [ ] Register all five types in `LayerRendererRegistry.ts`

---

## [J] Frontend — UI Panels  `frontend/src/components/panels/`
> Each panel registers in `PANEL_REGISTRY` for future extensibility 🔌
- [ ] `InputUploader.tsx` — drag-drop 32×32 image, preview, trigger inference via `useInferenceStore`
- [ ] `LayerInspector.tsx` — shows selected layer: shape, params count, kernel weight heatmap
- [ ] `FeatureMapGrid.tsx` — N×N grid of channel activation heatmaps using `<canvas>`
- [ ] `ModelSelector.tsx` — dropdown populated from `useModelStore`, switches active model

---

## [K] Integration & Wiring
- [ ] Mount `<CNNScene>` in a new route `/visualize` (add React Router)
- [ ] `App.tsx` — add `/` (Knowledge Base) and `/visualize` routes
- [ ] `CNNScene` fetches model config on mount → populates `useModelStore`
- [ ] `InputUploader` submit → `POST /infer` → fill `useActivationStore` → re-render nodes
- [ ] `wsClient` connects on scene mount, updates `useActivationStore` per stream message
- [ ] `LayerInspector` reads `useModelStore.selectedLayerId` + `useActivationStore`

---

## [L] Docker & Dev Environment
- [ ] `frontend/Dockerfile`
- [ ] `backend/ai-engine/Dockerfile` + `pyproject.toml` with uv deps
- [ ] `backend/platform-service/Dockerfile`
- [ ] `deployment/compose/docker-compose.dev.yml` — all services + postgres + redis
- [ ] `.env.example` — document all required env vars

---

## Extension Checklist (adding a new CNN model after LeNet-5)
1. `app/models/<name>.py` — implement `VisualizableModel`, call `@register("<name>")`
2. If new layer types exist → add `<LayerType>LayerNode.tsx` + register in `LayerRendererRegistry`
3. Nothing else changes — API, stores, and scene auto-discover via registries
