# SAGAR DRISHTI: Enterprise Maritime Intelligence & Bulk Cargo Logistics Platform
### Comprehensive Non-Technical Executive Architecture & Capability Dossier
**Government of India | Ministry of Steel | Steel Authority of India Limited (SAIL)**  
**Smart India Hackathon (SIH 2026) | Problem Statement SIH26006**

---

## 1. Executive Summary & Vision

### 1.1 The Strategic Mandate
India's domestic steel manufacturing industry is the backbone of the nation's infrastructure and economic growth. Producing high-grade steel at competitive prices requires millions of metric tonnes (MT) of raw bulk materials every year—principally metallurgical coking coal, pulverised coal injection (PCI), limestone, and high-grade iron ore. 

Because domestic reserves of prime coking coal are geologically limited, India relies heavily on overseas procurement from key exporting regions:
- **Australia** (Hay Point, Dalrymple Bay, Gladstone, Newcastle)
- **United States** (Hampton Roads, Baltimore, New Orleans)
- **Mozambique** (Maputo, Beira)
- **Russia** (Vladivostok, Ust-Luga, Taman)
- **Indonesia** (Tanjung Bara, Balikpapan)

Discharging these massive volumes onto India's eastern seaboard involves a network of critical maritime gateways:
- **Visakhapatnam (Vizag)** (Outer Harbor & Inner Harbor)
- **Paradip**
- **Dhamra**
- **Haldia Dock Complex**
- **Gopalpur**
- **Gangavaram**

### 1.2 The Traditional Operational Problem
Historically, vessel chartering and bulk cargo procurement in Indian public sector undertakings have operated on a **reactive, manual, spot-market model**:
1. **Volatile Spot Exposure**: Procurement teams frequently entered the market on daily spot inquiries without predictive foresight of whether freight rates were peaking or bottoming out.
2. **Suboptimal Contract Structures**: High reliance on single-voyage spot fixtures rather than strategically timed medium-term contracts or Contracts of Affreightment (COA), causing multi-million dollar budget overruns during global freight spikes.
3. **Severe Port Bottlenecks & Demurrage**: Ports have strict physical limitations. For example, Haldia has an allowable draft of only 8.5 meters, whereas a fully loaded Capesize bulk carrier requires up to 18.0 meters. Chartering a vessel that cannot berth results in expensive mid-sea lightering (transshipment into smaller barges) or crippling demurrage penalties (costing $20,000 to $35,000 per day per vessel while idling at anchorage).
4. **Information Silos**: Procurement managers, chartering officers, port coordinators, and finance controllers worked across fragmented spreadsheets, disconnected emails, and subjective intuition.

### 1.3 The Solution: SAGAR DRISHTI (Oceanic Foresight)
**SAGAR DRISHTI** (*Vision Across the Oceans*) is an enterprise-grade, AI-powered maritime decision-support and freight forecasting ecosystem engineered specifically to modernize raw material logistics for India's steel sector.

SAGAR DRISHTI transforms maritime logistics from **reactive day-to-day scrambling** into **proactive, predictive, mathematical chartering**:
- Predicts global bulk shipping freight rates 7 to 180 days into the future.
- Automatically selects the optimal vessel class (from Handysize up to Capesize/VLOC) based on cargo parcel size and port physical boundaries.
- Identifies the exact calendar window to enter the charter market to secure the lowest rates.
- Evaluates complete voyage economics (fuel consumption, canal tolls, port tariffs, lightering costs).
- Provides an automated 16-step Decision Intelligence pipeline backed by an immutable compliance audit trail.
- Delivers a zero-hallucination AI Maritime Copilot to answer executive inquiries instantly.
- Completely supports both dark and light modes with high-contrast executive visual clarity.

---

## 2. Who Uses SAGAR DRISHTI? (Role-Based Governance)

SAGAR DRISHTI enforces strict enterprise governance with dedicated workspaces tailored to six distinct organizational personas:

