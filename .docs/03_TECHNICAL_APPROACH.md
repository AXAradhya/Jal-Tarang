# DELIVERABLE 3 — SLIDE 3: TECHNICAL APPROACH

---

## 3.1 Data Inputs — Named Sources

| # | Data Source | What It Contains | Access Method | Update Frequency | Cost |
|---|---|---|---|---|---|
| 1 | **Baltic Exchange** | BDI, BCI (C18 Gladstone→Dhamra 150,000 MT coal benchmark), BPI, BSI, BHSI — historical daily series | Baltic Exchange data products; academic datasets available on Kaggle/UNCTAD | Daily | Free (academic/historical); £18,000/year (live feed — production scale) |
| 2 | **Port Authority Traffic Bulletins** | Vessel arrival/departure records, berth occupancy, draft availability at Paradip, Vizag, Gangavaram, Gopalpur, Dhamra, Haldia | Daily PDF bulletins published on port authority websites (paradipport.gov.in, vizagport.com, kolkataporttrust.gov.in) | Daily | Free (public domain) |
| 3 | **Port Infrastructure Table** (Built by Team) | Draft (m), LOA (m), beam (m), berth length, cargo handling rate (MT/day), gear type (geared/gearless), tidal dependency for all 7 East Coast ports + 6 loading port clusters | Compiled from port authority published specifications and Admiralty Sailing Directions | Annually (with quarterly verification) | Free (public domain sources) |
| 4 | **Hooghly River Tide Tables** | Annual tidal predictions for Kolkata/Haldia reach — high/low water times and heights | Kolkata Port Authority (Syama Prasad Mookerjee Port) hydrographic publications | Annual publication | Free (downloadable) |
| 5 | **DGCIS Trade Statistics** | Coking coal import volumes by port, by country of origin, unit values ($/MT) | Directorate General of Commercial Intelligence & Statistics, Ministry of Commerce, Government of India | Annual | Free (government publication) |
| 6 | **SAIL Annual Reports** | Coking coal procurement volumes, sourcing country mix, landed cost breakdowns | sail.co.in — publicly filed annual reports | Annual | Free |
| 7 | **Bunker Fuel Prices** | IFO380 / VLSFO spot prices at major bunkering hubs (Singapore, Fujairah, Rotterdam) | Ship & Bunker (shipandbunker.com) — publicly available daily quotes | Daily | Free |
| 8 | **Coking Coal Spot Price Proxy** | Australian Premium Hard Coking Coal (PHCC) index — used as cargo price input for landed cost calculations | Platts/Argus (paid); DGCIS import unit value used as free proxy for prototype | Weekly/Monthly | Free (proxy); $3,000–5,000/year (live Platts) |
| 9 | **PMI Data** | India Manufacturing PMI, China Steel PMI — macro demand indicators | IHS Markit / S&P Global public press releases; Trading Economics free tier | Monthly | Free (press release data) |
| 10 | **Indian Railways FOIS** | Rake availability, freight rates per tonne-km, loading/unloading station data | Ministry of Railways open data portal (fois.indianrail.gov.in) | Daily | Free (government open data) |
| 11 | **AIS Vessel Tracking** | Real-time and historical vessel positions, speed, heading, destination | MarineTraffic API — free tier (24-hour delayed); paid real-time for production | Real-time (paid) / 24h delayed (free) | Free (prototype); $500–2,000/month (production) |
| 12 | **Maritime News** | Disruption events, port strikes, canal blockages, weather disruptions, sanctions | Lloyd's List, TradeWinds, Baltic Exchange circulars, Reuters maritime desk | Continuous | Free (public headlines); subscription for full text |
| 13 | **Cyclone Calendar** | Bay of Bengal cyclone season historical data, cyclone tracks, intensity classifications | India Meteorological Department (imd.gov.in) — Best Track data | Annual (historical); real-time during season | Free (government data) |

---

## 3.2 Model Architecture — Full Technical Stack

### Freight Rate Forecasting Layer

