"""
SAGAR DRISHTI — NLP Disruption Sentiment API Router
"""

from typing import List
from fastapi import APIRouter
from ..services.nlp_sentiment import (
    disruption_engine,
    DisruptionScoringRequest,
    DisruptionScoringResponse,
)

router = APIRouter()

PRELOADED_DISRUPTIONS = [
    {
        "headline": "Red Sea drone incursions intensify near Bab-el-Mandeb; bulk carriers divert via Cape of Good Hope",
        "bodyText": "Maritime security agencies advise commercial dry bulk fleet to avoid Southern Red Sea approaches. War risk insurance premiums surge 40%.",
        "source": "Lloyd's List Intelligence",
        "publishedDate": "2026-09-26T18:00:00Z"
    },
    {
        "headline": "Severe tropical depression forms in Bay of Bengal; Paradip and Dhamra outer anchorage pilotage suspended",
        "bodyText": "India Meteorological Department (IMD) issues orange cyclone alert with gale force winds and 3.8m swell waves across Odisha coast.",
        "source": "IMD Marine Weather Bulletin",
        "publishedDate": "2026-09-27T04:30:00Z"
    },
    {
        "headline": "Australian CFMEU & Maritime Union announce 48-hour rolling tugboat strike at Hay Point and Dalrymple Bay",
        "bodyText": "Tug operators reject enterprise bargaining agreement. 18 Capesize coal loaders face berthing delays at Queensland coal terminals.",
        "source": "TradeWinds Global Maritime",
        "publishedDate": "2026-09-26T12:00:00Z"
    },
    {
        "headline": "Syama Prasad Mookerjee Port Kolkata hydrographic survey reports Balari bar siltation post-monsoon",
        "bodyText": "Permissible draft reduced to 7.8m until capital dredging cutter-suction dredgers clear Auckland and Balari shoals.",
        "source": "SMP Kolkata Marine Department",
        "publishedDate": "2026-09-25T09:00:00Z"
    }
]

@router.post("/nlp/score", response_model=DisruptionScoringResponse)
async def score_disruption_text(req: DisruptionScoringRequest):
    return disruption_engine.analyze_text(req.headline, req.bodyText or "")

@router.get("/nlp/active-disruptions", response_model=List[DisruptionScoringResponse])
async def get_active_disruptions():
    results = []
    for item in PRELOADED_DISRUPTIONS:
        res = disruption_engine.analyze_text(item["headline"], item["bodyText"])
        results.append(res)
    return results
