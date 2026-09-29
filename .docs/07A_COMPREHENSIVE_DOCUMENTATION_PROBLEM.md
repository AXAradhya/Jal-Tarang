# DELIVERABLE 7 — COMPREHENSIVE PROBLEM AND SOLUTION DOCUMENTATION

## SAGAR DRISHTI: Complete Technical & Strategic Documentation
### AI-Driven Freight Intelligence Platform for SAIL's East Coast Port Cluster
### Smart India Hackathon 2026 | PS ID: 26006

---

> This document serves simultaneously as: the full technical documentation, the feasibility report, the impact assessment, and the strategic implementation plan — as a unified companion to the six competition slides.

---

# PART A: PROBLEM DOCUMENTATION

---

## A.1 Identify the Problem — Clearly Define What Is Happening

SAIL (Steel Authority of India Limited) is the largest integrated steel producer in India, operating five major steel plants — **Bhilai** (Chhattisgarh), **Bokaro** (Jharkhand), **Durgapur** (West Bengal), **Rourkela** (Odisha), and **Burnpur/IISCO** (West Bengal) — all of which require coking coal as the primary raw material for blast furnace operations. Coking coal cannot be substituted in the blast furnace process and cannot be stockpiled beyond 30–45 days of consumption without quality degradation (moisture absorption, fine-particle contamination, and coking index deterioration).

SAIL imports approximately **7.5 million tonnes of coking coal annually** from five primary source regions:

| Source Region | Export Terminals | Coal Grade | Approximate Share |
|---|---|---|---|
| **Australia** | Hay Point, Dalrymple Bay, Gladstone, Newcastle | Premium Hard Coking Coal (PHCC) — highest quality | ~50–55% |
| **United States** | Hampton Roads, Baltimore, New Orleans | Low-Vol HCC | ~10–15% |
| **Mozambique** | Nacala, Beira, Maputo | Medium-Vol Coking Coal | ~15–20% |
| **Russia** | Vostochny, Taman, Ust-Luga | Various grades — competitively priced | ~5–10% |
| **Indonesia** | Tanjung Bara, Balikpapan | Semi-soft coking coal, PCI | ~5–10% |

The entire import programme is discharged through **seven East Coast ports**:

| Port | State | Maximum Draft | LOA Limit | Key Characteristics |
|---|---|---|---|---|
| **Visakhapatnam (Vizag)** — Outer Harbor | Andhra Pradesh | 16.5m | 300m | Fully Capesize capable |
| **Visakhapatnam (Vizag)** — Inner Harbor | Andhra Pradesh | 10.5m | 200m | Panamax/Supramax |
| **Gangavaram** | Andhra Pradesh | 16.0m | 280m | Deep-draft, bulk handling |
| **Dhamra** | Odisha | 18.0m | 330m | Deepest East Coast port — Super Capesize capable |
| **Paradip** | Odisha | 14.5m | 260m | Kamsarmax and lightened Capesize |
| **Gopalpur** | Odisha | 13.0m | 225m | Panamax/Supramax |
| **Haldia Dock Complex** | West Bengal | 8.5m (tide-dependent) | 190m | Shallow riverine port — severe draft restriction |

Inland evacuation from ports to steel plants is via **Indian Railways** (FOIS — Freight Operations Information System).

### The Current Chartering Practice

SAIL's shipping desk, operating through the government chartering agency **Transchart** (Ministry of Ports, Shipping and Waterways), approaches the market on a **voyage-by-voyage spot basis**. Each shipment is separately negotiated at the prevailing freight rate, with no structural use of Contracts of Affreightment (COAs) that would lock in rates for multiple voyages over a 6–12 month horizon.

### Five Compounding Consequences

**1. Spot Rate Exposure at Cyclical Peaks**  
SAIL pays the prevailing spot freight rate at the moment of requirement — even when the Baltic Exchange Capesize Index (BCI) is at a cyclical peak. BCI has ranged from $4,000/day to $86,000/day between 2016 and 2021, demonstrating extreme volatility. Without a forecasting system, SAIL has no signal for whether the market is peaking, troughing, or transitioning.

**2. No COA Strategy**  
No systematic mechanism exists to evaluate whether locking a multi-voyage COA at a 7–15% discount to spot would yield savings over the programme horizon. Every voyage is a fresh spot negotiation, forfeiting the volume-based bargaining power that a 7.5 million MT annual programme should command.

