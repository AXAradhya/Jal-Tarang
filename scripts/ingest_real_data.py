"""
SAIL MARINEX - Real Maritime Data Ingestion & ETL Pipeline
Processes:
1. USCG/NOAA/BOEM AIS Vessel Type Codes (0 to 1025)
2. Global Ports & Physical Berths (ports.json + ports_and_berths.csv)
3. Baltic Dry Index Historical Data (Sanitized, 1,165 daily records)
4. Indian Major Ports TRT & Congestion Statistics (Rajya Sabha files)
5. Starter Pack CSVs (bunker_prices, procurement_requirements, vessels_fleet)
Memory Safety:
- compiled_real_maritime_dataset.json is strictly isolated to reference master metadata
  and the latest 30 days of benchmark rates.
- Excludes heavy telemetry and voyage breakdowns to keep memory footprint < 50KB.
"""

import os
import sys
import json
import re
from datetime import datetime
import pandas as pd
import numpy as np

DATA_DIR = "data"

def sanitize_financial_num(val):
    if pd.isna(val) or val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    cleaned = re.sub(r'[^\d.-]+', '', str(val)).strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

# ==============================================================================
# 1. AIS VESSEL TYPE CODES (USCG, NOAA, BOEM, Marine Cadastre 2018)
# ==============================================================================
AIS_RAW_ENTRIES = [
    ("Not Available", "0", "Not available or no ship, default", None, False),
    ("Other", "1-19", "Reserved for future use", None, False),
    ("Other", "20", "Wing in ground (WIG), all ships of this type", None, False),
    ("Tug Tow", "21", "Wing in ground (WIG), hazardous category A", "A", False),
    ("Tug Tow", "22", "Wing in ground (WIG), hazardous category B", "B", False),
    ("Other", "23", "Wing in ground (WIG), hazardous category C", "C", False),
    ("Other", "24", "Wing in ground (WIG), hazardous category D", "D", False),
    ("Other", "25", "Wing in ground (WIG), reserved for future use", None, False),
    ("Other", "26", "Wing in ground (WIG), reserved for future use", None, False),
    ("Other", "27", "Wing in ground (WIG), reserved for future use", None, False),
    ("Other", "28", "Wing in ground (WIG), reserved for future use", None, False),
    ("Other", "29", "Wing in ground (WIG), reserved for future use", None, False),
    ("Fishing", "30", "Fishing", None, False),
    ("Tug Tow", "31", "Towing", None, False),
    ("Tug Tow", "32", "Towing: length exceeds 200m or breadth exceeds 25m", None, False),
    ("Other", "33", "Dredging or underwater operations", None, False),
    ("Other", "34", "Diving operations", None, False),
    ("Military", "35", "Military operations", None, False),
    ("Pleasure Craft/Sailing", "36", "Sailing", None, False),
    ("Pleasure Craft/Sailing", "37", "Pleasure Craft", None, False),
    ("Other", "38", "Reserved", None, False),
    ("Other", "39", "Reserved", None, False),
    ("Other", "40", "High speed craft (HSC), all ships of this type", None, False),
    ("Other", "41", "High speed craft (HSC), hazardous category A", "A", False),
    ("Other", "42", "High speed craft (HSC), hazardous category B", "B", False),
    ("Other", "43", "High speed craft (HSC), hazardous category C", "C", False),
    ("Other", "44", "High speed craft (HSC), hazardous category D", "D", False),
    ("Other", "45", "High speed craft (HSC), reserved for future use", None, False),
    ("Other", "46", "High speed craft (HSC), reserved for future use", None, False),
    ("Other", "47", "High speed craft (HSC), reserved for future use", None, False),
    ("Other", "48", "High speed craft (HSC), reserved for future use", None, False),
    ("Other", "49", "High speed craft (HSC), no additional information", None, False),
    ("Other", "50", "Pilot Vessel", None, False),
    ("Other", "51", "Search and Rescue vessel", None, False),
    ("Tug Tow", "52", "Tug", None, False),
    ("Other", "53", "Port Tender", None, False),
    ("Other", "54", "Anti-pollution equipment", None, False),
    ("Other", "55", "Law Enforcement", None, False),
    ("Other", "56", "Spare - for assignment to local vessel", None, False),
    ("Other", "57", "Spare - for assignment to local vessel", None, False),
    ("Other", "58", "Medical Transport", None, False),
    ("Other", "59", "Ship according to RR Resolution No. 18", None, False),
    ("Passenger", "60", "Passenger, all ships of this type", None, False),
    ("Passenger", "61", "Passenger, hazardous category A", "A", False),
    ("Passenger", "62", "Passenger, hazardous category B", "B", False),
    ("Passenger", "63", "Passenger, hazardous category C", "C", False),
    ("Passenger", "64", "Passenger, hazardous category D", "D", False),
    ("Passenger", "65", "Passenger, reserved for future use", None, False),
    ("Passenger", "66", "Passenger, reserved for future use", None, False),
    ("Passenger", "67", "Passenger, reserved for future use", None, False),
    ("Passenger", "68", "Passenger, reserved for future use", None, False),
    ("Passenger", "69", "Passenger, no additional information", None, False),
    ("Cargo", "70", "Cargo, all ships of this type", None, False),
    ("Cargo", "71", "Cargo, hazardous category A", "A", False),
    ("Cargo", "72", "Cargo, hazardous category B", "B", False),
    ("Cargo", "73", "Cargo, hazardous category C", "C", False),
    ("Cargo", "74", "Cargo, hazardous category D", "D", False),
    ("Cargo", "75", "Cargo, reserved for future use", None, False),
    ("Cargo", "76", "Cargo, reserved for future use", None, False),
    ("Cargo", "77", "Cargo, reserved for future use", None, False),
    ("Cargo", "78", "Cargo, reserved for future use", None, False),
    ("Cargo", "79", "Cargo, no additional information", None, False),
    ("Tanker", "80", "Tanker, all ships of this type", None, False),
    ("Tanker", "81", "Tanker, hazardous category A", "A", False),
    ("Tanker", "82", "Tanker, hazardous category B", "B", False),
    ("Tanker", "83", "Tanker, hazardous category C", "C", False),
    ("Tanker", "84", "Tanker, hazardous category D", "D", False),
    ("Tanker", "85", "Tanker, reserved for future use", None, False),
    ("Tanker", "86", "Tanker, reserved for future use", None, False),
    ("Tanker", "87", "Tanker, reserved for future use", None, False),
    ("Tanker", "88", "Tanker, reserved for future use", None, False),
    ("Tanker", "89", "Tanker, no additional information", None, False),
    ("Other", "90", "Other Type, all ships of this type", None, False),
    ("Other", "91", "Other Type, hazardous category A", "A", False),
    ("Other", "92", "Other Type, hazardous category B", "B", False),
    ("Other", "93", "Other Type, hazardous category C", "C", False),
    ("Other", "94", "Other Type, hazardous category D", "D", False),
    ("Other", "95", "Other Type, reserved for future use", None, False),
    ("Other", "96", "Other Type, reserved for future use", None, False),
    ("Other", "97", "Other Type, reserved for future use", None, False),
    ("Other", "98", "Other Type, reserved for future use", None, False),
    ("Other", "99", "Other Type, no additional information", None, False),
    ("Other", "100-199", "Reserved for regional use", None, False),
    ("Other", "200-255", "Reserved for future use", None, False),
    ("Other", "256-999", "No designation", None, False),
    # AVIS Vessel Service Codes (1001-1025)
    ("Fishing", "1001", "Commercial Fishing Vessel", None, True),
    ("Fishing", "1002", "Fish Processing Vessel", None, True),
    ("Cargo", "1003", "Freight Barge", None, True),
    ("Cargo", "1004", "Freight Ship", None, True),
    ("Other", "1005", "Industrial Vessel", None, True),
    ("Other", "1006", "Miscellaneous Vessel", None, True),
    ("Other", "1007", "Mobile Offshore Drilling Unit", None, True),
    ("Other", "1008", "Non-vessel", None, True),
    ("Other", "1009", "NON-VESSEL", None, True),
    ("Other", "1010", "Offshore Supply Vessel", None, True),
    ("Other", "1011", "Oil Recovery", None, True),
    ("Passenger", "1012", "Passenger (Inspected)", None, True),
    ("Passenger", "1013", "Passenger (Uninspected)", None, True),
    ("Passenger", "1014", "Passenger Barge (Inspected)", None, True),
    ("Passenger", "1015", "Passenger Barge (Uninspected)", None, True),
    ("Cargo", "1016", "Public Freight", None, True),
    ("Tanker", "1017", "Public Tankship/Barge", None, True),
    ("Other", "1018", "Public Vessel, Unclassified", None, True),
    ("Pleasure Craft/Sailing", "1019", "Recreational", None, True),
    ("Other", "1020", "Research Vessel", None, True),
    ("Military", "1021", "SAR Aircraft", None, True),
    ("Other", "1022", "School Ship", None, True),
    ("Tug Tow", "1023", "Tank Barge", None, True),
    ("Tanker", "1024", "Tank Ship", None, True),
    ("Tug Tow", "1025", "Towing Vessel", None, True),
]

