```
Jal-Tarang/
├── api/                       # Vercel Serverless Function Edge Gateway
│   └── index.js               # Cloud Edge API Handler (CORS, Auth, Datasets, Health Probes)
├── backend/                   # Python Core Configuration
├── data/                      # AIS Vessel Telemetry, Port Datasets & Baltic Historical Benchmarks
├── frontend/                  # React 19 + TypeScript + Vite Single-Page Application
│   ├── src/
│   │   ├── api/               # Axios API client, query keys & service contracts
│   │   ├── components/        # Reusable UI widgets (Radar Map, Tidal Bar, Charts, Modals)
│   │   ├── hooks/             # Custom hooks (useLiveStatus, useAuth, useDebounce)
│   │   ├── lib/               # Mathematical utilities, currency formatting & CSV engines
│   │   ├── pages/             # Core Operational Pages
│   │   │   ├── auth/          # LoginPage with Enterprise Showcase fallback
│   │   │   ├── dashboard/     # ControlTower, Executive, Chartering & Port Dashboards
│   │   │   ├── decision/      # DecisionCenterPage (LP/MIP Optimizer & Transchart Export)
│   │   │   ├── forecasting/   # ForecastDashboardPage (LSTM/Prophet/XGB Ensemble Curves)
│   │   │   ├── ports/         # PortIntelligencePage (Tidal Bar & Cyclone Alerts)
│   │   │   ├── cargo/         # CargoRequirementWizardPage
│   │   │   └── scenarios/     # ScenarioCenterPage (What-If Simulation Studio)
│   │   └── store/             # Zustand state stores (authStore, uiStore, settingsStore)
│   ├── package.json
│   └── vite.config.ts
├── ml-service/                # Python ML Microservice (FastAPI + Uvicorn + PyTorch)
├── prisma/                    # PostgreSQL Prisma Schema & Migrations
├── src/                       # Node.js Express 5 Enterprise Orchestrator
│   ├── config/                # Environment variables & constants
│   ├── db/                    # PostgreSQL connection pool & resilient fallback engine
│   ├── routes/                # 30+ Express REST route handlers
│   ├── services/              # Domain services (Optimization, Ingestion, Decision, Feasibility)
│   └── index.ts               # Express application entrypoint
├── pnpm-lock.yaml             # Tracked dependency lockfile
├── vercel.json                # Vercel build & route rewrite configuration
└── README.md                  # Master Documentation
```
---
## 👥 Team Cloud 9
| Member Name | Role / Specialization | Contact / Links |
| :--- | :--- | :--- |
| **Aradhya Saxena** | Full Stack Architecture, Cloud Infrastructure & Systems Engineering | [GitHub](https://github.com/AXAradhya) |
| **Team Cloud 9** | Machine Learning, Mathematical Modeling & UI/UX Design | Smart India Hackathon 2026 |
*Research Guidance and Maritime Operations Discussion: Capt. Arpit Choubey (Indian Navy).*
---
## 📄 License & Intellectual Property
This software prototype is developed for the **Smart India Hackathon 2026** under Problem Statement **SIH26006**. All rights and intellectual property align with Ministry of Steel, Government of India, and Team Cloud 9 guidelines.
<div align="center">
<b>🌊 JAL TARANG — Navigating India's Maritime Logistics with Algorithmic Precision.</b>
</div>
