# DELIVERABLE 7 — PART B: SOLUTION DOCUMENTATION

---

## B.1 Define the Problem Clearly (Concise Restatement for Solution Framing)

SAIL's coking coal chartering process is **reactive**, **port-constraint-unaware**, and **COA-blind** — resulting in ₹87–174 crore/year in avoidable freight costs, demurrage losses, and vessel–port mismatches across the East Coast port cluster. The root cause is the absence of a data-driven freight intelligence capability that converts publicly available Baltic Exchange indices, port authority data, tide tables, and macro-commodity signals into actionable chartering decisions.

---

## B.2 Define the Desired Outcome

SAGAR DRISHTI is an AI freight intelligence platform that:

1. **Predicts** freight rate curves per route × vessel class 30/90/180 days ahead with 95% confidence intervals
2. **Recommends** the optimal vessel class for each cargo lot at each East Coast port based on hard physical constraints
3. **Recommends** the optimal COA vs spot allocation per quarter using Markowitz portfolio optimisation
4. **Computes** total landed cost across all discharge routing options (direct port, lightering, two-port split, rail evacuation)
5. **Predicts** Haldia tidal windows to eliminate anchorage waiting time
6. **Flags** geopolitical and cyclone disruptions proactively with quantified rate impact
7. **Provides** a zero-hallucination conversational AI interface (Charter-Copilot) for logistics managers
8. **Generates** auditable Decision Dossiers for every chartering recommendation

---

## B.3 Identify the Root Cause (Solution Frame)

The root cause is the **absence of a structured data pipeline** converting publicly available Baltic Exchange indices, port authority data, tide tables, and macro-commodity signals into actionable chartering decisions. SAGAR DRISHTI is the infrastructure that converts raw data into decisions.

---

## B.4 Gather Relevant Facts and Data

| Data Point | Value | Source |
|---|---|---|
| SAIL coking coal imports | ~7.5 million MT/year | SAIL Annual Report FY2023–24 |
| BCI C18 average FY2023 (Gladstone→Dhamra, 150K MT coal) | ~$22–32/MT | Baltic Exchange |
| Haldia maximum draft (tide-dependent) | 8.5–12.5m (spring tides) | Kolkata Port Authority |
| Dhamra maximum draft | 18.0m | Dhamra Port Company Ltd |
| Vizag Outer Harbor maximum draft | 16.5m | Vizag Port Authority |
| COA 12-month discount to spot | 10–15% | Drewry/Clarksons benchmark |
| COA 6-month discount to spot | 7–12% | Drewry/Clarksons benchmark |
| COA 3-month discount to spot | 3–7% | Drewry/Clarksons benchmark |
| Demurrage rate — Capesize | $30,000–40,000/day | Standard charter party rates |
| Demurrage rate — Supramax | $25,000–35,000/day | Standard charter party rates |
| Bay of Bengal cyclone season | April–May (pre-monsoon), October–December (post-monsoon) | India Meteorological Department |
| Transchart chartering fee | 1% of freight value | Ministry of Ports |

---

## B.5 Identify Who Is Affected

*Reference: Section A.8 — Stakeholder identification table*

---

## B.6 Understand Stakeholder Needs

| Stakeholder | Primary Need | How SAGAR DRISHTI Delivers |
|---|---|---|
| **SAIL Chartering Desk** | Real-time freight rate signal + vessel recommendation + COA timing advice | Market Entry Timing Engine + Vessel–Port Matcher + COA Simulator |
| **SAIL Plant Operations** | Reliable coking coal delivery schedule — no blast furnace feed disruption | Supply chain predictability from ±15 days to ±3 days |
| **Ministry of Steel** | Cost efficiency visibility + PSU freight benchmark | Government dashboard with real-time savings counter |
| **Port Trusts** | Advance vessel arrival scheduling to reduce anchorage congestion | Congestion prediction module — 30-day advance visibility |
| **Indian Railways (FOIS)** | Advance rake demand signal from arbitrage engine | Arbitrage Engine outputs rake requirements 7–14 days before vessel arrival |
| **NTPC/Coal India** | Same platform, different cargo parameters — scalability | Multi-tenant architecture — new organisation profile only |

---

## B.7 Define the Scope

### In Scope (Version 1.0)