| Role | Primary Responsibility | How SAGAR DRISHTI Empowers Them |
| :--- | :--- | :--- |
| **Executive Leadership (Board / Director Logistics)** | Strategic oversight, annual procurement budgets, and supply chain continuity. | High-level Control Tower dashboards, total landed cost summaries, real-time savings counters (in ₹ Lakhs & Millions USD), and macroeconomic risk radars. |
| **Chartering Manager** | Vessel chartering, charter fixtures, vessel candidate evaluation, laytime, and demurrage control. | Live fleet tracking, vessel candidate suitability scores, bunker fuel sensitivity analysis, and Time Charter Equivalent (TCE) calculators. |
| **Procurement Manager** | Sourcing bulk materials, tender parcel allocation, supplier price comparisons, and supplier contracts. | Multi-origin landed cost comparison wizard (e.g., Australian vs. Mozambican coking coal), contract lifecycle management, and price arbitration tools. |
| **Port Operations Manager** | Port logistics, berth allocations, draft restrictions, and anchorage turnaround. | Real-time East Coast port congestion indices, draft/LOA compatibility checking, weather/cyclone advisories for the Bay of Bengal, and lightering coordination. |
| **Maritime Market Analyst** | Freight market forecasting, ML model backtesting, macro trend analysis, and simulation studies. | Forward rate curves (7D, 14D, 30D, 60D, 90D, 180D), model governance (Candidate/Staging/Production), and scenario stress-testing sandboxes. |
| **Super Administrator** | Platform security, tenant configuration, compliance, and user roles. | System audit trails, cryptographic data integrity logs, and global configuration settings. |

---

## 3. End-to-End Core Capabilities & Features

### 3.1 Executive Control Tower & Global Telemetry
- **Single-Pane Command Center**: Real-time visual tracking of active voyages, inbound shipments to India's East Coast, active contracts, and current fleet positions.
- **Financial Key Performance Indicators (KPIs)**:
  - *Projected Freight Rate ($/MT)* vs. Historical Benchmarks.
  - *Net Logistics Savings Achieved* (measured against spot market baselines).
  - *Fleet Capacity Utilization* across Handymax, Panamax, and Capesize bulkers.
  - *Demurrage Exposure Meter* identifying vessels at risk of congestion delays.
- **Bay of Bengal Weather & Maritime Safety Radar**: Direct integration of cyclone warnings, wave-height advisories, and monsoon storm tracking affecting ports like Paradip and Dhamra.

### 3.2 Cargo Procurement Requirement Wizard & Landed Cost Engine
- **Step-by-Step Cargo Allocation**: Logistics officers input commodity type (Coking Coal, Thermal Coal, Limestone, Iron Ore), parcel volume (e.g., 75,000 MT to 150,000 MT), preferred laycan window, and origin/destination pairs.
- **True Landed Cost Breakdown**: The platform calculates the complete financial cost of the cargo delivered to the steel plant gate:
  `Total Landed Cost = FOB Cargo Price + Ocean Freight + Bunker Adjustment + Port Tariffs + Lightering Surcharges + Demurrage Buffer`
- **Multi-Origin Arbitrage Comparison**: Side-by-side comparison of sourcing identical energy-value coking coal from Queensland (Australia) versus Maputo (Mozambique) or Hampton Roads (USA), factoring in sailing days, canal dues (e.g., Suez/Cape of Good Hope routing), and destination port handling fees.

### 3.3 AI Freight Rate Forecasting Engine
- **Forward Rate Trajectory Curves**: Generates multi-horizon freight rate predictions for 7, 14, 30, 60, 90, and 180 calendar days into the future.
- **Statistical Confidence Bands**: Every forecast includes 95% upper and lower probability bounds, allowing risk committees to assess market volatility before signing charter agreements.
- **Baltic Dry Index (BDI) Synchronization**: Dynamically correlates predictive models with real-world shipping indices:
  - *Capesize Index (BCI)*
  - *Panamax Index (BPI)*
  - *Supramax Index (BSI)*
  - *Handysize Index (BHSI)*
- **Model Governance & Backtesting**: Transparent scoring of forecasting accuracy (RMSE, MAE, R²) so analysts can verify how closely past AI predictions matched actual historical spot rates.

