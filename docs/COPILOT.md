# SAGAR DRISHTI — AI Copilot & Controlled Tool Architecture

## 1. Zero Hallucination Guarantee
The SAGAR DRISHTI AI Copilot operates under strict deterministic grounding. The language model or agent is **never given direct, unconstrained database access** or allowed to invent maritime metrics.

Every factual statement in Copilot responses is derived from one of 6 controlled tool interfaces:

```
[User Maritime Question]
         │
         ▼
[Copilot Intent Dispatcher]
         │
 ┌───────┴───────────────────────────────┐
 ▼                                       ▼
searchPorts()                   searchFreight()
searchVessels()                 getForecast()
checkPortFeasibility()          analyzeVoyage()
         │                                       │
         └───────────────┬───────────────────────┘
                         │
                         ▼
             [Structured Evidence Trace]
                         │
                         ▼
               [Grounded Answer Output]
```

---

## 2. Controlled Tool Inventory

### 1. `searchPorts(query: string)`
Queries physical restrictions for Indian East Coast ports (Paradip, Visakhapatnam, Gangavaram, Gopalpur, Dhamra, Haldia). Returns maximum draft, LOA, beam, and DWT limits.

### 2. `searchVessels(vesselClass?: string, minDwt?: number)`
Filters vetted bulk carrier fleet by class (Capesize, Newcastlemax, Kamsarmax, Panamax, Ultramax, Supramax, Handysize) and operational status.

### 3. `searchFreight(originCode: string, destinationCode: string)`
Retrieves verified spot market benchmarks from Baltic Exchange and historical fixtures.

### 4. `getForecast(freightCode?: string)`
Queries forward time-series machine learning predictions across 7D, 14D, 30D, 60D, 90D, and 180D horizons with 95% confidence intervals.

### 5. `checkPortFeasibility(vesselId: string, portId: string)`
Executes physical dimensional verification (Vessel LOA vs Port LOA, Summer Draft vs Berth Draft) and returns a binary feasibility status with explicit rejection causes.

### 6. `analyzeVoyage(cargoQuantityMt, distanceNm, freightRateUsd)`
Executes the full 10-component voyage economics engine using `Decimal.js` to compute TCE, landed cost/MT, net P&L, and break-even freight rate.

---

## 3. Grounded Response Format
```json
{
  "query": "What are the draft restrictions at Paradip port?",
  "answer": "Grounded Port Intelligence: Paradip Port (Code: INPPA) permits vessels up to maximum draft of 14.5m...",
  "evidence": [
    {
      "toolName": "searchPorts",
      "parameters": { "query": "Paradip" },
      "output": [...],
      "executedAt": "2026-09-15T22:00:00.000Z"
    }
  ],
  "dataTimestamp": "2026-09-15T22:00:00.000Z",
  "source": "SAIL_SAGAR DRISHTI_GROUNDED_DATABASE_AND_ANALYTICS_V2",
  "confidence": 0.95,
  "limitations": "Outputs are deterministically constrained to verified PostgreSQL database records..."
}
```
