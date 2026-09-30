/**
 * JAL TARANG - Maritime Demand Elasticity & Multimodal Substitution Service
 * 
 * Implements econometric elasticity formulations from:
 * Dr. Vrajlal Sapovadia (2024).
 * "Demand Forecasting and Supply Chain Management in the Indian Shipping Industry:
 * An Application of Elasticity Concepts."
 * Gujarat Maritime University (GMU) & National Forensic Sciences University (NFSU).
 * 
 * Formulations:
 * 1. Price Elasticity of Demand (PED) for Indian Metallurgical / Coking Coal
 * 2. Cross-Price Elasticity of Demand (CPED) for Modal Substitution (Sandheads Lighterage vs. Dhamra Direct + FOIS Rail)
 * 3. Income Elasticity of Demand (IED) under National Steel Policy 2030 (300 MMT Target)
 * 4. Sensitivity Simulation for Landed Cost Arbitrage
 */

export interface ElasticityMetricDetail {
  code: 'PED' | 'CPED' | 'IED';
  title: string;
  value: number;
  classification: 'Inelastic' | 'Substitute' | 'Superior/Growth Driver' | string;
  formulaLatex: string;
  operationalInterpretation: string;
  policyContext: string;
}

export interface ModalShiftSimulationInput {
  freightRateChangePct: number;    // e.g. +15% surge in ocean spot hire
  railTariffChangePct?: number;    // e.g. -5% Indian Railways FOIS rake concession
  baseCargoVolumeMt?: number;      // e.g. 120,000 MT Capesize parcel
  currentSandheadsLighteringRateUsd?: number;
  currentDhamraRailTariffInr?: number;
}

export interface ModalShiftSimulationResult {
  input: {
    freightRateChangePct: number;
    railTariffChangePct: number;
    baseCargoVolumeMt: number;
  };
  elasticityParameters: {
    ped: number;
    cped: number;
    ied: number;
  };
  predictedDemandChangePct: number;
  projectedVolumeDemandedMt: number;
  modalReallocation: {
    sandheadsLighterageMt: number;
    dhamraDirectRailMt: number;
    shiftedVolumeMt: number;
    shiftDirection: 'Shift to Dhamra Direct + FOIS Rail' | 'Shift to Sandheads Lighterage' | 'Neutral';
  };
  financialImpact: {
    estimatedLandedCostDeltaInrPerMt: number;
    netSavingsOrSurplusInr: number;
  };
  procurementRecommendation: {
    recommendedContractStructure: 'Multiple Voyage Contract (COA) 75% / Spot 25%' | 'Multiple Voyage Contract (COA) 60% / Spot 40%' | 'Spot Preferred';
    strategicReasoning: string;
  };
}

export interface ElasticityAnalysisResponse {
  academicCitation: {
    author: string;
    institution: string;
    paperTitle: string;
    year: number;
  };
  elasticityMetrics: ElasticityMetricDetail[];
  modalSubstitutionBaseline: {
    originBasin: string;
    primaryCommodity: string;
    optionA_Lighterage: {
      route: string;
      oceanFreightUsdMt: number;
      lighterageSurchargeUsdMt: number;
      bargeThroughputInrMt: number;
    };
    optionB_DeepwaterRail: {
      route: string;
      oceanFreightUsdMt: number;
      foisRailFreightInrMt: number;
      dhamraHandlingInrMt: number;
    };
    crossElasticityThresholdPct: number;
  };
}

export class MaritimeElasticityService {
  private static readonly BASE_PED = -0.22; // Price Elasticity of Demand (Inelastic short-term coking coal)
  private static readonly BASE_CPED = 0.65; // Cross-Price Elasticity between Lighterage and Direct Rail
  private static readonly BASE_IED = 1.35;  // Income Elasticity of Demand (GDP to dry bulk growth)