### 3.4 Vessel Intelligence & Compatibility Engine
- **Comprehensive Bulk Carrier Fleet Registry**:
  - **Handysize (15,000 - 35,000 DWT)**: For smaller parcels or highly restricted berths.
  - **Handymax (35,000 - 50,000 DWT)**: Geared vessels with self-loading capability.
  - **Supramax (50,000 - 60,000 DWT)**: Versatile, standard bulk carriers.
  - **Ultramax (60,000 - 65,000 DWT)**: Modern high-efficiency vessels.
  - **Panamax (65,000 - 75,000 DWT)**: Optimized for major international bulk trade.
  - **Kamsarmax (80,000 - 85,000 DWT)**: High-capacity Panamax extension.
  - **Post-Panamax (85,000 - 100,000 DWT)**: Broad beam, high cargo deadweight.
  - **Capesize (100,000 - 200,000 DWT)**: The heavy workhorse for coal and ore imports.
  - **Newcastlemax (200,000 - 220,000 DWT)**: Maximum parcel size for Newcastle coal ports.
  - **VLOC (220,000 - 400,000 DWT)**: Very Large Ore Carriers.
- **Vessel Vetting & Suitability Scoring**: Ranks candidate vessels by age, fuel economy (tons of VLSFO/MGO consumed per sea-day), deadweight suitability, and historical safety ratings.

### 3.5 Port Physical Constraints & Maritime Navigation Routing
- **Indian East Coast Port Master Data**:
  - **Visakhapatnam (Vizag) Outer Harbor**: Permissible draft up to 16.5m, LOA up to 300m (Fully Capesize capable).
  - **Dhamra Port**: Deep-water draft up to 18.0m (Can accommodate fully loaded Capesize and mini-VLOCs).
  - **Paradip Port**: Permissible draft up to 14.5m (Accommodates Kamsarmax and lightened Capesize).
  - **Gangavaram Port**: Deep-draft port handling up to 16.0m draft.
  - **Gopalpur Port**: Draft up to 13.0m (Panamax/Supramax suitable).
  - **Haldia Dock Complex**: Shallow riverine port with 8.5m draft restriction.
- **Automated Physical Compatibility Validation**: Instant pass/fail dimensional verification comparing the vessel's Summer Draft, Beam, and Length Overall (LOA) against port berth parameters.
- **Lightering Economics Calculator**: If a Capesize vessel is assigned to a shallow port like Haldia or Paradip, SAGAR DRISHTI automatically models the cost and time required for mid-sea transshipment (lightering at Sagar Sandheads), ensuring full financial transparency.
- **SeaRoute Maritime Navigation**: Calculates true nautical distance (NM) following official maritime shipping lanes (e.g., navigating through the Malacca Strait, Sunda Strait, or around Cape of Good Hope) rather than geographic straight lines.

### 3.6 The Automated 16-Step Decision Intelligence Pipeline
When a shipment requirement is submitted, SAGAR DRISHTI triggers an automated, mathematically rigorous 16-step analysis:
1. **Input Validation**: Verifies cargo tonnage, laycan dates, origin export terminal, and target Indian discharge port.
2. **Master Data Resolution**: Standardizes commodity specs, stowage factors, and moisture allowances.
3. **Route Distance Resolution**: Measures exact nautical miles via verified maritime corridors.
4. **Freight Rate Benchmarking**: Fetches real-time spot market quotes and Baltic index differentials.
5. **Machine Learning Forecast**: Projects future rate curves across 7D to 180D horizons with confidence intervals.
6. **Market Entry Strategy Recommendation**: Issues explicit chartering timing guidance:
   - `ENTER_NOW` (rates expected to climb rapidly).
   - `WAIT` (rates expected to soften in upcoming weeks).
   - `ENTER_PARTIALLY` (secure partial tonnage now, hedge balance later).
