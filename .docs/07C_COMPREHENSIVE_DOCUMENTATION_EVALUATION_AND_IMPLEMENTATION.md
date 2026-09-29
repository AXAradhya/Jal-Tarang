# DELIVERABLE 7 — PART D: SOLUTION EVALUATION

---

## D.1 Assess Feasibility

### Technical Feasibility — **HIGH**

All algorithms used in SAGAR DRISHTI are well-established in academic and industry practice:
- SARIMAX: Standard econometric time-series model (statsmodels Python library, extensively documented)
- XGBoost: Industry-standard gradient boosting (scikit-learn/XGBoost library, Nobel-calibre ML algorithm)
- Prophet: Facebook/Meta Research open-source forecasting tool with 20,000+ GitHub stars
- Markowitz optimisation: Classical portfolio theory (1952), implemented in scipy.optimize
- RAG/LangChain: Production-ready LLM framework used by thousands of enterprise applications

All data sources are publicly available or low-cost. The team's existing FastAPI/Python + React skills cover the full-stack requirement.

### Operational Feasibility — **HIGH**

SAGAR DRISHTI is a **decision-support tool** — it does not require changes to Transchart's statutory chartering process. SAIL's chartering desk uses the platform *before* submitting requirements to Transchart. No operational workflow disruption.

### Regulatory Feasibility — **HIGH**

- The platform does **not** execute contracts — it recommends, the human decides
- Does **not** access classified government data — all inputs are public/commercial
- Does **not** make autonomous procurement decisions — requires human sign-off
- Is a **recommendation engine** with a full audit trail, enhancing (not replacing) government procurement compliance

---

## D.2 Estimate Cost

| Component | Prototype Cost (₹ lakh) | Production Annual Cost (₹ lakh) |
|---|---|---|
| Cloud infrastructure | 0 (free tier / academic credits) | 5–10 |
| AIS data (MarineTraffic) | 0 (free tier, 24h delay) | 15–20 |
| LLM API (OpenAI / Mistral) | 0–1 (usage-based) | 5–10 |
| Baltic Exchange data | 0 (academic/historical datasets) | 10–15 |
| Development team | 0 (hackathon / academic) | 50–80 (team of 5) |
| **Total** | **~₹1 lakh** | **₹85–125 lakh/year (~₹1.25 crore)** |
| **Annual savings generated** | — | **₹139–226 crore** |
| **ROI** | — | **111:1 to 181:1** |

---

## D.3 Estimate Implementation Time

| Milestone | Timeline |
|---|---|
| **Prototype** (internal round demonstration — core forecasting + constraint solver + COA simulator) | 4–6 weeks from project start |
| **Production-ready MVP** for SAIL chartering desk pilot | 9–12 months |
| **Full multi-stakeholder platform** (NTPC, RINL, government dashboard) | 18 months |

---

## D.4 Assess Expected Benefits

| Benefit | Quantification |
|---|---|
| **Freight cost reduction** | ₹87–174 crore/year (5–10% improvement over spot baseline) |
| **Demurrage elimination** | ₹52 crore/year (2 days saved per voyage × 90 voyages) |
| **Decision speed improvement** | 4–6 hours → 15–20 minutes per chartering decision |
| **CAG audit risk reduction** | 100% documented decision trail — eliminates audit exposure |
| **Supply chain predictability** | ±15 days → ±3 days delivery window accuracy |
| **Carbon emission reduction** | ~500–800 MT CO₂ per avoided ballast voyage |

---

## D.5 Assess Potential Risks

*Reference: Section 4.2 — Five risks with detailed mitigations (COA data privacy, AIS cost, tidal accuracy, LLM hallucination, Transchart dependency)*

---

## D.6 Assess Operational Impact

The platform reduces the time a chartering officer spends on market research from approximately **4–6 hours per chartering decision** to **15–20 minutes** of reviewing SAGAR DRISHTI recommendations. It also shifts accountability from individual judgment (subjective, unauditable) to **documented, auditable model output** — reducing CAG audit risk for SAIL's procurement function.

The chartering officer's role evolves from "market research analyst" to "decision validator" — reviewing, contextualising, and approving platform recommendations rather than conducting manual market discovery.

---

## D.7 Assess Customer/User Impact

