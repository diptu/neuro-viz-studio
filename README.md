

<div align="center">

# 🔷 DeepPrism

<div align="center">

```text
        ●────●────●
       ╱│    │    │╲
      ●─●────●────●
       ╲│    │    │╱
        ●────●────●

               │
               ▼

           ╱────────╲
          ╱  PRISM   ╲
         ╱____________╲

     🟥 🟧 🟨 🟩 🟦 🟪

            DeepPrism
```

</div>
**Illuminating the Inner Workings of Deep Learning**

*Visualize • Interpret • Understand*

</div>
---

<div align="center">

<!-- Optional: Project Banner -->

<!-- ![DeepPrism Banner](docs/assets/banner.png) -->

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python\&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?logo=fastapi\&logoColor=white)](https://fastapi.tiangolo.com/)
[![NestJS](https://img.shields.io/badge/NestJS-Latest-E0234E?logo=nestjs\&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react\&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r170-black?logo=threedotjs)](https://threejs.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-Latest-EE4C2C?logo=pytorch\&logoColor=white)](https://pytorch.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](CONTRIBUTING.md)

### **Open-Source Platform for Interactive Deep Learning Visualization, Interpretability, and Analysis**

DeepPrism helps researchers, engineers, educators, and students **explore, understand, and debug modern deep learning models** through immersive GPU-accelerated visualizations, explainable AI techniques, and real-time model introspection.

Visualize tensors, activations, attention mechanisms, embeddings, gradients, pruning, and model architectures—from small CNNs to billion-parameter transformer models.

**Inspired by the educational visualizations of NeuroViz and Brendan Bycroft's interactive transformer explorer, DeepPrism extends those ideas into a production-ready platform for AI research and engineering.**

---

**Explore**

[Overview](#-overview) •
[Features](#-features) •
[Architecture](#-architecture) •
[Quick Start](#-quick-start) •
[Documentation](#-documentation) •
[Roadmap](#-roadmap) •
[Contributing](#-contributing)

</div>

---

# 📖 Overview

Modern deep learning models have become increasingly powerful—but also increasingly difficult to interpret. Understanding **why** a model behaves the way it does is essential for debugging, optimization, explainability, and research.

**DeepPrism** is an open-source visualization and interpretability platform that transforms complex neural network internals into intuitive, interactive visual experiences. It bridges the gap between **PyTorch-based model execution** and **browser-native GPU rendering**, enabling real-time exploration of deep learning models at multiple levels of abstraction.

Whether you're analyzing a convolutional network, a Vision Transformer, a large language model, or a multimodal architecture, DeepPrism provides the tools to inspect, understand, and communicate model behavior.

## Core Capabilities

* 🧠 Interactive neural network architecture visualization
* 📊 Tensor, activation, and gradient exploration
* 🎯 Attention and embedding analysis for transformer-based models
* ✂️ Structured and unstructured pruning visualization
* 🔬 Explainable AI (XAI) with Captum integration
* ⚡ High-performance GPU-accelerated rendering with Three.js
* 🔄 Real-time tensor streaming using WebSockets
* 🏗 Extensible microservice architecture powered by **NestJS** and **FastAPI**

DeepPrism is designed for:

* AI Researchers
* Machine Learning Engineers
* MLOps Engineers
* Students and Educators
* Open-source Contributors
* Organizations building explainable AI systems

---

# ✨ Features

## 🧠 Model Visualization

* Interactive neural network graph exploration
* Layer-by-layer architecture inspection
* Tensor topology visualization
* Weight distribution analysis
* Dynamic activation rendering

## 🎯 Transformer Interpretability

* Multi-head attention visualization
* Token relationship exploration
* Attention rollout
* Embedding inspection
* Cross-attention analysis

## 🔬 Explainable AI (XAI)

Powered by **PyTorch** and **Captum**:

* Saliency Maps
* Integrated Gradients
* Layer Conductance
* Feature Attribution
* Custom explainability plugins

## ✂️ Model Compression Analysis

Visualize modern optimization techniques:

* Structured pruning
* Unstructured pruning
* Magnitude pruning
* Sparsity heatmaps
* Live pruning mask visualization

## ⚡ High-Performance Data Streaming

Optimized for large models using:

* WebSockets
* Apache Arrow
* Binary serialization
* Incremental tensor streaming
* Low-latency updates

## 🎨 GPU-Accelerated Rendering

Built on modern WebGL technologies:

* Three.js
* React Three Fiber
* Custom GLSL shaders
* Instanced Mesh rendering
* Frustum culling
* Batched GPU draw calls

---

# 🏗 High-Level Architecture

```text
                                      +----------------------+
                                      | React + Three.js     |
                                      | React Three Fiber    |
                                      +----------+-----------+
                                                 |
                                    REST / WebSocket / GraphQL
                                                 |
                                      +----------v-----------+
                                      | Platform Service     |
                                      |      NestJS          |
                                      +----------+-----------+
                                                 |
                                      HTTP / gRPC (Future)
                                                 |
                                      +----------v-----------+
                                      | AI Engine            |
                                      |      FastAPI         |
                                      +----------+-----------+
                                                 |
                     ---------------------------------------------------------
                     |              |              |              |            |
                     |              |              |              |            |
               +-----v-----+  +-----v-----+  +-----v-----+  +-----v-----+  +--v-------+
               | PyTorch   |  | Captum    |  | Hugging   |  | Pruning   |  | Streaming|
               | Runtime   |  | XAI       |  | Face      |  | Engine    |  | Engine   |
               +-----------+  +-----------+  +-----------+  +-----------+  +----------+
```

---

# 🛠 Technology Stack

DeepPrism is built using a modern, cloud-native technology stack designed for scalability, maintainability, and high-performance AI workloads.

| Category                      | Technology                            |
| ----------------------------- | ------------------------------------- |
| **Frontend**                  | React 19, TypeScript                  |
| **3D Visualization**          | Three.js, React Three Fiber, GLSL     |
| **Frontend State Management** | Zustand                               |
| **Frontend Build Tool**       | Vite                                  |
| **Platform Backend**          | NestJS, TypeScript                    |
| **AI Backend**                | FastAPI, Python 3.12+                 |
| **Machine Learning**          | PyTorch, Hugging Face Transformers    |
| **Explainable AI (XAI)**      | Captum                                |
| **Database**                  | PostgreSQL                            |
| **ORM**                       | Prisma (NestJS), SQLAlchemy (FastAPI) |
| **Cache**                     | Redis                                 |
| **Streaming**                 | WebSockets                            |
| **Serialization**             | Apache Arrow                          |
| **Authentication**            | JWT, OAuth2 (Planned)                 |
| **API Documentation**         | OpenAPI / Swagger                     |
| **Containerization**          | Docker, Docker Compose                |
| **Orchestration**             | Kubernetes (Planned)                  |
| **CI/CD**                     | GitHub Actions                        |
| **Package Manager (Python)**  | uv                                    |
| **Package Manager (Node.js)** | npm                                   |

---

# 📂 Project Structure

```text
deepprism/
│
├── frontend/                          # React + Three.js client
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── scenes/
│   │   ├── shaders/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── tests/
│   └── Dockerfile
│
├── backend/
│   │
│   ├── platform-service/              # NestJS Platform Backend
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── test/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── ai-engine/                     # FastAPI AI Engine
│   │   ├── app/
│   │   │   ├── api/
│   │   │   ├── core/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   ├── visualization/
│   │   │   ├── xai/
│   │   │   ├── pruning/
│   │   │   ├── streaming/
│   │   │   └── main.py
│   │   ├── tests/
│   │   ├── pyproject.toml
│   │   ├── uv.lock
│   │   └── Dockerfile
│   │
│   └── shared/
│       ├── contracts/
│       ├── protobuf/
│       └── schemas/
│
├── deployment/
│   ├── docker/
│   ├── compose/
│   └── kubernetes/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── development/
│   └── images/
│
├── examples/
├── scripts/
├── .github/
│   └── workflows/
│
├── CONTRIBUTING.md
├── LICENSE
└── README.md

```

---

# 🚀 Quick Start

## Prerequisites

Before getting started, ensure you have the following installed:

### Development Tools

* Python **3.12+**
* Node.js **20+**
* npm **10+**
* Docker **24+**
* Docker Compose

### Optional

* NVIDIA CUDA Toolkit (GPU acceleration)
* Git LFS (for large model checkpoints)

---

## Clone the Repository

```bash
git clone https://github.com/your-org/deepprism.git

cd deepprism
```

---

# 🖥 Running the Platform Backend (NestJS)

```bash
cd backend/platform-service

npm install

npm run start:dev
```

The Platform Service will be available at:

```text
http://localhost:3000
```

Swagger documentation:

```text
http://localhost:3000/api
```

---

# 🤖 Running the AI Engine (FastAPI)

```bash
cd backend/ai-engine

uv sync

uv run uvicorn app.main:app --reload
```

The AI Engine will be available at:

```text
http://localhost:8000
```

OpenAPI documentation:

```text
http://localhost:8000/docs
```

---

# 🎨 Running the Frontend

```bash
cd frontend

npm install

npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

---

# 🐳 Running with Docker (Recommended)

Start the complete development environment:

```bash
docker compose up --build
```

This launches:

| Service                   | Port |
| ------------------------- | ---- |
| Frontend                  | 5173 |
| Platform Service (NestJS) | 3000 |
| AI Engine (FastAPI)       | 8000 |
| PostgreSQL                | 5432 |
| Redis                     | 6379 |

Once all services are running, open your browser and navigate to:

```text
http://localhost:5173
```

---

# 🐳 Docker Deployment

DeepPrism is fully containerized for local development and production deployments.

## Build All Services

```bash
docker compose build
```

## Start the Platform

```bash
docker compose up -d
```

## View Running Services

```bash
docker compose ps
```

## View Logs

```bash
docker compose logs -f
```

View logs for a specific service:

```bash
docker compose logs -f platform-service
docker compose logs -f ai-engine
```

## Stop All Services

```bash
docker compose down
```

---

# 🔌 Service APIs

DeepPrism consists of two backend services.

| Service                   | Default Port | Responsibility                                                   |
| ------------------------- | ------------ | ---------------------------------------------------------------- |
| Platform Service (NestJS) | 3000         | Authentication, Users, Projects, Workspaces, API Gateway         |
| AI Engine (FastAPI)       | 8000         | Model loading, inference, visualization, explainability, pruning |

---

## Platform Service (NestJS)

### Authentication

```http
POST /api/v1/auth/login
```

Authenticate a user.

---

### Projects

```http
GET /api/v1/projects
```

Retrieve available visualization projects.

---

### Workspaces

```http
GET /api/v1/workspaces
```

List user workspaces.

---

### Upload Models

```http
POST /api/v1/models/upload
```

Upload a PyTorch checkpoint or model artifact.

---

## AI Engine (FastAPI)

### Available Models

```http
GET /api/v1/models
```

List supported deep learning models.

---

### Model Metadata

```http
GET /api/v1/models/{model_id}
```

Retrieve architecture metadata.

---

### Activations

```http
GET /api/v1/models/{model_id}/activations
```

Retrieve activation tensors.

---

### Attention Maps

```http
GET /api/v1/models/{model_id}/attention
```

Retrieve transformer attention maps.

---

### Embeddings

```http
GET /api/v1/models/{model_id}/embeddings
```

Retrieve embedding representations.

---

### Pruning Analysis

```http
GET /api/v1/models/{model_id}/pruning
```

Retrieve pruning masks and sparsity statistics.

---

### Explainability

```http
GET /api/v1/models/{model_id}/xai
```

Generate explainability artifacts using Captum.

---

### WebSocket Streaming

```text
ws://localhost:8000/ws/model-stream
```

Real-time streaming supports:

* Activation tensors
* Attention weights
* Embeddings
* Gradients
* Saliency maps
* Pruning updates
* Layer metadata

---

# 🧠 Supported Model Architectures

## Currently Supported

### Computer Vision

* Vision Transformer (ViT)

### Natural Language Processing

* BERT
* RoBERTa
* GPT-style Transformers

---

## Planned Support

### Large Language Models

* LLaMA
* Qwen
* Mistral
* Gemma
* Phi

### Vision & Multimodal

* CLIP
* SigLIP
* BLIP
* SAM

### Generative AI

* Stable Diffusion
* FLUX
* Diffusion Transformers (DiT)

### Graph Learning

* Graph Neural Networks (GNNs)
* Graph Transformers

---

# 📈 Performance Targets

DeepPrism is designed with scalability and high-performance visualization in mind.

| Metric                    | Target                          |
| ------------------------- | ------------------------------- |
| Interactive Rendering     | 60+ FPS                         |
| Tensor Streaming Latency  | <100 ms                         |
| Initial Model Load        | <2 s (cached)                   |
| WebSocket Throughput      | High-frequency binary streaming |
| GPU Rendering             | Instanced Mesh + Custom GLSL    |
| Supported Model Scale     | Billion-parameter models        |
| Concurrent Users (Target) | 1,000+                          |

---

# 🔒 Security

Production deployments should follow modern cloud-native security practices.

## Authentication & Authorization

* JWT Authentication
* OAuth2 / OpenID Connect
* Role-Based Access Control (RBAC)
* Multi-Factor Authentication (Planned)

## API Security

* HTTPS / TLS
* API Rate Limiting
* CORS Protection
* Request Validation
* Secure File Uploads

## Infrastructure Security

* Docker Secrets
* Environment-based Configuration
* Audit Logging
* Redis Authentication
* PostgreSQL Role Management

---

# 🧪 Testing

DeepPrism follows a multi-layer testing strategy.

## Platform Service (NestJS)

Run unit tests:

```bash
cd backend/platform-service

npm test
```

Run end-to-end tests:

```bash
npm run test:e2e
```

Generate coverage:

```bash
npm run test:cov
```

---

## AI Engine (FastAPI)

Run unit tests:

```bash
cd backend/ai-engine

uv run pytest
```

Run with coverage:

```bash
uv run pytest --cov=app --cov-report=term-missing
```

---

## Frontend

Run unit tests:

```bash
cd frontend

npm run test
```

Run linting:

```bash
npm run lint
```

Build production assets:

```bash
npm run build
```

---

## Continuous Integration

Every pull request is automatically validated using GitHub Actions.

The CI pipeline includes:

* ✅ Code formatting
* ✅ Linting
* ✅ Type checking
* ✅ Unit testing
* ✅ Integration testing
* ✅ Docker image builds
* ✅ Security scanning


---

# 🗺 Roadmap

DeepPrism is being developed incrementally with a strong focus on performance, extensibility, and modern AI interpretability. The roadmap below outlines our planned milestones.

| Status | Milestone                       | Description                                                                                    |
| ------ | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| 🚧     | **v0.1 — Foundation**           | Monorepo, frontend, NestJS Platform Service, FastAPI AI Engine, Docker development environment |
| 📝     | **v0.2 — Core Visualization**   | Interactive neural network visualization, tensor explorer, weight matrix rendering             |
| 📝     | **v0.3 — Explainability (XAI)** | Captum integration, saliency maps, integrated gradients, attention visualization               |
| 📝     | **v0.4 — Model Compression**    | Structured & unstructured pruning, sparsity heatmaps, pruning comparison                       |
| 📝     | **v0.5 — Transformer Explorer** | Multi-head attention, token relationships, embedding visualization                             |
| 📝     | **v0.6 — Streaming Engine**     | Binary tensor streaming, Apache Arrow integration, high-frequency WebSocket updates            |
| 📝     | **v0.7 — Collaboration**        | Projects, workspaces, authentication, sharing, team collaboration                              |
| 📝     | **v1.0 — Production Release**   | Stable APIs, documentation, plugin system, deployment guides, production-ready release         |

## Planned Features

### 🤖 Model Support

* Vision Transformer (ViT)
* BERT
* RoBERTa
* GPT-family models
* LLaMA
* Mistral
* Qwen
* Gemma
* CLIP
* Stable Diffusion
* Graph Neural Networks (GNNs)

### 🔬 Explainable AI

* Saliency Maps
* Integrated Gradients
* Layer Conductance
* Feature Attribution
* Attention Rollout
* Custom Explainability Plugins

### 🎨 Visualization

* Interactive model graph
* Tensor Explorer
* Embedding Explorer
* Activation Heatmaps
* Attention Flow
* Pruning Visualizer
* Model Comparison Dashboard
* 3D Layer Inspector

### ⚡ Performance

* GPU instancing
* Streaming optimization
* Progressive tensor loading
* Memory-efficient rendering
* Multi-GPU inference (planned)

### 🌐 Platform

* Plugin SDK
* Workspace management
* Model registry
* Dataset explorer
* Experiment tracking
* Cloud deployment
* Kubernetes support

---

# 🤝 Contributing

DeepPrism is an open-source project, and contributions of all sizes are welcome—from fixing documentation to implementing new visualization techniques or supporting additional model architectures.

Before contributing, please review:

* `CONTRIBUTING.md`
* `CODE_OF_CONDUCT.md`

## Ways to Contribute

### 🧠 AI & Machine Learning

* Support new model architectures
* Integrate additional explainability techniques
* Improve tensor extraction pipelines
* Optimize inference performance

### 🎨 Frontend & Visualization

* Three.js visualizations
* React Three Fiber components
* GLSL shader development
* UI/UX improvements
* Performance optimization

### ⚙ Backend

* NestJS Platform Service
* FastAPI AI Engine
* WebSocket streaming
* API improvements
* Database optimization

### 📚 Documentation

* Tutorials
* API documentation
* Architecture guides
* Example projects
* Blog posts

### 🧪 Quality Assurance

* Unit tests
* Integration tests
* Performance benchmarks
* Bug reports
* Security improvements

We especially welcome contributions from researchers, students, educators, and engineers interested in AI visualization and explainability.

---

# 📚 Documentation

Comprehensive documentation is available in the `docs/` directory.

```text id="v8z53o"
docs/
├── architecture/
├── api/
├── development/
├── deployment/
├── guides/
├── tutorials/
└── contributing/
```

Documentation includes:

* 🏗 System Architecture
* 🔌 API Reference
* 🤖 AI Engine Design
* 🎨 Visualization Engine
* 🔄 Data Streaming Pipeline
* 🐳 Docker & Kubernetes Deployment
* 🧪 Development Setup
* 🤝 Contributor Guide
* 📖 Tutorials & Examples

Future documentation will also include plugin development, custom model integration, and performance optimization guides.

---

# 📜 License

DeepPrism is released under the **MIT License**, allowing both personal and commercial use while encouraging community collaboration.

See the `LICENSE` file for the complete license text.

---

<div align="center">

### 🔷 DeepPrism

**Illuminating the Inner Workings of Deep Learning**

*Visualize • Interpret • Understand*

Built with ❤️ for researchers, engineers, educators, and the open-source AI community.

If you find DeepPrism useful, consider ⭐ starring the repository and contributing to its development.

</div>


### Built for the Future of Explainable AI

**DeepPrism** transforms neural network internals into immersive visual experiences.

⭐ Star the project if you find it useful.

</div>

# 💡 Inspiration & Acknowledgements

DeepPrism is inspired by several outstanding visualization and interpretability projects that have advanced the understanding of deep learning systems.

## 🎓 Inspirations

### NeuroViz

The interactive visualizations and educational approach of **NeuroViz** inspired our goal of making neural network internals easier to understand through intuitive, real-time exploration. Their work demonstrates how visual interfaces can significantly improve the learning experience for neural networks and backpropagation.

### Brendan Bycroft's Interactive Visualizations

Brendan Bycroft's **LLM Visualization** is one of the best examples of interactive technical storytelling. His work showcases how complex algorithms can be communicated through beautiful, performant, browser-based visualizations, inspiring many of the design principles behind DeepPrism's frontend experience.

---

## Our Vision

While these projects primarily focus on explaining how neural networks and transformers work, **DeepPrism** aims to extend that vision into a production-grade research platform for modern deep learning interpretability.

Our long-term goals include:

* 🧠 Interactive visualization of large-scale transformer architectures (LLMs, ViTs, Multimodal Models)
* 📊 Real-time activation, gradient, and attention exploration
* ✂️ Structured and unstructured pruning visualization
* 🔬 Explainable AI (XAI) workflows with Captum integration
* ⚡ GPU-accelerated rendering for billion-parameter models
* 🌐 Browser-native exploration powered by WebGL and React Three Fiber
* 🔌 Live model introspection through FastAPI and WebSockets
* 📈 Research-grade tooling for debugging, teaching, and model analysis

Rather than replacing existing educational visualizers, DeepPrism seeks to complement them by providing an extensible platform for researchers, engineers, educators, and students working with state-of-the-art neural networks.

---

## ❤️ Thank You

We are grateful to the researchers, educators, and open-source developers whose work continues to make AI systems more transparent, interpretable, and accessible to everyone.

If you are the author of one of these projects and would like to collaborate, improve attribution, or suggest additional references, we'd be delighted to hear from you.

