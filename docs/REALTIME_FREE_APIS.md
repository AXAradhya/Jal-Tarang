# REAL-TIME FREE MARITIME & COMMODITY DATA APIS
## SAGAR DRISHTI - SIH Problem Statement 26006

This document lists **100% free, developer-accessible, real-time and near-real-time data APIs** for live tracking, port weather, freight rates, commodity prices, currency, and economic indicators.

---

### 1. Real-Time Vessel AIS & Tracking (Free Tier Available)
| Service / API | Access / Free Tier | What it Provides | Endpoint / Docs |
|---|---|---|---|
| **AISStream.io** | **100% Free** (Open Community WebSocket) | Live real-time worldwide AIS messages directly streamed (MMSI, lat, lon, SOG, COG, destination, draught). | `wss://stream.aisstream.io/v0/stream` |
| **Barentswatch AIS** | Free (Registration required) | Official governmental AIS data feed for commercial vessels. | `barentswatch.no/api` |
| **MarineTraffic / VesselFinder** | Free developer trial / scraping endpoints | Port calls, arrivals, expected vessel queues, waiting times. | `marinetraffic.com/en/ais-api-services` |

---

### 2. Port Weather, Waves, Swell & Cyclone Warnings (Free & No API Key Needed)
| Service / API | Access / Free Tier | What it Provides | Endpoint / Docs |
|---|---|---|---|
| **Open-Meteo Marine API** | **100% Free** (No API Key Required!) | Hourly wave height, wave direction, wave period, ocean wind speed, swell waves for Paradip, Vizag, Dhamra, Haldia. | `https://marine-api.open-meteo.com/v1/marine?latitude=20.26&longitude=86.67&hourly=wave_height,wave_direction,wind_wave_height` |
| **Open-Meteo Weather API** | **100% Free** (No API Key Required!) | Real-time port temperature, atmospheric pressure, wind gusts, precipitation. | `https://api.open-meteo.com/v1/forecast?latitude=17.68&longitude=83.21&hourly=temperature_2m,wind_speed_10m` |
| **NOAA / National Weather Service** | **100% Free Public Domain** | Worldwide oceanic storm warnings, tropical cyclone forecasts for Indian Ocean / Bay of Bengal. | `https://api.weather.gov/` |

---

### 3. Commodity Prices & Energy (Coal, Iron Ore, Crude, Gas)
| Service / API | Access / Free Tier | What it Provides | Endpoint / Docs |
|---|---|---|---|
| **US Energy Information Administration (EIA v2)** | **Free Official API** (Unlimited free key) | Weekly & monthly historical and live coal prices, diesel/bunker fuel benchmarks. | `https://api.eia.gov/v2/coal/` |
| **World Bank Commodity Price Data (Pink Sheet API)** | **100% Free & Open** | Monthly global benchmark prices for Iron Ore (62% Fe CFR China), Australian Coking Coal, Thermal Coal. | `https://api.worldbank.org/v2/en/indicator/` |
| **IMF Primary Commodity Prices** | **Free Public API** | Iron ore, metallurgical coal, natural gas, aluminum/bauxite indices. | `https://data.imf.org/` |
| **FRED (Federal Reserve Bank of St. Louis)** | **Free API Key** | Global price of coal (`PCOALAUUSDM`), iron ore (`PIORECRUSDM`), freight transport indices. | `https://api.stlouisfed.org/fred/series/observations?series_id=PCOALAUUSDM` |

---

### 4. Real-Time Foreign Exchange (USD to INR, EUR, AUD)
| Service / API | Access / Free Tier | What it Provides | Endpoint / Docs |
|---|---|---|---|
| **ExchangeRate-API** | **Free 1,500 requests/month** | Real-time spot rates for USD $\leftrightarrow$ INR, AUD, EUR (crucial for landed cost calculation in steel plants). | `https://open.er-api.com/v6/latest/USD` |
| **Frankfurter API (ECB)** | **100% Free, No Key Required** | Official European Central Bank daily reference exchange rates. | `https://api.frankfurter.app/latest?from=USD&to=INR` |

---

### 5. Macroeconomic, Steel Production & Trade Volumes
| Service / API | Access / Free Tier | What it Provides | Endpoint / Docs |
|---|---|---|---|
| **World Steel Association / OECD Data** | Free Public Datasets | Monthly steel production figures, coking coal consumption demand. | `https://stats.oecd.org/` |
| **UN Comtrade API** | **Free Tier** (500 calls/day) | Real bilateral import/export trade volumes (e.g. Australia metallurgical coal to India). | `https://comtradeapi.un.org/` |
| **RBI DBIE (Reserve Bank of India)** | Open Government Data India | Trade balance, shipping freight outward remittances, import tariffs. | `https://data.gov.in/` |

---

### 6. Live Ingestion Integration in SAGAR DRISHTI

Our database architecture provides tables to stream these feeds directly:
- `live_vessel_telemetry`: Target table for **AISStream.io** websocket points.
- `live_port_weather_feed`: Target table for **Open-Meteo Marine API** queries.
- `freight_rates`: Target table for daily **FRED / Exchange / Platts-derived** freight indices.
- `currency_rates`: Target table for **Frankfurter / ExchangeRate-API**.
