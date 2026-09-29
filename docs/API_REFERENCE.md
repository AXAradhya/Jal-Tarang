# SAGAR DRISHTI — Complete API Reference

**Enterprise Maritime Intelligence Backend**
**SIH Problem Statement 26006 | Ministry of Steel / SAIL**
**Version:** 2.0.0 | **Base URL:** `http://localhost:8000/api/v1`

---

## Authentication

All endpoints (except `POST /auth/register` and `POST /auth/login`) require a **Bearer JWT** in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens expire after 60 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`).

---

## Response Envelope

All responses follow a consistent envelope:

```json
{ "success": true,  "data": { ... }, "meta": { "total": 0, "page": 1, "limit": 25 } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

---

## 1. Health & Info

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | None | PostgreSQL connectivity check, uptime, memory |
| `GET` | `/` | None | Service metadata & endpoint index |

---

## 2. Authentication — `/auth`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| `POST` | `/auth/register` | None | — | Register user + organization |
| `POST` | `/auth/login` | None | — | Argon2id login, returns `accessToken` + `refreshToken` |
| `POST` | `/auth/refresh` | None | — | Rotate refresh token |
| `POST` | `/auth/logout` | JWT | Any | Invalidate current session |
| `GET`  | `/auth/me` | JWT | Any | Current user profile |
| `POST` | `/auth/change-password` | JWT | Any | Change own password |
| `POST` | `/auth/forgot-password` | None | — | Request password reset |
| `POST` | `/auth/reset-password` | None | — | Complete password reset with token |

### POST /auth/register — Body
```json
{
  "email": "manager@sail.in",
  "password": "Secure@2026",
  "displayName": "Chartering Manager",
  "organizationName": "SAIL - RSP Division",
  "role": "CHARTERING_MANAGER"
}
```

### POST /auth/login — Body
```json
{ "email": "manager@sail.in", "password": "Secure@2026" }
```

---

## 3. Users — `/users`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| `GET`    | `/users` | JWT | SUPER_ADMIN, ADMIN | List users (org-scoped, paginated) |
| `GET`    | `/users/:id` | JWT | ADMIN+ | Get user detail |
| `POST`   | `/users` | JWT | SUPER_ADMIN, ADMIN | Create user |
| `PATCH`  | `/users/:id` | JWT | ADMIN+ | Update user fields |
| `DELETE` | `/users/:id` | JWT | SUPER_ADMIN | Soft-delete user |
| `PATCH`  | `/users/:id/role` | JWT | SUPER_ADMIN | Change user role |
| `PATCH`  | `/users/:id/toggle-active` | JWT | ADMIN+ | Activate / deactivate |
| `GET`    | `/users/search` | JWT | Any | Typeahead search by name/email |
| `GET`    | `/users/stats` | JWT | ADMIN+ | Org user statistics |

**Query params:** `?page=1&limit=25&role=CHARTERING_MANAGER&search=kumar&isActive=true`

---

## 4. Roles — `/roles`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/roles` | JWT | List all 6 system roles |
| `GET` | `/roles/:id/permissions` | JWT | Role permission matrix |

### System Roles
| Role | Code | Domain |
|------|------|--------|
| Super Admin | `SUPER_ADMIN` | Full platform governance |
| Admin | `ADMIN` | Org-level management |
| Chartering Manager | `CHARTERING_MANAGER` | Chartering, fixtures, voyage economics |
| Procurement Manager | `PROCUREMENT_MANAGER` | Bulk cargo requirements, suppliers |
| Port Manager | `PORT_MANAGER` | Port infrastructure, berths, congestion |
| Analyst | `ANALYST` | Freight forecasting, ML runs, scenarios |

---

## 5. Vessels — `/vessels`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| `GET`    | `/vessels` | JWT | Any | List fleet (paginated, filterable) |
| `GET`    | `/vessels/:id` | JWT | Any | Full vessel detail |
| `POST`   | `/vessels` | JWT | SUPER_ADMIN, ADMIN | Create vessel |
| `PATCH`  | `/vessels/:id` | JWT | ADMIN, CHARTERING_MANAGER | Update vessel |
| `DELETE` | `/vessels/:id` | JWT | SUPER_ADMIN | Soft-delete vessel |
| `GET`    | `/vessels/:id/voyages` | JWT | Any | Voyage history for vessel |
| `GET`    | `/vessels/:id/positions` | JWT | Any | Latest AIS positions |
| `GET`    | `/vessels/:id/feasibility` | JWT | Any | Port feasibility check |
| `GET`    | `/vessels/classes` | JWT | Any | 9 vessel class definitions |
| `GET`    | `/vessels/available` | JWT | CHARTERING_MANAGER | Available vessels in laycan window |
| `GET`    | `/vessels/stats` | JWT | Any | Fleet statistics |

**Query params:** `?vesselType=BULK_CARRIER&minDwt=50000&maxDwt=200000&flag=LR&status=ACTIVE&search=MV%20Navkar`

### Vessel Classes (9)
| Class | DWT Range | Typical Routes |
|-------|-----------|----------------|
| Handysize | 10k–35k MT | Short-sea, minor bulk |
| Handymax | 35k–60k MT | Regional |
| Supramax | 50k–65k MT | Regional/Trans-ocean |
| Ultramax | 60k–65k MT | Open-hatch |
| Panamax | 65k–90k MT | AUS/USA/MOZ → East India |
| Kamsarmax | 80k–90k MT | Grain, Coal |
| Post-Panamax | 90k–120k MT | Coal, Iron Ore |
| Capesize | 100k–200k MT | Iron Ore, Coal (AUS/BRZ → India) |
| VLOC | 200k–400k MT | Iron Ore majors |

---

## 6. Ports — `/ports`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| `GET`  | `/ports` | JWT | Any | List all ports (paginated) |
| `GET`  | `/ports/east-coast` | JWT | Any | 7 strategic East Coast India ports |
| `GET`  | `/ports/:id` | JWT | Any | Port detail with terminals & berths |
| `POST` | `/ports` | JWT | PORT_MANAGER, ADMIN | Create port |
| `PATCH`| `/ports/:id` | JWT | PORT_MANAGER, ADMIN | Update port |
| `GET`  | `/ports/:id/constraints` | JWT | Any | Physical constraints (LOA, beam, draft) |
| `GET`  | `/ports/:id/weather` | JWT | Any | Live weather & operational status |
| `GET`  | `/ports/:id/berths` | JWT | Any | Berth availability |
| `GET`  | `/ports/:id/congestion` | JWT | Any | Current congestion & waiting vessels |

**East Coast India Strategic Ports:** Paradip (INPRT), Visakhapatnam (INVTZ), Gangavaram (INVGA), Dhamra (INDHA), Haldia (INHAL), Gopalpur (INGOP), Sagar Island (INSAG)

---

## 7. Cargo — `/cargo`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/cargo` | JWT | List cargo types & categories |
| `GET`  | `/cargo/types` | JWT | All cargo types with specs |
| `GET`  | `/cargo/types/:id` | JWT | Cargo type + quality specifications |
| `POST` | `/cargo/types` | JWT | Create cargo type |
| `GET`  | `/cargo/parcels` | JWT | Procurement cargo parcels (org-scoped) |
| `POST` | `/cargo/parcels` | JWT | Create cargo parcel |
| `GET`  | `/cargo/parcels/:id` | JWT | Parcel detail |
| `PATCH`| `/cargo/parcels/:id/status` | JWT | Update parcel status |
| `GET`  | `/cargo/commodities` | JWT | Commodity specifications with technical attrs |
| `GET`  | `/cargo/specifications/:cargoTypeId` | JWT | Quality specs for commodity |

### Cargo Categories
`DRY_BULK` | `LIQUID_BULK` | `BREAKBULK` | `PROJECT_CARGO` | `CONTAINERIZED_BULK` | `HAZARDOUS`

---

## 8. Freight — `/freight`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/freight/rates` | JWT | Freight rate history (paginated, filterable) |
| `GET`  | `/freight/forecasts` | JWT | Freight rate forecasts by route & horizon |
| `GET`  | `/freight/indices` | JWT | Baltic Dry Index, BCI, BPI, BSI, BHSI |
| `GET`  | `/freight/routes` | JWT | Trade lane definitions with distances |
| `GET`  | `/freight/codes` | JWT | Freight code registry |
| `POST` | `/freight/codes` | JWT | Create freight code |
| `GET`  | `/freight/codes/generate` | None | Generate structured freight code |
| `GET`  | `/freight/bunker-prices` | JWT | Bunker (VLSFO/HSFO) prices by port |
| `GET`  | `/freight/market-summary` | JWT | Current market conditions summary |

**Query params (rates):** `?routeId=<uuid>&cargoType=DRY_BULK&dateFrom=2026-01-01&dateTo=2026-09-15&page=1&limit=50`

---

## 9. Chartering — `/chartering`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| `GET`    | `/chartering` | JWT | Any | All charter contracts (org-scoped) |
| `GET`    | `/chartering/:id` | JWT | Any | Contract detail + voyages + cost breakdown |
| `POST`   | `/chartering` | JWT | CHARTERING_MANAGER, ADMIN | Create charter contract |
| `PATCH`  | `/chartering/:id/status` | JWT | CHARTERING_MANAGER, ADMIN | Transition contract status |
| `PATCH`  | `/chartering/:id` | JWT | CHARTERING_MANAGER, ADMIN | Update contract fields |
| `DELETE` | `/chartering/:id` | JWT | SUPER_ADMIN | Cancel / delete draft contract |
| `GET`    | `/chartering/strategy/compare` | JWT | CHARTERING_MANAGER | Spot vs COA vs T/C comparison |
| `GET`    | `/chartering/fixtures` | JWT | Any | Fixture summary with TCE |

**Charter Types:** `SPOT` | `TIME_CHARTER` | `COA` | `BAREBOAT` | `CONSECUTIVE_VOYAGE`

### POST /chartering — Body
```json
{
  "vesselId": "<uuid>",
  "cargoParcelId": "<uuid>",
  "charterType": "SPOT",
  "chartererId": "<uuid>",
  "ownerId": "<uuid>",
  "loadingPortId": "<uuid>",
  "dischargingPortId": "<uuid>",
  "laycanStart": "2026-10-01",
  "laycanEnd": "2026-10-10",
  "cargoQuantityMt": 75000,
  "freightRateUsd": 22.50,
  "freightRateBasis": "USD/MT",
  "demurrageRateUsdDay": 18000,
  "despatchRateUsdDay": 9000
}
```

---

## 10. Procurement — `/procurement`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| `GET`    | `/procurement` | JWT | Any | Procurement requirements (org-scoped) |
| `GET`    | `/procurement/:id` | JWT | Any | Requirement detail + allocated parcels |
| `POST`   | `/procurement` | JWT | PROCUREMENT_MANAGER, ADMIN | Create requirement |
| `PATCH`  | `/procurement/:id` | JWT | PROCUREMENT_MANAGER | Update requirement |
| `DELETE` | `/procurement/:id` | JWT | SUPER_ADMIN | Cancel requirement |
| `PATCH`  | `/procurement/:id/status` | JWT | PROCUREMENT_MANAGER | Change status |
| `GET`    | `/procurement/pipeline` | JWT | PROCUREMENT_MANAGER | Full procurement pipeline view |
| `GET`    | `/procurement/suppliers` | JWT | Any | Supplier registry |
| `POST`   | `/procurement/suppliers/:id/evaluate` | JWT | PROCUREMENT_MANAGER | Score supplier |

---

## 11. Voyages — `/voyages`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/voyages` | JWT | All voyages (org-scoped, paginated) |
| `GET`  | `/voyages/:id` | JWT | Voyage detail + costs + events |
| `POST` | `/voyages` | JWT | Create voyage plan |
| `PATCH`| `/voyages/:id/status` | JWT | Transition voyage status |
| `GET`  | `/voyages/:id/economics` | JWT | 10-component economics for voyage |
| `GET`  | `/voyages/:id/timeline` | JWT | Port event timeline |

**Voyage Statuses:** `PLANNED` → `LOADING` → `IN_TRANSIT` → `DISCHARGING` → `COMPLETED` | `CANCELLED`

---

## 12. Analytics — `/analytics`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/analytics/dashboard` | JWT | Full operations dashboard KPIs |
| `GET`  | `/analytics/freight-trend` | JWT | Freight rate trend (weekly, 90-day) |
| `GET`  | `/analytics/fleet` | JWT | Fleet utilization metrics |
| `GET`  | `/analytics/voyages` | JWT | Voyage performance analytics |
| `GET`  | `/analytics/procurement` | JWT | Procurement spend & pipeline |
| `GET`  | `/analytics/ports` | JWT | East Coast port throughput & congestion |
| `GET`  | `/analytics/tce` | JWT | TCE trend by vessel class |
| `GET`  | `/analytics/savings` | JWT | Optimization savings vs. benchmark |
| `GET`  | `/analytics/bunker-exposure` | JWT | Bunker price sensitivity analysis |
| `GET`  | `/analytics/kpi-summary` | JWT | Executive KPI summary card |

---

## 13. Alerts — `/alerts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`    | `/alerts` | JWT | Active alerts for organization |
| `GET`    | `/alerts/:id` | JWT | Alert detail |
| `PATCH`  | `/alerts/:id/acknowledge` | JWT | Acknowledge alert |
| `POST`   | `/alerts/rules` | JWT | Create alert rule |
| `GET`    | `/alerts/rules` | JWT | Alert rule definitions |
| `GET`    | `/alerts/stats` | JWT | Alert statistics |

**Alert Types:** `FREIGHT_SPIKE` | `PORT_CONGESTION` | `WEATHER_ADVISORY` | `CYCLONE_WARNING` | `VESSEL_IDLE` | `DEMURRAGE_RISK` | `BUDGET_OVERRUN`
**Severity:** `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`

---

## 14. Weather — `/weather`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/weather/east-coast/summary` | JWT | Operational status of all 7 East Coast ports |
| `GET`  | `/weather/port/:portId` | JWT | Latest weather for specific port |
| `GET`  | `/weather/port/:portId/history` | JWT | 7-day weather history |
| `GET`  | `/weather/cyclone-alerts` | JWT | Active cyclone advisories (Bay of Bengal) |
| `GET`  | `/weather/vessels/positions` | JWT | Live AIS vessel positions |

---

## 15. Counterparties — `/counterparties`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`    | `/counterparties` | JWT | List vessel owners, charterers, agents |
| `GET`    | `/counterparties/:id` | JWT | Counterparty detail |
| `POST`   | `/counterparties` | JWT | Create counterparty |
| `PATCH`  | `/counterparties/:id` | JWT | Update counterparty |

---

## 16. Decision Engine — `/decision` ⭐ Core Orchestrator

The **16-step Maritime Decision Intelligence Pipeline** — SAGAR DRISHTI's primary analytical endpoint.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/decision/analyze` | JWT | Execute full 16-step decision pipeline |
| `GET`  | `/decision/history` | JWT | Past decision records (org-scoped) |
| `GET`  | `/decision/:id` | JWT | Retrieve specific decision detail |

### POST /decision/analyze — Body
```json
{
  "loadingPortId":       "<uuid>",
  "dischargingPortId":   "<uuid>",
  "cargoQuantityMt":     100000,
  "vesselId":            "<uuid>",
  "cargoTypeId":         "<uuid>",
  "laycanStart":         "2026-10-01",
  "laycanEnd":           "2026-10-10",
  "freightRateOverrideUsd":  22.50,
  "bunkerPriceOverrideUsd":  620,
  "speedKnotsOverride":      13.5,
  "includeScenarios":    true,
  "includeForecasts":    true
}
```

### Response Structure
```json
{
  "success": true,
  "data": {
    "decisionId":        "<uuid>",
    "executionMs":       142,
    "input":             { "loadingPort": {}, "dischargingPort": {}, "vessel": {}, "cargoType": {} },
    "feasibility":       { "isFeasible": true, "violations": [], "draftCompatible": true },
    "economics": {
      "grossFreightUsd":        "2250000.00",
      "commissionUsd":          "28125.00",
      "netFreightUsd":          "2221875.00",
      "bunkerCostSeaUsd":       "451373.47",
      "bunkerCostPortUsd":      "21855.07",
      "portChargesUsd":         "89000.00",
      "hireOrCapitalCostUsd":   "0.00",
      "operatingCostUsd":       "196922.59",
      "demurrageNetUsd":        "0.00",
      "miscCostUsd":            "0.00",
      "taxUsd":                 "0.00",
      "totalVoyageCostUsd":     "759151.13",
      "seaDaysLaden":           "19.136",
      "seaDaysBallast":         "0.000",
      "portDaysLoad":           "3.333",
      "portDaysDischarge":      "4.000",
      "totalVoyageDays":        "24.644",
      "tceUsdDay":              "59400.12",
      "landedCostUsdMt":        "7.5915",
      "voyagePnlUsd":           "1462723.87",
      "voyageMarginPct":        "65.86",
      "breakEvenFreightUsdMt":  "7.8787"
    },
    "strategyComparison": {
      "SPOT":         { "tce": "59400.12", "landedCost": "7.5915", "pnl": "1462723.87", "margin": "65.86" },
      "COA":          { "tce": "53142.31", "landedCost": "7.5915", "pnl": "1350000.00", "margin": "63.16" },
      "TIME_CHARTER": { "tce": "22100.05", "landedCost": "10.1870", "pnl": "987200.00", "margin": "55.22" }
    },
    "recommendation": {
      "strategy":        "SPOT",
      "reasoning":       ["SPOT yields the highest TCE at USD 59400/day", "..."],
      "confidenceScore": 0.82,
      "actionRequired":  false
    },
    "risks":      [{ "type": "FREIGHT_MARKET", "severity": "MEDIUM", "message": "..." }],
    "forecasts":  [{ "forecast_date": "...", "predicted_rate_usd": 23.10, "market_sentiment": "BULLISH" }],
    "scenarios": {
      "base":      { "freightRate": 22.50, "bunkerPrice": 620 },
      "bull":      { "tceUsdDay": "79200.00", "voyageMarginPct": "71.20" },
      "bear":      { "tceUsdDay": "31800.00", "voyageMarginPct": "55.10" },
      "fuelSpike": { "tceUsdDay": "41100.00", "voyageMarginPct": "59.80" }
    },
    "portConditions": {
      "loading":     { "port": "Newcastle", "weather": { "wave_height_m": 1.2, "operational_impact": "NORMAL" } },
      "discharging": { "port": "Paradip",   "weather": { "wave_height_m": 2.8, "operational_impact": "NORMAL" } }
    },
    "marketContext": {
      "latestFreightRate": { "freight_rate_usd": "22.50", "market_condition": "NORMAL" },
      "bunkerPrice":       { "price_usd_mt": "620.00", "fuel_grade": "VLSFO" },
      "route":             { "route_code": "AUS-NEWC-IND-PRDP", "distance_nm": "6200" }
    }
  }
}
```

---

## 17. Reference Data

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/reference/currencies` | None | All currencies (USD, INR, EUR, AUD, ...) |
| `GET`  | `/reference/countries` | None | All maritime nations with ISO codes |
| `GET`  | `/reference/exchange-rates` | None | Latest FX rates (last 7 days) |
| `GET`  | `/freight-codes/generate` | None | Inline freight code generator |
| `POST` | `/vessel-feasibility/check` | None | Inline feasibility checker |

---

## 18. Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Request body or query params failed validation |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Insufficient role permissions |
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `CONFLICT` | 409 | Unique constraint violation (duplicate email, IMO, etc.) |
| `SERVER_ERROR` | 500 | Unhandled internal error |
| `DECISION_ENGINE_ERROR` | 500 | 16-step pipeline failure |

---

## 19. Service Metadata

```
Service:     SAGAR DRISHTI
Version:     2.0.0
Problem:     SIH 26006
Ministry:    Ministry of Steel, Government of India
Entity:      Steel Authority of India Limited (SAIL)
Stack:       Node.js 20 + TypeScript + Express + PostgreSQL 16 + PostGIS + Redis
Routes:      15 modules, 90+ endpoints
Services:    FreightCodeService, VesselFeasibilityService, VoyageEconomicsService
Tests:       18 passing (Vitest)
```