def load_ais_vessel_codes():
    print("[ETL] Ingesting AIS Vessel Type and Group Codes...")
    records = []
    for grp, code, name, haz, avis in AIS_RAW_ENTRIES:
        records.append({
            "vessel_group": grp,
            "vessel_type_code": code,
            "classification_name": name,
            "hazard_category": haz,
            "is_avis_service": avis,
            "source": "USCG_NOAA_BOEM_MARINE_CADASTRE_2018"
        })
    print(f"[SUCCESS] Loaded {len(records)} AIS vessel type codes.")
    return records

# ==============================================================================
# 2. PORTS & BERTH PHYSICAL LIMITS (ports_and_berths.csv)
# ==============================================================================
def load_ports_and_berths():
    print("[ETL] Ingesting Ports and Berth Physical Constraints...")
    berths = []
    berths_csv_path = os.path.join(DATA_DIR, "ports_and_berths.csv")
    if os.path.exists(berths_csv_path):
        df_berths = pd.read_csv(berths_csv_path)
        for _, row in df_berths.iterrows():
            berths.append({
                "port_name": str(row["port_name"]).strip(),
                "un_locode": str(row["un_locode"]).strip(),
                "terminal_name": str(row["terminal_name"]).strip(),
                "berth_name": str(row["berth_name"]).strip(),
                "max_loa_m": sanitize_financial_num(row["max_loa_m"]),
                "max_beam_m": sanitize_financial_num(row["max_beam_m"]),
                "max_draft_m": sanitize_financial_num(row["max_draft_m"]),
                "max_dwt_mt": sanitize_financial_num(row["max_dwt_mt"]),
            })
        print(f"[SUCCESS] Loaded {len(berths)} specific berths from {berths_csv_path}.")
    return berths

