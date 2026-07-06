# 🚨 Incident Response & Post-Mortem Agent

> **HiDevs × Mastra Hackathon** — AI Engineering Copilot  
> Production-grade incident intelligence powered by Mastra, Claude, and Qdrant.

---

## 🎯 Project Overview

The **Incident Response & Post-Mortem Agent** is an AI-powered engineering copilot that transforms how engineering teams detect, respond to, and learn from production incidents.

Instead of relying on manual triage and tribal knowledge, this system:

- **Ingests** structured and unstructured logs from multiple infrastructure sources
- **Detects** anomalies using AI-powered pattern recognition
- **Retrieves** similar historical incidents from a persistent vector memory (Qdrant)
- **Analyses** root causes using large language models (Anthropic Claude)
- **Suggests** validated remediation actions, safety-checked by Enkrypt AI Guardrails
- **Generates** structured post-mortem reports automatically
- **Learns** continuously — every resolved incident enriches the institutional memory

---

## 🏛️ Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Incident Response Agent                      │
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌───────────────┐   ┌───────────┐  │
│  │   Log    │──▶│ Anomaly  │──▶│  RCA Engine   │──▶│ Remediation│ │
│  │ Ingestion│   │Detection │   │ (Claude 3.5)  │   │  (Enkrypt) │ │
│  └──────────┘   └──────────┘   └───────────────┘   └───────────┘  │
│        │               │               │                   │        │
│        ▼               ▼               ▼                   ▼        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Mastra Orchestration Layer                  │ │
│  │              (Agents · Tools · Workflows · Memory)             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐ │
│  │  Qdrant DB    │   │ Post-Mortem   │   │   OpenTelemetry       │ │
│  │ (Vector Mem.) │   │  Generator    │   │   (Tracing)           │ │
│  └───────────────┘   └───────────────┘   └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Principles

| Principle | Application |
|-----------|-------------|
| **Clean Architecture** | Domain logic isolated from infrastructure (Express, Qdrant) |
| **SOLID** | Each service has a single, well-defined responsibility |
| **Type Safety** | Strict TypeScript + Zod runtime validation everywhere |
| **Observability** | OpenTelemetry tracing across all agent operations |
| **Safety First** | Enkrypt AI validates every LLM-generated remediation action |
| **Institutional Memory** | Qdrant stores every incident as a searchable vector |

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 20+ | ESM-native, modern JS runtime |
| **Language** | TypeScript 5.7 | Strict type safety |
| **Web Framework** | Express 4 | Lightweight HTTP API |
| **AI Orchestration** | Mastra 0.10 | Agent workflows, tools, memory |
| **Primary LLM** | Anthropic Claude 3.5 | RCA & post-mortem generation |
| **Embeddings** | OpenAI text-embedding-3-small | Semantic similarity search |
| **Vector DB** | Qdrant 1.13 | Persistent institutional memory |
| **Safety** | Enkrypt AI Guardrails | LLM output validation |
| **Validation** | Zod 3 | Runtime schema enforcement |
| **Observability** | OpenTelemetry | Distributed tracing |
| **Logger** | Pino | JSON structured logging |
| **Container** | Docker + Compose | Qdrant local dev environment |

---

## 📁 Folder Structure

```
incident-response-agent/
│
├── src/                          # All application source code
│   ├── index.ts                  # Application entry point
│   │
│   ├── config/                   # Environment & app configuration
│   ├── core/                     # Domain models, interfaces, base classes
│   ├── events/                   # Event emitters & internal event bus
│   ├── models/                   # Data transfer objects & domain entities
│   ├── types/                    # Shared TypeScript type definitions
│   ├── utils/                    # Pure utility functions
│   │
│   ├── services/                 # Business logic services
│   │   ├── logs/                 # Log ingestion & normalisation
│   │   ├── anomaly/              # Anomaly detection engine
│   │   ├── qdrant/               # Qdrant client & collection management
│   │   ├── retrieval/            # Semantic similarity search
│   │   ├── embeddings/           # Embedding generation (OpenAI)
│   │   ├── llm/                  # LLM orchestration (Claude, OpenAI)
│   │   └── enkrypt/              # Enkrypt AI guardrails integration
│   │
│   ├── mastra/                   # Mastra AI framework layer
│   │   ├── agents/               # Mastra agent definitions
│   │   ├── tools/                # Mastra tool definitions
│   │   └── workflows/            # Mastra workflow definitions
│   │
│   ├── api/                      # Express HTTP API layer
│   │   ├── controllers/          # Request handlers
│   │   ├── routes/               # Route definitions
│   │   └── middleware/           # Auth, validation, error handling
│   │
│   └── scripts/                  # One-off operational scripts
│       ├── generateLogs.ts       # Synthetic log data generator
│       ├── setupQdrant.ts        # Qdrant collection bootstrapper
│       └── seedQdrant.ts         # Historical incident seeder
│
├── docs/                         # Architecture docs, ADRs, diagrams
├── data/                         # Raw & processed log data (gitignored)
├── reports/                      # Generated post-mortem reports (gitignored)
├── tests/                        # Unit and integration tests
├── docker/                       # Dockerfile & container configs (future)
│
├── package.json                  # Dependencies & npm scripts
├── tsconfig.json                 # TypeScript (type-check only)
├── tsconfig.build.json           # TypeScript (production emit)
├── docker-compose.yml            # Qdrant local infrastructure
├── .env.example                  # Environment variable template
└── .gitignore                    # Git exclusion rules
```

