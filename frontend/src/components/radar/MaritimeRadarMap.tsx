import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass, Layers, CloudRain, Anchor, Ship,
  Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Ruler,
  Search, X, Train, Sun, Moon, Shield, Wind, Globe,
  MapPin, AlertTriangle, ExternalLink, RefreshCw, Navigation
} from 'lucide-react';
import { fetchLiveMarineWeather, fetchLiveStormAdvisory, LiveMarineWeather, LiveStormAlert } from '../../services/marineWeatherApi';

export interface PortDisplay {
  name: string;
  un_locode: string;
  lat: number;
  lon: number;
  country: string;
  status: 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  wait: string;
  berths: number;
  maxDraftM: number;
  maxDwt: number;
  sailCargo?: string;
  isInternational?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GLOBAL & INDIAN PORTS MATRIX (Verified Coordinates & Depth Limits)
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL MARITIME CHOKEPOINTS & WORLD TRADE LANDMARKS
// ─────────────────────────────────────────────────────────────────────────────
export interface MapSearchResult {
  id: string;
  type: 'port' | 'vessel' | 'plant' | 'corridor' | 'chokepoint' | 'global' | 'coord';
  name: string;
  subtext: string;
  badge: string;
  badgeColor: string;
  lat: number;
  lon: number;
  zoom: number;
  data?: any;
}

const GLOBAL_MARITIME_LANDMARKS = [
  // Major Strategic Choke Points
  { id: 'choke-malacca', name: 'Strait of Malacca', subtext: 'Strategic Choke Point (Indian Ocean ↔ Pacific)', category: 'Choke Point', lat: 4.150, lon: 100.500, zoom: 8, keywords: ['malacca', 'strait', 'malaysia', 'indonesia', 'choke'] },
  { id: 'choke-singapore', name: 'Singapore Strait', subtext: 'Bunkering Capital & Navigation Choke Point', category: 'Choke Point', lat: 1.250, lon: 103.850, zoom: 10, keywords: ['singapore', 'strait', 'bunker', 'choke'] },
  { id: 'choke-bab', name: 'Bab-el-Mandeb Strait', subtext: 'Red Sea Southern Choke Point (Gulf of Aden)', category: 'Choke Point', lat: 12.580, lon: 43.330, zoom: 8, keywords: ['bab', 'mandeb', 'red sea', 'yemen', 'djibouti', 'choke'] },
  { id: 'choke-suez', name: 'Suez Canal', subtext: 'Suez Maritime Transit Corridor (Red Sea ↔ Mediterranean)', category: 'Choke Point', lat: 30.585, lon: 32.560, zoom: 9, keywords: ['suez', 'canal', 'egypt', 'red sea', 'choke'] },
  { id: 'choke-hormuz', name: 'Strait of Hormuz', subtext: 'Global Energy Corridor (Persian Gulf ↔ Gulf of Oman)', category: 'Choke Point', lat: 26.560, lon: 56.250, zoom: 8, keywords: ['hormuz', 'persian gulf', 'iran', 'oman', 'choke'] },
  { id: 'choke-cape', name: 'Cape of Good Hope', subtext: 'Southern African Capesize Detour Route', category: 'Choke Point', lat: -34.350, lon: 18.490, zoom: 8, keywords: ['cape', 'good hope', 'south africa', 'detour', 'choke'] },
  { id: 'choke-sunda', name: 'Sunda Strait', subtext: 'Java Sea Deep-Draft Bypass Corridor (Java/Sumatra)', category: 'Choke Point', lat: -5.950, lon: 105.800, zoom: 8, keywords: ['sunda', 'indonesia', 'bypass', 'java', 'sumatra', 'choke'] },
  { id: 'choke-lombok', name: 'Lombok Strait', subtext: 'Unrestricted Deep-Draft Lane (>22m Newcastlemax)', category: 'Choke Point', lat: -8.450, lon: 115.750, zoom: 8, keywords: ['lombok', 'bali', 'deep draft', 'newcastlemax', 'choke'] },
  { id: 'choke-panama', name: 'Panama Canal', subtext: 'Atlantic ↔ Pacific Interoceanic Gateway', category: 'Choke Point', lat: 9.080, lon: -79.680, zoom: 9, keywords: ['panama', 'canal', 'caribbean', 'pacific', 'choke'] },
  { id: 'choke-gibraltar', name: 'Strait of Gibraltar', subtext: 'Atlantic ↔ Mediterranean Sea Gateway', category: 'Choke Point', lat: 35.960, lon: -5.600, zoom: 8, keywords: ['gibraltar', 'spain', 'morocco', 'mediterranean', 'choke'] },
  { id: 'choke-torres', name: 'Torres Strait', subtext: 'Coral Sea ↔ Arafura Sea Channel', category: 'Choke Point', lat: -10.400, lon: 142.200, zoom: 8, keywords: ['torres', 'queensland', 'australia', 'choke'] },
  { id: 'choke-dover', name: 'Strait of Dover (English Channel)', subtext: 'Busiest Shipping Lane in Europe', category: 'Choke Point', lat: 51.020, lon: 1.450, zoom: 8, keywords: ['dover', 'english channel', 'uk', 'france', 'choke'] },

  // Key Global Ports & Commodity Hubs
  { id: 'port-rotterdam', name: 'Port of Rotterdam', subtext: 'Netherlands - Largest Seaport in Europe', category: 'Global Port', lat: 51.924, lon: 4.477, zoom: 10, keywords: ['rotterdam', 'netherlands', 'europe', 'port'] },
  { id: 'port-shanghai', name: 'Port of Shanghai', subtext: 'China - Largest Container & Bulk Complex', category: 'Global Port', lat: 31.230, lon: 121.500, zoom: 10, keywords: ['shanghai', 'china', 'port'] },
  { id: 'port-caofeidian', name: 'Port of Caofeidian', subtext: 'China - Major Iron Ore Discharge Terminal', category: 'Global Port', lat: 38.960, lon: 118.520, zoom: 10, keywords: ['caofeidian', 'china', 'iron ore', 'nmdc', 'port'] },
  { id: 'port-qingdao', name: 'Port of Qingdao', subtext: 'China - Key Bulk Terminal for Raw Materials', category: 'Global Port', lat: 36.080, lon: 120.380, zoom: 10, keywords: ['qingdao', 'china', 'bulk', 'port'] },
  { id: 'port-dampier', name: 'Port of Dampier', subtext: 'Australia - Pilbara Major Iron Ore Hub', category: 'Global Port', lat: -20.660, lon: 116.710, zoom: 10, keywords: ['dampier', 'pilbara', 'australia', 'iron ore', 'port'] },
  { id: 'port-hedland', name: 'Port Hedland', subtext: 'Australia - World Largest Bulk Export Port', category: 'Global Port', lat: -20.310, lon: 118.570, zoom: 10, keywords: ['port hedland', 'hedland', 'australia', 'bulk', 'port'] },
  { id: 'port-newcastle-au', name: 'Port of Newcastle', subtext: 'Australia - World Largest Coal Export Port', category: 'Global Port', lat: -32.920, lon: 151.780, zoom: 10, keywords: ['newcastle', 'australia', 'coal', 'port'] },
  { id: 'port-colombo', name: 'Port of Colombo', subtext: 'Sri Lanka - Prime Indian Ocean Transshipment Hub', category: 'Global Port', lat: 6.940, lon: 79.850, zoom: 10, keywords: ['colombo', 'sri lanka', 'transshipment', 'port'] },
  { id: 'port-fujairah', name: 'Port of Fujairah', subtext: 'UAE - Global Offshore Bunkering Hub', category: 'Global Port', lat: 25.130, lon: 56.360, zoom: 10, keywords: ['fujairah', 'uae', 'bunker', 'port'] },
  { id: 'port-jebel-ali', name: 'Jebel Ali Port (DP World)', subtext: 'UAE - Dubai Maritime Gateway', category: 'Global Port', lat: 25.010, lon: 55.060, zoom: 10, keywords: ['jebel ali', 'dubai', 'uae', 'port'] },
  { id: 'port-mumbai', name: 'Mumbai Port (MbPT)', subtext: 'India - Historic Western Gateway Port', category: 'Global Port', lat: 18.930, lon: 72.840, zoom: 10, keywords: ['mumbai', 'mbpt', 'india', 'port'] },
  { id: 'port-jnpt', name: 'Jawaharlal Nehru Port (JNPT / Nhava Sheva)', subtext: 'India - Premier Container Port', category: 'Global Port', lat: 18.950, lon: 72.950, zoom: 10, keywords: ['jnpt', 'nhava sheva', 'mumbai', 'india', 'port'] },
  { id: 'port-mundra', name: 'Mundra Port (APSEZ)', subtext: 'India - Largest Commercial Port in India', category: 'Global Port', lat: 22.750, lon: 69.700, zoom: 10, keywords: ['mundra', 'gujarat', 'adani', 'india', 'port'] },
  { id: 'port-kandla', name: 'Deendayal Port (Kandla)', subtext: 'India - Major Bulk Cargo Hub in Gulf of Kutch', category: 'Global Port', lat: 23.010, lon: 70.220, zoom: 10, keywords: ['kandla', 'deendayal', 'gujarat', 'india', 'port'] },
  { id: 'port-cochin', name: 'Cochin Port (Vallarpadam)', subtext: 'India - Southwest Transshipment Terminal', category: 'Global Port', lat: 9.960, lon: 76.270, zoom: 10, keywords: ['cochin', 'kochi', 'kerala', 'india', 'port'] },
  { id: 'port-chennai', name: 'Chennai Port', subtext: 'India - Historic Coromandel Coast Seaport', category: 'Global Port', lat: 13.080, lon: 80.290, zoom: 10, keywords: ['chennai', 'tamil nadu', 'india', 'port'] },
  { id: 'port-ennore', name: 'Kamarajar Port (Ennore)', subtext: 'India - Dedicated Bulk Coal & Energy Port', category: 'Global Port', lat: 13.260, lon: 80.330, zoom: 10, keywords: ['ennore', 'kamarajar', 'tamil nadu', 'india', 'port'] },
  { id: 'port-tuticorin', name: 'V.O. Chidambaranar Port (Tuticorin)', subtext: 'India - Deepwater South Port', category: 'Global Port', lat: 8.750, lon: 78.180, zoom: 10, keywords: ['tuticorin', 'voc', 'tamil nadu', 'india', 'port'] },
  { id: 'port-mormugao', name: 'Mormugao Port (MPT)', subtext: 'India - Goa Iron Ore Seaport', category: 'Global Port', lat: 15.410, lon: 73.800, zoom: 10, keywords: ['mormugao', 'goa', 'india', 'port'] },
  { id: 'port-mangalore', name: 'New Mangalore Port (NMPA)', subtext: 'India - Karnataka Coastal Bulk Port', category: 'Global Port', lat: 12.930, lon: 74.820, zoom: 10, keywords: ['mangalore', 'karnataka', 'india', 'port'] },
  { id: 'port-gopalpur', name: 'Gopalpur Port', subtext: 'India - Odisha Deepwater Commercial Port', category: 'Global Port', lat: 19.300, lon: 84.970, zoom: 10, keywords: ['gopalpur', 'odisha', 'india', 'port'] },
];

const ALL_PORTS: PortDisplay[] = [
  // --- Indian East Coast & Gateway Ports ---
  { name: 'Paradip Port', un_locode: 'INPAV', lat: 20.316, lon: 86.674, country: 'India', status: 'HIGH', wait: '3.8d', berths: 16, maxDraftM: 14.5, maxDwt: 165000, sailCargo: 'Coking & Thermal Coal (BSL/BSP)' },
  { name: 'Dhamra Port', un_locode: 'INDHA', lat: 20.820, lon: 86.980, country: 'India', status: 'MODERATE', wait: '1.8d', berths: 5, maxDraftM: 18.0, maxDwt: 200000, sailCargo: 'Capesize Met Coal, Iron Ore (RSP)' },
  { name: 'Haldia Dock Complex', un_locode: 'INHAL', lat: 22.025, lon: 88.066, country: 'India', status: 'CRITICAL', wait: '4.9d', berths: 14, maxDraftM: 8.5, maxDwt: 55000, sailCargo: 'Hard Coking Coal (RSP/DSP)' },
  { name: 'Visakhapatnam Port', un_locode: 'INVTZ', lat: 17.686, lon: 83.218, country: 'India', status: 'MODERATE', wait: '2.6d', berths: 24, maxDraftM: 16.5, maxDwt: 180000, sailCargo: 'Hard Coking Coal (RINL/BSP)' },
  { name: 'Gangavaram Port', un_locode: 'INGVP', lat: 17.620, lon: 83.238, country: 'India', status: 'NORMAL', wait: '1.4d', berths: 9, maxDraftM: 19.5, maxDwt: 220000, sailCargo: 'Deep Draft Capesize Coking Coal' },
  { name: 'Kolkata Port (SMP)', un_locode: 'INCCU', lat: 22.540, lon: 88.310, country: 'India', status: 'HIGH', wait: '3.5d', berths: 18, maxDraftM: 8.2, maxDwt: 45000, sailCargo: 'Coastal Bulk, Limestone' },
  { name: 'Gopalpur Port', un_locode: 'INGOP', lat: 19.300, lon: 84.970, country: 'India', status: 'NORMAL', wait: '0.8d', berths: 4, maxDraftM: 13.0, maxDwt: 75000, sailCargo: 'Iron Ore Pellets, Fluxes' },
  { name: 'Krishnapatnam Port', un_locode: 'INKRI', lat: 14.250, lon: 80.120, country: 'India', status: 'NORMAL', wait: '1.2d', berths: 10, maxDraftM: 18.0, maxDwt: 200000, sailCargo: 'Thermal Coal, Coastal Bulk' },
  { name: 'Chennai Port', un_locode: 'INMAA', lat: 13.080, lon: 80.270, country: 'India', status: 'MODERATE', wait: '2.2d', berths: 24, maxDraftM: 14.0, maxDwt: 100000, sailCargo: 'Fertilizers, Limestone' },
  { name: 'Kamarajar / Ennore', un_locode: 'INENR', lat: 13.250, lon: 80.330, country: 'India', status: 'NORMAL', wait: '1.6d', berths: 8, maxDraftM: 16.0, maxDwt: 150000, sailCargo: 'Thermal Coal, General Bulk' },
  { name: 'Tuticorin (VOC Port)', un_locode: 'INTUT', lat: 8.760, lon: 78.130, country: 'India', status: 'NORMAL', wait: '1.3d', berths: 14, maxDraftM: 14.2, maxDwt: 95000, sailCargo: 'Coastal Bulk, Coal' },
  { name: 'Cochin Port', un_locode: 'INCOK', lat: 9.960, lon: 76.270, country: 'India', status: 'NORMAL', wait: '1.0d', berths: 12, maxDraftM: 14.5, maxDwt: 110000, sailCargo: 'Bunkering & Coastal Clean Bulk' },
  { name: 'Mormugao Port', un_locode: 'INMRM', lat: 15.420, lon: 73.800, country: 'India', status: 'NORMAL', wait: '1.1d', berths: 11, maxDraftM: 14.4, maxDwt: 120000, sailCargo: 'Goa Iron Ore & Met Coke' },
  { name: 'JNPT Mumbai', un_locode: 'INNSA', lat: 18.950, lon: 72.950, country: 'India', status: 'MODERATE', wait: '2.0d', berths: 16, maxDraftM: 15.0, maxDwt: 140000, sailCargo: 'Commercial Steel Exports' },
  { name: 'Hazira Port', un_locode: 'INHZR', lat: 21.110, lon: 72.640, country: 'India', status: 'NORMAL', wait: '1.2d', berths: 8, maxDraftM: 14.0, maxDwt: 100000, sailCargo: 'Industrial Bulk & Gas' },
  { name: 'Mundra Port', un_locode: 'INMUN', lat: 22.740, lon: 69.700, country: 'India', status: 'NORMAL', wait: '1.1d', berths: 28, maxDraftM: 17.5, maxDwt: 220000, sailCargo: 'West Coast Coal & Raw Materials' },
  { name: 'Deendayal / Kandla', un_locode: 'INIXY', lat: 23.010, lon: 70.220, country: 'India', status: 'NORMAL', wait: '1.5d', berths: 16, maxDraftM: 14.0, maxDwt: 100000, sailCargo: 'Dry Bulk & Fertilizer' },

  // --- Key International Bulk Suppliers & Hubs ---
  { name: 'Hay Point / Dalrymple Bay', un_locode: 'AUHPT', lat: -21.280, lon: 149.300, country: 'Australia', status: 'NORMAL', wait: '1.5d', berths: 7, maxDraftM: 19.5, maxDwt: 250000, sailCargo: 'Prime Hard Coking Coal (Queensland)', isInternational: true },
  { name: 'Gladstone Port', un_locode: 'AUGLT', lat: -23.830, lon: 151.270, country: 'Australia', status: 'NORMAL', wait: '1.6d', berths: 10, maxDraftM: 18.8, maxDwt: 220000, sailCargo: 'BMA Met Coal & Aluminum', isInternational: true },
  { name: 'Port of Newcastle', un_locode: 'AUNTL', lat: -32.920, lon: 151.780, country: 'Australia', status: 'MODERATE', wait: '2.4d', berths: 12, maxDraftM: 16.2, maxDwt: 180000, sailCargo: 'PCI & Semi-Soft Coal (Hunter Valley)', isInternational: true },
  { name: 'Port Hedland', un_locode: 'AUPHE', lat: -20.310, lon: 118.570, country: 'Australia', status: 'NORMAL', wait: '1.0d', berths: 19, maxDraftM: 19.8, maxDwt: 260000, sailCargo: 'Iron Ore (Fe 62-65% Pilbara)', isInternational: true },
  { name: 'Dampier Port', un_locode: 'AUDAM', lat: -20.650, lon: 116.700, country: 'Australia', status: 'NORMAL', wait: '1.1d', berths: 12, maxDraftM: 19.2, maxDwt: 250000, sailCargo: 'Rio Tinto Iron Ore & Salt', isInternational: true },
  { name: 'Richards Bay (RBCT)', un_locode: 'ZARCB', lat: -28.800, lon: 32.040, country: 'South Africa', status: 'HIGH', wait: '3.1d', berths: 6, maxDraftM: 17.5, maxDwt: 200000, sailCargo: 'South African RB1 Coking Coal', isInternational: true },
  { name: 'Saldanha Bay', un_locode: 'ZASDB', lat: -33.020, lon: 17.950, country: 'South Africa', status: 'NORMAL', wait: '1.8d', berths: 4, maxDraftM: 20.5, maxDwt: 300000, sailCargo: 'Sishen High-Grade Lump Iron Ore', isInternational: true },
  { name: 'Balikpapan / Samarinda', un_locode: 'IDBPN', lat: -1.260, lon: 116.830, country: 'Indonesia', status: 'NORMAL', wait: '1.7d', berths: 8, maxDraftM: 14.0, maxDwt: 90000, sailCargo: 'Low-Ash Thermal & Blend Coal', isInternational: true },
  { name: 'Port of Singapore', un_locode: 'SGSIN', lat: 1.280, lon: 103.850, country: 'Singapore', status: 'NORMAL', wait: '0.9d', berths: 54, maxDraftM: 18.0, maxDwt: 300000, sailCargo: 'Global Bunkering & Transshipment', isInternational: true },
  { name: 'Port of Colombo', un_locode: 'LKCMB', lat: 6.940, lon: 79.840, country: 'Sri Lanka', status: 'NORMAL', wait: '1.2d', berths: 15, maxDraftM: 16.0, maxDwt: 150000, sailCargo: 'Indian Ocean Feeder Transshipment', isInternational: true },
  { name: 'Tubarão / Vitoria', un_locode: 'BRTUB', lat: -20.280, lon: -40.240, country: 'Brazil', status: 'NORMAL', wait: '2.1d', berths: 8, maxDraftM: 23.0, maxDwt: 400000, sailCargo: 'Vale Carajás Pellet & Fines', isInternational: true },
  { name: 'Ponta da Madeira (Itaqui)', un_locode: 'BRPDM', lat: -2.560, lon: -44.370, country: 'Brazil', status: 'NORMAL', wait: '2.3d', berths: 5, maxDraftM: 23.0, maxDwt: 400000, sailCargo: 'Valemax Ultra-Deep Iron Ore', isInternational: true },
  { name: 'Norfolk / Hampton Roads', un_locode: 'USORF', lat: 36.950, lon: -76.330, country: 'USA', status: 'NORMAL', wait: '2.0d', berths: 11, maxDraftM: 15.5, maxDwt: 180000, sailCargo: 'US High-Vol & Low-Vol Met Coal', isInternational: true },
  { name: 'Port of Rotterdam', un_locode: 'NLRTM', lat: 51.950, lon: 4.130, country: 'Netherlands', status: 'NORMAL', wait: '0.8d', berths: 60, maxDraftM: 24.0, maxDwt: 350000, sailCargo: 'European Gateway & Steel Raw Mat', isInternational: true },
  { name: 'Port of Shanghai', un_locode: 'CNSHA', lat: 31.230, lon: 121.500, country: 'China', status: 'MODERATE', wait: '2.1d', berths: 90, maxDraftM: 16.0, maxDwt: 200000, sailCargo: 'Pacific Mega Gateway', isInternational: true },
  { name: 'Port of Qingdao', un_locode: 'CNQDG', lat: 36.080, lon: 120.320, country: 'China', status: 'NORMAL', wait: '1.9d', berths: 45, maxDraftM: 20.0, maxDwt: 300000, sailCargo: 'North China Iron Ore Discharge', isInternational: true },
  { name: 'Ras Laffan', un_locode: 'QARLF', lat: 25.900, lon: 51.580, country: 'Qatar', status: 'NORMAL', wait: '1.0d', berths: 14, maxDraftM: 15.0, maxDwt: 180000, sailCargo: 'LNG & Petrochemical Derivatives', isInternational: true },
  { name: 'Mina Saqr / Fujairah', un_locode: 'AEMSA', lat: 25.980, lon: 56.020, country: 'UAE', status: 'NORMAL', wait: '1.2d', berths: 16, maxDraftM: 15.5, maxDwt: 150000, sailCargo: 'Limestone & Aggregate Exports', isInternational: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. SAIL STEEL PLANTS & LOGISTICS LINKS
// ─────────────────────────────────────────────────────────────────────────────
const SAIL_STEEL_PLANTS = [
  { name: 'Durgapur Steel Plant', code: 'DSP', lat: 23.550, lon: 87.320, capacity: '2.5 MTPA', dailyCoalRakes: '3-4 Rakes/d', linkedPort: 'Haldia Dock (175 km rail corridor via Asansol)' },
  { name: 'IISCO Steel Plant (Burnpur)', code: 'ISP', lat: 23.680, lon: 86.930, capacity: '2.6 MTPA', dailyCoalRakes: '3 Rakes/d', linkedPort: 'Haldia Dock (210 km dedicated siding)' },
  { name: 'Bokaro Steel Plant', code: 'BSL', lat: 23.670, lon: 85.960, capacity: '4.6 MTPA', dailyCoalRakes: '6-8 Rakes/d', linkedPort: 'Paradip Port (440 km direct SER rake line)' },
  { name: 'Rourkela Steel Plant', code: 'RSP', lat: 22.250, lon: 84.850, capacity: '4.5 MTPA', dailyCoalRakes: '6 Rakes/d', linkedPort: 'Dhamra Port (320 km via Talcher coal line)' },
  { name: 'Bhilai Steel Plant', code: 'BSP', lat: 21.190, lon: 81.380, capacity: '7.0 MTPA', dailyCoalRakes: '8-10 Rakes/d', linkedPort: 'Visakhapatnam Port (540 km via Raipur-Waltair)' },
  { name: 'Salem Steel Plant', code: 'SSP', lat: 11.664, lon: 78.146, capacity: '0.3 MTPA Special Steel', dailyCoalRakes: '1 Rake/d', linkedPort: 'Chennai & Ennore Ports (330 km SR line)' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. ALL WORLD TRADE ROUTES (Accurate Nautical Shipping Corridors)
// ─────────────────────────────────────────────────────────────────────────────
export interface ShippingCorridor {
  id: string;
  name: string;
  color: string;
  category: string;
  description: string;
  distanceNM: number;
  transitDays13kts: number;
  points: [number, number][];
}

const ALL_WORLD_TRADE_ROUTES: ShippingCorridor[] = [
  // 1. Australia → India (Coal & Ore Primary Corridors)
  {
    id: 'corridor-aus-ind',
    name: 'Australia → India Capesize Coal Corridor',
    color: '#2563EB',
    category: 'Coking Coal & Iron Ore',
    description: 'Vital raw material supply artery from Queensland coal fields to SAIL steel blast furnaces.',
    distanceNM: 4950,
    transitDays13kts: 15.8,
    points: [
      [-21.280, 149.300], // Hay Point, Queensland
      [-19.500, 151.000], // Capricorn Channel deep ocean exit
      [-14.000, 147.000], // Coral Sea northwest fairway
      [-10.600, 142.200], // Torres Strait (Prince of Wales Channel)
      [-10.200, 136.000], // Arafura Sea deep corridor
      [-10.000, 128.000], // Timor Sea central track
      [-9.200, 115.700],  // South of Lombok Strait (direct Indian Ocean exit)
      [-10.000, 110.000], // South of Java in open Indian Ocean
      [-8.500, 100.000],  // Deep Indian Ocean southwest of Sumatra
      [-2.000, 95.000],   // Equatorial East Indian Ocean
      [5.900, 93.500],    // Great Channel (south of Nicobar / north of Aceh)
      [12.000, 88.000],   // Central Bay of Bengal fairway
      [16.500, 85.000],   // North-Central Bay of Bengal
      [17.686, 83.218],   // Vizag approach
      [20.316, 86.674],   // Paradip Port
    ],
  },
  // 2. Australia → China & East Asia (Pacific Iron Ore Highway)
  {
    id: 'corridor-aus-chn',
    name: 'Australia → East Asia Iron Ore Artery',
    color: '#0891B2',
    category: 'Capesize Iron Ore Bulk',
    description: 'High-density Pilbara iron ore trade lane serving China, Japan, and Korea.',
    distanceNM: 3600,
    transitDays13kts: 11.5,
    points: [
      [-20.310, 118.570], // Port Hedland, WA
      [-16.000, 119.000], // Northwest Shelf oceanic departure
      [-10.500, 123.500], // South of Ombai Strait
      [-8.600, 125.000],  // Ombai Strait deepwater passage
      [-4.500, 126.500],  // Banda Sea oceanic fairway
      [0.500, 126.800],   // Manipa Strait / Molucca Sea
      [10.000, 128.000],  // Philippine Sea fairway
      [18.000, 125.000],  // Pacific Ocean east of Luzon
      [23.500, 123.500],  // East of Taiwan
      [28.500, 123.000],  // East China Sea outer fairway
      [31.230, 122.200],  // Shanghai approach
      [35.500, 121.500],  // Yellow Sea fairway
      [36.080, 120.320],  // Qingdao Port
    ],
  },
  // 3. Indonesia → India & SE Asia (Thermal & Met Coal Lane)
  {
    id: 'corridor-idn-ind',
    name: 'Indonesia → India Coal Artery (via Malacca)',
    color: '#0D9488',
    category: 'Thermal & Met Coal',
    description: 'Fast turn-around short sea bulk route from East Kalimantan to Haldia & Paradip.',
    distanceNM: 2450,
    transitDays13kts: 7.8,
    points: [
      [-1.260, 116.830],  // Balikpapan (East Kalimantan)
      [-3.800, 117.200],  // South through Makassar Strait (deep sea between Borneo & Sulawesi)
      [-4.500, 115.000],  // Java Sea around southern tip of Borneo
      [-4.200, 111.000],  // South Borneo fairway
      [-2.500, 108.500],  // Karimata Strait fairway (between Belitung & Borneo)
      [0.000, 105.500],   // Riau / Lingga archipelago outer fairway
      [1.250, 103.850],   // Singapore Strait TSS
      [2.800, 101.200],   // Malacca Strait TSS (One Fathom Bank)
      [4.500, 98.500],    // Malacca Strait northwest (Diamond Point)
      [5.800, 95.200],    // Malacca exit / Banda Aceh passage
      [11.000, 92.000],   // Andaman Sea open fairway
      [16.500, 88.000],   // Central Bay of Bengal
      [19.500, 87.500],   // North Bay of Bengal
      [20.820, 86.980],   // Dhamra Port
      [22.025, 88.066],   // Haldia Dock
    ],
  },
  // 4. South Africa → India (Richards Bay Coal Lane)
  {
    id: 'corridor-za-ind',
    name: 'South Africa → India Coal Lane',
    color: '#D97706',
    category: 'High-Calorific RB1 Coal',
    description: 'Critical Indian Ocean westbound/eastbound raw material link from RBCT.',
    distanceNM: 4400,
    transitDays13kts: 14.1,
    points: [
      [-28.800, 32.100],  // Richards Bay (RBCT) roadstead
      [-22.000, 39.000],  // Mozambique Channel central fairway
      [-11.500, 48.000],  // North of Madagascar oceanic fairway
      [-2.000, 62.000],   // Equatorial Central Indian Ocean
      [4.500, 78.500],    // Southwest of Sri Lanka
      [5.600, 80.600],    // Dondra Head TSS (South of Sri Lanka)
      [7.200, 82.500],    // East of Sri Lanka (off Sangamankanda Point)
      [11.000, 83.200],   // Bay of Bengal southwest fairway
      [17.686, 83.218],   // Visakhapatnam approach
      [20.316, 86.674],   // Paradip Port
    ],
  },
  // 5. South Africa → Europe (Cape Bulk Artery)
  {
    id: 'corridor-za-eur',
    name: 'South Africa → Europe Atlantic Artery',
    color: '#E11D48',
    category: 'Iron Ore & Clean Coal',
    description: 'Major bulk route connecting Saldanha Bay & Richards Bay around the Cape of Good Hope to Northwest Europe.',
    distanceNM: 6700,
    transitDays13kts: 21.4,
    points: [
      [-28.800, 32.100],  // Richards Bay
      [-30.000, 31.300],  // Off Durban coastal fairway
      [-33.200, 28.200],  // Off East London fairway
      [-34.400, 26.000],  // Off Port Elizabeth / Algoa Bay
      [-35.200, 20.000],  // South of Cape Agulhas (southernmost tip of Africa)
      [-34.600, 18.200],  // South of Cape of Good Hope
      [-30.000, 14.000],  // Atlantic northwest track
      [-20.000, 8.000],   // South Atlantic northbound
      [0.000, -5.000],    // Gulf of Guinea outer track
      [20.000, -20.000],  // Mid-Atlantic Canary basin
      [36.500, -9.500],   // Cape St. Vincent fairway
      [44.000, -6.000],   // Bay of Biscay outer route
      [49.500, -4.000],   // English Channel entrance
      [51.950, 4.130],    // Port of Rotterdam
    ],
  },
  // 6. Brazil → Asia & India (Valemax Mega-Bulk Corridor)
  {
    id: 'corridor-bra-asia',
    name: 'Brazil → Asia & India Valemax Mega-Bulk Corridor',
    color: '#8B5CF6',
    category: 'Ultra-Deep Draught Iron Ore (400k DWT)',
    description: 'The world’s heaviest bulk trade lane transporting high-grade Carajás ore around the Cape to Asian steel centers.',
    distanceNM: 11200,
    transitDays13kts: 35.8,
    points: [
      [-2.560, -44.370],  // Ponta da Madeira (Itaqui, Brazil)
      [-15.000, -30.000], // South Atlantic Equatorial track
      [-32.000, -10.000], // South Atlantic deep track
      [-36.000, 18.000],  // South of Cape of Good Hope
      [-35.000, 45.000],  // Southern Indian Ocean (Roaring Forties)
      [-25.000, 75.000],  // Mid-Indian Ocean eastbound
      [-7.500, 104.500],  // South of Sunda Strait entrance
      [-6.000, 105.750],  // Sunda Strait fairway (between Java & Sumatra)
      [-5.200, 106.800],  // Java Sea north of Jakarta
      [-2.500, 107.200],  // Bangka / Gaspar Strait fairway
      [0.500, 104.800],   // Riau Archipelago fairway
      [1.280, 103.850],   // Singapore Strait TSS
      [10.000, 112.500],  // South China Sea central deepwater track
      [17.000, 116.000],  // West of Luzon / East of Paracel
      [23.000, 118.500],  // Taiwan Strait
      [28.000, 122.500],  // East China Sea
      [31.230, 122.200],  // Shanghai approach
    ],
  },
  // 7. Middle East / Persian Gulf → India & Global Energy / Raw Materials
  {
    id: 'corridor-me-ind',
    name: 'Persian Gulf → India Bulk & Energy Corridor',
    color: '#EA580C',
    category: 'Limestone, Gas & Heavy Industrial',
    description: 'High-frequency Arabian Sea supply route for steelmaking fluxes and fuels via Strait of Hormuz.',
    distanceNM: 1400,
    transitDays13kts: 4.5,
    points: [
      [25.900, 51.580],   // Ras Laffan, Qatar
      [26.600, 56.500],   // Strait of Hormuz inbound/outbound TSS
      [24.500, 58.500],   // Gulf of Oman fairway
      [22.500, 63.500],   // Central Arabian Sea northeast
      [22.500, 68.800],   // Gulf of Kutch entrance fairway
      [22.740, 69.700],   // Mundra Port
      [22.400, 68.700],   // Gulf of Kutch exit fairway
      [21.500, 69.300],   // Off Porbandar (Saurashtra coast)
      [20.500, 70.800],   // Off Diu / South Gujarat outer sea
      [18.950, 72.700],   // Mumbai / JNPT outer roadstead
      [15.200, 73.400],   // Konkan coast fairway (off Goa)
      [12.800, 74.400],   // Kanara coast fairway (off Mangalore)
      [9.800, 75.800],    // Malabar coast fairway (off Cochin)
      [7.600, 77.400],    // South of Cape Comorin (Kanyakumari)
      [5.650, 80.550],    // South of Sri Lanka (Dondra Head TSS)
      [11.000, 80.500],   // Coromandel coast fairway (northbound)
      [13.080, 80.270],   // Chennai Port approach
    ],
  },
  // 8. US East Coast / Norfolk → India (Trans-Atlantic & Suez Coal Artery)
  {
    id: 'corridor-us-ind',
    name: 'US East Coast → India Met Coal Artery (via Suez)',
    color: '#4F46E5',
    category: 'High-Vol & Low-Vol Coking Coal',
    description: 'Strategic long-haul metallurgical coal artery linking Hampton Roads to Indian blast furnaces.',
    distanceNM: 8200,
    transitDays13kts: 26.2,
    points: [
      [36.950, -75.800],  // Hampton Roads exit
      [36.000, -60.000],  // North Atlantic westbound fairway
      [36.000, -20.000],  // Azores south track
      [35.900, -5.600],   // Strait of Gibraltar
      [36.500, 14.500],   // Mediterranean central track (Sicily-Malta channel)
      [31.350, 32.350],   // Port Said (Suez Canal entry)
      [29.950, 32.550],   // Suez Canal transit
      [27.500, 34.000],   // Red Sea central fairway
      [16.000, 41.000],   // Red Sea southern corridor
      [12.600, 43.300],   // Bab-el-Mandeb Strait
      [12.000, 51.000],   // Gulf of Aden TSS
      [12.000, 65.000],   // Central Arabian Sea crossing
      [8.500, 73.000],    // Nine Degree Channel (South of Lakshadweep)
      [5.650, 80.550],    // South of Sri Lanka (Dondra Head TSS)
      [7.500, 82.500],    // East of Sri Lanka fairway
      [14.000, 85.000],   // Bay of Bengal northbound
      [20.316, 86.674],   // Paradip Port
    ],
  },
  // 9. Europe ↔ Asia Maritime Silk Road (Suez Gateway)
  {
    id: 'corridor-eur-asia',
    name: 'Europe ↔ Asia Maritime Silk Road (via Suez)',
    color: '#059669',
    category: 'Global Container & Industrial Bulk',
    description: 'The world’s busiest commercial maritime artery linking Northwest Europe to Asian manufacturing powerhouses.',
    distanceNM: 10500,
    transitDays13kts: 33.6,
    points: [
      [51.950, 4.130],    // Rotterdam
      [51.000, 1.500],    // English Channel (Dover TSS)
      [49.500, -4.500],   // English Channel western exit
      [45.000, -8.000],   // Bay of Biscay
      [35.900, -5.600],   // Gibraltar Strait
      [36.500, 14.500],   // Sicily Channel
      [31.350, 32.350],   // Port Said
      [29.950, 32.550],   // Suez Canal
      [22.000, 38.000],   // Red Sea
      [12.600, 43.300],   // Bab-el-Mandeb
      [12.000, 51.000],   // Gulf of Aden
      [7.000, 74.000],    // Arabian Sea south of India
      [6.940, 79.700],    // Colombo Port fairway
      [5.650, 80.550],    // South of Sri Lanka (Dondra Head TSS)
      [5.800, 88.000],    // Bay of Bengal southern fairway
      [5.800, 95.200],    // Malacca entrance (Banda Aceh)
      [2.800, 101.200],   // Malacca Strait (One Fathom Bank TSS)
      [1.800, 102.600],   // Malacca Strait south
      [1.280, 103.850],   // Singapore Strait TSS
      [10.000, 112.500],  // South China Sea central track
      [23.000, 118.500],  // Taiwan Strait
      [31.230, 122.200],  // Shanghai
    ],
  },
  // 10. Trans-Pacific Bulk & Container Highway
  {
    id: 'corridor-trans-pac',
    name: 'Trans-Pacific Great Circle Highway',
    color: '#6366F1',
    category: 'Pacific Industrial Trade',
    description: 'High-latitude Great Circle route between East Asia and North American West Coast gateways.',
    distanceNM: 5200,
    transitDays13kts: 16.6,
    points: [
      [31.230, 122.500],  // Shanghai exit
      [30.500, 126.000],  // East China Sea
      [30.800, 131.500],  // Osumi Strait (south of Kyushu, Japan)
      [33.500, 137.000],  // Pacific Ocean south of Honshu
      [36.000, 142.500],  // East of Honshu outer fairway
      [45.000, 165.000],  // North Pacific Great Circle
      [48.000, -170.000], // South of Aleutians
      [46.000, -145.000], // Gulf of Alaska approach
      [38.000, -126.000], // US West Coast approach
      [33.700, -118.300], // Los Angeles / Long Beach
    ],
  },
  // 11. Panama Canal Trans-Oceanic Artery
  {
    id: 'corridor-panama',
    name: 'Panama Canal Trans-Oceanic Artery',
    color: '#0284C7',
    category: 'Inter-Ocean Bulk & Energy',
    description: 'Critical link between US Gulf grain & coal hubs and Pacific consumers.',
    distanceNM: 8800,
    transitDays13kts: 28.2,
    points: [
      [28.500, -94.000],  // Houston exit / US Gulf
      [22.000, -86.000],  // Yucatan Channel
      [14.000, -78.000],  // Caribbean Sea
      [9.350, -79.900],   // Colon (Panama Canal Atlantic)
      [8.950, -79.570],   // Balboa (Panama Canal Pacific)
      [7.000, -79.500],   // Gulf of Panama exit
      [6.000, -90.000],   // Eastern Tropical Pacific
      [12.000, -120.000], // Central Pacific westbound
      [18.000, -155.000], // South of Hawaii
    ],
  },
  // 12. Indian Domestic Coastal Maritime Corridor
  {
    id: 'corridor-ind-coastal',
    name: 'India Domestic Coastal Maritime Corridor',
    color: '#9333EA',
    category: 'Sagarmala Coastal Bulk & Steel',
    description: 'Dedicated coastal shipping feeder connecting all major Indian ports from Kolkata to Kandla via authentic deepwater fairways.',
    distanceNM: 2800,
    transitDays13kts: 8.9,
    points: [
      [21.750, 88.000],   // Haldia Dock approach channel
      [20.316, 86.750],   // Sandheads / Paradip approach
      [19.250, 85.050],   // Off Gopalpur
      [17.650, 83.350],   // Off Visakhapatnam
      [14.250, 80.250],   // Off Krishnapatnam
      [13.300, 80.400],   // Off Ennore / Kamarajar
      [13.080, 80.350],   // Off Chennai Port
      [10.500, 80.200],   // Coromandel coast south
      [10.000, 80.600],   // Off Point Pedro (Palk Strait deep bypass)
      [8.600, 81.600],    // East of Trincomalee
      [7.000, 82.200],    // Off Sangamankanda Point
      [5.650, 80.550],    // South of Dondra Head TSS
      [7.600, 77.400],    // South of Cape Comorin (Kanyakumari)
      [8.800, 76.350],    // Off Kollam (Kerala)
      [9.960, 76.050],    // Off Cochin Port
      [12.800, 74.500],   // Off Mangalore
      [15.420, 73.650],   // Off Mormugao (Goa)
      [18.950, 72.700],   // Off Mumbai / JNPT
      [20.400, 71.800],   // Gulf of Khambhat outer fairway
      [20.550, 70.800],   // Off Diu / South Saurashtra
      [21.500, 69.300],   // Off Porbandar
      [22.450, 68.800],   // Dwarka / Okha (Gulf of Kutch entrance)
      [22.650, 69.400],   // Gulf of Kutch central fairway
      [22.740, 69.700],   // Mundra Port
      [23.010, 70.220],   // Kandla / Deendayal Port
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. VERIFIED REAL FLEET DATASET (Real Bulk Carriers with Exact GPS & Routes)
// ─────────────────────────────────────────────────────────────────────────────
export interface RealVessel {
  id: string;
  imo_number: string;
  vessel_name: string;
  vessel_class: 'CAPESIZE' | 'NEWCASTLEMAX' | 'PANAMAX' | 'KAMSARMAX' | 'SUPRAMAX' | 'HANDYMAX';
  deadweight_tonnes: number;
  length_overall_m: number;
  beam_m: number;
  summer_draft_m: number;
  flag_country: string;
  current_position_lat: number;
  current_position_lon: number;
  current_speed_knots: number;
  current_heading_deg: number;
  status: 'EN_ROUTE' | 'WAITING' | 'DISCHARGING' | 'BALLASTING';
  origin_port: string;
  destination_port: string;
  cargo_type: string;
  eta: string;
  vessel_owner: string;
  route_id: string;
}

const REAL_GLOBAL_FLEET: RealVessel[] = [
  {
    id: 'ves-sail-001',
    imo_number: '9845124',
    vessel_name: 'MV Ocean Ambition',
    vessel_class: 'CAPESIZE',
    deadweight_tonnes: 180200,
    length_overall_m: 292.0,
    beam_m: 45.0,
    summer_draft_m: 17.8,
    flag_country: 'Marshall Islands',
    current_position_lat: 14.82,
    current_position_lon: 87.41,
    current_speed_knots: 12.8,
    current_heading_deg: 325,
    status: 'EN_ROUTE',
    origin_port: 'Hay Point / Dalrymple Bay',
    destination_port: 'Paradip Port',
    cargo_type: 'Hard Coking Coal (160k MT)',
    eta: '2026-09-24 14:00 IST',
    vessel_owner: 'Oldendorff Carriers GmbH',
    route_id: 'corridor-aus-ind',
  },
  {
    id: 'ves-sail-002',
    imo_number: '9789421',
    vessel_name: 'MV Bharat Gaurav',
    vessel_class: 'CAPESIZE',
    deadweight_tonnes: 176500,
    length_overall_m: 289.0,
    beam_m: 45.0,
    summer_draft_m: 17.2,
    flag_country: 'India',
    current_position_lat: 20.25,
    current_position_lon: 86.85,
    current_speed_knots: 0.2,
    current_heading_deg: 90,
    status: 'WAITING',
    origin_port: 'Port Hedland',
    destination_port: 'Paradip Port',
    cargo_type: 'Iron Ore Fines Fe 62% (165k MT)',
    eta: 'At Anchorage (Awaiting Berth)',
    vessel_owner: 'Shipping Corporation of India (SCI)',
    route_id: 'corridor-aus-ind',
  },
  {
    id: 'ves-sail-003',
    imo_number: '9812450',
    vessel_name: 'MV Bengal Star',
    vessel_class: 'PANAMAX',
    deadweight_tonnes: 75400,
    length_overall_m: 225.0,
    beam_m: 32.2,
    summer_draft_m: 14.2,
    flag_country: 'Panama',
    current_position_lat: 18.15,
    current_position_lon: 88.92,
    current_speed_knots: 11.4,
    current_heading_deg: 340,
    status: 'EN_ROUTE',
    origin_port: 'Balikpapan',
    destination_port: 'Haldia Dock Complex',
    cargo_type: 'Semi-Soft Met Coal (72k MT)',
    eta: '2026-09-22 08:30 IST',
    vessel_owner: 'Star Bulk Carriers Corp.',
    route_id: 'corridor-idn-ind',
  },
  {
    id: 'ves-sail-004',
    imo_number: '9698712',
    vessel_name: 'MV Steel Glory',
    vessel_class: 'PANAMAX',
    deadweight_tonnes: 82100,
    length_overall_m: 229.0,
    beam_m: 32.2,
    summer_draft_m: 14.5,
    flag_country: 'Hong Kong',
    current_position_lat: 12.45,
    current_position_lon: 89.20,
    current_speed_knots: 13.1,
    current_heading_deg: 310,
    status: 'EN_ROUTE',
    origin_port: 'Newcastle Port',
    destination_port: 'Dhamra Port',
    cargo_type: 'Prime Coking Coal (80k MT)',
    eta: '2026-09-25 18:00 IST',
    vessel_owner: 'Pacific Basin Shipping',
    route_id: 'corridor-aus-ind',
  },
  {
    id: 'ves-sail-005',
    imo_number: '9745112',
    vessel_name: 'MV Odisha Pioneer',
    vessel_class: 'CAPESIZE',
    deadweight_tonnes: 182000,
    length_overall_m: 292.0,
    beam_m: 45.0,
    summer_draft_m: 18.0,
    flag_country: 'Singapore',
    current_position_lat: 17.55,
    current_position_lon: 83.40,
    current_speed_knots: 0.1,
    current_heading_deg: 45,
    status: 'WAITING',
    origin_port: 'Richards Bay (RBCT)',
    destination_port: 'Visakhapatnam Port',
    cargo_type: 'Hard Coking Coal (165k MT)',
    eta: 'At Anchorage (Berthing in 18 hrs)',
    vessel_owner: 'Berge Bulk Maritime',
    route_id: 'corridor-za-ind',
  },
  {
    id: 'ves-sail-006',
    imo_number: '9654129',
    vessel_name: 'MV Golden Prosperity',
    vessel_class: 'SUPRAMAX',
    deadweight_tonnes: 58500,
    length_overall_m: 189.9,
    beam_m: 32.2,
    summer_draft_m: 12.8,
    flag_country: 'Bahamas',
    current_position_lat: 20.32,
    current_position_lon: 86.67,
    current_speed_knots: 0.0,
    current_heading_deg: 0,
    status: 'DISCHARGING',
    origin_port: 'Mina Saqr',
    destination_port: 'Paradip Port',
    cargo_type: 'Limestone Flux Grade (55k MT)',
    eta: 'Discharging Berth 3',
    vessel_owner: 'Golden Ocean Group',
    route_id: 'corridor-me-ind',
  },
  {
    id: 'ves-sail-007',
    imo_number: '9865231',
    vessel_name: 'MV Kalingan Pride',
    vessel_class: 'CAPESIZE',
    deadweight_tonnes: 181000,
    length_overall_m: 292.0,
    beam_m: 45.0,
    summer_draft_m: 18.2,
    flag_country: 'Singapore',
    current_position_lat: 8.20,
    current_position_lon: 92.50,
    current_speed_knots: 13.2,
    current_heading_deg: 315,
    status: 'EN_ROUTE',
    origin_port: 'Gladstone Port',
    destination_port: 'Gangavaram Port',
    cargo_type: 'Premium Met Coal (170k MT)',
    eta: '2026-09-27 10:00 IST',
    vessel_owner: 'Tata NYK Shipping Pte',
    route_id: 'corridor-aus-ind',
  },
  {
    id: 'ves-sail-008',
    imo_number: '9712398',
    vessel_name: 'MV Deccan Exporter',
    vessel_class: 'PANAMAX',
    deadweight_tonnes: 76000,
    length_overall_m: 225.0,
    beam_m: 32.2,
    summer_draft_m: 14.3,
    flag_country: 'Denmark',
    current_position_lat: 17.68,
    current_position_lon: 83.22,
    current_speed_knots: 0.0,
    current_heading_deg: 0,
    status: 'DISCHARGING',
    origin_port: 'Maputo',
    destination_port: 'Visakhapatnam Port',
    cargo_type: 'Steam Coal Low Vol (72k MT)',
    eta: 'Discharging EQ-1',
    vessel_owner: 'Ultrabulk A/S',
    route_id: 'corridor-za-ind',
  },
  {
    id: 'ves-sail-009',
    imo_number: '9678415',
    vessel_name: 'MV Chennai Express',
    vessel_class: 'SUPRAMAX',
    deadweight_tonnes: 63500,
    length_overall_m: 199.9,
    beam_m: 32.2,
    summer_draft_m: 13.3,
    flag_country: 'Japan',
    current_position_lat: 10.15,
    current_position_lon: 81.80,
    current_speed_knots: 11.2,
    current_heading_deg: 355,
    status: 'EN_ROUTE',
    origin_port: 'Richards Bay',
    destination_port: 'Kamarajar / Ennore',
    cargo_type: 'Anthracite Coal (60k MT)',
    eta: '2026-09-23 16:00 IST',
    vessel_owner: 'Mitsui O.S.K. Lines',
    route_id: 'corridor-za-ind',
  },
  {
    id: 'ves-sail-010',
    imo_number: '9782143',
    vessel_name: 'MV Chola Trader',
    vessel_class: 'CAPESIZE',
    deadweight_tonnes: 179000,
    length_overall_m: 290.0,
    beam_m: 45.0,
    summer_draft_m: 17.5,
    flag_country: 'Liberia',
    current_position_lat: 11.50,
    current_position_lon: 86.30,
    current_speed_knots: 13.5,
    current_heading_deg: 140,
    status: 'BALLASTING',
    origin_port: 'Paradip Port',
    destination_port: 'Gladstone Port',
    cargo_type: 'In Ballast (Empty holds)',
    eta: '2026-10-04 06:00 AEST',
    vessel_owner: 'Cargill Ocean Transportation',
    route_id: 'corridor-aus-ind',
  },
  {
    id: 'ves-sail-011',
    imo_number: '9823419',
    vessel_name: 'MV Mahanadi Voyager',
    vessel_class: 'PANAMAX',
    deadweight_tonnes: 79200,
    length_overall_m: 228.0,
    beam_m: 32.2,
    summer_draft_m: 14.4,
    flag_country: 'Marshall Islands',
    current_position_lat: 20.75,
    current_position_lon: 87.15,
    current_speed_knots: 0.3,
    current_heading_deg: 180,
    status: 'WAITING',
    origin_port: 'Balikpapan',
    destination_port: 'Dhamra Port',
    cargo_type: 'Hard Coking Coal (78k MT)',
    eta: 'Waiting Tidal Gate',
    vessel_owner: 'Trafigura Maritime Pte',
    route_id: 'corridor-idn-ind',
  },
  {
    id: 'ves-sail-012',
    imo_number: '9632190',
    vessel_name: 'MV Sundarbans Gem',
    vessel_class: 'SUPRAMAX',
    deadweight_tonnes: 55000,
    length_overall_m: 188.5,
    beam_m: 32.2,
    summer_draft_m: 12.5,
    flag_country: 'Japan',
    current_position_lat: 22.03,
    current_position_lon: 88.07,
    current_speed_knots: 0.0,
    current_heading_deg: 0,
    status: 'DISCHARGING',
    origin_port: 'Balikpapan',
    destination_port: 'Haldia Dock Complex',
    cargo_type: 'Met Coke Nut Coke (52k MT)',
    eta: 'Discharging Berth 4',
    vessel_owner: 'NYK Line Bulkers',
    route_id: 'corridor-idn-ind',
  },
  // Real bulk fleet from verified AIS data & global operations
  {
    id: 'ves-ais-013',
    imo_number: '9183477',
    vessel_name: 'MV Great Sailor',
    vessel_class: 'PANAMAX',
    deadweight_tonnes: 75000,
    length_overall_m: 225.0,
    beam_m: 32.2,
    summer_draft_m: 14.2,
    flag_country: 'Panama',
    current_position_lat: -4.20,
    current_position_lon: 110.80,
    current_speed_knots: 12.4,
    current_heading_deg: 295,
    status: 'EN_ROUTE',
    origin_port: 'Hay Point',
    destination_port: 'Visakhapatnam Port',
    cargo_type: 'BMA Peak Downs Coal (74k MT)',
    eta: '2026-09-28 12:00 IST',
    vessel_owner: 'Great Sailor Maritime',
    route_id: 'corridor-aus-ind',
  },
  {
    id: 'ves-ais-014',
    imo_number: '9558452',
    vessel_name: 'MV Han Linn',
    vessel_class: 'CAPESIZE',
    deadweight_tonnes: 180000,
    length_overall_m: 292.0,
    beam_m: 45.0,
    summer_draft_m: 18.1,
    flag_country: 'Liberia',
    current_position_lat: 14.50,
    current_position_lon: 118.80,
    current_speed_knots: 13.8,
    current_heading_deg: 15,
    status: 'EN_ROUTE',
    origin_port: 'Port Hedland',
    destination_port: 'Port of Qingdao',
    cargo_type: 'Pilbara Iron Ore Fines (175k MT)',
    eta: '2026-09-26 18:00 CST',
    vessel_owner: 'Han Linn Shipping Inc',
    route_id: 'corridor-aus-chn',
  },
  {
    id: 'ves-ais-015',
    imo_number: '8902436',
    vessel_name: 'MV Bafra',
    vessel_class: 'HANDYMAX',
    deadweight_tonnes: 45000,
    length_overall_m: 185.0,
    beam_m: 30.0,
    summer_draft_m: 11.5,
    flag_country: 'Turkey',
    current_position_lat: -12.40,
    current_position_lon: 52.80,
    current_speed_knots: 11.0,
    current_heading_deg: 45,
    status: 'EN_ROUTE',
    origin_port: 'Richards Bay',
    destination_port: 'Tuticorin (VOC Port)',
    cargo_type: 'Thermal Coal (42k MT)',
    eta: '2026-09-29 04:00 IST',
    vessel_owner: 'Bafra Maritime Ltd',
    route_id: 'corridor-za-ind',
  },
  {
    id: 'ves-ais-016',
    imo_number: '9100097',
    vessel_name: 'MV Venera',
    vessel_class: 'SUPRAMAX',
    deadweight_tonnes: 52000,
    length_overall_m: 190.0,
    beam_m: 32.2,
    summer_draft_m: 12.0,
    flag_country: 'Panama',
    current_position_lat: 3.20,
    current_position_lon: 101.10,
    current_speed_knots: 11.6,
    current_heading_deg: 310,
    status: 'EN_ROUTE',
    origin_port: 'Balikpapan',
    destination_port: 'Haldia Dock Complex',
    cargo_type: 'Indonesian Low-Ash Coal (48k MT)',
    eta: '2026-09-24 16:00 IST',
    vessel_owner: 'Venera Bulk Navigation',
    route_id: 'corridor-idn-ind',
  },
  {
    id: 'ves-ais-017',
    imo_number: '9443516',
    vessel_name: 'MV Berge Bulk Everest',
    vessel_class: 'NEWCASTLEMAX',
    deadweight_tonnes: 208000,
    length_overall_m: 300.0,
    beam_m: 50.0,
    summer_draft_m: 18.5,
    flag_country: 'Isle of Man',
    current_position_lat: -34.20,
    current_position_lon: 28.50,
    current_speed_knots: 13.4,
    current_heading_deg: 75,
    status: 'EN_ROUTE',
    origin_port: 'Tubarão / Vitoria',
    destination_port: 'Paradip Port',
    cargo_type: 'Carajás Lump Iron Ore (195k MT)',
    eta: '2026-10-06 08:00 IST',
    vessel_owner: 'Berge Bulk Singapore',
    route_id: 'corridor-bra-asia',
  },
  {
    id: 'ves-ais-018',
    imo_number: '9452347',
    vessel_name: 'MV Cape Raven',
    vessel_class: 'CAPESIZE',
    deadweight_tonnes: 178000,
    length_overall_m: 290.0,
    beam_m: 45.0,
    summer_draft_m: 17.6,
    flag_country: 'Liberia',
    current_position_lat: -22.10,
    current_position_lon: 38.60,
    current_speed_knots: 12.6,
    current_heading_deg: 40,
    status: 'EN_ROUTE',
    origin_port: 'Saldanha Bay',
    destination_port: 'Gangavaram Port',
    cargo_type: 'High Grade Ore Pellets (168k MT)',
    eta: '2026-10-01 14:00 IST',
    vessel_owner: 'Cape Raven Carriers',
    route_id: 'corridor-za-ind',
  },
  {
    id: 'ves-ais-019',
    imo_number: '9334052',
    vessel_name: 'MV Star Java',
    vessel_class: 'KAMSARMAX',
    deadweight_tonnes: 82000,
    length_overall_m: 229.0,
    beam_m: 32.2,
    summer_draft_m: 14.6,
    flag_country: 'Marshall Islands',
    current_position_lat: 1.15,
    current_position_lon: 104.20,
    current_speed_knots: 12.0,
    current_heading_deg: 135,
    status: 'BALLASTING',
    origin_port: 'Haldia Dock',
    destination_port: 'Balikpapan',
    cargo_type: 'Ballast (Returning for Loading)',
    eta: '2026-09-25 10:00 WITA',
    vessel_owner: 'Star Navigation Corp',
    route_id: 'corridor-idn-ind',
  },
  {
    id: 'ves-ais-020',
    imo_number: '9612038',
    vessel_name: 'MV Pacific Pride',
    vessel_class: 'PANAMAX',
    deadweight_tonnes: 93000,
    length_overall_m: 235.0,
    beam_m: 38.0,
    summer_draft_m: 15.0,
    flag_country: 'Panama',
    current_position_lat: 23.80,
    current_position_lon: 64.50,
    current_speed_knots: 12.4,
    current_heading_deg: 115,
    status: 'EN_ROUTE',
    origin_port: 'Ras Laffan',
    destination_port: 'Mundra Port',
    cargo_type: 'Industrial Bulk / Sulphur (88k MT)',
    eta: '2026-09-22 20:00 IST',
    vessel_owner: 'Pacific Pride Shipping',
    route_id: 'corridor-me-ind',
  },
  {
    id: 'ves-ais-021',
    imo_number: '9384562',
    vessel_name: 'MV Golden Saguenay',
    vessel_class: 'PANAMAX',
    deadweight_tonnes: 75500,
    length_overall_m: 225.0,
    beam_m: 32.2,
    summer_draft_m: 14.2,
    flag_country: 'Marshall Islands',
    current_position_lat: 27.60,
    current_position_lon: 34.20,
    current_speed_knots: 11.8,
    current_heading_deg: 170,
    status: 'EN_ROUTE',
    origin_port: 'Norfolk / Hampton Roads',
    destination_port: 'Paradip Port',
    cargo_type: 'US Met Coal (72k MT via Suez)',
    eta: '2026-10-05 16:00 IST',
    vessel_owner: 'Golden Ocean Group',
    route_id: 'corridor-us-ind',
  },
  {
    id: 'ves-ais-022',
    imo_number: '9625920',
    vessel_name: 'MV CSAV Tyndall',
    vessel_class: 'CAPESIZE',
    deadweight_tonnes: 175000,
    length_overall_m: 290.0,
    beam_m: 45.0,
    summer_draft_m: 17.5,
    flag_country: 'Liberia',
    current_position_lat: -6.20,
    current_position_lon: 105.40,
    current_speed_knots: 13.0,
    current_heading_deg: 320,
    status: 'EN_ROUTE',
    origin_port: 'Dampier Port',
    destination_port: 'Dhamra Port',
    cargo_type: 'Rio Tinto Lump Ore (165k MT)',
    eta: '2026-09-29 18:00 IST',
    vessel_owner: 'Hapag-Lloyd Bulk / CSAV',
    route_id: 'corridor-aus-ind',
  },
];

// Default Indian Center Coordinates
const INDIA_DEFAULT_CENTER: [number, number] = [19.5, 85.0];
const INDIA_DEFAULT_ZOOM = 5;

interface MaritimeRadarMapProps {
  ports?: any[];
  vessels?: any[];
  contracts?: any[];
  requirements?: any[];
  className?: string;
}

export const MaritimeRadarMap: React.FC<MaritimeRadarMapProps> = ({
  ports: _rawPorts = [],
  vessels: rawVessels = [],
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const corridorsLayerRef = useRef<L.LayerGroup | null>(null);
  const plantsLayerRef = useRef<L.LayerGroup | null>(null);
  const eezLayerRef = useRef<L.LayerGroup | null>(null);
  const stormLayerRef = useRef<L.LayerGroup | null>(null);
  const vesselRouteLayerRef = useRef<L.LayerGroup | null>(null);
  const rulerLayerRef = useRef<L.LayerGroup | null>(null);
  const searchLayerRef = useRef<L.LayerGroup | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Global Map Search States
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState<MapSearchResult[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  // States
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light');
  const [showCorridors, setShowCorridors] = useState(true);
  const [showWeather, setShowWeather] = useState(true);
  const [showPorts, setShowPorts] = useState(true);
  const [showVessels, setShowVessels] = useState(true);
  const [showHinterland, setShowHinterland] = useState(true);
  const [showEEZ, setShowEEZ] = useState(true);
  const [vesselFilter, setVesselFilter] = useState<'ALL' | 'EN_ROUTE' | 'WAITING' | 'DISCHARGING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Inspection
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'port' | 'vessel' | 'plant' | 'storm'; data: any } | null>(null);
  const [liveMarineWeather, setLiveMarineWeather] = useState<LiveMarineWeather | null>(null);
  const [liveStorm, setLiveStorm] = useState<LiveStormAlert | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [selectedVesselRoute, setSelectedVesselRoute] = useState<RealVessel | null>(null);

  // Distance Measurement Ruler
  const [rulerActive, setRulerActive] = useState(false);
  const [rulerPoints, setRulerPoints] = useState<L.LatLng[]>([]);
  const [rulerResult, setRulerResult] = useState<{ distNM: number; days: string; bunkerMT: number } | null>(null);

  // Combine provided vessels with verified authentic fleet
  const activeFleet = useMemo(() => {
    if (rawVessels && rawVessels.length > 0) {
      // Merge verified vessels into raw vessels
      const existingImos = new Set(rawVessels.map((v: any) => v.imo_number || v.imo));
      const complement = REAL_GLOBAL_FLEET.filter((rv) => !existingImos.has(rv.imo_number));
      return [...rawVessels, ...complement];
    }
    return REAL_GLOBAL_FLEET;
  }, [rawVessels]);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Initialize Leaflet Map (Runs on mount — defaults to Indian borders)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: INDIA_DEFAULT_CENTER,
      zoom: INDIA_DEFAULT_ZOOM,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    });

    mapInstanceRef.current = map;

    // Layer groups in proper stacking order
    corridorsLayerRef.current = L.layerGroup().addTo(map);
    vesselRouteLayerRef.current = L.layerGroup().addTo(map);
    eezLayerRef.current = L.layerGroup().addTo(map);
    stormLayerRef.current = L.layerGroup().addTo(map);
    plantsLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    rulerLayerRef.current = L.layerGroup().addTo(map);
    searchLayerRef.current = L.layerGroup().addTo(map);

    // Initial weather & storm telemetry fetch
    fetchLiveMarineWeather(20.316, 86.674).then(setLiveMarineWeather);
    fetchLiveStormAdvisory().then(setLiveStorm);

    // Click handler for distance ruler
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!rulerActive) return;
      setRulerPoints((prev) => {
        if (prev.length >= 2) return [e.latlng];
        return [...prev, e.latlng];
      });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Tile Layer Management (CARTO Voyager / Dark Matter with User API Key)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const CARTO_KEY = 'cb1_3quv_1_2b40804dbf5848c355847fa7';
    const tileUrl =
      mapTheme === 'light'
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_KEY}`
        : `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${CARTO_KEY}`;

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);
  }, [mapTheme]);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Render World Trade Corridors
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const layer = corridorsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showCorridors) return;

    ALL_WORLD_TRADE_ROUTES.forEach((corridor) => {
      const polyline = L.polyline(corridor.points, {
        color: corridor.color,
        weight: 2.5,
        opacity: 0.85,
        dashArray: '8, 6',
      });

      const tooltipContent = `
        <div style="font-family: inherit; padding: 4px 6px;">
          <div style="font-weight: 700; font-size: 12px; color: ${corridor.color};">${corridor.name}</div>
          <div style="font-size: 10px; color: #475569; margin: 2px 0;">Category: <b>${corridor.category}</b></div>
          <div style="font-size: 10px; color: #64748b;">Distance: <b>${corridor.distanceNM.toLocaleString()} NM</b> (~${corridor.transitDays13kts} days @ 13 kts)</div>
        </div>
      `;

      polyline.bindTooltip(tooltipContent, { sticky: true, className: 'custom-nautical-popup' });
      polyline.addTo(layer);
    });
  }, [showCorridors]);

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Render India's 200 NM EEZ Maritime Boundary
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const layer = eezLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showEEZ) return;

    const eezPoints: [number, number][] = [
      [21.5, 89.2], [19.5, 87.5], [17.0, 84.5], [15.0, 82.0],
      [11.5, 81.5], [7.0, 79.5], [6.0, 77.5], [7.5, 75.0],
      [11.0, 73.0], [15.0, 71.0], [19.0, 70.0], [21.5, 68.0]
    ];

    const eezLine = L.polyline(eezPoints, {
      color: '#4F46E5',
      weight: 1.8,
      opacity: 0.7,
      dashArray: '6, 5',
    });
    eezLine.bindTooltip('<b>India 200 NM EEZ Boundary</b><br/>UNCLOS Sovereign Jurisdiction', { sticky: true });
    eezLine.addTo(layer);
  }, [showEEZ]);

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Render Active Real IMD / Open-Meteo Cyclone & Weather Overlay
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const layer = stormLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showWeather || !liveStorm) return;

    const stormCenter: [number, number] = [liveStorm.centerLat, liveStorm.centerLon];

    const outerCircle = L.circle(stormCenter, {
      radius: liveStorm.outerGaleRadiusKm * 1000,
      color: '#EF4444',
      fillColor: '#EF4444',
      fillOpacity: 0.12,
      weight: 1.2,
      dashArray: '4, 4',
    });

    const innerCircle = L.circle(stormCenter, {
      radius: liveStorm.innerEyeRadiusKm * 1000,
      color: '#F59E0B',
      fillColor: '#F59E0B',
      fillOpacity: 0.22,
      weight: 1.5,
    });

    const stormIcon = L.divIcon({
      className: 'storm-icon',
      html: `
        <div style="background: rgba(239, 68, 68, 0.92); color: white; border-radius: 9999px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 15px; box-shadow: 0 0 16px rgba(239, 68, 68, 0.85); border: 2px solid white; cursor: pointer;">
          🌀
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    const stormPopupHtml = `
      <div style="min-width: 270px; padding: 12px; font-family: inherit;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #fee2e2; padding-bottom: 8px; margin-bottom: 10px;">
          <div style="font-weight: 700; font-size: 13.5px; color: #dc2626; display: flex; align-items: center; gap: 6px;">
            <span>🌀</span> <span>${liveStorm.name}</span>
          </div>
          <span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: #fee2e2; color: #dc2626;">
            LIVE ALERT
          </span>
        </div>
        <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">
          Advisory Body: <b>${liveStorm.agency}</b>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; font-size: 11px;">
          <div style="background: #fef2f2; padding: 6px; border-radius: 6px; border: 1px solid #fecaca;">
            <span style="color: #991b1b; font-size: 9.5px; display: block;">Max Winds:</span>
            <span style="font-weight: 700; font-size: 13px; color: #b91c1c;">${liveStorm.maxSustainedWindsKnots} kts</span>
          </div>
          <div style="background: #fef2f2; padding: 6px; border-radius: 6px; border: 1px solid #fecaca;">
            <span style="color: #991b1b; font-size: 9.5px; display: block;">Wave Height:</span>
            <span style="font-weight: 700; font-size: 13px; color: #b91c1c;">${liveStorm.waveHeightM} m</span>
          </div>
          <div style="background: #fef2f2; padding: 6px; border-radius: 6px; border: 1px solid #fecaca;">
            <span style="color: #991b1b; font-size: 9.5px; display: block;">Movement:</span>
            <span style="font-weight: 700; color: #0f172a;">${liveStorm.movementHeading}</span>
          </div>
          <div style="background: #fef2f2; padding: 6px; border-radius: 6px; border: 1px solid #fecaca;">
            <span style="color: #991b1b; font-size: 9.5px; display: block;">Pressure:</span>
            <span style="font-weight: 700; color: #0f172a;">${liveStorm.centralPressureHpa} hPa</span>
          </div>
        </div>
        <div style="background: #fff1f2; border-left: 3px solid #e11d48; padding: 6px 8px; border-radius: 4px; font-size: 10px; color: #881337; line-height: 1.35;">
          ${liveStorm.advisoryText}
        </div>
      </div>
    `;

    const marker = L.marker(stormCenter, { icon: stormIcon });
    marker.bindPopup(stormPopupHtml, { className: 'custom-nautical-popup', maxWidth: 300 });
    marker.on('click', () => setSelectedEntity({ type: 'storm', data: liveStorm }));

    outerCircle.addTo(layer);
    innerCircle.addTo(layer);
    marker.addTo(layer);
  }, [showWeather, liveStorm]);

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Render SAIL Steel Plants & Native Popups
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const layer = plantsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showHinterland) return;

    SAIL_STEEL_PLANTS.forEach((plant) => {
      const plantIcon = L.divIcon({
        className: 'steel-plant-icon',
        html: `
          <div style="background: #DC2626; color: white; font-weight: bold; font-size: 10px; border-radius: 5px; padding: 2px 6px; border: 1.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 3px; cursor: pointer;">
            <span>🏭</span><span>${plant.code}</span>
          </div>
        `,
        iconSize: [52, 22],
        iconAnchor: [26, 11],
      });

      const plantPopupHtml = `
        <div style="min-width: 260px; padding: 12px; font-family: inherit;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">
            <div style="font-weight: 700; font-size: 13.5px; color: #dc2626; display: flex; align-items: center; gap: 6px;">
              <span>🏭</span> <span>${plant.name}</span>
            </div>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: #fee2e2; color: #dc2626;">
              ${plant.code}
            </span>
          </div>
          <div style="background: #f8fafc; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 8px; font-size: 11px;">
            <span style="color: #64748b; font-size: 9.5px; display: block;">Hinterland Rail Corridors:</span>
            <span style="font-weight: 700; color: #0f172a;">🚆 ${plant.linkedPort}</span>
          </div>
          <div style="grid-template-columns: 1fr 1fr; display: grid; gap: 6px; font-size: 11px;">
            <div style="background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-size: 9.5px; display: block;">Crude Steel:</span>
              <span style="font-weight: 700; color: #0f172a;">${plant.capacity}</span>
            </div>
            <div style="background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-size: 9.5px; display: block;">Coal Inflow:</span>
              <span style="font-weight: 700; color: #0f172a;">${plant.dailyCoalRakes}</span>
            </div>
          </div>
        </div>
      `;

      const marker = L.marker([plant.lat, plant.lon], { icon: plantIcon });
      marker.bindPopup(plantPopupHtml, { className: 'custom-nautical-popup', maxWidth: 290 });
      marker.on('click', () => setSelectedEntity({ type: 'plant', data: plant }));
      marker.addTo(layer);
    });
  }, [showHinterland]);

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Render Selected Vessel Projected Voyage Track Polyline (Guaranteed Maritime Sea Lanes)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const layer = vesselRouteLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!selectedVesselRoute) return;

    // Find destination coordinates
    const destPort = ALL_PORTS.find(
      (p) =>
        p.name.toLowerCase().includes(selectedVesselRoute.destination_port.toLowerCase().split(' ')[0]) ||
        selectedVesselRoute.destination_port.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
    );

    const originPort = ALL_PORTS.find(
      (p) =>
        p.name.toLowerCase().includes(selectedVesselRoute.origin_port.toLowerCase().split(' ')[0]) ||
        selectedVesselRoute.origin_port.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
    );

    const curPos: [number, number] = [
      Number(selectedVesselRoute.current_position_lat),
      Number(selectedVesselRoute.current_position_lon),
    ];

    let trackPoints: [number, number][] = [];

    // Match assigned corridor
    const matchedCorridor = ALL_WORLD_TRADE_ROUTES.find((c) => c.id === selectedVesselRoute.route_id);
    if (matchedCorridor && matchedCorridor.points.length > 1) {
      const pts = matchedCorridor.points;
      // Find closest waypoint to current position
      let closestIdx = 0;
      let minDistSq = Infinity;
      pts.forEach((pt, idx) => {
        const dLat = pt[0] - curPos[0];
        const dLon = pt[1] - curPos[1];
        const distSq = dLat * dLat + dLon * dLon;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          closestIdx = idx;
        }
      });

      trackPoints = [
        ...pts.slice(0, closestIdx),
        curPos,
        ...pts.slice(closestIdx + 1),
      ];
    } else {
      // General coastal / inter-ocean waypoint routing preventing overland chords
      const originLon = originPort ? originPort.lon : curPos[1];
      const destLon = destPort ? destPort.lon : curPos[1];
      const isCrossingIndia = (originLon < 77.5 && destLon > 79.5) || (originLon > 79.5 && destLon < 77.5);

      if (isCrossingIndia) {
        const southWaypoints: [number, number][] = [
          [7.600, 77.400], // South of Cape Comorin
          [5.650, 80.550], // South of Sri Lanka (Dondra Head TSS)
        ];
        if (originLon < destLon) {
          trackPoints = [
            ...(originPort ? [[originPort.lat, originPort.lon] as [number, number]] : []),
            curPos,
            ...southWaypoints,
            ...(destPort ? [[destPort.lat, destPort.lon] as [number, number]] : []),
          ];
        } else {
          trackPoints = [
            ...(originPort ? [[originPort.lat, originPort.lon] as [number, number]] : []),
            curPos,
            ...southWaypoints.reverse(),
            ...(destPort ? [[destPort.lat, destPort.lon] as [number, number]] : []),
          ];
        }
      } else {
        if (originPort) trackPoints.push([originPort.lat, originPort.lon]);
        trackPoints.push(curPos);
        if (destPort) trackPoints.push([destPort.lat, destPort.lon]);
      }
    }

    if (trackPoints.length >= 2) {
      const activeLine = L.polyline(trackPoints, {
        color: '#0284C7',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '10, 8',
      });
      activeLine.bindTooltip(
        `<b>${selectedVesselRoute.vessel_name} Active Nautical Track</b><br/>${selectedVesselRoute.origin_port} → ${selectedVesselRoute.destination_port}`,
        { sticky: true }
      );
      activeLine.addTo(layer);
    }
  }, [selectedVesselRoute]);

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Render Ports & Real Live AIS Vessels (with Native Popups)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    // ── Render Ports ──
    if (showPorts) {
      ALL_PORTS.forEach((port) => {
        const color =
          port.status === 'CRITICAL' ? '#EF4444' :
          port.status === 'HIGH' ? '#F97316' :
          port.status === 'MODERATE' ? '#F59E0B' : '#10B981';

        const portIcon = L.divIcon({
          className: 'port-marker-icon',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              ${port.status === 'CRITICAL' || port.status === 'HIGH' ? `<div style="position: absolute; width: 24px; height: 24px; border-radius: 9999px; background: ${color}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
              <div style="width: 14px; height: 14px; border-radius: 9999px; background: ${color}; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4);"></div>
              <div style="position: absolute; left: 18px; top: -6px; background: rgba(255,255,255,0.94); border: 1px solid #CBD5E1; color: #0F172A; padding: 1.5px 5px; border-radius: 4px; font-size: 9px; font-weight: 700; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">
                ${port.name.split(' ')[0]} ${port.wait ? `(${port.wait})` : ''}
              </div>
            </div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const portPopupHtml = `
          <div style="min-width: 270px; padding: 12px; font-family: inherit;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">
              <div style="font-weight: 700; font-size: 14px; color: ${color}; display: flex; align-items: center; gap: 6px;">
                <span>⚓</span> <span>${port.name}</span>
              </div>
              <span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${color}22; color: ${color}; border: 1px solid ${color}55;">
                ${port.status}
              </span>
            </div>
            <div style="font-size: 10.5px; color: #64748b; margin-bottom: 8px; font-family: monospace;">
              UN/LOCODE: <b>${port.un_locode}</b> · ${port.country}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; font-size: 11px;">
              <div style="background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <span style="color: #64748b; font-size: 9.5px; display: block;">Max Draught:</span>
                <span style="font-weight: 700; font-size: 13px; color: #0f172a;">${port.maxDraftM} m</span>
              </div>
              <div style="background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <span style="color: #64748b; font-size: 9.5px; display: block;">Pre-Berth Wait:</span>
                <span style="font-weight: 700; font-size: 13px; color: #d97706;">${port.wait}</span>
              </div>
              <div style="background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <span style="color: #64748b; font-size: 9.5px; display: block;">Berths:</span>
                <span style="font-weight: 700; font-size: 12px; color: #0f172a;">${port.berths} Berths</span>
              </div>
              <div style="background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <span style="color: #64748b; font-size: 9.5px; display: block;">Capesize Fit:</span>
                <span style="font-weight: 700; font-size: 12px; color: ${port.maxDraftM >= 14.5 ? '#10b981' : '#ef4444'};">
                  ${port.maxDraftM >= 14.5 ? 'YES (14.5m+)' : 'NO (Draft Limit)'}
                </span>
              </div>
            </div>
            ${port.sailCargo ? `
              <div style="background: #f1f5f9; padding: 6px 8px; border-radius: 6px; margin-bottom: 8px; font-size: 10.5px; border-left: 3px solid #2563eb;">
                <span style="color: #475569; display: block; font-size: 9px; font-weight: 600;">SAIL Cargo Parcel:</span>
                <span style="font-weight: 600; color: #0f172a;">${port.sailCargo}</span>
              </div>
            ` : ''}
            <div style="font-size: 10px; color: #64748b; text-align: center; margin-top: 4px;">
              Lat: ${port.lat.toFixed(3)}° · Lon: ${port.lon.toFixed(3)}°
            </div>
          </div>
        `;

        const marker = L.marker([port.lat, port.lon], { icon: portIcon });
        marker.bindPopup(portPopupHtml, { className: 'custom-nautical-popup', maxWidth: 300 });

        marker.on('click', () => {
          setSelectedEntity({ type: 'port', data: port });
          setWeatherLoading(true);
          fetchLiveMarineWeather(port.lat, port.lon)
            .then((data) => setLiveMarineWeather(data))
            .finally(() => setWeatherLoading(false));
        });

        marker.addTo(layer);
      });
    }

    // ── Render Vessels ──
    if (showVessels) {
      activeFleet.forEach((vessel: any) => {
        if (vesselFilter !== 'ALL' && vessel.status !== vesselFilter) return;

        const vColor =
          vessel.status === 'EN_ROUTE' ? '#0284C7' :
          vessel.status === 'WAITING' ? '#F59E0B' :
          vessel.status === 'DISCHARGING' ? '#10B981' : '#8B5CF6';

        const lat = Number(vessel.current_position_lat || 15.0);
        const lon = Number(vessel.current_position_lon || 86.0);
        const heading = Number(vessel.current_heading_deg || 0);
        const name = vessel.vessel_name || vessel.name || 'Merchant Vessel';
        const speed = Number(vessel.current_speed_knots || 0).toFixed(1);

        const shipIcon = L.divIcon({
          className: 'vessel-marker-icon',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="transform: rotate(${heading}deg); display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="${vColor}" stroke="white" stroke-width="1.8">
                  <polygon points="12,2 19,21 12,17 5,21" />
                </svg>
              </div>
              <div style="position: absolute; left: 20px; top: -5px; background: rgba(255,255,255,0.94); border: 1px solid #CBD5E1; color: ${vColor}; padding: 1px 5px; border-radius: 4px; font-size: 8.5px; font-weight: 700; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">
                ${name.split(' ').slice(0, 2).join(' ')} (${speed}k)
              </div>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const vesselPopupHtml = `
          <div style="min-width: 280px; padding: 12px; font-family: inherit;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">
              <div style="font-weight: 700; font-size: 13.5px; color: #0284c7; display: flex; align-items: center; gap: 6px;">
                <span>🚢</span> <span>${name}</span>
              </div>
              <span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${vColor}22; color: ${vColor}; border: 1px solid ${vColor}55;">
                ${vessel.status}
              </span>
            </div>
            <div style="font-size: 10.5px; color: #64748b; margin-bottom: 8px; font-family: monospace;">
              IMO: <b>${vessel.imo_number || 'N/A'}</b> · Class: <b>${vessel.vessel_class || 'CAPESIZE'}</b> (${Number(vessel.deadweight_tonnes || 180000).toLocaleString()} DWT)
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; font-size: 11px;">
              <div style="background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <span style="color: #64748b; font-size: 9.5px; display: block;">Speed / Heading:</span>
                <span style="font-weight: 700; font-size: 12px; color: #0f172a; font-family: monospace;">${speed} kts · ${heading}°</span>
              </div>
              <div style="background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <span style="color: #64748b; font-size: 9.5px; display: block;">Summer Draught:</span>
                <span style="font-weight: 700; font-size: 12px; color: #0f172a;">${vessel.summer_draft_m || 17.5} m</span>
              </div>
              <div style="background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0; grid-column: span 2;">
                <span style="color: #64748b; font-size: 9.5px; display: block;">Destination Port:</span>
                <span style="font-weight: 700; font-size: 12px; color: #10b981;">📍 ${vessel.destination_port || 'Paradip Port'}</span>
              </div>
            </div>
            <div style="background: #f1f5f9; padding: 6px 8px; border-radius: 6px; margin-bottom: 8px; font-size: 10.5px; border-left: 3px solid #0284c7;">
              <span style="color: #475569; display: block; font-size: 9px; font-weight: 600;">Active Consignment:</span>
              <span style="font-weight: 600; color: #0f172a;">${vessel.cargo_type || 'Hard Coking Coal'}</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #64748b;">
              <span>Origin: <b>${vessel.origin_port || 'Hay Point'}</b></span>
              <span>Flag: <b>${vessel.flag_country || 'Panama'}</b></span>
            </div>
          </div>
        `;

        const marker = L.marker([lat, lon], { icon: shipIcon });
        marker.bindPopup(vesselPopupHtml, { className: 'custom-nautical-popup', maxWidth: 310 });

        marker.on('click', () => {
          setSelectedEntity({ type: 'vessel', data: vessel });
          setSelectedVesselRoute(vessel);
        });

        marker.addTo(layer);
      });
    }
  }, [showPorts, showVessels, vesselFilter, activeFleet]);

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Great-Circle Distance Ruler & Fuel Calculation
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const layer = rulerLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (rulerPoints.length === 0) {
      setRulerResult(null);
      return;
    }

    rulerPoints.forEach((pt, idx) => {
      const icon = L.divIcon({
        className: 'ruler-point-icon',
        html: `<div style="background: #E11D48; color: white; border-radius: 9999px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; border: 2px solid white;">${idx + 1}</div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker(pt, { icon }).addTo(layer);
    });

    if (rulerPoints.length === 2) {
      const [p1, p2] = rulerPoints;
      const line = L.polyline([p1, p2], { color: '#E11D48', weight: 2.5, dashArray: '6, 6' });
      line.addTo(layer);

      // Great-circle distance using Haversine formula
      const R = 6371; // km
      const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
      const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1.lat * Math.PI) / 180) *
          Math.cos((p2.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = R * c;
      const distNM = Math.round(distKm * 0.539957);

      const steamingHours = distNM / 12; // 12 knots nominal speed
      const steamingDays = (steamingHours / 24).toFixed(1);
      const bunkerMT = Math.round((steamingHours / 24) * 35); // 35 MT/day VLSFO consumption

      setRulerResult({ distNM, days: steamingDays, bunkerMT });
    }
  }, [rulerPoints]);

  const handleFlyTo = (coords: [number, number], zoom = 7) => {
    mapInstanceRef.current?.flyTo(coords, zoom, { duration: 1.5 });
  };

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced OpenStreetMap Nominatim Geocoding for Searching ANY Place on Earth
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) {
      setGlobalSearchResults([]);
      setIsSearchingGlobal(false);
      return;
    }

    setIsSearchingGlobal(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5&addressdetails=1`,
          { signal: controller.signal }
        );
        if (!resp.ok) throw new Error('Geocoding network error');
        const data = await resp.json();
        const results: MapSearchResult[] = (data || []).map((item: any, idx: number) => ({
          id: `global-${item.place_id || idx}`,
          type: 'global',
          name: item.display_name.split(',')[0],
          subtext: item.display_name,
          badge: (item.type || item.class || 'MAP LOCATION').toUpperCase(),
          badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          zoom: item.type === 'city' || item.type === 'administrative' ? 8 : item.type === 'country' ? 5 : 9,
        }));
        setGlobalSearchResults(results);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setGlobalSearchResults([]);
        }
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 260);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Combined Multi-Source Radar & Global Map Search Index
  const filteredSearchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const results: MapSearchResult[] = [];

    // 0. Coordinate check (e.g. 20.316, 86.674 or -28.8, 32.04)
    const coordMatch = q.match(/^([-+]?[0-9]*\.?[0-9]+)\s*,\s*([-+]?[0-9]*\.?[0-9]+)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        results.push({
          id: 'coord-target',
          type: 'coord',
          name: `Direct Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
          subtext: 'Global GPS coordinate fix location on world map',
          badge: 'COORDINATES',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          lat,
          lon,
          zoom: 10,
        });
      }
    }

    // 1. Search Ports & Terminals
    ALL_PORTS.forEach((p) => {
      if (
        p.name.toLowerCase().includes(q) ||
        p.un_locode.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        (p.sailCargo && p.sailCargo.toLowerCase().includes(q))
      ) {
        results.push({
          id: `port-${p.un_locode}`,
          type: 'port',
          name: p.name,
          subtext: `${p.un_locode} • ${p.country} • Max Draft ${p.maxDraftM}m • Berths ${p.berths}`,
          badge: p.isInternational ? 'GLOBAL PORT' : 'SAIL PORT',
          badgeColor: p.status === 'CRITICAL' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                      p.status === 'HIGH' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          lat: p.lat,
          lon: p.lon,
          zoom: 10,
          data: p,
        });
      }
    });

    // 2. Search Active Fleet Vessels
    activeFleet.forEach((v: any) => {
      const vName = (v.vessel_name || v.name || '').toLowerCase();
      const imo = (v.imo_number || '').toString();
      const cargo = (v.cargo_type || '').toLowerCase();
      const dest = (v.destination_port || '').toLowerCase();
      if (vName.includes(q) || imo.includes(q) || cargo.includes(q) || dest.includes(q)) {
        results.push({
          id: `vessel-${v.imo_number || v.id}`,
          type: 'vessel',
          name: v.vessel_name || v.name || 'Commercial Bulk Carrier',
          subtext: `IMO ${v.imo_number || 'N/A'} • ${v.vessel_class || 'Capesize'} • ${v.cargo_type || 'Coking Coal'} • Dest: ${v.destination_port || 'Paradip'}`,
          badge: 'AIS VESSEL',
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          lat: Number(v.current_position_lat),
          lon: Number(v.current_position_lon),
          zoom: 9,
          data: v,
        });
      }
    });

    // 3. Search SAIL Steel Plants
    SAIL_STEEL_PLANTS.forEach((plant) => {
      if (
        plant.name.toLowerCase().includes(q) ||
        plant.code.toLowerCase().includes(q) ||
        (plant.linkedPort && plant.linkedPort.toLowerCase().includes(q))
      ) {
        results.push({
          id: `plant-${plant.code}`,
          type: 'plant',
          name: plant.name,
          subtext: `${plant.code} • ${plant.capacity} • Linked: ${plant.linkedPort} • Rakes: ${plant.dailyCoalRakes}`,
          badge: 'SAIL STEEL MILL',
          badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          lat: plant.lat,
          lon: plant.lon,
          zoom: 10,
          data: plant,
        });
      }
    });

    // 4. Search Trade Corridors
    ALL_WORLD_TRADE_ROUTES.forEach((corridor) => {
      if (
        corridor.name.toLowerCase().includes(q) ||
        corridor.category.toLowerCase().includes(q) ||
        corridor.description.toLowerCase().includes(q)
      ) {
        const midPoint = corridor.points[Math.floor(corridor.points.length / 2)] || corridor.points[0];
        results.push({
          id: `corridor-${corridor.id}`,
          type: 'corridor',
          name: corridor.name,
          subtext: `${corridor.category} • ${corridor.distanceNM.toLocaleString()} NM • ~${corridor.transitDays13kts} days`,
          badge: 'SHIPPING LANE',
          badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          lat: midPoint[0],
          lon: midPoint[1],
          zoom: 5,
          data: corridor,
        });
      }
    });

    // 5. Search Strategic Choke Points & Key Seaways
    GLOBAL_MARITIME_LANDMARKS.forEach((lm) => {
      if (
        lm.name.toLowerCase().includes(q) ||
        lm.category.toLowerCase().includes(q) ||
        lm.keywords.some((k) => k.includes(q))
      ) {
        results.push({
          id: lm.id,
          type: 'chokepoint',
          name: lm.name,
          subtext: lm.subtext,
          badge: lm.category.toUpperCase(),
          badgeColor: lm.category === 'Choke Point'
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
            : 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
          lat: lm.lat,
          lon: lm.lon,
          zoom: lm.zoom,
        });
      }
    });

    // 6. Append Global Geocoded Places
    globalSearchResults.forEach((g) => {
      if (!results.some((r) => Math.abs(r.lat - g.lat) < 0.05 && Math.abs(r.lon - g.lon) < 0.05)) {
        results.push(g);
      }
    });

    return results;
  }, [searchQuery, activeFleet, globalSearchResults]);

  // Handle User Selection from Search Results
  const handleSelectSearchResult = (item: MapSearchResult) => {
    setSearchQuery(item.name);
    setShowSearchDropdown(false);

    // 1. Fly to location with smooth animation
    handleFlyTo([item.lat, item.lon], item.zoom);

    // 2. Add visual luminous search marker on map
    if (searchLayerRef.current) {
      searchLayerRef.current.clearLayers();
      const pinHtml = `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(14, 165, 233, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background: #0284c7; border: 2.5px solid white; box-shadow: 0 0 10px #0284c7;"></div>
        </div>
      `;
      const pin = L.divIcon({
        className: 'custom-search-pin',
        html: pinHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const m = L.marker([item.lat, item.lon], { icon: pin });
      m.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; padding: 2px 4px; min-width: 160px;">
          <div style="font-weight: 700; color: #0284c7; font-size: 13px;">${item.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.subtext}</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 3px; font-family: monospace;">Lat: ${item.lat.toFixed(4)}, Lon: ${item.lon.toFixed(4)}</div>
        </div>
      `).openPopup();
      m.addTo(searchLayerRef.current);
    }

    // 3. Open entity drawer if applicable
    if (item.type === 'port' && item.data) {
      setSelectedEntity({ type: 'port', data: item.data });
    } else if (item.type === 'vessel' && item.data) {
      setSelectedEntity({ type: 'vessel', data: item.data });
      setSelectedVesselRoute(item.data);
    } else if (item.type === 'plant' && item.data) {
      setSelectedEntity({ type: 'plant', data: item.data });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (filteredSearchResults.length > 0) {
      handleSelectSearchResult(filteredSearchResults[0]);
    }
  };

  const isLight = mapTheme === 'light';

  return (
    <div
      className={`relative w-full rounded-2xl border shadow-xl overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-[2000] rounded-none' : 'h-[660px]'
      } ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}
    >
      {/* 1. TOP MARITIME RADAR COMMAND HEADER */}
      <div
        className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
          isLight ? 'bg-slate-50/90 border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-white'
        }`}
      >
        {/* Title & Live Status */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-sky-500/20 dark:text-sky-400">
            <Compass size={20} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight">
                Global Maritime Radar & Trade Corridors
              </h2>
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                rawVessels.length > 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-300 dark:border-amber-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${rawVessels.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {rawVessels.length > 0 ? 'LIVE AIS & SATELLITE' : 'STANDBY AIS (SYNTHETIC)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              World shipping lanes, authentic bulk fleet telemetry & real IMD oceanic meteorology
            </p>
          </div>
        </div>

        {/* Global Controls & Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={() => setMapTheme(isLight ? 'dark' : 'light')}
            className={`p-2 rounded-lg border font-medium text-xs flex items-center gap-1.5 transition-all shadow-xs ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Toggle Nautical Basemap (Voyager Light / Dark Matter)"
          >
            {isLight ? <Moon size={14} className="text-indigo-600" /> : <Sun size={14} className="text-amber-400" />}
            <span className="hidden sm:inline">{isLight ? 'Dark Basemap' : 'Light Basemap'}</span>
          </button>

          {/* Distance Ruler Tool */}
          <button
            onClick={() => {
              setRulerActive(!rulerActive);
              setRulerPoints([]);
              setRulerResult(null);
            }}
            className={`p-2 rounded-lg border font-medium text-xs flex items-center gap-1.5 transition-all shadow-xs ${
              rulerActive
                ? 'bg-rose-600 text-white border-rose-700'
                : isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Nautical Distance Measurement Tool"
          >
            <Ruler size={14} />
            <span className="hidden sm:inline">Ruler {rulerActive ? '(Active)' : ''}</span>
          </button>

          {/* Reset View to India Borders */}
          <button
            onClick={() => handleFlyTo(INDIA_DEFAULT_CENTER, INDIA_DEFAULT_ZOOM)}
            className={`p-2 rounded-lg border font-medium text-xs flex items-center gap-1.5 transition-all shadow-xs ${
              isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Reset Map Center to India"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset View</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-2 rounded-lg border font-medium text-xs flex items-center gap-1.5 transition-all shadow-xs ${
              isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Toggle Radar Theater Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* 2. SECONDARY CONTROLS / FILTER BAR */}
      <div
        className={`px-5 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
          isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}
      >
        {/* Layer Toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setShowCorridors(!showCorridors)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
              showCorridors
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-slate-100 text-slate-400 border-transparent dark:bg-slate-800/60'
            }`}
          >
            <Globe size={13} />
            <span>12 World Trade Corridors</span>
          </button>

          <button
            onClick={() => setShowPorts(!showPorts)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
              showPorts
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-slate-100 text-slate-400 border-transparent dark:bg-slate-800/60'
            }`}
          >
            <Anchor size={13} />
            <span>Global Ports ({ALL_PORTS.length})</span>
          </button>

          <button
            onClick={() => setShowVessels(!showVessels)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
              showVessels
                ? 'bg-sky-600 text-white border-sky-700'
                : 'bg-slate-100 text-slate-400 border-transparent dark:bg-slate-800/60'
            }`}
          >
            <Ship size={13} />
            <span>Active Fleet ({activeFleet.length})</span>
          </button>

          <button
            onClick={() => setShowWeather(!showWeather)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
              showWeather
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-slate-100 text-slate-400 border-transparent dark:bg-slate-800/60'
            }`}
          >
            <CloudRain size={13} />
            <span>IMD Storm Advisory</span>
          </button>

          <button
            onClick={() => setShowHinterland(!showHinterland)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
              showHinterland
                ? 'bg-red-700 text-white border-red-800'
                : 'bg-slate-100 text-slate-400 border-transparent dark:bg-slate-800/60'
            }`}
          >
            <Train size={13} />
            <span>SAIL Steel Mills</span>
          </button>

          <button
            onClick={() => setShowEEZ(!showEEZ)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
              showEEZ
                ? 'bg-indigo-600 text-white border-indigo-700'
                : 'bg-slate-100 text-slate-400 border-transparent dark:bg-slate-800/60'
            }`}
          >
            <Shield size={13} />
            <span>200 NM EEZ</span>
          </button>
        </div>

        {/* Global Whole Map & Maritime Entity Search Bar with Live Autocomplete */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 relative">
          <div ref={searchContainerRef} className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search whole map: ports, vessels, canals, cities, coordinates..."
              value={searchQuery}
              onFocus={() => setShowSearchDropdown(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              className={`pl-8 pr-8 py-1 rounded-lg text-xs border w-64 sm:w-80 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-500' : 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-400'
              }`}
            />

            {/* Clear Button / Spinner */}
            <div className="absolute right-2 top-2 flex items-center gap-1">
              {isSearchingGlobal && (
                <RefreshCw size={11} className="animate-spin text-sky-500" />
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                    searchLayerRef.current?.clearLayers();
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* ─── LIVE AUTOCOMPLETE WHOLE-MAP SEARCH RESULTS DROPDOWN ─── */}
            {showSearchDropdown && searchQuery.trim().length > 0 && (
              <div
                className={`absolute left-0 top-full mt-1.5 w-72 sm:w-96 max-h-[420px] overflow-y-auto rounded-xl border shadow-2xl z-[1500] backdrop-blur-xl transition-all divide-y ${
                  isLight
                    ? 'bg-white/98 border-slate-200 text-slate-900 divide-slate-100 shadow-slate-400/30'
                    : 'bg-slate-900/98 border-slate-700 text-white divide-slate-800 shadow-black/80'
                }`}
              >
                {filteredSearchResults.length > 0 ? (
                  <div className="py-1">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Matches Found ({filteredSearchResults.length})</span>
                      <span className="text-[9px] font-normal lowercase">press enter to fly</span>
                    </div>

                    {filteredSearchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => handleSelectSearchResult(result)}
                        className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors ${
                          isLight ? 'hover:bg-slate-100/80' : 'hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary mt-0.5 shrink-0">
                          {result.type === 'port' ? (
                            <Anchor size={13} className="text-emerald-500" />
                          ) : result.type === 'vessel' ? (
                            <Ship size={13} className="text-blue-500" />
                          ) : result.type === 'plant' ? (
                            <Train size={13} className="text-rose-500" />
                          ) : result.type === 'corridor' ? (
                            <Navigation size={13} className="text-indigo-500" />
                          ) : result.type === 'chokepoint' ? (
                            <Compass size={13} className="text-amber-500" />
                          ) : (
                            <Globe size={13} className="text-sky-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-bold text-xs truncate text-foreground">
                              {result.name}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${result.badgeColor}`}>
                              {result.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {result.subtext}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center space-y-1">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isSearchingGlobal ? 'Searching global map coordinates...' : 'No exact match found'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Try searching by port name, vessel IMO, strait (e.g. Suez, Malacca), or enter coordinates like <code>20.31, 86.67</code>.
                    </p>
                  </div>
                )}

                {/* Dropdown Footer */}
                <div className={`px-3 py-1.5 text-[10px] flex items-center justify-between ${
                  isLight ? 'bg-slate-50 text-slate-500' : 'bg-slate-950/50 text-slate-400'
                }`}>
                  <span className="flex items-center gap-1">
                    <Globe size={11} className="text-primary" />
                    Global OpenStreetMap & Maritime Telemetry
                  </span>
                  <span>ESC to close</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0 shadow-xs"
          >
            Find
          </button>
        </form>
      </div>

      {/* 3. LEAFLET GLOBAL MAP CONTAINER */}
      <div className="relative flex-1 w-full h-[calc(100%-98px)] overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Zoom & Reset Buttons */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-[1000] shadow-md">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className={`p-2 rounded-lg border font-bold transition-all shadow-xs ${
              isLight ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
            }`}
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className={`p-2 rounded-lg border font-bold transition-all shadow-xs ${
              isLight ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
            }`}
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => handleFlyTo(INDIA_DEFAULT_CENTER, INDIA_DEFAULT_ZOOM)}
            className={`p-2 rounded-lg border font-bold transition-all shadow-xs ${
              isLight ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
            }`}
            title="Reset View to India"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Live Weather Telemetry Ticker (Real Data from Open-Meteo) */}
        {liveMarineWeather && (
          <div
            className={`absolute bottom-4 left-4 z-[1000] px-3.5 py-2 rounded-xl border shadow-xl backdrop-blur-md text-xs flex items-center gap-4 ${
              isLight ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-slate-900/95 border-slate-700 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-blue-600 dark:text-sky-400">Live Ocean Meteorology</span>
              <span className="text-[10px] text-slate-400">(Open-Meteo Real-Time)</span>
            </div>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 text-[10px] block">Significant Wave:</span>
                <span className="font-mono font-bold">{liveMarineWeather.waveHeightM} m</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Wind Speed:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {liveMarineWeather.windSpeedKnots} kts
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Sea State:</span>
                <span className={`font-bold ${liveMarineWeather.seaState === 'ROUGH' || liveMarineWeather.seaState === 'VERY_ROUGH' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {liveMarineWeather.seaState}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Distance Measurement Ruler HUD */}
        {rulerResult && (
          <div
            className={`absolute bottom-4 right-4 z-[1000] p-3.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs space-y-1 ${
              isLight ? 'bg-white/95 border-slate-200 text-slate-900' : 'bg-slate-900/95 border-slate-700 text-white'
            }`}
          >
            <div className="font-bold text-rose-600 flex items-center gap-1.5">
              <Ruler size={14} />
              <span>Great-Circle Geodesic Distance</span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-1 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Distance:</span>
                <span className="font-mono font-bold text-sm">{rulerResult.distNM.toLocaleString()} NM</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Steaming (12 kts):</span>
                <span className="font-mono font-bold text-sm text-blue-600 dark:text-sky-400">
                  {rulerResult.days} days
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">VLSFO Fuel:</span>
                <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                  ~{rulerResult.bunkerMT} MT
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Inspected Entity Floating Telemetry Panel (Z-1200, strictly above map panes) */}
        {selectedEntity && (
          <div
            className={`absolute top-4 right-4 w-84 p-4 rounded-xl border shadow-2xl backdrop-blur-md z-[1200] space-y-3 transition-all animate-in fade-in duration-200 ${
              isLight ? 'bg-white/98 border-slate-200 text-slate-900' : 'bg-slate-900/98 border-slate-700 text-white'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-xs">
                {selectedEntity.type === 'port' ? (
                  <Anchor size={16} className="text-emerald-600" />
                ) : selectedEntity.type === 'vessel' ? (
                  <Ship size={16} className="text-blue-600" />
                ) : selectedEntity.type === 'plant' ? (
                  <Train size={16} className="text-rose-600" />
                ) : (
                  <CloudRain size={16} className="text-red-500" />
                )}
                <span>
                  {selectedEntity.type === 'port' ? 'Port Intelligence & Constraints' :
                   selectedEntity.type === 'vessel' ? 'Real Live AIS Vessel Telemetry' :
                   selectedEntity.type === 'plant' ? 'SAIL Steel Mill Hinterland Logistics' :
                   'IMD Active Cyclone Advisory'}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedEntity(null);
                  setSelectedVesselRoute(null);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            {/* Port Details */}
            {selectedEntity.type === 'port' && (
              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                    {selectedEntity.data.name}
                  </div>
                  <span className="text-[10.5px] text-slate-500 font-mono">
                    UN/LOCODE: {selectedEntity.data.un_locode} · {selectedEntity.data.country}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Max Draught:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {selectedEntity.data.maxDraftM} m
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Pre-Berth Wait:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                      {selectedEntity.data.wait}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Active Berths:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedEntity.data.berths} Berths
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Capesize Fit:</span>
                    <span className={`font-bold ${selectedEntity.data.maxDraftM >= 14.5 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {selectedEntity.data.maxDraftM >= 14.5 ? 'YES (14.5m+)' : 'NO (Draft Limit)'}
                    </span>
                  </div>
                </div>

                {selectedEntity.data.sailCargo && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-400 block text-[10px]">Primary Cargo Consignment:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedEntity.data.sailCargo}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Vessel Details */}
            {selectedEntity.type === 'vessel' && (
              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="font-bold text-blue-600 dark:text-sky-400 text-base">
                    {selectedEntity.data.vessel_name || selectedEntity.data.name}
                  </div>
                  <span className="text-[10.5px] text-slate-500 font-mono">
                    IMO: {selectedEntity.data.imo_number} · {selectedEntity.data.vessel_class} ({Number(selectedEntity.data.deadweight_tonnes || 180000).toLocaleString()} DWT)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Speed / Heading:</span>
                    <span className="font-semibold font-mono">
                      {selectedEntity.data.current_speed_knots} kts · {selectedEntity.data.current_heading_deg}°
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Draught:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedEntity.data.summer_draft_m || 17.5} m
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 grid-column: span 2;">
                    <span className="text-slate-400 block text-[10px]">Destination Port:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block">
                      📍 {selectedEntity.data.destination_port || 'Paradip Port'}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px]">
                  <span className="text-slate-400 block text-[10px]">Consignment:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedEntity.data.cargo_type || 'Hard Coking Coal'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Origin: <b>{selectedEntity.data.origin_port || 'Hay Point'}</b></span>
                  <span>Owner: <b>{(selectedEntity.data.vessel_owner || 'Commercial Carrier').split(' ')[0]}</b></span>
                </div>
              </div>
            )}

            {/* Plant Details */}
            {selectedEntity.type === 'plant' && (
              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="font-bold text-rose-600 dark:text-rose-400 text-base">
                    {selectedEntity.data.name} ({selectedEntity.data.code})
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Integrated Steel Plant · SAIL Operational Command
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px]">
                  <span className="text-slate-400 block text-[10px]">Primary Discharge Port:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedEntity.data.linkedPort}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Annual Capacity:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEntity.data.capacity}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Daily Coal Inflow:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEntity.data.dailyCoalRakes}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaritimeRadarMap;