- East Coast India ports (7 named ports: Vizag, Gangavaram, Dhamra, Paradip, Gopalpur, Haldia, Sagar-Sandheads)
- Coking coal import routes (5 source regions: Australia, USA, Mozambique, Russia, Indonesia)
- Dry bulk vessel classes (Handysize through Super Capesize/VLOC)
- Spot chartering and COA decision support
- Inland evacuation arbitrage (rail vs lighterage) — Dhamra→Durgapur/Bokaro railway route
- Tidal/draft optimisation for Haldia/Hooghly
- NLP disruption scoring from maritime news
- Conversational AI Charter-Copilot
- Authentication and role-based access control

### Out of Scope (Version 1.0)

- West Coast India ports (Kandla, Mundra, JNPT)
- Liquid bulk, container, or tanker segments
- Actual charter party contract execution (SAGAR DRISHTI is decision-support, not an e-marketplace)
- FFA trading or financial hedging execution
- Proprietary live Baltic Exchange data feed (prototype uses historical/academic data)

---

## B.8 Identify Constraints

| Constraint | Impact | Mitigation |
|---|---|---|
| All freight rate inputs based on publicly available indices, not live proprietary data | Prototype accuracy bounded by index availability and 24-hour lag | Free academic datasets for prototype; production upgrade to paid Baltic feed (₹10–15 lakh/year) |
| Transchart's statutory role in chartering is a legal constraint | Platform cannot bypass or replace Transchart's procurement process | Position as pre-Transchart decision-support; outputs formatted as Transchart-compatible requirement sheets |
| AIS real-time data is a paid resource | Prototype uses 24-hour delayed AIS from MarineTraffic free tier | Sufficient for 30–180 day forecast horizons; real-time AIS added in production (₹15–20 lakh/year) |
| LLM Copilot requires internet connectivity and API access | Offline mode would degrade to rule-based recommendations only | RAG architecture ensures all critical computations are local; LLM adds explanation layer only |

---

## B.9 Identify Assumptions

| Assumption | Confidence | Validation Method |
|---|---|---|
| BCI/BPI/BSI historical data is available for model training | ✅ Confirmed | Academic datasets available on Kaggle, UNCTAD, research papers |
| SAIL's historical freight rates from Transchart records can be obtained under MoU | ⚠ Assumed | Required for production-grade COA model calibration; prototype uses Drewry/Clarksons benchmarks |
| Port constraint specifications from public documents are accurate | ✅ High confidence | Verified against multiple port authority publications; annual verification protocol |
| Hooghly tide tables are sufficiently accurate for tidal draft prediction | ✅ High confidence | Corrected for siltation using quarterly dredging reports from KPT |
| COA discount model (3–15% below spot by tenor) is reasonable | ✅ High confidence | Calibrated against Drewry Dry Bulk Freight Rate Outlook and Clarksons Shipping Review published ranges |

---

## B.10 Establish Success Criteria

| Metric | Target | Measurement Method | Timeline |
|---|---|---|---|
| **Freight cost reduction vs BCI benchmark** | ≥5% in Year 1, ≥10% by Year 2 | Monthly average paid rate vs BCI C18 equivalent | Monthly tracking |
| **COA adoption rate** | 30% of volume in Year 1, 50% by Year 2 | % of total MT under COA vs spot | Quarterly review |
| **Tidal window misses at Haldia** | Zero after go-live | Port records — anchorage waiting time log | Per voyage |
| **Vessel–port mismatch rate** | Zero (hard constraint enforcement) | Chartering records — LOA/draft compliance check | Per voyage |
| **Demurrage per voyage** | ≤0.5 days average | Voyage report analysis | Monthly tracking |
| **Forecast directional accuracy** (30-day) | ≥70% | Backtesting — predicted direction vs actual BCI movement | Monthly |
| **Platform adoption rate** | 100% of SAIL chartering desk decisions | System login and usage logs | Quarterly |

---

# PART C: SOLUTION DEVELOPMENT

---

## C.1 Brainstorm Possible Solutions — Internal Module Alternatives Considered

### Forecasting Layer