---

## ⚙️ Installation

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20.0.0 | [nodejs.org](https://nodejs.org) |
| npm | ≥ 10.0.0 | Included with Node.js |
| Docker | ≥ 24.0 | [docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | ≥ 2.20 | Included with Docker Desktop |

### Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-org/incident-response-agent.git
cd incident-response-agent

# 2. Install dependencies
npm install

# 3. Create your local environment file
cp .env.example .env
# → Open .env and fill in your API keys

# 4. Start the Qdrant vector database
docker compose up -d

# 5. Verify Qdrant is healthy
curl http://localhost:6333/healthz
# → Expected: OK

# 6. Run the type-checker to verify the project setup
npm run typecheck
```

---

## 🚀 Running Locally

```bash
# Start the development server (hot-reload via tsx watch)
npm run dev

# Type-check without starting the server
npm run typecheck

# Lint the source code
npm run lint

# Build for production
npm run build

# Start the production build
npm start
```

---

## 🐳 Docker Setup

The `docker-compose.yml` runs **only Qdrant** — the application runs natively via npm scripts for optimal developer experience (fast hot-reload, native debugger, no image rebuild cycles).

```bash
# Start Qdrant in the background
docker compose up -d

# Check container status and health
docker compose ps

# View Qdrant logs
docker compose logs -f qdrant

# Stop containers (data is preserved in named volume)
docker compose down

# Stop containers AND destroy all vector data (use with caution!)
docker compose down -v
```

### Qdrant Web UI

Once running, the built-in Qdrant dashboard is available at:  
→ **http://localhost:6333/dashboard**

### Port Reference

| Port | Protocol | Service |
|------|----------|---------|
| `6333` | HTTP REST | Qdrant REST API & Dashboard |
| `6334` | gRPC | Qdrant gRPC API |
| `3000` | HTTP | Incident Agent Express API |

---

## 🛡️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | ✅ | Runtime environment (`development` \| `production`) |
| `PORT` | ✅ | Express server port (default: `3000`) |
| `ANTHROPIC_API_KEY` | ✅ | Claude API key for RCA & report generation |
| `OPENAI_API_KEY` | ✅ | OpenAI key for embedding generation |
| `ENKRYPTAI_GUARDRAILS_API_KEY` | ✅ | Enkrypt AI key for safety validation |
| `QDRANT_URL` | ✅ | Qdrant REST URL (default: `http://localhost:6333`) |
| `QDRANT_API_KEY` | ⬜ | Required for Qdrant Cloud deployments only |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | ⬜ | Tracing collector endpoint |

---

## 🗺️ Development Roadmap

### ✅ Module 1 — Project Bootstrap (Day 1) ← *You are here*
- [x] Repository structure & folder scaffold
- [x] `package.json` with all production dependencies
- [x] Strict TypeScript configuration
- [x] Docker Compose for Qdrant
- [x] Environment variable template
- [x] README & project documentation

### 🔲 Module 2 — Configuration & Type System
- [ ] Zod-validated environment loader (`src/config/env.ts`)
- [ ] Shared TypeScript types for incidents, logs, embeddings
- [ ] Pino logger initialisation with pretty-print in dev
- [ ] OpenTelemetry tracer bootstrap

### 🔲 Module 3 — Log Ingestion Service
- [ ] Log normalisation pipeline
- [ ] Multi-source log adapters (CloudWatch, Datadog, raw JSON)
- [ ] Synthetic log generator script

### 🔲 Module 4 — Vector Memory (Qdrant)
- [ ] Qdrant collection setup script
- [ ] Embedding service using OpenAI
- [ ] Historical incident seeder

### 🔲 Module 5 — Mastra Agent Core
- [ ] Incident Response Agent definition
- [ ] RCA tool, retrieval tool, anomaly tool
- [ ] Mastra workflow orchestration

### 🔲 Module 6 — Safety & Validation
- [ ] Enkrypt AI guardrails integration
- [ ] Remediation action validator

### 🔲 Module 7 — Post-Mortem Generator
- [ ] Structured report template
- [ ] Claude-powered generation
- [ ] Markdown & PDF export

### 🔲 Module 8 — REST API
- [ ] Express routes for incident submission
- [ ] WebSocket for real-time agent updates
- [ ] Authentication middleware

### 🔲 Module 9 — Frontend
- [ ] Next.js dashboard
- [ ] Real-time incident timeline
- [ ] Post-mortem viewer

---

## 📄 License

MIT © HiDevs Team — HiDevs × Mastra Hackathon 2024