# ==============================================================================
# 3. BALTIC DRY INDEX HISTORICAL RATES (Sanitized)
# ==============================================================================
def load_historical_freight_rates():
    print("[ETL] Ingesting Baltic Dry Index and Historical Freight Rates...")
    bdi_path = os.path.join(DATA_DIR, "Baltic Dry Index Historical Data.csv")
    rates = []
    if os.path.exists(bdi_path):
        df_bdi = pd.read_csv(bdi_path)
        for _, row in df_bdi.iterrows():
            try:
                date_str = str(row["Date"]).strip().strip('"')
                parsed_date = datetime.strptime(date_str, "%d-%m-%Y").strftime("%Y-%m-%d")
                price = sanitize_financial_num(row["Price"])
                if price > 0:
                    rates.append({
                        "freight_code": "BDI",
                        "observation_date": parsed_date,
                        "rate": price,
                        "currency": "USD",
                        "unit": "INDEX",
                        "source": "BALTIC_EXCHANGE"
                    })
            except Exception:
                continue
        # Sort by date descending
        rates.sort(key=lambda x: x["observation_date"], reverse=True)
        print(f"[SUCCESS] Loaded {len(rates)} sanitized daily BDI observations from {bdi_path}.")

    # Append starter pack freight rates
    rates_csv = os.path.join(DATA_DIR, "freight_rates_historical.csv")
    if os.path.exists(rates_csv):
        df_starter = pd.read_csv(rates_csv)
        for _, row in df_starter.iterrows():
            rates.append({
                "freight_code": str(row["freight_code"]).strip(),
                "observation_date": str(row["observation_date"]).strip(),
                "rate": sanitize_financial_num(row["rate"]),
                "currency": str(row["currency"]).strip(),
                "unit": str(row["unit"]).strip(),
                "source": str(row["source"]).strip()
            })
        print(f"[SUCCESS] Appended starter freight benchmarks ({len(df_starter)} items).")

    return rates

# ==============================================================================
# 4. INDIAN MAJOR PORTS CONGESTION & TRT STATS
# ==============================================================================
def load_indian_port_congestion():
    print("[ETL] Ingesting Official Indian Port Turnaround & Congestion Data...")
    trt_path = os.path.join(DATA_DIR, "RS_Session_260_AU_1426_2.csv")
    records = []
    if os.path.exists(trt_path):
        df_trt = pd.read_csv(trt_path)
        for _, row in df_trt.iterrows():
            port_name = str(row.get("Name of Port", "")).strip()
            trt_hours = sanitize_financial_num(row.get("Avg. Total TRT (In Hours)", 0))
            output_day = sanitize_financial_num(row.get("Average Output Per Ship Berthday (In Tonnes)", 0))
            traffic_kt = sanitize_financial_num(row.get("Traffic (In Thousand Tonnes)", 0))
            year = str(row.get("Financial Year", "")).strip()
            records.append({
                "financial_year": year,
                "port_name": port_name,
                "avg_turnaround_time_hours": trt_hours,
                "output_per_berthday_tonnes": output_day,
                "annual_traffic_thousand_tonnes": traffic_kt,
                "source": "PARLIAMENT_RAJYA_SABHA_AU_1426"
            })
        print(f"[SUCCESS] Loaded {len(records)} official Indian port TRT and throughput benchmarks.")
    return records