| User | Impact |
|---|---|
| **SAIL plant operations teams** | Gain 30–180 day advance visibility into freight costs, enabling better production cost forecasting and blast furnace scheduling |
| **SAIL chartering desk** | Gains confidence in COA negotiations by having a quantitative breakeven rate calculator — no longer negotiating blind |
| **Ministry of Steel** | Gains real-time freight intelligence dashboard — replaces annual report lag with live PSU performance monitoring |
| **Port trusts** | Gain advance vessel arrival prediction — enables proactive berth planning |

---

## D.8 Assess Scalability

SAGAR DRISHTI is architected for **multi-tenant deployment**. Adding NTPC or Coal India as a user requires only:

| Change Required | Effort |
|---|---|
| New cargo parameters (thermal coal, iron ore, etc.) | Configuration change — 1 day |
| New route configurations | Database update — 1 day |
| New organisation profile and access control | Admin setup — 1 hour |
| Architecture changes | **None** |

The government dashboard is an additional read-only layer over the same data infrastructure — no separate build required.

**Scaling path:**
1. SAIL (coking coal) → ₹139–226 crore savings
2. + NTPC (thermal coal) → estimated additional ₹50–100 crore savings
3. + Coal India (bulk coal) → estimated additional ₹30–50 crore savings
4. + RINL (coking coal via Vizag) → estimated additional ₹20–30 crore savings
5. **Total addressable annual savings: ₹239–406 crore across PSUs**

---

## D.9 Assess Sustainability

SAGAR DRISHTI is designed for **continuous learning and improvement**:

| Sustainability Mechanism | Description |
|---|---|
| **Model self-improvement** | Platform accuracy improves as it accumulates SAIL's actual charter rate data (fed back as training data after each voyage) |
| **NLP engine maturation** | Maritime news event labelling improves as more disruption events are classified and validated |
| **Tidal predictor refinement** | Haldia draft prediction improves as more arrival records and dredging data are collected |
| **COA model calibration** | Once SAIL's historical Transchart rates are available, the COA discount model transitions from benchmark-based to calibrated-on-actuals |
| **Knowledge base growth** | SAGAR DRISHTI Copilot's RAG knowledge base expands with every decision, voyage outcome, and user query |

---

## D.10 Compare Alternative Solutions

*Reference: Section A.11 — Solution evaluation comparison table*

---

## D.11 Conduct Cost-Benefit Analysis

### Conservative Case

```
Annual benefit:     ₹87 crore (5% freight reduction) + ₹52 crore (demurrage) = ₹139 crore
Annual cost:        ₹1.25 crore (production operations)
Net annual benefit: ₹137.75 crore
Payback period:     < 4 days
NPV (5 years, 10% discount): ₹522 crore
```

### Optimistic Case

```
Annual benefit:     ₹174 crore (10% freight + COA) + ₹52 crore (demurrage) = ₹226 crore
Annual cost:        ₹1.25 crore
Net annual benefit: ₹224.75 crore
Payback period:     < 3 days
NPV (5 years, 10% discount): ₹852 crore
```

**This is a Category 1 investment by any public sector NPV standard.**

---

## D.12 Identify Dependencies

| Dependency | Impact | Mitigation |
|---|---|---|
| **SAIL historical Transchart records** (for COA model calibration) | Required for production-grade accuracy | Prototype operates on published benchmarks; MoU with Ministry of Ports for data sharing |
| **FOIS API access** | Required for real-time rake availability in arbitrage engine | Ministry of Railways data-sharing agreement; fallback to published rake statistics |
| **Port authority cooperation** (real-time berth status) | Required for live congestion prediction | Port trust coordination; fallback to scraped daily bulletins |
| **Indian Railways rake forecast data** | Depends on FOIS data quality | Manual input as interim; automated API in production |

---

## D.13 Identify Potential Side Effects

### Positive Side Effects

- SAGAR DRISHTI's port congestion prediction will be useful to **port trusts for berth planning** — creating a natural institutional adoption pathway
- The platform's carbon tracking capability supports **India's IMO CII compliance** — generating ESG value beyond freight savings
- Backhaul matching reduces global empty vessel positioning — contributing to **industry-wide emission reduction**

### Negative Side Effects and Mitigations