  /**
   * Return comprehensive academic elasticity metrics and policy context
   */
  public static getElasticityAnalysis(): ElasticityAnalysisResponse {
    return {
      academicCitation: {
        author: 'Dr. Vrajlal Sapovadia (Adjunct Professor, GMU & NFSU)',
        institution: 'Gujarat Maritime University / NFSU Gandhinagar',
        paperTitle: 'Demand Forecasting and Supply Chain Management in the Indian Shipping Industry: An Application of Elasticity Concepts',
        year: 2024,
      },
      elasticityMetrics: [
        {
          code: 'PED',
          title: 'Price Elasticity of Demand (PED) — Coking Coal',
          value: this.BASE_PED,
          classification: 'Price Inelastic (|PED| < 1.0)',
          formulaLatex: '\\text{PED} = \\frac{\\% \\Delta Q_{\\text{coal}}}{\\% \\Delta \\text{Freight Rate}} = -0.22',
          operationalInterpretation: 'Because blast furnace cooling causes irreversible refractory collapse, SAIL cannot halt raw material intake during freight spikes. Shippers cannot wait out the market and must utilize structured forward COAs.',
          policyContext: 'National Steel Policy feedstock resilience guideline.',
        },
        {
          code: 'CPED',
          title: 'Cross-Price Elasticity of Demand (CPED) — Modal Arbitrage',
          value: this.BASE_CPED,
          classification: 'Direct Substitutes (CPED > 0)',
          formulaLatex: '\\text{CPED} = \\frac{\\% \\Delta Q_{\\text{Dhamra Direct + Rail}}}{\\% \\Delta P_{\\text{Sandheads Lighterage}}} = +0.65',
          operationalInterpretation: 'A 10% increase in Sandheads lightering or riverine delay costs triggers a 6.5% diversion of bulk tonnage to deepwater discharge at Dhamra paired with Indian Railways FOIS Class 140/150 rakes.',
          policyContext: 'Sagarmala coastal logistics and Indian Railways FOIS multi-modal integration.',
        },
        {
          code: 'IED',
          title: 'Income Elasticity of Demand (IED) — Industrial Growth',
          value: this.BASE_IED,
          classification: 'Growth Driver (IED > 1.0)',
          formulaLatex: '\\text{IED} = \\frac{\\% \\Delta \\text{Dry Bulk Imports}}{\\% \\Delta \\text{National GDP}} = +1.35',
          operationalInterpretation: 'India seaborne dry bulk cargo growth outpaces baseline GDP by 1.35x, driven by infrastructure capex and expanding blast furnace capacity.',
          policyContext: 'National Steel Policy 2030 (target: 300 Million Tonnes crude steel production by 2030).',
        },
      ],
      modalSubstitutionBaseline: {
        originBasin: 'Queensland, Australia (Hay Point / Gladstone)',
        primaryCommodity: 'Prime Hard Coking Coal',
        optionA_Lighterage: {
          route: 'Capesize ocean voyage to Sandheads Anchorage -> Lighter to daughter barges -> Haldia Dock Complex',
          oceanFreightUsdMt: 14.85,
          lighterageSurchargeUsdMt: 3.20,
          bargeThroughputInrMt: 280.0,
        },
        optionB_DeepwaterRail: {
          route: 'Full Capesize direct discharge at Dhamra (18.0m draft) -> Indian Railways FOIS rakes to Durgapur / Bokaro',
          oceanFreightUsdMt: 14.85,
          foisRailFreightInrMt: 740.0,
          dhamraHandlingInrMt: 195.0,
        },
        crossElasticityThresholdPct: 8.5,
      },
    };
  }

