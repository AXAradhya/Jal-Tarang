# SAGAR DRISHTI - Enterprise Database & Node.js Backend Architecture

**Platform**: Intelligent Freight Forecasting, Vessel Chartering, Bulk Cargo Procurement & Maritime Decision Intelligence  
**Problem Statement**: SIH 26006  
**Organization**: Ministry of Steel / Steel Authority of India Limited (SAIL)  
**Stack**: PostgreSQL 16+ (PostGIS, pgcrypto, pg_trgm, btree_gist) & Node.js 20+ (TypeScript, Express, pg)

---

## 1. Executive Summary

SAGAR DRISHTI provides a database foundation connecting the strategic maritime decision pipeline:

$$\text{Cargo} \to \text{Parcel} \to \text{Trade Lane} \to \text{Route} \to \text{Freight Code} \to \text{Forecast} \to \text{Port Feasibility} \to \text{Voyage Economics} \to \text{Charter} \to \text{Contract} \to \text{Voyage} \to \text{Performance}$$

---

## 2. RBAC System: Exactly Six Primary Roles

The platform enforces **exactly six primary application roles**:

| Role Name | Display Name | Core Responsibilities & Primary Dashboard |
|---|---|---|
| `SUPER_ADMIN` | Platform Super Administrator | Full unrestricted platform administration, global master data, organizations, security, disaster recovery. |
| `ADMIN` | Organization Administrator | Organization users, department setup, location master, organization audit logs. |
| `CHARTERING_MANAGER` | Chartering Manager | **Chartering Command Center**: Freight quotes, spot vs. COA analysis, vessel feasibility, voyage economics, idle/deadheading risk. |
| `PROCUREMENT_MANAGER` | Procurement Manager | **Procurement Intelligence Center**: Bulk cargo requirements, parcel allocation, laycan scheduling, contract volume commitments. |
| `PORT_MANAGER` | Port Manager | **Port Operations Control Center**: Draft, LOA, beam restrictions, tidal windows, berth handling rates, congestion alerts. |
| `ANALYST` | Freight & Decision Analyst | **Freight & Data Intelligence Center**: Time-series forecasts (7D to 180D), ML model evaluations, scenario simulations (e.g. Fuel Spike, Port Closure). |

---

## 3. Core Database Schemas & Key Tables

1. **Multi-Tenancy & Auth**: `organizations`, `users`, `user_credentials` (Argon2id), `user_sessions`, `refresh_tokens`, `roles`, `permissions`, `user_roles`.
2. **Geography & Port Master**: `ports` (PostGIS `geography(Point, 4326)`), `port_terminals`, `port_berths`, `port_channels`, `port_constraints` (`valid_from`/`valid_to`).
   - Seeded East Coast India Hubs: **Paradip**, **Visakhapatnam**, **Gangavaram**, **Gopalpur**, **Dhamra**, **Sagar / Sandheads**, **Haldia**.
3. **Vessel Master**: `vessels` (IMO, MMSI, DWT, draft, LOA, beam), `vessel_classes` (Handysize, Supramax, Ultramax, Panamax, Kamsarmax, Post-Panamax, Capesize, Newcastlemax, Mini-Cape).
4. **Freight Master & Configurable Codes**: `freight_codes` (`FRT-{ORIGIN}-{DEST}-{VESSEL}-{CARGO}`), `freight_rates` (Strict `NUMERIC(16,4)` precision).
5. **Chartering & Contracts**: `charter_requests`, `contracts` (COA, Time Charter, Voyage Charter), `cargo_parcels`.
6. **Operations & Economics**: `voyages`, `voyage_economics` (TCE calculation, bunker, port disbursements, demurrage).
7. **Intelligence & Forecasting**: `ml_models`, `ml_model_versions`, `forecast_runs`, `forecast_predictions`, `vessel_feasibility_checks`, `market_entry_signals`, `scenarios`.

---

## 4. Setup & Running Instructions

### Prerequisites
- Node.js v20+
- PostgreSQL 16+ with PostGIS extension enabled

### Step 1: Initialize Database & Schema
Ensure PostgreSQL is running, then apply the complete SQL schema:
```bash
# Using Node / tsx CLI
npm run db:init
```
Or directly execute via `psql`:
```bash
psql -U sail_marinex -d sail_marinex_db -f scripts/schema.sql
```

### Step 2: Seed Master Data & Admin
```bash
npm run db:seed:master
```
This populates:
- Continents, countries (India, Australia, USA, Mozambique, Russia, Indonesia).
- Standard currencies and conversion units.
- **The 6 primary system roles**.
- 9 Vessel classes and standard bulk cargos (Coking coal, Iron ore, Limestone, etc.).
- East Coast India ports with coordinate centroids.
- Default organization `SAIL-HQ` and Super Admin credentials (`superadmin@marinex.sail.in`).

### Step 3: Run Automated Tests
```bash
npm test
```

### Step 4: Launch Backend API Server
```bash
npm run dev
```
Endpoints will be available at `http://localhost:8000/api/v1`.