**3. Vessel–Port Mismatches**  
Vessel-to-port matching is done manually, without a systematic constraint solver. This leads to:
- Chartering a vessel too large for Haldia's draft → requiring expensive mid-sea lighterage at Sagar-Sandheads
- Chartering a gearless vessel to a berth with a broken/slow shore crane → causing demurrage from slow discharge
- Chartering two smaller vessels when one Capesize would fit the destination port at lower total cost

**4. No Backhaul Optimisation**  
Vessels return to Australia/Mozambique in ballast (empty), imposing a deadleg cost component that could be offset by negotiating return cargo arrangements (e.g., Indian iron ore exports to China/Japan).

**5. Bay of Bengal Cyclone Disruption**  
Cyclone season (April–May pre-monsoon, October–December post-monsoon) disrupts vessel scheduling without advance warning integration, leading to unexpected port waiting time and demurrage penalties of $30,000–$40,000/day per Capesize vessel.

---

## A.2 Assess the Impact — Effects on Cost, Time, Quality, and Operations

### Cost Impact

| Cost Category | Annual Value | Source / Calculation |
|---|---|---|
| **Total freight expenditure** | ~$210 million (₹1,743 crore) | 7.5M MT × $28/MT average spot × ₹83/USD |
| **Avoidable freight premium** (5–10%) | $10.5M–$21M (₹87–174 crore) | Conservative timing + COA discount vs spot baseline |
| **Avoidable demurrage** | $6.3M (₹52 crore) | 2 days × $35,000/day × 90 voyages/year |
| **Lighterage surcharges** (Haldia Capesize) | $3–5/MT additional | Sagar-Sandheads lightering cost vs correctly sized direct vessel |
| **Total avoidable cost** | **₹139–226 crore/year** | Sum of freight + demurrage savings |

### Time Impact

- A vessel waiting at anchorage due to tidal window miss at Haldia loses **2–5 days**, delaying coking coal delivery to the Durgapur blast furnace
- Blast furnace disruption from coking coal shortage is a **multi-crore production loss event per day** — steel output of ~5,000 MT/day at ₹45,000/MT = ₹22.5 crore/day of production value at risk

### Quality Impact

- Coking coal quality degrades with prolonged storage and exposure during lighterage operations
- Each mid-sea transfer increases moisture content and fine-particle contamination, reducing coke oven efficiency
- Quality degradation reduces coke strength (CSR metric), directly impacting blast furnace productivity

### Operational Scope

The problem affects the **entire upstream supply chain**: from mine-gate in Queensland/Mozambique to blast furnace at Bokaro — five plant locations, seven port gateways, Indian Railways evacuation — all currently operated without a unified digital intelligence layer.

---

## A.3 Determine Urgency

**HIGH — Immediate Action Required.**

- The coking coal import programme is **continuous and year-round** — every month without a COA strategy is a month where SAIL pays avoidable spot rate premiums
- The Bay of Bengal cyclone season (October–December) represents the highest-risk scheduling window — without a disruption forecasting module, SAIL enters this window blind
- India's **National Steel Policy 2017** targets 300 million tonnes of steel capacity by 2030 (from ~160 MT current) — requiring proportionally higher coking coal imports
- The problem **scales with growth** — as SAIL expands capacity, the absolute rupee value of procurement inefficiency grows proportionally

---

## A.4 Identify the Root Cause

### Primary Root Cause

**Absence of a data-driven freight intelligence capability** within SAIL's shipping procurement process. The chartering desk currently relies on broker calls, general market awareness, and past experience — not on quantitative forecasting models integrating Baltic Exchange indices, port-specific operational constraints, seasonality, and macro-commodity drivers.

### Secondary Root Causes

1. **Transchart's process design** — Transchart's centralised government chartering process was designed for procurement compliance and transparency, not for market-timing optimisation. There is no institutional mechanism within Transchart to evaluate COA vs spot trade-offs quantitatively.

2. **Port constraint data fragmentation** — Port constraint data (draft, LOA, tide tables, crane specs) exists in physical port documents, PDFs, and separate databases but is not integrated into a digital decision-support system accessible to SAIL's chartering desk.

