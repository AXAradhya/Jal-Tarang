# DELIVERABLE 2 — SLIDE 2: PROPOSED SOLUTION

---

## 2.1 One-Line Solution Statement

**SAGAR DRISHTI** is an AI-powered freight intelligence platform that enables SAIL to shift coking coal chartering from reactive, day-to-day spot-market procurement to a mathematically optimised, forecast-driven strategy combining spot fixtures and Contracts of Affreightment (COA), using machine learning rate prediction, vessel–port constraint matching, and portfolio optimisation across India's East Coast port cluster.

---

## 2.2 Problem Statement in Own Words

SAIL's shipping desk currently charters coking coal vessels on a voyage-by-voyage spot basis from Australia, USA, Mozambique, Russia, and Indonesia — without systematic forecasting of freight rates, without quantitative evaluation of optimal vessel–port matching against physical draft/LOA constraints at seven East Coast ports, and without any structured mechanism to evaluate whether locking a multi-voyage COA would save ₹87–174 crore/year versus continuing spot market exposure. The consequences are missed low-rate windows, mismatched vessels causing demurrage at draft-restricted ports like Haldia, idle anchorage time during Bay of Bengal cyclones, and zero COA adoption — all directly auditable procurement inefficiencies.

---

## 2.3 Four Core Solution Modules — Mapped to PS Sub-clauses a/b/c/d

### Module 1 — Market Entry Timing Engine (Answers PS Clause a)

| Attribute | Details |
|---|---|
| **PS Sub-clause** | (a) Freight rate forecasting and market timing |
| **Function** | Forecasts freight rate curves per route × vessel class for 30, 90, and 180 calendar days into the future. Routes covered: Newcastle/Hay Point → East Coast India, Nacala/Beira → East Coast India, US Gulf → East Coast India, East Kalimantan → East Coast India, Vostochny/Taman → East Coast India. Vessel classes: Handysize, Supramax, Panamax, Capesize, Super Capesize. |
| **Processing Logic** | Ensemble SARIMAX + XGBoost + Prophet models trained on Baltic Exchange BCI/BPI/BSI/BHSI historical indices, with seasonal cyclone dummies, India Manufacturing PMI, bunker fuel price (VLSFO), and NLP-derived geopolitical disruption scores as exogenous regressors. Walk-forward cross-validation on 5 years of data ensures statistical rigour. |
| **Output** | A rate-curve chart with a colour-coded entry signal: **GREEN** (lock charter now — rates expected to climb), **AMBER** (wait 7–14 days — rates softening), **RED** (rates rising sharply — avoid spot, consider COA). 95% confidence bands displayed on every forecast curve. |

### Module 2 — Vessel–Port Matching Engine (Answers PS Clause b)

| Attribute | Details |
|---|---|
| **PS Sub-clause** | (b) Vessel class optimisation and port constraint matching |
| **Function** | Recommends the optimal vessel class per cargo lot based on hard physical port constraints at all seven named East Coast ports. Prevents vessel–port mismatches that cause demurrage, lightering costs, or berth rejection. |
| **Processing Logic** | Port Constraint Database stores draft (m), LOA (m), beam (m), handling rate (MT/day), gear requirement (geared vs gearless), and tidal dependency for each berth at Paradip, Vizag, Gangavaram, Gopalpur, Dhamra, Sagar-Sandheads, and Haldia. Constraint solver filters the feasible vessel set first (pass/fail on draft, LOA, beam), then ranks by Time Charter Equivalent (TCE)-adjusted total landed cost. |
| **Output** | Ranked vessel-class recommendation with rationale per port. Example: *"For 120,000 MT to Vizag Outer Harbor (16.5m draft): Capesize FEASIBLE — lowest TCE at $14.85/MT. For same cargo to Haldia (8.5m draft): Capesize NOT FEASIBLE — recommend 2× Supramax at $22.10/MT, or Capesize + Sagar-Sandheads lightering at $18.40/MT."* |

### Module 3 — Idle/Deadheading Optimiser (Answers PS Clause c)