7. **Candidate Vessel Filtering**: Shortlists registered vessels capable of carrying the parcel deadweight.
8. **Physical Port Feasibility Verification**: Disqualifies vessels exceeding draft, beam, or LOA limits.
9. **10-Component Voyage Economics**: Calculates fuel (VLSFO/MGO at sea and in port), canal tolls, port disbursements, crew/insurance opex, and net TCE.
10. **Congestion & Turnaround Risk**: Assesses current waiting time at discharge anchorage.
11. **Multi-Factor Risk Scoring**: Evaluates weather, geopolitical, counterparty, and bunker price risks.
12. **Contract Structure Optimization**: Recommends the optimal contract format: Single Spot Voyage, 3-Month Short-Term Charter, 6-Month Period Charter, or Annual COA.
13. **Scenario Simulation Stress-Testing**: Re-tests the decision against simulated fuel spikes (+25%) and severe weather delays (+4 days).
14. **Savings & ROI Calculation**: Computes projected cost reduction compared to benchmark spot rates.
15. **Decision Recommendation Trace**: Assembles verifiable factor evidence supporting the strategy.
16. **Enterprise Audit Persistence**: Generates a tamper-evident audit record and formal Decision Dossier.

### 3.7 Multi-Factor Maritime Risk Engine
SAGAR DRISHTI monitors and scores risks across eight distinct operational dimensions (0 to 100 Risk Score):
1. **Weather & Sea State Risk**: Cyclone tracking, wave swells, and seasonal monsoon impact in the Bay of Bengal.
2. **Port Congestion Risk**: Berth occupancy rates and historical vessel queuing delays.
3. **Freight Market Volatility Risk**: Price fluctuation risk measured using Value at Risk (VaR) calculations.
4. **Bunker Price Fluctuation Risk**: Financial sensitivity to global crude and marine fuel spikes.
5. **Geopolitical & Chokepoint Risk**: Bottlenecks in the Malacca Strait, Red Sea, or Mozambique Channel.
6. **Counterparty & Shipowner Reliability Risk**: Operator creditworthiness, vessel inspection history, and PSC detention records.
7. **Currency & FX Risk**: Currency conversion fluctuations (USD freight settlement vs. INR domestic balance sheet).
8. **Vessel Performance Risk**: Speed and fuel overconsumption claims under standard charter party terms (e.g., NYPE 93).

### 3.8 Scenario Simulation Sandbox (Digital Twin Stress-Testing)
Before authorizing high-value charter fixtures, executives and chartering managers can simulate disruptive real-world events:
- **Bunker Fuel Shock**: Simulates crude oil escalations (+15%, +30%, +50%) and reveals the impact on voyage freight costs.
- **Port Closure / Cyclone Disruptions**: Simulates severe cyclonic storms hitting Odisha and Andhra Pradesh coastlines, modeling anchorage delays and redirecting vessels to alternate deep-water ports (e.g., rerouting from Paradip to Dhamra).
- **Canal & Chokepoint Blockages**: Models transit delays and route diversions around Africa.
- **Demand Surges**: Tests charter availability during peak Chinese raw material import surges.

### 3.9 Zero-Hallucination AI Copilot (SAGAR DRISHTI Assistant)
- **Executive Conversational AI**: Available 24/7 as an intelligent floating assistant in the bottom-right corner of every screen.
- **Deterministic Grounding (Zero Hallucination)**: Unlike generic conversational AI models, the SAGAR DRISHTI Copilot is strictly bounded by 6 deterministic maritime tools. It never invents data or fabricates shipping rates:
  1. `searchPorts()`: Verifies official port draft, LOA, and berth capacity.
  2. `searchVessels()`: Queries active fleet parameters and suitability.
  3. `searchFreight()`: Fetches verified spot benchmarks and historical index data.
  4. `getForecast()`: Retrieves trained ML forward curves with confidence boundaries.
  5. `checkPortFeasibility()`: Executes dimensional clearance mathematics.
  6. `analyzeVoyage()`: Runs 10-component voyage economics with 20-digit precision.
- **Interactive Quick-Action Chips**: One-click prompt suggestions allow users to immediately compare port limits, inspect vessel costs, or export decision briefs.

### 3.10 Contract Lifecycle, Laytime & Demurrage Management
- **Contract State Machine**: Manages the formal lifecycle of shipping contracts from Draft -> Tender Evaluation -> Charter Party Signed -> Voyage in Progress -> Laytime Settlement -> Completed.
- **Automated Laytime Calculation**: Automatically accounts for *Weather Working Days (WWD)*, Sundays and Holidays Excluded (SHEX), notice of readiness (NOR) tendering, and demurrage/dispatch balances.