3. **No FOIS–port integration** — Indian Railways rake availability (tracked in FOIS) is not connected to port arrival scheduling, creating a disconnect between vessel discharge planning and inland evacuation capacity.

4. **No institutional COA evaluation mechanism** — No institutional framework exists to evaluate the COA vs spot trade-off quantitatively on a per-cargo, per-route, per-quarter basis.

---

## A.5 Estimate Likelihood of Problem Continuing

**Certainty — 100%.**

Without a platform of this type, SAIL will continue spot chartering by default. The dry bulk freight market is inherently volatile — BCI ranged from $4,000/day to $86,000/day between 2016 and 2021. The probability of paying above-optimal freight on at least 30–40% of voyages in any given year, in the absence of a forecasting system, is extremely high based on historical rate volatility analysis.

---

## A.6 Estimate Severity

**Critical.**

₹87–174 crore in avoidable annual freight cost for a public sector company is a **directly auditable procurement inefficiency**. Under Comptroller & Auditor General (CAG) audit guidelines, procurement at non-competitive rates without documented market analysis is a material audit finding. The severity is further compounded by the blast furnace dependency — coking coal supply disruption has a **multiplier effect** on steel production loss.

---

## A.7 Prioritise the Problem

| Dimension | Rating |
|---|---|
| **Impact** | Very High (₹87–174 crore/year direct cost + blast furnace reliability risk) |
| **Urgency** | High (continuous procurement cycle, cyclone season approaching) |
| **Likelihood of continuation** | 100% (structural capability gap) |
| **Priority** | **P1 — Immediate** |

---

## A.8 Identify Affected Stakeholders

| Stakeholder | How Affected | Severity |
|---|---|---|
| **SAIL Chartering/Shipping Desk** | Primary decision-maker; currently operating without forecasting tools | Critical |
| **SAIL Plant Operations** (Bokaro, Durgapur, Rourkela, Bhilai, Burnpur) | Downstream recipient of coking coal; affected by supply disruption | High |
| **Transchart** (Ministry of Ports) | Government chartering agency; process owner for PSU chartering | Medium |
| **Ministry of Steel** | Policy oversight; ₹174 crore/year inefficiency is a government resource loss | High |
| **East Coast Port Trusts** | Port scheduling, berth allocation, congestion management | Medium |
| **Indian Railways (FOIS)** | Rake planning for inland coal evacuation from ports | Medium |
| **Shipowners/Charterers globally** | Counterparties in charter negotiations | Low |
| **ESG/Carbon compliance teams** | Freight emissions reporting under IMO CII | Low |

---

## A.9 Contain the Problem — Immediate Steps (While Platform Is Being Built)

| Action | Effort | Impact | Timeline |
|---|---|---|---|
| Build and maintain the **port constraint table** manually in a spreadsheet | Low | Medium | 1 week |
| Source Baltic Exchange historical data and run a **basic SARIMAX model** for 30-day rate forecast | Medium | High | 2–4 weeks |
| Integrate **Hooghly tide table** into a simple Excel lookup for Haldia scheduling decisions | Low | Medium | 1 week |
| Begin **documenting SAIL's historical charter rates** from Transchart records to calibrate the COA discount model | Medium | High | Ongoing |

---

## A.10 Develop Possible Solutions

| Option | Description | Cost | Effectiveness | India-Specificity |
|---|---|---|---|---|
| **1. Status quo + manual improvement** | Add a dedicated freight analyst to the chartering desk; train on Baltic Exchange data | Low (₹10–15 lakh/year) | Low — no scalability, no automation | None |
| **2. Buy a commercial IMOS-type platform** (Veson Nautical) | $200,000–$500,000/year licensing; generic global platform | Very High (₹1.7–4.2 crore/year) | Medium — good voyage accounting, no India-specific optimisation | None |
| **3. Build SAGAR DRISHTI** (this proposal) | Bespoke AI freight intelligence platform; India-specific, East Coast-focused, Transchart-integrated, COA-optimised | Low-Medium (₹50 lakh build + ₹1.25 crore/year operations) | Very High — full optimisation stack | Full |
| **4. Freight Forward Agreements (FFAs)** | Hedge freight risk on financial derivatives market | High (trading desk setup + regulatory clearance) | Medium — financial hedge only, no operational optimisation | None |

---

## A.11 Evaluate Solution Options

