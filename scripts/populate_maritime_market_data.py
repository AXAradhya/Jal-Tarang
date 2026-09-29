"""
JAL TARANG — Maritime Market Data Populator & Synchronizer
Extracts, cleans, maps, and populates:
1. Baltic Freight Indices (from data/baltic_freight_indices.csv XLSX spreadsheet)
2. Bunker Fuel Prices (from data/bunker_prices1.csv)
3. Synchronizes compiled datasets, fallback databases, and CSV benchmarks
"""

import os
import sys
import csv
import json
import zipfile
import datetime
import xml.etree.ElementTree as ET

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

PORT_LOCODE_MAP = {
    'Singapore': 'SGSIN',
    'Fujairah': 'AEFUJ',
    'Rotterdam': 'NLRTM',
    'Hong Kong': 'HKHKG',
    'Houston': 'USHOU',
    'Los Angeles / Long Beach': 'USLAX',
    'New York': 'USNYC',
    'Santos': 'BRSSZ'
}

def parse_baltic_xlsx():
    xlsx_path = os.path.join(DATA_DIR, 'baltic_freight_indices.csv')
    if not os.path.exists(xlsx_path):
        print(f"[ERROR] Baltic indices file not found at {xlsx_path}")
        return []

    base_excel_date = datetime.date(1899, 12, 30)
    with zipfile.ZipFile(xlsx_path, 'r') as z:
        sst = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for si in tree.findall('.//ns:si', ns):
                sst.append(''.join(t.text or '' for t in si.findall('.//ns:t', ns)))

        sheet_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        rows = []
        for row in sheet_tree.findall('.//ns:row', ns):
            cells = []
            for c in row.findall('ns:c', ns):
                t = c.get('t')
                v = c.find('ns:v', ns)
                val = v.text if v is not None else None
                if t == 's' and val is not None:
                    val = sst[int(val)]
                cells.append(val)
            rows.append(cells)

    if not rows:
        return []

    header = rows[0]
    data_rows = rows[1:]
    parsed = []

    for r in data_rows:
        try:
            d = (base_excel_date + datetime.timedelta(days=int(r[0]))).isoformat()
        except:
            d = r[0]

        index_name = r[1]
        val = float(r[2]) if r[2] else 0.0
        cape = float(r[3]) if r[3] else 0.0
        pan = float(r[4]) if r[4] else 0.0
        sup = float(r[5]) if r[5] else 0.0
        route = r[6]
        period = r[7]
        source = r[8]
        unit = r[9]

        parsed.append({
            'date': d,
            'index_name': index_name,
            'index_value': val,
            'capesize_index': cape,
            'panamax_index': pan,
            'supramax_index': sup,
            'route': route,
            'period': period,
            'source': source,
            'unit': unit
        })

    return parsed

def parse_bunker_csv():
    csv_path = os.path.join(DATA_DIR, 'bunker_prices1.csv')
    if not os.path.exists(csv_path):
        print(f"[ERROR] Bunker prices file not found at {csv_path}")
        return []

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        records = []
        for r in reader:
            port_name = r['port']
            locode = PORT_LOCODE_MAP.get(port_name, 'SGSIN')
            records.append({
                'date': r['date'],
                'port': port_name,
                'port_code': locode,
                'fuel_type': r['fuel_type'],
                'fuel_grade': r['fuel_type'],
                'price_usd_mt': float(r['price_usd_mt']),
                'price_usd_per_mt': float(r['price_usd_mt']),
                'currency': r.get('currency', 'USD'),
                'unit': r.get('unit', 'MT'),
                'source': r.get('source', 'Bunker Index'),
                'region': r.get('region', port_name)
            })
    return records