| Potential Negative Side Effect | Mitigation |
|---|---|
| If COA recommendation is followed and rates fall further than forecast, SAIL locks at higher-than-spot rate | Markowitz portfolio approach ensures **never 100% COA** — always retains spot exposure to capture further dips; 90-day forecast confidence intervals clearly communicated |
| Over-reliance on platform recommendations without human judgment | Platform is designed as **decision-support, not decision-making** — human sign-off required; override logging captures learning opportunities |

---

## D.14 Check Compliance and Requirements

| Compliance Area | Assessment |
|---|---|
| **Government e-procurement rules** | ✅ Platform is decision-support, not execution — no compliance issue |
| **Data privacy (PDP Bill)** | ✅ No personal data processed — all inputs are commodity, vessel, and freight data |
| **CAG auditability** | ✅ All recommendations logged with data inputs, model version, user ID, timestamp — fully auditable |
| **Transchart statutory process** | ✅ Platform operates upstream of Transchart — enhances, does not replace |
| **IT security** | ✅ JWT authentication, bcrypt password hashing, RBAC, PostgreSQL with encrypted connections |

---

## D.15 Validate Against Success Criteria

*Reference: Section B.10 — All success criteria are measurable from operational data with defined measurement methods and timelines.*

---

# PART E: IMPLEMENTATION PLAN

---

## E.1 Select the Solution Approach

**Build bespoke AI freight intelligence platform (SAGAR DRISHTI)** on open-source Python stack, India-specific, East Coast-focused, integrated with FOIS and Transchart workflow.

---

## E.2 Define Implementation Steps

*Reference: Section A.14 — 4-phase, 18-month action plan*

---

## E.3 Assign Responsibilities

| Role | Responsibility | Phase |
|---|---|---|
| **ML Engineer 1** | Forecasting models (SARIMAX, XGBoost, Prophet), validation, backtesting | Phase 1–2 |
| **ML Engineer 2** | NLP engine, LLM/RAG Copilot, FAISS vector store | Phase 2–3 |
| **Backend Engineer** | FastAPI, PostgreSQL, data pipeline, port bulletin scraper, authentication | Phase 1–3 |
| **Frontend Engineer** | React dashboard, Chart.js/Recharts visualisations, UI/UX, responsive design | Phase 1–3 |
| **Domain Consultant** | Port constraint database, COA model calibration, FOIS integration, Transchart workflow design | Phase 1–4 |
| **Project Owner** | SAIL GM Shipping & Logistics | All phases |

---

## E.4–E.6 Milestones, Deadlines, and Budget

| Milestone | Deadline | Budget (₹ lakh) |
|---|---|---|
| Port constraint database + Baltic data pipeline | Month 1 | 2 |
| Freight forecast engine (SARIMAX + XGBoost + Prophet) | Month 2 | 5 |
| Spot-COA simulator + Markowitz optimiser | Month 3 | 5 |
| Arbitrage engine + tidal draft predictor | Month 4 | 5 |
| NLP disruption sentiment engine | Month 5–6 | 8 |
| LLM/RAG Charter-Copilot | Month 7–8 | 10 |
| FOIS integration + multi-tenant layer + government dashboard | Month 9–12 | 15 |
| **Total Phase 1–3** | **12 months** | **₹50 lakh** |

---

## E.7 Communication Plan

| Audience | Communication | Frequency |
|---|---|---|
| **SAIL Board** | Progress dashboard, savings realised, KPI scorecard | Quarterly |
| **Ministry of Steel** | Platform impact report, PSU benchmark data | Half-yearly |
| **Transchart** | Workflow integration status, requirement sheet format compliance | Monthly |
| **Port Trusts** | Congestion prediction outputs, vessel arrival forecasts | Daily (automated) |
| **Indian Railways (FOIS)** | Rake demand forecast from arbitrage engine | Weekly |

---

## E.8 Contingency Plans

| Risk Event | Contingency |
|---|---|
| Baltic Exchange data access restricted | Use UNCTAD dry bulk trade statistics + IMF commodity price data as proxy |
| FOIS API unavailable | Use Indian Railways published rake statistics + manual input as interim |
| LLM API costs escalate | Migrate to self-hosted Mistral-7B on same cloud infrastructure |
| SAIL's Transchart records cannot be shared | Calibrate COA discount model entirely on published Drewry/Clarksons benchmarks (already planned as primary approach) |
| Port authority stops publishing daily bulletins | Deploy AIS-based congestion inference as alternative |

---