| Criteria | Status Quo | Commercial IMOS | **SAGAR DRISHTI** | FFAs |
|---|---|---|---|---|
| India East Coast specificity | ❌ None | ❌ Low | ✅ **High** | ❌ None |
| COA portfolio optimisation | ❌ None | ⚠ Partial | ✅ **Full (Markowitz)** | ⚠ Partial |
| Government integration (FOIS, Transchart) | ❌ None | ❌ None | ✅ **Full** | ❌ None |
| Tidal draft prediction (Haldia) | ❌ None | ❌ None | ✅ **Yes** | ❌ None |
| Crane capability matching | ❌ None | ❌ None | ✅ **Yes** | ❌ None |
| NLP disruption scoring | ❌ None | ❌ None | ✅ **Yes** | ❌ None |
| Conversational AI Copilot | ❌ None | ❌ None | ✅ **Yes** | ❌ None |
| Annual cost | ₹15 lakh | ₹1.7–4.2 crore | **₹1.25 crore** | ₹2+ crore |
| Build time | Immediate | 6 months integration | 6–12 months | 12+ months (regulatory) |
| Scalability to NTPC/Coal India | ❌ No | ⚠ Partial | ✅ **Yes** | ❌ No |
| Regulatory risk | None | Low | **Low** | High (SEBI/RBI) |

**Winner: SAGAR DRISHTI — Option 3**

---

## A.12 Choose a Response Strategy

**Resolve and Prevent Recurrence** — Build and deploy SAGAR DRISHTI as a **permanent institutional capability** within SAIL's shipping procurement process, with a governance framework ensuring it is used for every chartering decision above a threshold tonnage (e.g., >25,000 MT per parcel).

---

## A.13 Assign an Owner

**SAIL General Manager — Shipping & Logistics** as the platform owner, with a designated data science team (internal or contracted) for model maintenance. **Transchart** to be a co-stakeholder for the workflow integration layer.

---

## A.14 Create an Action Plan

| Phase | Tasks | Timeline |
|---|---|---|
| **Phase 1 — Data & Prototype** | Scrape Baltic indices, build port constraint table, build basic SARIMAX model, build Spot-COA simulator, build FastAPI prototype, build React dashboard | Months 1–4 |
| **Phase 2 — Advanced Modules** | Add Markowitz optimiser, tidal predictor, arbitrage engine, NLP disruption engine, crane matcher, backhaul module | Months 5–8 |
| **Phase 3 — Copilot & Integration** | Build LLM/RAG Charter-Copilot, integrate FOIS API, integrate AIS paid tier, pilot with SAIL chartering desk | Months 9–12 |
| **Phase 4 — Production & Scale** | Harden for production, onboard NTPC/RINL, government dashboard for Ministry of Steel | Months 13–18 |

---

## A.15 Communicate the Decision

Present SAGAR DRISHTI to **SAIL Board**, **Ministry of Steel**, and **Transchart leadership** simultaneously. Emphasise that:
- The platform is a **decision-support tool** — it does not replace Transchart's statutory role in chartering
- It makes SAIL's input to Transchart more informed, market-optimal, and audit-defensible
- The ROI (111:1 to 181:1) makes this a Category 1 investment by any public sector NPV standard

---

## A.16–A.20 Monitor, Measure, Document, and Prevent Recurrence

| KPI | Target | Measurement |
|---|---|---|
| **Average freight rate paid by SAIL vs BCI benchmark** | ≤5% premium over benchmark | Quarterly — compare SAIL's average paid rate vs BCI C18 equivalent |
| **COA adoption rate** | 40% of annual volume under COA within 12 months | Track % of total MT under COA vs spot |
| **Demurrage days per voyage** | ≤0.5 days/voyage average (from current ~2+ days) | Voyage report analysis |
| **Tidal window miss rate at Haldia** | Zero missed windows after go-live | Port records — anchorage waiting time log |
| **Platform adoption rate** | 100% of SAIL chartering desk decisions | System login and usage logs |
| **Forecast directional accuracy** | ≥70% directional accuracy (up/down) at 30-day horizon | Backtesting against actual BCI outcomes |

**Prevention mechanism:** Document all instances where the platform recommendation was overridden and record the outcome — build a continuous feedback loop to improve model calibration. Annual model retraining on updated Baltic Exchange and port data.

---