| Model | Role | Inputs | Output | Validation |
|---|---|---|---|---|
| **SARIMAX** | Baseline per route × vessel class | BCI/BPI/BSI time series + seasonal cyclone dummies + PMI + bunker price as exogenous regressors | Point forecasts with 95% confidence intervals at 30/90/180-day horizons | Walk-forward cross-validation on 5 years of BCI historical data; report MAPE per route |
| **XGBoost** | Ensemble layer — captures non-linear feature interactions | All macro/commodity/sentiment features (BDI, PMI, bunker, PHCC price, NLP disruption score, seasonality features) | Gradient-boosted ensemble forecast overlaid on SARIMAX baseline | 5-fold time-series split cross-validation; report RMSE, MAE, R² |
| **Prophet** | Trend decomposition + holiday/cyclone-season effects | BCI/BPI/BSI daily series | Trend + seasonality decomposition; cyclone-season and holiday-period changepoint detection | Backtested against 2021–2023 actuals |

**Ensemble Strategy:** Weighted average of SARIMAX (40%), XGBoost (40%), Prophet (20%) — weights optimised via validation set performance. Individual model forecasts and ensemble forecast both displayed on dashboard for transparency.

### Decision/Optimisation Layer

| Module | Algorithm | Inputs | Output |
|---|---|---|---|
| **Vessel–Port Constraint Solver** | Rule-based filter (draft ≤ port max, LOA ≤ berth length, beam ≤ berth width) → feasible vessel set → rank by TCE-adjusted total landed cost | Port constraint table + vessel registry + cargo parcel specification | Ranked vessel-class recommendation per port with pass/fail justification |
| **Spot vs COA Simulator** | Monte Carlo simulation (10,000 paths) over forecast rate distribution | Forecast rate curves + COA discount model (3/6/12-month tenors at 3–15% discount) | Expected cost under spot vs COA, breakeven rate, probability of COA outperformance, ₹ crore savings |
| **Markowitz Portfolio Optimiser** | Mean-variance optimisation (scipy.optimize.minimize) | Spot rate mean/variance + COA rate mean/variance per route per quarter | Efficient frontier + recommended spot/COA allocation with risk reduction metrics |
| **Arbitrage Engine** | Linear programming (PuLP) | Rail freight rates (FOIS), lightering barge rates, port tariffs, bunker costs for 3 discharge options | Least-cost discharge routing in ₹/MT total landed per option |
| **Tidal Draft Predictor** | Polynomial interpolation over tide table data + siltation correction factor | Hooghly tide tables + quarterly dredging reports | Draft window availability per day + demurrage cost of tidal window miss |

### NLP Layer

