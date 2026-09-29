"""
SAGAR DRISHTI — NLP Geopolitical Disruption Sentiment Engine (Feature E)

Extracts and scores geopolitical, maritime security, weather, and labor disruptions
from maritime news feeds (Lloyd's List, TradeWinds, Baltic Exchange circulars, IMD bulletins).
Computes route-specific Disruption Risk Scores (0–100) and calculates empirical
freight rate forecast elasticities.
"""

import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class DisruptionScoringRequest(BaseModel):
    headline: str
    bodyText: Optional[str] = ""
    source: Optional[str] = "Maritime News Feed"
    publishedDate: Optional[str] = None

class DisruptionScoringResponse(BaseModel):
    category: str
    severity: str
    disruptionScore: int = Field(..., ge=0, le=100)
    freightRateElasticityPct: float
    affectedRoutes: List[str]
    affectedPorts: List[str]
    recommendedAction: str
    keySignalsDetected: List[str]
    confidenceScorePct: int

class NlpDisruptionEngine:
    """
    Maritime NLP analysis engine calibrated against historical geopolitical crises
    (2021 Suez blockage, 2023 Red Sea crisis, Australian coal port strikes).
    """

    CATEGORIES = {
        "CANAL_BLOCKAGES": {
            "keywords": ["suez", "panama", "canal", "grounded", "stuck", "draft restriction", "transit slot", "water level"],
            "base_score": 75,
            "elasticity": 15.0,
            "routes": ["USG_ECI", "MZ_ECI"],
            "action": "LOCK CAPE OF GOOD HOPE ROUTING; avoid canal choke-points and budget +10-14 days transit."
        },
        "PIRACY_SECURITY": {
            "keywords": ["red sea", "houthi", "drone", "missile", "gulf of aden", "bab-el-mandeb", "strait of hormuz", "attack", "security alert"],
            "base_score": 78,
            "elasticity": 12.0,
            "routes": ["MZ_ECI", "USG_ECI"],
            "action": "AVOID BAB-EL-MANDEB; reroute Mozambique and Atlantic parcels via Cape Town; secure war risk insurance."
        },
        "PORT_STRIKES": {
            "keywords": ["strike", "tugboat", "dockworker", "industrial action", "union", "go-slow", "pilots strike", "lockout"],
            "base_score": 62,
            "elasticity": 8.0,
            "routes": ["AU_ECI"],
            "action": "ADVANCE LAYCAN DATES; secure prompt tonnage before berthing delays accumulate."
        },
        "WEATHER_DISRUPTIONS": {
            "keywords": ["cyclone", "typhoon", "depression", "monsoon", "gale", "swell", "sea state", "pilotage suspended", "outer anchorage shut"],
            "base_score": 70,
            "elasticity": 9.5,
            "routes": ["AU_ECI", "ID_ECI"],
            "action": "DIVERT TO SHELTERED ANCHORAGE; delay arrival by 48-72h to avoid high demurrage and rough sea demurrage."
        },
        "SANCTIONS_TRADE_WARS": {
            "keywords": ["sanctions", "tariff", "embargo", "export ban", "duties", "quota", "customs clearance", "dgcis"],
            "base_score": 58,
            "elasticity": 6.5,
            "routes": ["RU_ECI", "ID_ECI"],
            "action": "EVALUATE NON-DOLLAR SETTLEMENT; verify counterparty compliance and vessel P&I club coverage."
        },
        "CONFLICT_WAR": {
            "keywords": ["war", "hostilities", "blockade", "black sea", "mine threat", "naval drone", "martial law"],
            "base_score": 85,
            "elasticity": 18.0,
            "routes": ["RU_ECI"],
            "action": "ACTIVATE CONTINGENCY ORIGINS; replace Black Sea coal volume with Australian/Indonesian supply."
        }
    }

    PORT_KEYWORDS = {
        "Haldia": ["haldia", "kolkata", "hooghly", "sandheads"],
        "Paradip": ["paradip", "odisha"],
        "Dhamra": ["dhamra"],
        "Vizag": ["vizag", "visakhapatnam", "outer harbor"],
        "Newcastle": ["newcastle", "hay point", "gladstone", "dalrymple", "queensland"],
        "Nacala": ["nacala", "beira", "maputo", "mozambique"],
        "Balikpapan": ["balikpapan", "kalimantan", "indonesia"],
    }

    @classmethod
    def analyze_text(cls, headline: str, body: str = "") -> DisruptionScoringResponse:
        combined = f"{headline} {body}".lower()
        
        best_category = "GENERAL_LOGISTICS"
        max_keyword_matches = 0
        signals_found: List[str] = []
        matched_config = None

        for cat_name, config in cls.CATEGORIES.items():
            matches = [kw for kw in config["keywords"] if re.search(r'\b' + re.escape(kw) + r'\b', combined)]
            if len(matches) > max_keyword_matches:
                max_keyword_matches = len(matches)
                best_category = cat_name
                signals_found = matches
                matched_config = config

        # Intensity boosters
        intensity_boosters = ["severe", "critical", "shut", "closed", "emergency", "force majeure", "record high", "indefinite"]
        booster_count = sum(1 for b in intensity_boosters if re.search(r'\b' + re.escape(b) + r'\b', combined))

        if matched_config:
            raw_score = matched_config["base_score"] + (len(signals_found) * 3) + (booster_count * 5)
            final_score = min(100, max(10, raw_score))
            elasticity = matched_config["elasticity"] * (1.0 + (booster_count * 0.15))
            action = matched_config["action"]
            routes = matched_config["routes"]
        else:
            final_score = 25
            elasticity = 1.0
            action = "Routine monitoring; no immediate freight adjustment required."
            routes = ["ALL_ECI"]

        # Determine severity
        if final_score >= 80:
            severity = "CRITICAL"
        elif final_score >= 65:
            severity = "HIGH"
        elif final_score >= 45:
            severity = "MODERATE"
        else:
            severity = "LOW"

        # Detect affected ports
        affected_ports: List[str] = []
        for port_name, p_kws in cls.PORT_KEYWORDS.items():
            if any(re.search(r'\b' + re.escape(kw) + r'\b', combined) for kw in p_kws):
                affected_ports.append(port_name)

        confidence = min(98, 60 + (max_keyword_matches * 8) + (booster_count * 4))

        return DisruptionScoringResponse(
            category=best_category,
            severity=severity,
            disruptionScore=final_score,
            freightRateElasticityPct=round(elasticity, 1),
            affectedRoutes=routes,
            affectedPorts=affected_ports or ["East Coast India"],
            recommendedAction=action,
            keySignalsDetected=signals_found,
            confidenceScorePct=confidence,
        )

disruption_engine = NlpDisruptionEngine()
