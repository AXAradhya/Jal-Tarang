# SAGAR DRISHTI — System Architecture Document
**Ministry of Steel / Steel Authority of India Limited (SAIL)**  
**Problem Statement SIH 26006:** *Intelligent Freight Forecasting, Vessel Chartering, Bulk Cargo Procurement & Maritime Decision Intelligence*

---

## 1. High-Level Modular Architecture

SAGAR DRISHTI is built as an enterprise modular monolith running on **Node.js 22 LTS**, **TypeScript (Strict Mode)**, **Express.js**, and **PostgreSQL 16+ with PostGIS**.

```
                           ┌───────────────────────────────┐
                           │      Client / UI / OpenAPI    │
                           └───────────────┬───────────────┘
                                           │
                                           ▼
                      ┌────────────────────────────────────────┐
                      │    API Gateway & Global Middleware     │
                      │  (Helmet, CORS, JWT Auth, Tenant Guard)│
                      └────────────────────┬───────────────────┘
                                           │
  ┌────────────────────────────────────────┴────────────────────────────────────────┐
  ▼                                        ▼                                        ▼
┌──────────────────┐             ┌───────────────────┐             ┌─────────────────────┐
│  Master Data &   │             │ Core Intelligence │             │ Decision Pipeline   │
│  Geography       │             │ Engines           │             │ Orchestrator        │
├──────────────────┤             ├───────────────────┤             ├─────────────────────┤
│ • /ports         │             │ • FreightCode     │             │ • /decision/analyze │
│ • /vessels       │             │ • VesselFeasib.   │             │ • /chartering       │
│ • /trade-lanes   │             │ • VoyageEconomics │             │ • /procurement      │
│ • /cargo         │             │ • Risk Engine     │             │ • /contracts        │
│ • /market-data   │             │ • ScenarioEngine  │             │ • /copilot/chat     │
└─────────┬────────┘             └─────────┬─────────┘             └──────────┬──────────┘
          │                                │                                  │
          └────────────────────────────────┼──────────────────────────────────┘
                                           │
                                           ▼
                      ┌────────────────────────────────────────┐
                      │     Data Access Layer (Connection Pool)│
                      │     PostgreSQL 16 + PostGIS Spatial    │
                      │     (45+ Relational Tables & Views)    │
                      └────────────────────────────────────────┘
```

---

## 2. Decision Intelligence Pipeline (`POST /decision/analyze`)

The core value engine of SAGAR DRISHTI transforms raw bulk requirements into auditable charter fixtures through a 16-step pipeline:

```
1. Input Validation (Cargo, MT, Laycan, Origin, Target East Coast Port)
   ↓
2. Master Data Resolution (Coking Coal, Paradip/Vizag/Dhamra)
   ↓
3. Route Distance Resolution (Nautical Miles via Malacca or Sunda)
   ↓
4. Freight Rate Benchmark (Latest spot quotes & Baltic indices)
   ↓
5. Machine Learning Forecast (7D to 180D forward trend & confidence bounds)
   ↓
6. Market Entry Recommendation (ENTER_NOW, WAIT, or ENTER_PARTIALLY)
   ↓
7. Candidate Vessel Filtering (Capesize, Panamax, Supramax DWT fit)
   ↓
8. Physical Port Feasibility Check (Max Draft, LOA, Beam, Berth limits)
   ↓
9. 10-Component Voyage Economics (Decimal.js: Bunker, Port, Canal, Opex)
   ↓
10. Port Congestion & Waiting Risk (Anchorage delay days)
   ↓
11. Multi-Category Maritime Risk Scoring (Weather, Freight, Port, Geopolitical)
   ↓
12. Charter Strategy Optimization (Spot vs Short-Term vs Medium vs COA)
   ↓
13. Scenario Simulation Stress-Testing (Fuel Spike +25%, Cyclone Delays)
   ↓
14. Projected Procurement Savings Calculation (Gross & Risk-Adjusted)
   ↓
15. Decision Recommendation Generation & Factor Evidence Trace
   ↓
16. Enterprise Audit Persistence (`decision_recommendations` & `audit_logs`)
```

---

## 3. Financial & Arithmetic Precision Rules
- **Zero JavaScript Number for Currency/Tonnage Calculations**: All calculations use `Decimal.js` with 20 decimal places of precision and `ROUND_HALF_UP` bankers rounding.
- **Unit Conversions**: Handled via verified mathematical constants (`1 nautical mile = 1.852 km`).
- **Time Charter Equivalent (TCE)**: Calculated as:
  $$\text{TCE} = \frac{\text{Gross Freight} - \text{Commissions} - \text{Voyage Costs}}{\text{Total Days (Sea + Port)}}$$

---

## 4. Multi-Tenant Governance
- Request context derives `organizationId` from authenticated JWT claims.
- Super Admins can query globally; Org Admins and domain managers are strictly scoped to their tenant.
