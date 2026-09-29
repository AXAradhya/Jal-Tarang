/**
 * JAL TARANG — Copilot Role Guides
 * Structured guidance for all 6 system personas.
 */

import { formatDaily, formatMoney } from '../tools/formatters.js';

export interface RoleGuideResult {
  answer: string;
  suggestedFollowups: string[];
}

export function getCharteringManagerGuide(
  currency: string,
  fleet: { total: number; available: number }
): RoleGuideResult {
  return {
    answer: `### 🚢 Chartering & Fleet Manager Role Guide
As the **Chartering Manager** for Steel Authority of India Limited (SAIL), your primary mission is to secure ocean shipping capacity for imported coking coal and raw materials at the lowest landed cost while maximizing vessel utilization and eliminating demurrage waste.

#### 🎯 Key Responsibilities:
1. **Fleet Nomination & Fixtures**: Assign available dry bulk vessels (Capesize, Panamax, Supramax) to strategic trade routes (Australia/Indonesia → India).
2. **Voyage Economics & P&L**: Calculate Time Charter Equivalent (TCE), gross freight income, VLSFO bunker consumption, and port disbursements.
3. **Spot vs COA Optimization**: Determine whether to execute immediate spot charters or lock long-term Contract of Affreightment (COA) tranches.
4. **Demurrage Mitigation**: Monitor vessel laycans to prevent demurrage penalties (averaging ${formatDaily(22000, currency)} per delayed Capesize).

#### 📍 Your Dedicated Pages:
- **[Chartering & Vessels](/chartering)**: Inspect active vessels (${fleet.total} total, ${fleet.available} ready for fixture), evaluate vessel draft/LOA, and run the **Voyage Economics Calculator**.
- **[Contracts](/contracts)**: Review active charter party agreements, verify laycan windows, and audit demurrage/despatch clauses.
- **[Decision Center](/decision)**: Run the AI strategy engine to compare **Spot vs COA** fixtures and view the step-by-step voyage financial waterfall.
- **[Freight Market](/freight)**: Track real-time Baltic indices (BCI 5TC, C5TC, P1A) and 7-day rate momentum.
- **[Executive Dashboard](/dashboard)**: View high-level Baltic Capesize BCI 5TC benchmarks and total fleet deadweight tonnage.`,
    suggestedFollowups: [
      'Run a complete voyage economics analysis for 100,000 MT Coking Coal',
      'Which vessels are available in the Panamax/Capesize fleet?',
      'What is the current C5TC freight rate and 30-day forecast?'
    ]
  };
}

export function getProcurementManagerGuide(
  currency: string,
  stockData: Array<{ plant_id: string; stock_days: number }>
): RoleGuideResult {
  const bhilaiStock = stockData.find((s: any) => String(s.plant_id).includes('Bhilai'))?.stock_days || 18;
  const bokaroStock = stockData.find((s: any) => String(s.plant_id).includes('Bokaro'))?.stock_days || 16;

  return {
    answer: `### 📦 Raw Material Procurement Manager Role Guide
As the **Procurement Manager** for SAIL, your primary mandate is ensuring uninterrupted raw material supply (coking coal, thermal coal, limestone, iron ore) across all integrated steel plants while negotiating optimal commercial tender pricing.

#### 🎯 Key Responsibilities:
1. **Steel Plant Stock Security**: Enforce the mandatory **21-day minimum stock cushion** across Bhilai, Bokaro, Rourkela, Durgapur, and IISCO Burnpur to prevent blast furnace shutdowns.
2. **Tender Allocation & Awards**: Evaluate supplier bids (BHP Billiton, Anglo American, Teck, Peabody, Glencore) and award procurement contracts based on lowest landed CFR cost.
3. **FOB vs CFR Terms**: Collaborate with Chartering to decide whether SAIL should control freight (FOB purchase + SAIL charter) or buy delivered (CFR).
4. **Volume Fulfillment Tracking**: Ensure international mining counterparties meet contractual shipping schedules.

#### ⚠️ Immediate Status Alert:
- **Bhilai Steel Plant**: Currently at **${bhilaiStock} days** inventory buffer (*Below 21-day safety threshold!*).
- **Bokaro Steel Plant**: Currently at **${bokaroStock} days** inventory buffer (*Action required: Expedite Q4 coking coal shipments*).

#### 📍 Your Dedicated Pages:
- **[Procurement Dashboard](/procurement)**: Monitor real-time plant stock cushions, track strategic commodity requirements, and execute the **Confirm Tender Award** workflow.
- **[Decision Center](/decision)**: Access the **Multi-Supplier Tender Allocation** matrix to compare supplier FOB quotes vs landed CFR costs with ocean freight additions.
- **[Contracts](/contracts)**: Oversee long-term supplier procurement agreements and monitor fulfillment fulfillment metrics.
- **[Executive Dashboard](/dashboard)**: View total contracted cargo tonnage and average contract freight benchmarks.`,
    suggestedFollowups: [
      'Compare spot vs COA strategy for Q4 coal procurement',
      'What are the stock cushions across Bhilai and Bokaro?',
      'How does the Multi-Supplier Tender Allocation work?'
    ]
  };
}