| Model Considered | Strengths | Weaknesses | Decision |
|---|---|---|---|
| **Pure ARIMA** | Simple, interpretable | Cannot use exogenous regressors; misses macro drivers | ❌ Rejected as standalone |
| **SARIMAX** | Handles seasonality + exogenous inputs (BDI, PMI, bunker) | Linear assumptions | ✅ **Selected as baseline** |
| **XGBoost** | Captures non-linear feature interactions; robust to outliers | Less interpretable than SARIMAX | ✅ **Selected as ensemble layer** |
| **LSTM / Deep Learning** | Powerful sequence modelling | Requires large dataset; hard to interpret for government decision-makers; overfitting risk | ⚠ Deferred to Version 2.0 |
| **Prophet** | Excellent trend + seasonality decomposition; handles missing data | Less precise than SARIMAX for point forecasts | ✅ **Selected for supplementary decomposition** |

### Optimisation Layer

| Algorithm Considered | Use Case | Decision |
|---|---|---|
| **Linear Programming (PuLP)** | Arbitrage engine — deterministic, transparent, auditable | ✅ **Selected** |
| **Markowitz Mean-Variance** | Portfolio optimisation — classical, defensible, explainable | ✅ **Selected** |
| **Reinforcement Learning** | Dynamic chartering policy optimisation | ⚠ Deferred — black box, difficult to audit in government context |

---

## C.2 Research Existing Solutions

| Platform | Capabilities | Gaps vs SAGAR DRISHTI | Assessment |
|---|---|---|---|
| **Veson IMOS** | Commercial voyage management, charter accounting, position list | $200K+/year; not India-specific; no East Coast digital twin; no COA portfolio optimiser; no FOIS integration | ❌ Insufficient for SAIL's specific needs |
| **Clarksons Platou Digital** | Rate data, research reports, market intelligence | No optimisation layer; no operational decision module | ⚠ Useful as data source, not as platform |
| **Oceanbolt (Veson)** | AIS-based trade flow analytics | No freight rate forecasting; no optimisation engine | ⚠ Data layer only |
| **Kpler/Vortexa** | Commodity trade flow tracking | No freight rate forecasting; no COA optimisation | ⚠ Data layer only |

**None of the above have:** the Haldia tidal predictor, the Dhamra–Rail arbitrage engine, the Markowitz COA/spot optimiser, the crane capability matcher, the NLP geopolitical engine, the AI Contextual Intelligence Layer (inline field suggestions, on-page proactive recommendation cards, smart alert banners, AI-powered chart tooltips), or Transchart workflow integration. **These are genuine innovations unique to SAGAR DRISHTI.**

---

## C.3 Identify Best Practices

| Best Practice | Source | How SAGAR DRISHTI Adopts It |
|---|---|---|
| COA indexation against Baltic route-specific indices with fixed spread | Clarksons/Drewry standard | COA Simulator uses BCI C18 as base with tenor-based discount |
| Duration-based discount model (3–15% below spot) | Published shipping trade press benchmarks | Calibrated into Monte Carlo simulation |
| Walk-forward cross-validation for time-series models | Standard ML practice | Applied to all forecasting model validation |
| RAG architecture for LLM in data-sensitive domains | LangChain/Google best practices | SAGAR DRISHTI Copilot uses RAG over internal verified database |
| Port Digital Twin concept | Smart port academic literature | Adapted as constraint solver + tidal predictor combination |

---

## C.4 Generate Alternative Approaches

**Selected Approach:** Ensemble SARIMAX + XGBoost forecasting + mean-variance portfolio optimisation + linear programming arbitrage + RAG LLM Copilot, deployed on FastAPI/Python stack with React + Chart.js dashboard.

This approach was selected because:
1. All algorithms are well-established and auditable (critical for government PSU context)
2. All data sources are publicly available or low-cost
3. The Python/React stack has extensive community support and the team has proven competence
4. The RAG architecture prevents LLM hallucination — essential for procurement decisions

---

## C.5 Challenge Existing Assumptions

### Assumption Challenged: "SAIL must always charter through Transchart and therefore has no flexibility in chartering strategy."

**Reality:** Transchart is the execution channel, not the strategy setter. SAIL can and should develop its own freight market intelligence and present an optimised cargo programme to Transchart. SAGAR DRISHTI improves SAIL's negotiating position *within* the Transchart process, not around it.

### Assumption Challenged: "Haldia's draft restriction means SAIL must always use Panamax or smaller for West Bengal plants."