| Attribute | Details |
|---|---|
| **PS Sub-clause** | (c) Reducing vessel idle time and deadheading |
| **Function** | Forecasts low-demand windows, identifies ballast/repositioning risk, and suggests backhaul cargo matching with Indian bulk exports (iron ore, manganese, finished steel) to reduce empty repositioning voyages. |
| **Processing Logic** | Analyses seasonal coal demand patterns at SAIL plants (blast furnace consumption schedules), identifies windows where vessel availability exceeds requirement, and cross-references Indian export cargo databases (DGCIS export statistics) to match outbound cargo parcels with returning bulk carriers. |
| **Output** | A voyage utilisation calendar showing: inbound coal deliveries, ballast repositioning legs (flagged in red), and suggested backhaul cargo pairings with estimated freight savings. Example: *"Capesize returning to Australia post-Vizag discharge — backhaul 80,000 MT iron ore to Qingdao available — estimated freight offset: $4.20/MT."* |

### Module 4 — Risk Early-Warning Module (Answers PS Clause d)

| Attribute | Details |
|---|---|
| **PS Sub-clause** | (d) Risk identification and disruption management |
| **Function** | Flags freight rate volatility spikes, port congestion at destination, Bay of Bengal cyclone season impact (April–May, October–December), geopolitical disruption (Red Sea, Panama Canal, Australian port strikes), and NLP-derived disruption risk scores from maritime news. |
| **Processing Logic** | Composite scoring across eight risk dimensions (weather, congestion, freight volatility, bunker price, geopolitical, counterparty, currency/FX, vessel performance). NLP engine uses HuggingFace zero-shot classification on maritime news corpus (Lloyd's List, TradeWinds, Baltic Exchange circulars). India Meteorological Department cyclone data integrated for Bay of Bengal seasonal risk. |
| **Output** | A risk dashboard with a Composite Disruption Risk Score (0–100) per route and recommended action. Example: *"Red Sea disruption score: 78/100 — BCI C18 rate forecast revised upward by 12% for 45-day window. Action: LOCK CAPE TOWN ROUTING, avoid Suez."* |

---

## 2.4 Innovation Feature — Spot vs COA Cost Simulator

This is the direct answer to the PS's stated Objective, which most competing teams will not build.

| Attribute | Details |
|---|---|
| **What It Computes** | Expected total freight cost of continuing on single-voyage spot charters versus locking a 3-month, 6-month, or 12-month COA at the forecast rate. Calculates the breakeven freight rate in USD/MT at which the COA becomes cost-equivalent to spot. |
| **How It Computes** | Monte Carlo simulation (10,000 paths) over the SARIMAX+XGBoost forecast rate distribution. For each simulation path, computes total spot cost vs total COA cost (applying duration-based discounts: 3-month: 3–7% below spot, 6-month: 7–12%, 12-month: 10–15% — calibrated against Drewry/Clarksons shipping benchmarks). Outputs the probability that COA outperforms spot, the expected savings in USD and INR, and the breakeven rate. |
| **Output Format** | A rupee-crore annual savings recommendation. Example: *"For Q3 Australian coal volume (2.1 million MT): 6-month COA at $24.50/MT (7.5% below current BCI C18) has 82% probability of outperforming spot. Expected savings: $3.67 million (₹30.5 crore) vs spot baseline."* |
| **Why This Is Unique** | No other team will model the COA discount structure (3–15% by tenor) against a probabilistic forecast rate curve. Commercial platforms like Veson IMOS provide voyage accounting but not forward-looking COA vs spot decision support with Monte Carlo confidence intervals. |

---

## 2.5 Advanced Differentiating Features (the "No One Else Will Have This" Layer)

### Feature A — COA vs Spot Markowitz Portfolio Optimiser

Apply Modern Portfolio Theory (Markowitz, 1952) to chartering decisions. Treat spot market exposure as a high-volatility asset and COA as a lower-volatility fixed-income-like instrument. The optimiser computes the efficient frontier of freight cost (expected return) vs freight cost variance (risk), and recommends the optimal spot/COA split per quarter per route.

**Processing Logic:** Mean-variance optimisation using scipy.optimize over the forecast rate distributions for spot and COA at each tenor. The efficient frontier is plotted, and the optimal allocation point is selected based on SAIL's risk appetite parameter (configurable by the chartering manager).

**Example Output:** *"Model recommends locking 65% of Q3 Australian coal under a 6-month COA pegged to BCI C18 average minus $1.50/MT, retaining 35% spot exposure to capture expected November rate dip. Portfolio risk (freight cost standard deviation): reduced from $4.80/MT to $2.10/MT."*

### Feature B — Haldia Sandheads Lighterage vs Dhamra Rail Arbitrage Engine

Compute Total Landed Cost across three discharge scenarios for Capesize cargo destined for Durgapur/Bokaro blast furnaces:

- **Option A:** Two Supramax vessels direct to Haldia (within draft limit)
- **Option B:** One Capesize, two-port discharge — 40% Dhamra + 60% Haldia lighterage at Sagar-Sandheads
- **Option C:** Full Capesize to Dhamra + Indian Railways FOIS rake transport to plant

**Inputs:** Rail freight rate per tonne-km from Dhamra to Durgapur/Bokaro (FOIS published rates), current rake availability signal from FOIS, stockyard fill-level at Haldia, bunker fuel cost differential for Capesize vs 2× Supramax, lightering barge hire rate at Sagar-Sandheads.

**Output:** Least-cost discharge routing recommendation in ₹/tonne total landed. Example: *"Option C (Capesize to Dhamra + rail) is ₹320/MT cheaper than Option A (2× Supramax to Haldia) under current conditions. Rail rake availability: 85% — 12 rakes available this week at Dhamra siding."*

### Feature C — Hooghly River Tidal Draft Predictor (Haldia-Specific)

Ingest hydrographic tide tables published annually by Kolkata Port Authority (Syama Prasad Mookerjee Port). Predict the draft window available on each day of the vessel's estimated arrival window. Incorporate a siltation correction factor derived from quarterly dredging reports.

**Output:** *"If chartered today, vessel arrives Nov 14th — draft 7.2m available, cannot load full cargo. Delay charter 3 days — arrival Nov 17th spring tide — draft 8.1m — additional 5,000 MT capacity unlocked. Demurrage cost of missing tidal window: $70,000 (2 days × $35,000/day). Cost of delaying charter 3 days: $8,400 (rate differential). Net saving from delay: $61,600."*

### Feature D — Geared vs Gearless Vessel Crane Capability Matcher

For each destination berth, store the shore crane specification (type, capacity, rated condition). If the destination berth has no functional shore unloader or slow cranes, filter out gearless vessels and recommend geared Supramax.

**Mathematical Proof:** A geared Supramax costs approximately $2/MT more in time-charter equivalent than a gearless vessel. However, at a berth with a slow crane (handling rate 8,000 MT/day vs standard 25,000 MT/day), a 50,000 MT cargo takes 6.25 days to discharge vs 2.0 days. Extra demurrage: 4.25 days × $30,000/day = $127,500 = $2.55/MT. Net saving from choosing geared vessel: $0.55/MT × 50,000 MT = **$27,500 per voyage**.

### Feature E — NLP Geopolitical Disruption Sentiment Engine

Scrape maritime news sources (Lloyd's List, TradeWinds, Baltic Exchange circulars). Use NLP (HuggingFace zero-shot classification or fine-tuned DistilBERT on maritime text corpus) to classify event severity across categories: port strikes, canal blockages, weather disruptions, sanctions, piracy, and war/conflict.

**Processing:** Each event is assigned a Disruption Score (0–100) and a route-specific impact flag. The score adjusts the freight rate forecast upward or downward based on empirical disruption-to-rate elasticities (calibrated on historical events: 2021 Suez blockage +15% BCI, 2023 Red Sea crisis +22% BCI).

**Output:** *"Red Sea disruption score: 78/100 — C18 rate forecast revised upward by 12% for 45-day window. Action: Consider Cape of Good Hope routing for Mozambique origin coal."*

### Feature F — SAGAR DRISHTI Charter-Copilot (Conversational AI)

Embed an LLM-powered conversational interface. The logistics manager types natural language queries and receives comprehensive, data-grounded responses.

**Architecture:** RAG (Retrieval-Augmented Generation) using LangChain + FAISS vector store over SAGAR DRISHTI's own data lake (port constraints, vessel registry, rate forecasts, voyage economics). The LLM (GPT-4-turbo API or self-hosted Mistral-7B) generates natural language explanations, but all numerical outputs come from deterministic model computations. The LLM cannot override hard port constraint rules.

**Example Interaction:**
> **User:** "I need to move 120,000 MT of coking coal from Queensland to Vizag next month. Best strategy?"
>
> **SAGAR DRISHTI Copilot:** "Based on current data:
> - **Vessel:** Capesize (Vizag Outer Harbor draft 16.5m — fully feasible)
> - **Market timing:** BCI C18 forecast shows rates softening 4% over next 10 days before Australian weather disruption rally — **ENTER IN WEEK 2**
> - **Rate estimate:** $14.85/MT (vs current spot $15.50/MT)
> - **COA signal:** 6-month COA breakeven at $13.20/MT — COA outperforms spot with 78% probability
> - **Risk flags:** Bay of Bengal cyclone risk LOW (January window), Red Sea disruption MODERATE (14/100)
> - **Draft check:** PASS — vessel summer draft 17.8m < Vizag limit 18.5m
> - **Crane check:** Vizag has functional shore unloaders — gearless vessel acceptable
> - **Estimated savings vs blind spot:** ₹13.5 crore on this single shipment"

### Feature G — AI Contextual Intelligence Layer (Inline & On-Page Suggestions)

While Feature F (Charter-Copilot) provides an *on-demand* conversational AI assistant, Feature G delivers **proactive, ambient intelligence** — surfacing AI-driven insights directly within every page and every data field of the platform, without the user needing to ask. This transforms SAGAR DRISHTI from a passive dashboard into an **actively intelligent workspace** that continuously guides decision-making.

#### G.1 — Inline Field-Level AI Suggestions

**What It Does:** As the logistics manager fills in cargo requirement forms, every input field is augmented with a small AI suggestion chip (💡 icon) that provides real-time contextual guidance based on current market data and platform models.

**How It Works:** Each input field triggers a lightweight inference call to the SAGAR DRISHTI Decision Engine. The engine cross-references the user's partial input against current forecasts, port constraints, and historical patterns to generate a one-line contextual recommendation displayed as an inline annotation directly below or beside the field.

**Detailed Examples:**

| Input Field | User Enters | Inline AI Suggestion |
|---|---|---|
| **Cargo Tonnage** | 120,000 MT | 💡 *"At 120K MT, a single Capesize is optimal for Vizag/Dhamra. For Haldia, consider splitting into 2× Supramax (60K each) — saves ₹3.2/MT vs lightering."* |
| **Origin Port** | Hay Point, Australia | 💡 *"BCI C18 (Hay Point→Dhamra) is currently $26.40/MT — 8% below 90-day average. Favourable window detected."* |
| **Destination Port** | Haldia | ⚠ *"ALERT: Haldia max draft 8.5m (tide-dependent). Capesize NOT feasible without Sagar-Sandheads lightering. Consider Dhamra + rail alternative — currently ₹280/MT cheaper."* |
| **Laycan Window** | 15–30 Nov 2026 | 💡 *"November is post-monsoon cyclone shoulder season. IMD forecast shows 18% probability of Bay of Bengal depression in this window. Consider advancing laycan by 10 days."* |
| **Contract Preference** | Spot | 💡 *"Based on 90-day forecast: 6-month COA would save an estimated ₹4.70/MT (₹56.4 lakh on this parcel) vs spot. Tap to see COA comparison →"* |
| **Vessel Class** | Panamax | 💡 *"Panamax is feasible at Vizag but suboptimal — Capesize available at $3.20/MT lower TCE. Upgrade to Capesize? Tap to compare →"* |

**Technical Implementation:**
- Debounced field-change event listeners (300ms delay to prevent excessive API calls)
- Backend microservice endpoint: `POST /api/v1/suggestions/inline` — accepts partial form state, returns contextual suggestion per field
- Suggestions cached for 5 minutes per field combination to reduce latency
- Severity classification: 💡 *Suggestion* (blue), ⚠ *Warning* (amber), 🚨 *Critical Alert* (red)

#### G.2 — On-Page Proactive Recommendation Cards

**What It Does:** Every dashboard page displays a dynamically generated **AI Insights Panel** — a scrollable sidebar or top-mounted card carousel containing 3–5 proactive, time-sensitive recommendations derived from the latest model outputs. These appear without any user action — the platform continuously analyses market conditions and surfaces the most actionable insights.

**How It Works:** A background scheduler (running every 15 minutes) evaluates all active and potential chartering decisions against the latest forecast data, port congestion indices, NLP disruption scores, and tidal predictions. Insights are ranked by urgency × financial impact and displayed as visually distinct recommendation cards.

**Card Types and Examples:**

| Card Type | Visual Indicator | Example Content |
|---|---|---|
| **⚡ Market Timing Alert** | Green pulse border | *"BCI C18 rate dip detected — forecast shows 6.2% decline over next 12 days before recovery. WINDOW: Enter Capesize charter for Australian coal before Oct 8. Potential saving: ₹1.85 crore per voyage."* |
| **🚢 Vessel Optimisation Tip** | Blue accent border | *"3 pending cargo lots (Vizag, Dhamra, Paradip) totalling 280K MT can be consolidated into 2 Capesize voyages instead of 4 Supramax — estimated combined saving: $420,000 (₹34.9 lakh)."* |
| **🌊 Port Congestion Warning** | Amber pulse border | *"Paradip anchorage queue has increased to 14 vessels (72-hour wait). Consider diverting pending Paradip cargo to Dhamra (3-hour truck haul to Paradip rail siding). Demurrage avoidance: $105,000."* |
| **🌀 Cyclone Season Advisory** | Red gradient border | *"IMD cyclone alert: Depression BOB 04 forming. Estimated landfall: Odisha coast, Nov 22–24. Paradip and Dhamra may suspend berthing operations for 48–72 hours. Action: Advance laycan for pending Paradip voyages."* |
| **📊 COA Opportunity Window** | Purple accent border | *"Q4 freight rate volatility is forecasted at 2.3× Q3. Markowitz model recommends increasing COA coverage from 40% to 65% for Jan–Mar Australian coal. Estimated portfolio risk reduction: 42%."* |
| **🔔 Tidal Window Alert** | Teal accent border | *"Haldia-bound vessel MV Pacific Harmony (ETA Nov 17): Spring tide draft window 8.3m available Nov 17–19 only. Next favourable window: Dec 2. Recommend immediate berthing priority request to KPT."* |
| **💰 Savings Tracker** | Gold accent border | *"YTD savings from SAGAR DRISHTI recommendations: ₹47.3 crore (32 voyages). Largest single-voyage saving: ₹4.1 crore (Capesize timing optimisation, Sept voyage HAY POINT→VIZAG)."* |

**Technical Implementation:**
- Backend scheduler: Celery Beat task running every 15 minutes, evaluating all active models
- Insight ranking algorithm: `Priority Score = Urgency (0–10) × Financial Impact (₹ crore) × Confidence (0–1)`
- Maximum 5 cards displayed per page, ordered by priority score
- Cards are dismissible (with reason logging) and expirable (auto-remove after action window closes)
- Each card includes: one-click action button (e.g., "View Full Analysis", "Apply to Current Requirement", "Dismiss"), data source citation, and confidence indicator

#### G.3 — Smart Alert Banners (Page-Top Critical Notifications)

**What It Does:** Time-critical, high-impact events trigger a full-width animated banner at the top of every page — impossible to miss, requiring explicit acknowledgment before dismissal. These are the platform's "emergency broadcast" channel for events that could materially affect chartering decisions within hours, not days.

**Trigger Conditions:**

| Trigger | Threshold | Banner Content |
|---|---|---|
| **Freight rate flash crash/spike** | BCI change > ±8% in 24 hours | 🚨 *"BCI C18 ALERT: Rate spiked +11.4% in last 24 hours ($24.20→$26.96/MT). 3 pending spot charters affected. Immediate review recommended."* |
| **Cyclone direct threat** | IMD Severe Cyclone Warning for East Coast | 🌀 *"SEVERE CYCLONE WARNING: Cyclone DANA — Category 3 — ETA Odisha coast Oct 25. Paradip/Dhamra/Gopalpur operations likely suspended 48–96 hours. 2 vessels at anchorage."* |
| **Port closure** | Official port closure notice detected in bulletin scrape | ⛔ *"PORT CLOSURE: Paradip — All berths suspended due to heavy swell. Reopening estimated Oct 28. 4 pending discharges affected."* |
| **Tidal window expiring** | Haldia vessel ETA within 48 hours of spring tide closure | ⏰ *"TIDAL WINDOW CLOSING: MV Bulk Pioneer must berth at Haldia within 36 hours or wait 14 days for next spring tide. Demurrage at risk: $490,000."* |
| **Geopolitical disruption** | NLP Disruption Score > 80/100 on any active route | 🔴 *"GEOPOLITICAL ALERT: Australian port workers' strike confirmed at Hay Point/Dalrymple Bay. Duration unknown. 2 pending load-port nominations affected. Consider US Gulf alternative."* |

**Technical Implementation:**
- WebSocket real-time push from backend to frontend (no polling)
- Banner state stored in PostgreSQL — tracks acknowledgment timestamp, user ID, and action taken
- Auto-escalation: if unacknowledged for 2 hours, banner is forwarded to supervisory role via email/notification
- Compliance logging: all banner events and responses recorded in audit trail

#### G.4 — Predictive Field Suggestions (Auto-Complete with Intelligence)

**What It Does:** Beyond basic form auto-complete, SAGAR DRISHTI's input fields predict and pre-fill optimal values based on the user's historical patterns, current market conditions, and platform model outputs. The system learns from each user's decision history to offer increasingly personalised suggestions.

**Examples:**

| Field | Predictive Suggestion |
|---|---|
| **Cargo Tonnage** | *Pre-fills 75,000 MT based on user's most common Panamax parcel size for this route* |
| **Origin Port** | *Ranks Hay Point first (user's 60% historical preference), but highlights Nacala with a badge: "Alternative: Nacala coal at $2.10/MT lower landed cost this month"* |
| **Destination Port** | *Pre-fills Vizag (user's default), but shows a comparison chip: "Dhamra: 2-day faster turnaround, 3% lower port tariff this quarter"* |
| **Laycan Window** | *Highlights calendar dates in green/amber/red based on forecast rate trajectory and cyclone probability — user sees at a glance which weeks are cheapest and safest* |
| **Vessel Class** | *Recommends Capesize with 92% confidence based on constraint solver output for the selected route/port combination* |

**Technical Implementation:**
- User behaviour analytics stored in PostgreSQL (anonymised decision history per user role)
- Prediction model: lightweight XGBoost classifier trained on user's past 50 decisions
- Calendar heat-map rendering: rate forecast + cyclone probability mapped to colour gradient (green = low rate + low risk, red = high rate + high risk)

#### G.5 — Contextual AI Tooltips on Charts and Metrics

**What It Does:** Every chart, KPI card, and metric on the dashboard is enriched with an AI-powered tooltip. When the user hovers over or taps a data point, instead of showing raw numbers only, the tooltip provides a **natural language interpretation** explaining what the number means in the current operational context and what action it implies.

**Examples:**

| Dashboard Element | Standard Tooltip | SAGAR DRISHTI AI Tooltip |
|---|---|---|
| **BCI C18 Rate Chart** (hover on today's point) | *"$26.40/MT"* | *"$26.40/MT — 8% below 90-day moving average. Model predicts further 4% decline over next 10 days (confidence: 78%). This is a FAVOURABLE entry window for Capesize Australian coal."* |
| **Port Congestion Index** (Paradip = 72%) | *"72%"* | *"Paradip congestion at 72% — above seasonal average (58%). Current anchorage wait: ~48 hours. If your cargo is flexible, Dhamra (congestion: 34%) offers 3-day faster turnaround."* |
| **Demurrage Exposure KPI** (₹2.1 crore) | *"₹2.1 Cr"* | *"₹2.1 crore demurrage exposure across 3 vessels at anchorage. Primary driver: Paradip queue (MV Ocean Star — 4 days waiting). Mitigation: request priority berthing or divert to Gangavaram (berth available in 12 hours)."* |
| **COA Coverage Ratio** (35%) | *"35%"* | *"35% of Q4 volume under COA — below recommended 60% target. Markowitz model signals high rate volatility ahead. Consider locking additional 25% under 6-month COA at current BCI-$1.50 spread."* |
| **Savings Counter** (₹47.3 crore YTD) | *"₹47.3 Cr"* | *"₹47.3 crore saved YTD across 32 optimised voyages vs spot market baseline. Largest contributor: Market timing engine (₹28.1 crore). Second: COA portfolio shift (₹12.8 crore)."* |
| **Forecast Confidence Band** (hover on upper bound) | *"95% Upper: $31.20/MT"* | *"There is only a 2.5% probability that the rate exceeds $31.20/MT in this window. The forecast model's 30-day MAPE is 9.2%. Worst-case scenario at this bound would add ₹1.8 crore to voyage cost."* |

**Technical Implementation:**
- Tooltip content generated by a lightweight summarisation endpoint: `GET /api/v1/suggestions/tooltip?metric={metric_id}&value={value}&context={page_context}`
- LLM-generated natural language cached for 15 minutes per metric state
- Fallback to template-based tooltips if LLM API is unavailable (ensures zero-downtime UX)
- Tooltip severity theming matches platform risk colour system (green/amber/red)

#### G.6 — Cross-Page Decision Continuity Suggestions

**What It Does:** As the user navigates between different pages of SAGAR DRISHTI (e.g., from the Forecast page to the Vessel Intelligence page), the platform maintains a persistent **Decision Context Bar** at the top of the viewport. This bar displays a brief AI summary of the user's current decision context and proactively suggests the next logical action based on where they are in their workflow.

**Workflow Continuity Examples:**

| Current Page | Decision Context Bar Content |
|---|---|
| **Dashboard** (after entering cargo requirement) | *"Active: 120K MT Coking Coal, Hay Point→Vizag, Nov laycan. Next step: Review forecast →"* |
| **Forecast Page** (after viewing rate curve) | *"Rate signal: GREEN (enter Week 2). Next step: Check vessel feasibility for Vizag →"* |
| **Vessel Intelligence** (after constraint check) | *"Capesize FEASIBLE (Vizag 16.5m). Next step: Run COA vs Spot comparison →"* |
| **COA Simulator** (after seeing breakeven) | *"COA breakeven: $13.20/MT (82% probability of outperformance). Next step: Generate Decision Dossier →"* |
| **Decision Dossier** (after generation) | *"Dossier ready for review. Action: Approve and submit to Transchart, or modify parameters ↺"* |

**Technical Implementation:**
- Frontend global state management (React Context / Zustand) tracks the user's active decision session
- Decision state persisted to backend via `PUT /api/v1/session/decision-context`
- AI summary generated by passing decision state to a lightweight prompt template + LLM summarisation call
- Bar is collapsible but persistent across navigation — ensures user never loses context during multi-step decisions

---

#### Summary: Why Feature G Matters

| Without Feature G (Traditional Dashboard) | With Feature G (SAGAR DRISHTI Ambient Intelligence) |
|---|---|
| User must interpret raw charts and metrics manually | Platform explains every data point in operational context |
| User must remember to check forecasts before each decision | Platform proactively surfaces time-sensitive opportunities |
| User fills forms with no guidance | Every field provides real-time AI-powered suggestions |
| Critical alerts buried in separate notification tabs | Full-width banners for emergencies; ranked insight cards for strategic actions |
| Navigation between pages breaks decision flow | Cross-page Decision Context Bar maintains continuity |
| User asks Copilot for help reactively | Platform anticipates needs and suggests before the user asks |

**Feature G transforms SAGAR DRISHTI from a tool you query into a system that actively co-pilots every decision.**

---