  /**
   * Simulate bulk cargo volume reallocation and landed cost impact based on elasticity concepts
   */
  public static simulateModalShift(input: ModalShiftSimulationInput): ModalShiftSimulationResult {
    const freightChange = Number(input.freightRateChangePct || 0);
    const railChange = Number(input.railTariffChangePct || 0);
    const baseVolume = input.baseCargoVolumeMt !== undefined ? Number(input.baseCargoVolumeMt) : 120000;

    // 1. Overall volume impact using PED
    // % Delta Q = PED * % Delta P_freight
    const demandChangePct = +(this.BASE_PED * freightChange).toFixed(2);
    const projectedVolumeDemandedMt = Math.max(0, Math.round(baseVolume * (1 + demandChangePct / 100)));

    // 2. Modal substitution between Sandheads Lighterage and Dhamra Direct + Rail
    // Relative price shift: Higher ocean/lighterage costs favor direct discharge + rail
    const netRelativeCostDiff = freightChange - railChange;
    const shiftRatio = +(this.BASE_CPED * (netRelativeCostDiff / 100)).toFixed(4);

    let baselineSandheadsPct = 0.40; // Baseline 40% Sandheads lighterage
    let baselineDhamraPct = 0.60;    // Baseline 60% Dhamra direct

    if (netRelativeCostDiff > 0) {
      // Sandheads became relatively more expensive -> shift towards Dhamra
      baselineDhamraPct = Math.min(0.95, baselineDhamraPct + shiftRatio);
      baselineSandheadsPct = 1.0 - baselineDhamraPct;
    } else if (netRelativeCostDiff < 0) {
      // Rail tariffs increased relatively -> shift towards coastal lighterage
      baselineSandheadsPct = Math.min(0.70, baselineSandheadsPct - shiftRatio);
      baselineDhamraPct = 1.0 - baselineSandheadsPct;
    }

    const sandheadsVolume = Math.round(projectedVolumeDemandedMt * baselineSandheadsPct);
    const dhamraVolume = projectedVolumeDemandedMt - sandheadsVolume;
    const shiftedVolume = Math.abs(Math.round(projectedVolumeDemandedMt * shiftRatio));

    // 3. Financial calculations
    const landedCostDeltaInr = +(netRelativeCostDiff * 14.5).toFixed(2); // ~INR 14.5 per MT per % relative shift
    const netSavingsOrSurplus = Math.round(shiftedVolume * Math.abs(landedCostDeltaInr));

    // 4. Strategic procurement recommendations
    let contractStructure: ModalShiftSimulationResult['procurementRecommendation']['recommendedContractStructure'] = 'Multiple Voyage Contract (COA) 75% / Spot 25%';
    let reasoning = 'Under high market volatility and price inelasticity, secure 75% volume via period COA multi-voyage contracts to eliminate spot spikes, deploying 25% for opportunistic dips.';

    if (freightChange < -10) {
      contractStructure = 'Multiple Voyage Contract (COA) 60% / Spot 40%';
      reasoning = 'Freight markets are experiencing a cyclical depression. Expand spot exposure to 40% to capture discounted fixtures below long-term COA parity.';
    } else if (freightChange > 20) {
      contractStructure = 'Multiple Voyage Contract (COA) 75% / Spot 25%';
      reasoning = 'Severe freight rally detected. Maximize COA cover to 75%+ immediately to prevent open market margin compression.';
    }

    return {
      input: {
        freightRateChangePct: freightChange,
        railTariffChangePct: railChange,
        baseCargoVolumeMt: baseVolume,
      },
      elasticityParameters: {
        ped: this.BASE_PED,
        cped: this.BASE_CPED,
        ied: this.BASE_IED,
      },
      predictedDemandChangePct: demandChangePct,
      projectedVolumeDemandedMt,
      modalReallocation: {
        sandheadsLighterageMt: sandheadsVolume,
        dhamraDirectRailMt: dhamraVolume,
        shiftedVolumeMt: shiftedVolume,
        shiftDirection: netRelativeCostDiff >= 0 ? 'Shift to Dhamra Direct + FOIS Rail' : 'Shift to Sandheads Lighterage',
      },
      financialImpact: {
        estimatedLandedCostDeltaInrPerMt: landedCostDeltaInr,
        netSavingsOrSurplusInr: netSavingsOrSurplus,
      },
      procurementRecommendation: {
        recommendedContractStructure: contractStructure,
        strategicReasoning: reasoning,
      },
    };
  }
}
