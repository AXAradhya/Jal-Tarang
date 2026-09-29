import numpy as np
import pandas as pd
from typing import Dict, List, Tuple

FEATURE_COLUMNS = [
    # Freight Rate Historical Dynamics
    "rate_lag_1d",
    "rate_lag_7d",
    "rate_lag_14d",
    "rate_lag_30d",
    "rolling_mean_7d",
    "rolling_mean_30d",
    "rolling_std_7d",
    "rolling_std_30d",
    "rate_momentum_7d",
    "rate_momentum_14d",
    # Bunker Fuel & Energy Drivers
    "bunker_vlsfo_singapore",
    "bunker_vlsfo_paradip",
    "bunker_price_change_7d",
    # Vessel Supply & Tonnage Dynamics
    "ballast_vessel_count",
    "fleet_dwt_utilization",
    "ton_mile_demand_index",
    # Port & Supply Chain Congestion
    "port_wait_hours_paradip",
    "port_wait_hours_vizag",
    "berth_occupancy_ratio",
    # Weather & Ocean Conditions
    "wave_height_bay_of_bengal",
    "cyclone_alert_index",
    # Macro & Commodity Factors
    "bdi_index",
    "coking_coal_fob_australia",
    "china_steel_pmi",
]

def engineer_features_from_history(df_rates: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms raw observation time-series into rich multi-horizon features.
    Expects df_rates to have columns: ['date', 'rate'] sorted chronologically.
    """
    df = df_rates.copy()
    df = df.sort_values("date").reset_index(drop=True)

    # Historical Lags
    df["rate_lag_1d"] = df["rate"].shift(1)
    df["rate_lag_7d"] = df["rate"].shift(7)
    df["rate_lag_14d"] = df["rate"].shift(14)
    df["rate_lag_30d"] = df["rate"].shift(30)

    # Rolling Statistics
    df["rolling_mean_7d"] = df["rate"].rolling(window=7, min_periods=1).mean()
    df["rolling_mean_30d"] = df["rate"].rolling(window=30, min_periods=1).mean()
    df["rolling_std_7d"] = df["rate"].rolling(window=7, min_periods=1).std().fillna(0.2)
    df["rolling_std_30d"] = df["rate"].rolling(window=30, min_periods=1).std().fillna(0.5)

    # Momentum
    df["rate_momentum_7d"] = (df["rate"] - df["rate_lag_7d"]).fillna(0.0)
    df["rate_momentum_14d"] = (df["rate"] - df["rate_lag_14d"]).fillna(0.0)

    # Synthetic but realistic exogenous features if not present in input
    n = len(df)
    if "bunker_vlsfo_singapore" not in df.columns:
        # Base VLSFO price around $620/MT with small random walk
        rng = np.random.RandomState(42)
        vlsfo = 620.0 + np.cumsum(rng.normal(0, 3.5, n))
        df["bunker_vlsfo_singapore"] = vlsfo
        df["bunker_vlsfo_paradip"] = vlsfo + 24.0
        df["bunker_price_change_7d"] = pd.Series(vlsfo).diff(7).fillna(0.0).values

    if "ballast_vessel_count" not in df.columns:
        rng = np.random.RandomState(43)
        df["ballast_vessel_count"] = 14 + rng.randint(-3, 4, n)
        df["fleet_dwt_utilization"] = np.clip(0.88 + rng.normal(0, 0.02, n), 0.75, 0.98)
        df["ton_mile_demand_index"] = 100.0 + np.cumsum(rng.normal(0, 0.4, n))

    if "port_wait_hours_paradip" not in df.columns:
        rng = np.random.RandomState(44)
        df["port_wait_hours_paradip"] = np.clip(18.0 + rng.normal(0, 4.0, n), 6.0, 60.0)
        df["port_wait_hours_vizag"] = np.clip(12.0 + rng.normal(0, 3.0, n), 4.0, 40.0)
        df["berth_occupancy_ratio"] = np.clip(0.78 + rng.normal(0, 0.05, n), 0.5, 0.98)

    if "wave_height_bay_of_bengal" not in df.columns:
        rng = np.random.RandomState(45)
        df["wave_height_bay_of_bengal"] = np.clip(2.2 + rng.normal(0, 0.6, n), 0.8, 5.5)
        df["cyclone_alert_index"] = rng.choice([0.0, 0.0, 0.0, 1.0, 2.0], n)

    if "bdi_index" not in df.columns:
        rng = np.random.RandomState(46)
        df["bdi_index"] = 1850.0 + np.cumsum(rng.normal(0, 15.0, n))
        df["coking_coal_fob_australia"] = 245.0 + np.cumsum(rng.normal(0, 1.2, n))
        df["china_steel_pmi"] = np.clip(50.4 + rng.normal(0, 0.8, n), 47.0, 54.0)

    # Forward fill and backfill any NaNs
    df = df.bfill().ffill()
    return df

def generate_default_feature_vector(freight_code: str, base_rate: float = 12.50) -> Dict[str, float]:
    """
    Produces a feature dictionary representing current market conditions for a route.
    """
    is_capesize = "C5" in freight_code or "C3" in freight_code or "CAPE" in freight_code
    is_panamax = "P1" in freight_code or "PMX" in freight_code

    if is_capesize:
        base = base_rate if base_rate > 0 else 11.85
    elif is_panamax:
        base = base_rate if base_rate > 0 else 14.20
    else:
        base = base_rate if base_rate > 0 else 13.00

    return {
        "rate_lag_1d": round(base * 0.995, 2),
        "rate_lag_7d": round(base * 0.978, 2),
        "rate_lag_14d": round(base * 0.965, 2),
        "rate_lag_30d": round(base * 0.940, 2),
        "rolling_mean_7d": round(base * 0.985, 2),
        "rolling_mean_30d": round(base * 0.960, 2),
        "rolling_std_7d": 0.28,
        "rolling_std_30d": 0.54,
        "rate_momentum_7d": round(base * 0.022, 2),
        "rate_momentum_14d": round(base * 0.035, 2),
        "bunker_vlsfo_singapore": 618.5,
        "bunker_vlsfo_paradip": 642.0,
        "bunker_price_change_7d": 8.5,
        "ballast_vessel_count": 14.0 if is_capesize else 18.0,
        "fleet_dwt_utilization": 0.89,
        "ton_mile_demand_index": 104.2,
        "port_wait_hours_paradip": 18.5,
        "port_wait_hours_vizag": 12.0,
        "berth_occupancy_ratio": 0.82,
        "wave_height_bay_of_bengal": 2.4,
        "cyclone_alert_index": 1.0,
        "bdi_index": 1945.0,
        "coking_coal_fob_australia": 252.0,
        "china_steel_pmi": 50.8,
    }