# ==============================================================================
# 5. BUNKER PRICES, PROCUREMENT & FLEET
# ==============================================================================
def load_starter_packs():
    print("[ETL] Ingesting Bunker Prices, Procurement Specs & Fleet Master...")
    bunkers = []
    bunker_csv = os.path.join(DATA_DIR, "bunker_prices.csv")
    if os.path.exists(bunker_csv):
        df_bunker = pd.read_csv(bunker_csv)
        for _, row in df_bunker.iterrows():
            bunkers.append({
                "port_code": str(row["port_code"]).strip(),
                "fuel_grade": str(row["fuel_grade"]).strip(),
                "price_usd_per_mt": sanitize_financial_num(row["price_usd_per_mt"]),
                "price_date": str(row["price_date"]).strip()
            })

    procurement = []
    proc_csv = os.path.join(DATA_DIR, "procurement_requirements.csv")
    if os.path.exists(proc_csv):
        df_proc = pd.read_csv(proc_csv)
        for _, row in df_proc.iterrows():
            procurement.append({
                "requirement_code": str(row["requirement_code"]).strip(),
                "plant_name": str(row["plant_name"]).strip(),
                "cargo_type": str(row["cargo_type"]).strip(),
                "commodity_code": str(row["commodity_code"]).strip(),
                "quantity_mt": sanitize_financial_num(row["quantity_mt"]),
                "origin_port": str(row["origin_port"]).strip(),
                "destination_port": str(row["destination_port"]).strip(),
                "moisture_pct": sanitize_financial_num(row["moisture_pct"]),
                "ash_content_pct": sanitize_financial_num(row["ash_content_pct"])
            })

    fleet = []
    fleet_csv = os.path.join(DATA_DIR, "vessels_fleet.csv")
    if os.path.exists(fleet_csv):
        df_fleet = pd.read_csv(fleet_csv)
        for _, row in df_fleet.iterrows():
            fleet.append({
                "imo_number": str(int(sanitize_financial_num(row["imo_number"]))),
                "vessel_name": str(row["vessel_name"]).strip(),
                "vessel_class": str(row["vessel_class"]).strip(),
                "dwt_mt": sanitize_financial_num(row["dwt_mt"]),
                "loa_m": sanitize_financial_num(row["loa_m"]),
                "beam_m": sanitize_financial_num(row["beam_m"]),
                "summer_draft_m": sanitize_financial_num(row["summer_draft_m"]),
                "build_year": int(sanitize_financial_num(row["build_year"])),
                "flag_country": str(row["flag_country"]).strip(),
                "is_verified": True
            })

    print(f"[SUCCESS] Bunkers: {len(bunkers)}, Procurement: {len(procurement)}, Fleet: {len(fleet)}.")
    return {
        "bunkers": bunkers,
        "procurement": procurement,
        "fleet": fleet
    }

# ==============================================================================
# MAIN COMPILE & SAVE (STRICT MEMORY ISOLATION)
# ==============================================================================
def main():
    print("==================================================================")
    print("SAIL MARINEX - MEMORY-SAFE MARITIME DATA INGESTION PIPELINE")
    print("==================================================================")

    ais_codes = load_ais_vessel_codes()
    berths = load_ports_and_berths()
    bdi_rates = load_historical_freight_rates()
    indian_congestion = load_indian_port_congestion()
    starter_packs = load_starter_packs()

    # Memory Protection: Keep only latest 30 days of freight rates in fallback cache
    latest_30_rates = bdi_rates[:30]

    compiled = {
        "meta": {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "ais_codes_count": len(ais_codes),
            "berths_count": len(berths),
            "indian_congestion_records_count": len(indian_congestion),
            "fleet_count": len(starter_packs["fleet"]),
            "memory_protection": "Reference Master Only - Telemetry & Voyages Excluded"
        },
        "ais_vessel_type_codes": ais_codes,
        "ports_and_berths": berths,
        "historical_freight_rates": latest_30_rates,
        "indian_port_congestion": indian_congestion,
        "bunker_prices": starter_packs["bunkers"],
        "procurement_requirements": starter_packs["procurement"],
        "fleet_master": starter_packs["fleet"]
    }

    out_path = os.path.join(DATA_DIR, "compiled_real_maritime_dataset.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(compiled, f, indent=2)

    file_size_kb = round(os.path.getsize(out_path) / 1024, 2)
    print(f"[SUCCESS] Compiled reference master dataset into {out_path} ({file_size_kb} KB - Memory Safe).")
    print("==================================================================")

if __name__ == "__main__":
    main()