## E.9 Define Metrics/KPIs

*Reference: Section B.10 — Success criteria table with targets and measurement methods*

---

## E.10 Establish Governance

| Governance Activity | Participants | Frequency |
|---|---|---|
| **Model performance review** | Data Science team + SAIL GM Shipping | Monthly |
| **COA vs spot performance audit** | SAIL CFO + Ministry of Steel representative | Quarterly |
| **Platform strategy review** (NTPC/Coal India expansion decision) | SAIL Board + Ministry of Steel | Annual |
| **CAG-ready audit log** | All recommendations, data inputs, model versions, and actual outcomes logged in PostgreSQL with timestamps and user IDs | Continuous (automated) |

---

# PART F: IMPLEMENTATION AND CONTINUOUS IMPROVEMENT

---

## F.1 Build or Configure the Solution

Follow the phased build plan (Section E.4). Priority order for internal hackathon round:

1. **Spot-COA Simulator** — directly answers the PS's stated objective
2. **Vessel–Port Constraint Solver** — most technically defensible demonstration of India-specific value
3. **Freight Rate Forecast** — shows ML capability with real Baltic Exchange data

These three modules together are demonstrable in a **6-minute presentation** and directly answer every PS sub-clause.

---

## F.2 Test the Solution

| Test Type | Method | Success Criterion |
|---|---|---|
| **Unit testing** | Test each module independently on historical data | All modules produce expected output for known inputs |
| **Backtesting — freight forecast** | Train on 2015–2020 BCI data, test on 2021–2023 | MAPE < 15% for 30-day forecast |
| **Backtesting — COA simulator** | Compare simulated COA vs spot outcomes on 2021–2023 historical rate data | COA outperforms spot in ≥65% of quarters |
| **Constraint solver validation** | Verify all 7 port constraints against official port authority specifications | 100% match |
| **Stress testing — tidal predictor** | Compare predicted draft windows against Kolkata Port Authority actual records | RMSE < 0.3m |
| **Integration testing** | End-to-end flow: cargo input → forecast → recommendation → Copilot explanation | Complete pipeline executes in < 30 seconds |

---

## F.3 Run a Pilot or Trial

**Proposed Pilot:** 3-month pilot with SAIL's shipping desk covering **5 actual voyages**:

| Pilot Parameter | Value |
|---|---|
| Duration | 3 months |
| Voyages covered | 5 (across at least 2 different routes and 2 different destination ports) |
| Method | Platform recommendations generated alongside existing process; outcomes compared at voyage completion |
| Success metric | Platform recommendation outperforms existing process on ≥3 of 5 voyages (freight cost or demurrage days) |

---

## F.4 Collect Feedback

Post-voyage survey with chartering officers covering:

| Question | Purpose |
|---|---|
| Was the vessel recommendation correct? | Validate constraint solver accuracy |
| Was the rate forecast directionally accurate? | Validate forecasting model reliability |
| Was the COA signal actionable within the Transchart timeline? | Validate operational integration |
| Was the tidal/draft prediction useful (if Haldia)? | Validate tidal predictor value |
| Was the SAGAR DRISHTI Copilot response useful? | Validate conversational AI utility |
| What additional data would you want the platform to include? | Identify capability gaps for Version 2.0 |

---

## F.5 Monitor Results and Continuously Improve

| Activity | Frequency |
|---|---|
| **Model retraining** on new Baltic Exchange data | Monthly |
| **Port constraint table update** | Quarterly (verified against port authority publications) |
| **COA discount model recalibration** | Annual (incorporating SAIL's actual charter rates once available) |
| **NLP engine vocabulary expansion** | Continuous (new maritime event types added as they occur) |
| **SAGAR DRISHTI Copilot knowledge base update** | Continuous (every new Decision Dossier added to RAG corpus) |
| **Tidal predictor siltation factor update** | Quarterly (from KPT dredging reports) |

---

*End of Deliverable 7 — Comprehensive Problem and Solution Documentation*

---

> **SAGAR DRISHTI** — *Vision Across the Oceans* — bridges the gap between complex maritime realities and strategic public-sector bulk procurement. By synthesising machine learning, physical port hydrodynamics, global shipping indices, and high-precision financial calculations into a single, intuitive platform, SAGAR DRISHTI establishes a new benchmark for India's industrial maritime independence.

---