export function getPortManagerGuide(currency: string): RoleGuideResult {
  return {
    answer: `### ⚓ Port Logistics & Operations Manager Role Guide
As the **Port Manager** for SAIL, your primary responsibility is overseeing vessel arrival, anchorage queues, berth allocation, and rake dispatch across East Coast Indian maritime gateways.

#### 🎯 Key Responsibilities:
1. **Port Restriction Compliance**: Ensure arriving bulk carriers satisfy physical berth constraints: draft, length overall (LOA), beam, and deadweight (DWT).
2. **Demurrage Avoidance & Diversion**: Monitor anchorage waiting days (especially at Paradip and Haldia). When congestion exceeds 2-3 days, authorize diversion to faster-clearing ports (e.g. Dhamra or Gopalpur).
3. **Berth Scheduling**: Coordinate with port authorities to allocate mechanized bulk berths and avoid idle vessel anchorage costs.
4. **Evacuation to Rakes**: Synchronize rail rake loading from port stockyards directly into steel plant railway sidings.

#### 📍 Your Dedicated Pages:
- **[Port Intelligence](/ports)**: Monitor active vessel queues, waiting days, and terminal restrictions for Paradip, Visakhapatnam, Haldia, Dhamra, and Gopalpur. Trigger **Authorize Berth Re-Allocation** when congestion builds.
- **[Decision Center](/decision)**: Utilize the **Port Congestion Diversion** engine to calculate net demurrage savings (e.g. diverting MV Bharat Gaurav from Paradip to Dhamra saves ${formatMoney(44000, currency)}).
- **[Operations Control Tower](/control-tower)**: View real-time satellite AIS vessel positions at anchorage, weather advisories, and Bay of Bengal cyclone tracking.
- **[Executive Dashboard](/dashboard)**: Monitor average turnaround time across all coastal discharge terminals.`,
    suggestedFollowups: [
      'What are the current port restrictions and waiting days at Paradip?',
      'What is the feasibility of a Newcastlemax vessel at Paradip port?',
      'How much money can be saved by diverting a vessel to Dhamra?'
    ]
  };
}

export function getAnalystGuide(): RoleGuideResult {
  return {
    answer: `### 📈 Quantitative Maritime & Freight Analyst Role Guide
As the **Analyst** for JAL TARANG, your primary objective is providing data-driven market forecasts, econometric forward curves, and stress-testing shipping operations against macroeconomic and weather volatility.

#### 🎯 Key Responsibilities:
1. **Econometric Forward Curves**: Project Baltic freight indices (Capesize C5TC, Panamax P1A, Supramax S10TC) across 7D, 14D, 30D, 60D, and 90D forward horizons.
2. **Machine Learning Model Governance**: Benchmark predictive performance across Ensemble Pro, Bi-LSTM, XGBoost, and Prophet models, tracking MAE and RMSE metrics.
3. **Scenario Stress Testing**: Simulate severe supply chain shocks (e.g., +25% VLSFO bunker price spike, 5-day Bay of Bengal cyclone port shutdown, supplier force majeure).
4. **Chartering Strategy Recommendations**: Identify inflection points where forward curve escalation warrants locking COA contracts over spot chartering.

#### 📍 Your Dedicated Pages:
- **[Freight Forecasting](/forecasting)**: Inspect dynamic forward curves with 95% confidence intervals, evaluate ML model metrics, and trigger **Retrain Model Pipeline**.
- **[Freight Market](/freight)**: Analyze multi-route trajectory curves, historical 4-week moving averages, and 7-day rate momentum.
- **[Scenario Center](/scenarios)**: Create and simulate what-if operational disruptions, evaluate baseline vs scenario cost variance, and generate strategic recommendations.
- **[Executive Dashboard](/dashboard)**: Inspect the Analyst View featuring forecast model accuracy (94.2%), Cape-to-Panamax ratios, and confidence envelopes.`,
    suggestedFollowups: [
      'What is the 30-day forecast for the C5TC freight rate?',
      'How do the Ensemble Pro and Bi-LSTM models compare in MAE?',
      'Run a simulation for a 25% bunker price surge'
    ]
  };
}