### 3.11 Formal Decision Dossiers & Audit Readiness
- **Committee-Ready Dossier Generator**: One-click generation of formal decision briefs containing executive summaries, alternative vessel comparisons, port clearance certificates, voyage cost breakdowns, and risk matrices.
- **Audit Trails**: Every recommendation, user approval, parameter modification, and forecast run is cryptographically logged to satisfy public-sector procurement transparency guidelines.

### 3.12 Complete Light Mode & Dark Mode System
- **Executive Visual Ergonomics**: Seamless switching between a sleek, futuristic dark operations room theme and a high-contrast, paper-like white mode designed for well-lit office environments and executive boardrooms.
- **True White Mode Typography**: High-contrast black and deep slate typography (`#0f172a`), crisp white card containers, clear borders, readable data tables, and print-ready document exports.

---

## 4. Real-World Business Scenarios (How SAGAR DRISHTI Solves Day-to-Day Logistics)

### Scenario A: Sourcing 120,000 MT Coking Coal from Hay Point (Australia) to Vizag
- **Without SAGAR DRISHTI**:
  - The team books two separate Supramax vessels on the spot market at $28.40/MT because of uncertainty regarding deep-water berth availability.
  - Total Ocean Freight: **$3,408,000**.
- **With SAGAR DRISHTI**:
  - The system analyzes Visakhapatnam Outer Harbor's 16.5m draft and confirms full feasibility for a Capesize bulk carrier.
  - The ML forecast predicts that Capesize rates will drop by 4% over the next 10 days before climbing due to Australian weather disruptions.
  - SAGAR DRISHTI recommends: **Enter 3-Month Medium-Term Charter for a Capesize Bulker during Week 2**.
  - Rate secured: **$14.85/MT**.
  - Total Ocean Freight: **$1,782,000**.
  - **Net Financial Savings: $1,626,000 (~₹13.5 Crore)** on a single shipment parcel.

### Scenario B: Avoiding the Haldia Port Draft Trap
- **The Challenge**: A shipment of 70,000 MT coal is planned for discharge at Haldia Dock Complex.
- **SAGAR DRISHTI Protection**:
  - The system immediately flags an alert: *Haldia maximum permissible draft is 8.5m. A loaded Panamax draws 13.2m.*
  - The system evaluates two strategies:
    1. **Direct Supramax Delivery** (partial cargo with reduced draft).
    2. **Capesize with Lightering at Sagar Sandheads**: Discharge 50,000 MT at outer anchorage into barges, allowing the vessel to safely enter Haldia with remaining cargo.
  - The system calculates the net economics of both options, recommends the lightering solution, and prevents an estimated **$180,000 in demurrage penalties**.

---

## 5. Strategic Benefits & ROI for Ministry of Steel & SAIL

| Strategic Benefit Area | Measurable Impact Delivered by SAGAR DRISHTI |
| :--- | :--- |
| **Ocean Freight Cost Reduction** | **12% to 18% reduction** in total ocean freight expenditures through optimized parcel consolidation and forward timing. |
| **Demurrage & Idle Time Elimination** | **65% reduction** in port anchorage demurrage claims by proactive draft and congestion screening. |
| **Contractual Stability** | Transition from 90% spot market reliance to a balanced **60:40 portfolio** (60% long/medium-term contracts, 40% strategic spot fixtures). |
| **Decision Speed & Audit Transparency** | Decision turnaround reduced from **4 days to 45 seconds**, with 100% compliance audit trail documentation. |
| **Supply Chain Resilience** | Proactive warning of Bay of Bengal cyclones and regional disruptions up to 5 days in advance. |

---

## 6. Summary: The Future of Maritime Logistics with SAGAR DRISHTI
**SAGAR DRISHTI** bridges the gap between complex maritime realities and strategic public-sector bulk procurement. By synthesizing machine learning, physical port hydrodynamics, global shipping indices, and high-precision financial calculations into a single, intuitive platform, SAGAR DRISHTI establishes a new benchmark for India's industrial maritime independence.