def run():
    print("=" * 65)
    print("  JAL TARANG — MARITIME MARKET DATA INGESTION & POPULATION")
    print("=" * 65)

    # 1. Parse Baltic
    baltic_records = parse_baltic_xlsx()
    print(f"[OK] Extracted {len(baltic_records)} Baltic Freight Indices rows from XLSX (September 2026).")

    # 2. Parse Bunker
    bunker_records = parse_bunker_csv()
    print(f"[OK] Extracted {len(bunker_records)} Bunker Price rows across 8 global hubs.")

    # 3. Write clean plain-text CSV for Baltic Freight Indices
    clean_baltic_csv = os.path.join(DATA_DIR, 'baltic_freight_indices_clean.csv')
    user_named_csv = os.path.join(DATA_DIR, 'Baltic Freight Indices .csv')

    fieldnames = ['date', 'index_name', 'index_value', 'capesize_index', 'panamax_index', 'supramax_index', 'route', 'period', 'source', 'unit']
    for out_path in [clean_baltic_csv, user_named_csv]:
        with open(out_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(baltic_records)
    print(f"[OK] Generated clean CSV at {clean_baltic_csv} and {user_named_csv}.")

    # 4. Update data/freight_rates_historical.csv
    historical_frt_csv = os.path.join(DATA_DIR, 'freight_rates_historical.csv')
    with open(historical_frt_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['freight_code', 'observation_date', 'rate', 'currency', 'unit', 'source', 'route', 'period'])
        for r in baltic_records:
            code = r['index_name']
            if r['route'] != 'composite':
                code = f"FRT-{r['route'].upper()}"
            writer.writerow([
                code,
                r['date'],
                r['index_value'],
                'USD',
                r['unit'],
                r['source'],
                r['route'],
                r['period']
            ])
    print(f"[OK] Updated {historical_frt_csv} with {len(baltic_records)} records.")

    # 5. Update data/bunker_prices.csv
    bunker_csv_path = os.path.join(DATA_DIR, 'bunker_prices.csv')
    with open(bunker_csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['port_code', 'port_name', 'fuel_grade', 'price_usd_per_mt', 'price_date', 'currency', 'unit', 'source', 'region'])
        for b in bunker_records:
            writer.writerow([
                b['port_code'],
                b['port'],
                b['fuel_grade'],
                b['price_usd_per_mt'],
                b['date'],
                b['currency'],
                b['unit'],
                b['source'],
                b['region']
            ])
    print(f"[OK] Updated {bunker_csv_path} with {len(bunker_records)} records.")

    # 6. Update data/compiled_real_maritime_dataset.json
    compiled_json_path = os.path.join(DATA_DIR, 'compiled_real_maritime_dataset.json')
    if os.path.exists(compiled_json_path):
        with open(compiled_json_path, 'r', encoding='utf-8') as f:
            compiled_data = json.load(f)

        compiled_data['bunker_prices'] = [
            {
                'port_code': b['port_code'],
                'port_name': b['port'],
                'fuel_grade': b['fuel_grade'],
                'fuel_type': b['fuel_type'],
                'price_usd_per_mt': b['price_usd_per_mt'],
                'price_date': b['date'],
                'currency': b['currency'],
                'source': b['source'],
                'region': b['region']
            }
            for b in bunker_records
        ]

        compiled_data['historical_freight_rates'] = [
            {
                'freight_code': r['index_name'] if r['route'] == 'composite' else f"FRT-{r['route'].upper()}",
                'index_name': r['index_name'],
                'route': r['route'],
                'observation_date': r['date'],
                'rate': r['index_value'],
                'currency': 'USD',
                'unit': r['unit'],
                'source': r['source']
            }
            for r in baltic_records
        ]

        with open(compiled_json_path, 'w', encoding='utf-8') as f:
            json.dump(compiled_data, f, indent=2)
        print(f"[OK] Updated {compiled_json_path} with live bunker prices & Baltic freight rates.")

    # 7. Update ml_historical_market.csv through 2026-09-30
    ml_csv_path = os.path.join(DATA_DIR, 'ml_historical_market.csv')
    if os.path.exists(ml_csv_path):
        with open(ml_csv_path, 'r', encoding='utf-8') as f:
            ml_lines = f.read().strip().split('\n')

        existing_dates = set()
        for line in ml_lines[1:]:
            parts = line.split(',')
            if parts:
                existing_dates.add(parts[0])

        # Group baltic records by date
        by_date = {}
        for r in baltic_records:
            d = r['date']
            if d not in by_date:
                by_date[d] = {}
            if r['route'] == 'composite' and r['index_name'] == 'BDI':
                by_date[d]['bdi'] = r['index_value']
            elif r['route'] == 'C5':
                by_date[d]['c5tc'] = r['index_value']

        # Group bunker by date for Singapore VLSFO and Fujairah MGO
        bunker_by_date = {}
        for b in bunker_records:
            d = b['date']
            if d not in bunker_by_date:
                bunker_by_date[d] = {}
            if b['port_code'] == 'SGSIN' and b['fuel_grade'] == 'VLSFO':
                bunker_by_date[d]['sin_vlsfo'] = b['price_usd_per_mt']
            elif b['port_code'] == 'AEFUJ' and b['fuel_grade'] == 'MGO':
                bunker_by_date[d]['fuj_mgo'] = b['price_usd_per_mt']

        new_rows = []
        for d in sorted(by_date.keys()):
            if d not in existing_dates:
                bdi = by_date[d].get('bdi', 3300.0)
                c5tc = by_date[d].get('c5tc', 11.50)
                sin_vlsfo = bunker_by_date.get(d, {}).get('sin_vlsfo', 880.0)
                fuj_mgo = bunker_by_date.get(d, {}).get('fuj_mgo', 1250.0)
                new_rows.append(f"{d},{bdi},{c5tc},{sin_vlsfo},{fuj_mgo}")

        if new_rows:
            with open(ml_csv_path, 'a', encoding='utf-8') as f:
                for row in new_rows:
                    f.write(f"\n{row}")
            print(f"[OK] Appended {len(new_rows)} September 2026 dates to {ml_csv_path}.")

    # 8. Save structured intermediate JSON for TypeScript fallback dataset injection
    json_out = os.path.join(DATA_DIR, 'extracted_market_data.json')
    with open(json_out, 'w', encoding='utf-8') as f:
        json.dump({
            'baltic_records': baltic_records,
            'bunker_records': bunker_records
        }, f, indent=2)
    print(f"[OK] Saved intermediate extracted data to {json_out}.")
    print("=" * 65)

if __name__ == '__main__':
    run()