export function getSuperAdminGuide(currency: string): RoleGuideResult {
  return {
    answer: `### 🛡️ Super Administrator & Executive Director Role Guide
As the **Super Admin** for JAL TARANG, you possess executive oversight across all maritime, procurement, and platform operations with complete Central Vigilance Commission (CVC) compliance accountability.

#### 🎯 Key Responsibilities:
1. **Executive Clearance & Threshold Governance**: Provide mandatory board-level digital countersignatures for all COA contract amendments exceeding ${formatMoney(1000000, currency)} (${formatMoney(1000000, 'USD')}).
2. **CVC Integrity & Audit Inspection**: Review immutable SHA-256 cryptographic audit logs capturing every user action, tender award, fixture authorization, and parameter modification.
3. **Enterprise Policy Management**: Enforce bunker procurement price caps, hedging guidelines, and approved supplier accreditations.
4. **Cross-Departmental Alignment**: Balance the conflicting objectives of Procurement (low FOB costs), Chartering (optimal TCE and demurrage), and Port Logistics (turnaround speed).

#### 📍 Your Dedicated Pages:
- **Full Unrestricted Access** to all 15 platform modules.
- **[Audit Logs & Governance](/audit)**: Verify cryptographic audit hashes, filter by security events, and inspect compliance records.
- **[Contracts](/contracts)**: Grant executive clearance on high-value contract amendments and laycan renegotiations.
- **[System Administration](/admin)**: Monitor backend health, database connection pools, and API latency.
- **[Executive Dashboard](/dashboard)**: View macro-level operational metrics across all 5 organizational personas.`,
    suggestedFollowups: [
      'What are the recent audit log governance events?',
      'Which contracts require board-level clearance?',
      'Explain the complete workflow of Decision Center'
    ]
  };
}

export function getAdminGuide(): RoleGuideResult {
  return {
    answer: `### ⚙️ System Administrator Role Guide
As the **Platform Administrator**, you ensure high availability, security, and data pipeline integrity across the entire JAL TARANG platform.

#### 🎯 Key Responsibilities:
1. **System Health & Telemetry**: Monitor PostgreSQL connection pools, API request latencies, Redis caching, and microservice statuses.
2. **Background Job Pipelines**: Supervise asynchronous workers ingesting Baltic Exchange spot feeds, satellite AIS tracking telemetry, and automated forecast model retraining.
3. **Role-Based Access Control (RBAC)**: Manage user accounts, role assignments (Chartering Manager, Procurement Manager, Port Manager, Analyst, Super Admin), and JWT session lifecycles.
4. **Audit Trail Verification**: Ensure every administrative mutation is written to immutable compliance tables.

#### 📍 Your Dedicated Pages:
- **[System Administration](/admin)**: Real-time service status, database query latency, cache hit ratio, and active background job queues.
- **[Audit Logs](/audit)**: Inspect user sign-ins, role changes, and API security events.
- **[Executive Dashboard](/dashboard)**: High-level system uptime and infrastructure status.`,
    suggestedFollowups: [
      'What background jobs are currently running in MARINEX?',
      'How does the RBAC system manage user roles?',
      'How do I monitor database query performance?'
    ]
  };
}