**Reality:** The arbitrage engine proves that a Capesize to Dhamra + Indian Railways rail to Durgapur can be **cheaper** than two Supramax to Haldia under specific freight rate and rail rake availability conditions. SAGAR DRISHTI computes this dynamically for every shipment decision.

---

## C.6 Break the Solution into Smaller Components

| # | Component | Function |
|---|---|---|
| 1 | Data ingestion and preprocessing pipeline | Scrape, parse, normalise all data sources |
| 2 | Port constraint database | Physical specifications for 7 East Coast + 6 loading ports |
| 3 | Freight rate forecasting engine (SARIMAX + XGBoost + Prophet) | 30/90/180-day rate predictions |
| 4 | Vessel–port constraint solver | Pass/fail + ranking for feasible vessel classes |
| 5 | Spot-vs-COA cost simulator | Monte Carlo breakeven rate calculator |
| 6 | Markowitz portfolio optimiser | Efficient frontier for COA/spot allocation |
| 7 | Arbitrage engine (Haldia lighterage vs Dhamra rail) | Least-cost discharge routing |
| 8 | Tidal draft predictor (Hooghly/Haldia) | Draft window availability + demurrage cost |
| 9 | Crane capability matcher | Geared vs gearless vessel filtering |
| 10 | NLP disruption sentiment engine | Disruption Risk Score 0–100 |
| 11 | Risk early-warning dashboard | 8-dimension composite risk scoring |
| 12 | Backhaul matching module | Indian export cargo pairing |
| 13 | SAGAR DRISHTI Charter-Copilot (LLM/RAG) | Natural language query interface |
| 14 | Multi-stakeholder access layer | SAIL desk / analyst / government roles |
| 15 | FOIS integration layer | Railway rake demand signalling |
| 16 | AI Contextual Intelligence Layer (Feature G) | Inline field suggestions, on-page recommendation cards, smart alert banners, AI tooltips, predictive field auto-complete, cross-page decision continuity |

---

## C.7 Identify Required Resources

| Resource Category | Prototype | Production |
|---|---|---|
| **Computing** | Standard cloud VM (AWS EC2 t3.large or free tier) | Compute-optimised instance for NLP/LLM inference |
| **Data** | Publicly available (Baltic indices, port bulletins, tide tables, DGCIS, SAIL annual report, IMD) | Paid Baltic Exchange live feed + real-time AIS |
| **AIS** | MarineTraffic free tier (24h delay) | $500–2,000/month real-time |
| **LLM API** | OpenAI GPT-4-turbo (~$0.01–0.03/1000 tokens) | Self-hosted Mistral-7B for zero marginal cost |
| **Team** | 2 ML engineers + 1 backend + 1 frontend | + 1 domain consultant |
| **Timeline** | 4–6 weeks (prototype) | 12 months (production MVP) |

---

## C.8 Identify Required Skills

| Skill | Role | Team Coverage |
|---|---|---|
| Time-series econometrics (SARIMAX, ARIMA) | ML Engineer 1 | ✅ |
| Gradient boosting (XGBoost, CatBoost) | ML Engineer 1 | ✅ |
| Linear/quadratic programming (PuLP, scipy) | ML Engineer 1/2 | ✅ |
| NLP / transformer models (HuggingFace) | ML Engineer 2 | ✅ |
| LLM application development (LangChain, RAG, FAISS) | ML Engineer 2 | ✅ |
| FastAPI backend development | Backend Engineer | ✅ |
| PostgreSQL database design | Backend Engineer | ✅ |
| React frontend development | Frontend Engineer | ✅ |
| Web scraping (BeautifulSoup, Selenium) | Backend Engineer | ✅ |
| Maritime domain knowledge | Domain research | ✅ (researched) |

---

## C.9 Determine Technology or Tools Required

*Reference: Section 3.2 — Full Technology Stack Table*

---

## C.10 Develop the Preliminary Solution Concept

The platform is named **SAGAR DRISHTI** (सागर दृष्टि — *Vision Across the Oceans*). It is a web-based AI freight intelligence platform accessible to SAIL's shipping desk via a browser. The core decision loop is:

```
Data Ingestion → Forecast → Optimisation → Recommendation → Copilot Explanation
```

Every recommendation is traceable to a specific data input and model output, making it fully auditable under government procurement standards. The platform enforces role-based access control, maintains cryptographic audit trails, and generates committee-ready Decision Dossiers.

---