| Component | Technology | Input | Output |
|---|---|---|---|
| **Disruption Classifier** | HuggingFace zero-shot classifier (facebook/bart-large-mnli) or fine-tuned DistilBERT on maritime news corpus | Maritime news headlines and articles (Lloyd's List, TradeWinds, Reuters) | Disruption Risk Score (0–100) per route, event severity classification, route-specific impact flag |
| **Sentiment Aggregator** | Rolling 7-day weighted average of daily disruption scores | Daily NLP outputs | Smoothed disruption trend for forecast adjustment |

### Conversational AI Layer

| Component | Technology | Function |
|---|---|---|
| **RAG Framework** | LangChain + FAISS vector store | Retrieves verified port constraints, rate data, vessel registry, and model outputs from SAGAR DRISHTI's internal database |
| **LLM Engine** | GPT-4-turbo API (production) or self-hosted Mistral-7B (cost-optimised alternative) | Generates natural language explanations of model recommendations |
| **Guardrail Layer** | Hard rule enforcement — LLM output validated against constraint solver results | Prevents hallucination of port specifications or fabrication of freight rates; all numerical outputs sourced from deterministic computation layer |

### Full Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.11+ (FastAPI) |
| **ML/Forecasting** | scikit-learn, XGBoost, Facebook Prophet, statsmodels (SARIMAX), CatBoost |
| **Optimisation** | scipy.optimize, PuLP (linear programming for arbitrage engine) |
| **NLP** | HuggingFace Transformers, NLTK |
| **Conversational AI** | LangChain, FAISS, OpenAI API / Mistral |
| **Data Pipeline** | Pandas, BeautifulSoup (port bulletin scraper), requests, searoute (maritime distance) |
| **Frontend** | React 18 + Vite, Tailwind CSS, Recharts/Chart.js |
| **Database** | PostgreSQL (structured data), FAISS (vector store for RAG) |
| **Authentication** | JWT tokens + bcrypt password hashing + role-based access control |
| **Deployment** | Docker, AWS EC2 / Azure (scalable), Nginx reverse proxy |
| **AIS Integration** | MarineTraffic API (free tier prototype) |
| **Maritime Routing** | `searoute` Python library (nautical distance calculation via shipping lanes) |
| **Caching / Message Queue** | Redis (suggestion caching, Celery broker) |
| **Task Scheduling** | Celery + Celery Beat (periodic insight generation, model evaluation) |
| **Real-time Push** | FastAPI WebSocket (smart alert banners, live notifications) |
| **Frontend State** | Zustand (cross-page decision context management) |
| **Maritime Routing** | `searoute` Python library (nautical distance calculation via shipping lanes) |

### AI Contextual Intelligence Layer (Inline & On-Page Suggestions Engine)

This layer powers Feature G — the ambient intelligence system that proactively surfaces AI-driven insights across every page and input field.

| Component | Technology | Function | API Endpoint |
|---|---|---|---|
| **Inline Suggestion Engine** | FastAPI microservice + LLM summarisation + Decision Engine inference | Generates contextual field-level suggestions as user fills cargo requirement forms | `POST /api/v1/suggestions/inline` |
| **On-Page Insight Scheduler** | Celery Beat (15-min interval) + Redis queue + priority ranking algorithm | Evaluates all active models every 15 minutes, ranks insights by `Urgency × Financial Impact × Confidence`, pushes top 5 to frontend | `GET /api/v1/suggestions/insights` |
| **Smart Alert Banner System** | WebSocket (Django Channels / FastAPI WebSocket) + PostgreSQL event log | Real-time push of critical alerts (rate spikes, cyclone warnings, port closures, tidal window expiry) to all connected clients | `WS /ws/alerts` |
| **Predictive Field Suggestions** | Lightweight XGBoost classifier trained on per-user decision history | Predicts and pre-fills optimal field values based on user's past 50 decisions + current market state | `GET /api/v1/suggestions/predict-field` |
| **AI Tooltip Generator** | LLM summarisation endpoint + 15-minute Redis cache | Converts raw metric values into natural language interpretations with operational context and action implications | `GET /api/v1/suggestions/tooltip` |
| **Decision Context Manager** | React Context / Zustand (frontend) + PostgreSQL session store (backend) | Maintains persistent cross-page decision state, generates AI summary of current workflow position | `PUT /api/v1/session/decision-context` |

**Caching Strategy:**
- Inline suggestions: 5-minute TTL per field combination (Redis)
- Tooltip content: 15-minute TTL per metric state (Redis)
- Insight cards: regenerated every 15 minutes by Celery Beat scheduler
- Predictive fields: user model retrained daily, predictions served from in-memory cache

**Latency Targets:**
- Inline suggestion response: < 500ms (debounced at 300ms)
- Tooltip generation: < 200ms (cached) / < 1.5s (uncached, LLM call)
- Smart alert banner: < 100ms (WebSocket push)
- Insight card refresh: background process, no user-facing latency

---

## 3.3 System Architecture Flowchart

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA SOURCES LAYER                            │
│                                                                  │
│  Baltic Exchange Indices ──┐                                     │
│  Port Authority Bulletins ─┤                                     │
│  Hooghly Tide Tables ──────┤──→ [DATA INGESTION &               │
│  FOIS Rake Data ───────────┤     PREPROCESSING PIPELINE]        │
│  Maritime News ────────────┤           │                         │
│  AIS (Delayed) ────────────┤           ▼                         │
│  PMI / Bunker Prices ──────┤    [FEATURE ENGINEERING LAYER]     │
│  DGCIS Import Data ────────┘    (Route × Vessel Class matrices, │
│  IMD Cyclone Data                Seasonal dummies, NLP scores)  │
│                                        │                         │
└────────────────────────────────────────┼─────────────────────────┘
                                         │
                    ┌────────────────────┼──────────────────────┐
                    ▼                    ▼                       ▼
          ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
          │ FREIGHT RATE  │    │ CONSTRAINT/       │    │ NLP DISRUPTION│
          │ FORECAST      │    │ DECISION LAYER    │    │ RISK ENGINE   │
          │ MODELS        │    │                   │    │               │
          │ SARIMAX       │    │ Vessel-Port       │    │ DistilBERT/   │
          │ + XGBoost     │    │ Filter            │    │ Zero-shot     │
          │ + Prophet     │    │ Arbitrage Engine   │    │ Classifier    │
          │ 30/90/180     │    │ Markowitz         │    │               │
          │ day horizons  │    │ Optimizer         │    │ Disruption    │
          │               │    │ Tidal Draft       │    │ Score 0–100   │
          │               │    │ Predictor         │    │               │
          └──────┬────────┘    └────────┬──────────┘    └──────┬───────┘
                 │                      │                       │
                 └──────────┬───────────┘                       │
                            ▼                                   │
                 ┌──────────────────────┐                       │
                 │ UNIFIED DECISION     │◄──────────────────────┘
                 │ ENGINE               │
                 │                      │
                 │ Spot vs COA Simulator│
                 │ Breakeven Rate Calc  │
                 │ ₹ Crore Savings      │
                 │ Risk-Adjusted        │
                 │ Recommendation       │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │ DASHBOARD & COPILOT  │
                 │ LAYER                │
                 │                      │
                 │ React + Chart.js     │
                 │ Visualisations       │
                 │ SAGAR DRISHTI        │
                 │ Charter-Copilot      │
                 │ (LLM/RAG)           │
                 │ Role-based Access    │
                 └──────────┬───────────┘
                            │
                    ┌───────┴──────────┐
                    ▼                   ▼
          ┌──────────────┐    ┌──────────────────┐
          │ SAIL          │    │ GOVERNMENT/       │
          │ CHARTERING    │    │ POLICY OUTPUT     │
          │ DESK OUTPUT   │    │                   │
          │               │    │ Freight trend     │
          │ Vessel rec.   │    │ reports           │
          │ Entry timing  │    │ PSU benchmarking  │
          │ COA/Spot split│    │ Carbon tracking   │
          │ Risk flags    │    │ FOIS integration  │
          └───────────────┘    └───────────────────┘
```

---

## 3.4 User Interface Flow — Step-by-Step Logistics Manager Experience

| Step | User Action / System Response |
|---|---|
| **1** | **Input Cargo Requirement:** Logistics manager enters — cargo tonnage (e.g., 120,000 MT), commodity (Coking Coal), origin port cluster (Hay Point, Australia), destination East Coast port (Vizag), required laycan window (15–30 Nov 2026), contract duration preference (spot / 3-month COA / 6-month COA). |
| **2** | **Constraint Solver Runs:** System returns feasible vessel classes — e.g., Capesize ✅ (Vizag draft 16.5m, LOA 300m), Panamax ✅, Supramax ✅ (but 3 vessels needed). |
| **3** | **Tidal Predictor Runs (if Haldia/Sagar-Sandheads):** System flags tidal windows — e.g., *"Nov 17 spring tide — 8.1m draft available — max Panamax."* For Vizag/Dhamra: *"No tidal restriction."* |
| **4** | **Crane Matcher Runs:** System checks berth crane specification — e.g., *"Vizag Outer Harbor: functional shore unloader (40,000 MT/day) — gearless vessel acceptable."* |
| **5** | **Freight Rate Forecast Displayed:** Rate curve chart shows 30/90/180-day BCI C18 forecast with confidence bands + colour-coded entry signal: **GREEN — Enter in Week 2.** |
| **6** | **Spot vs COA Simulator Runs:** Breakeven rate calculator shows — *"6-month COA at $24.50/MT has 82% probability of outperforming spot. Expected savings: ₹30.5 crore."* |
| **7** | **Markowitz Optimiser Runs:** Efficient frontier displayed — *"Recommended: 65% COA / 35% spot for Q3 Australian coal. Portfolio risk reduced from $4.80/MT σ to $2.10/MT σ."* |
| **8** | **Arbitrage Engine Runs (if Haldia/Dhamra route):** Total landed cost comparison — Option A (2× Supramax to Haldia): ₹4,280/MT; Option B (Cape + lightering): ₹3,960/MT; Option C (Cape to Dhamra + rail): ₹3,820/MT. **Recommended: Option C.** |
| **9** | **Risk Dashboard Updates:** Composite disruption score = 31/100 (Low). Bay of Bengal cyclone risk: NIL (January window). Red Sea disruption: 14/100 (Normal). |
| **10** | **SAGAR DRISHTI Charter-Copilot:** Available as floating chat widget for natural language queries at any step. Manager can ask: *"What if I change the destination to Dhamra?"* — system recalculates all modules instantly. |

---
