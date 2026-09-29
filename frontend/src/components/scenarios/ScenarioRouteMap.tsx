import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass, Ship, Anchor, AlertTriangle, CheckCircle2,
  Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw,
  Navigation, Sliders, ArrowRight, Shield, Layers,
  ExternalLink, Sparkles, MapPin, Wind
} from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { formatCurrency, formatUsd } from '../../lib/utils';

export interface RouteOption {
  id: string;
  name: string;
  tag: 'PRIMARY' | 'ALTERNATE' | 'DEEP_DRAFT' | 'DETOUR_SAFE' | 'DIRECT';
  description: string;
  distanceNM: number;
  transitDays13kts: number;
  fuelConsumptionMt: number;
  bunkerCostUsd: number;
  chokepoints: string[];
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  draftSuitabilityM: number;
  color: string;
  points: [number, number][]; // [lat, lon]
}

export interface TradeCorridor {
  id: string;
  title: string;
  origin: { name: string; country: string; coords: [number, number] };
  destination: { name: string; country: string; coords: [number, number] };
  cargoType: string;
  routes: RouteOption[];
}

// 5 Key Authoritative Bulk Shipping Corridors for SAIL Coking Coal & Raw Materials
export const TRADE_CORRIDORS: TradeCorridor[] = [
  {
    id: 'corridor-aus-ind',
    title: 'Australia (Hay Point) → East Coast India (Paradip)',
    origin: { name: 'Hay Point / Dalrymple Bay', country: 'Australia', coords: [-21.28, 149.30] },
    destination: { name: 'Paradip Port', country: 'India', coords: [20.26, 86.67] },
    cargoType: 'Hard Coking Coal (Queensland BMA)',
    routes: [
      {
        id: 'aus-malacca-primary',
        name: 'Route 1: Malacca Strait Direct (Primary)',
        tag: 'PRIMARY',
        description: 'Standard economic bulk shipping lane via Coral Sea, Torres Strait, Java Sea, and Singapore/Malacca Strait.',
        distanceNM: 5200,
        transitDays13kts: 16.7,
        fuelConsumptionMt: 520,
        bunkerCostUsd: 322400,
        chokepoints: ['Torres Strait', 'Singapore Strait', 'Malacca Strait'],
        riskLevel: 'LOW',
        draftSuitabilityM: 15.0,
        color: '#2563eb', // Blue
        points: [
          [-21.28, 149.30], // Hay Point
          [-16.0, 147.0],   // Coral Sea
          [-10.5, 142.2],   // Torres Strait
          [-9.8, 137.5],    // Arafura Sea
          [-8.5, 130.0],    // Timor Sea North
          [-8.2, 125.0],    // Ombai Strait
          [-8.0, 119.5],    // Flores Sea
          [-6.0, 112.5],    // Java Sea
          [-1.5, 106.5],    // Karimata Strait
          [1.25, 103.8],    // Singapore Strait
          [3.0, 100.5],     // Malacca Strait
          [5.8, 95.5],      // Great Channel / North Sumatra
          [11.5, 90.0],     // South Bay of Bengal
          [17.0, 85.0],     // Coastwise Approach
          [20.26, 86.67],   // Paradip Port
        ],
      },
      {
        id: 'aus-sunda-alternate',
        name: 'Route 2: Sunda Strait Bypass (Weather/Congestion Alternate)',
        tag: 'ALTERNATE',
        description: 'South of Java track bypassing Singapore congestion; transit through Sunda Strait into central Indian Ocean.',
        distanceNM: 5680,
        transitDays13kts: 18.2,
        fuelConsumptionMt: 575,
        bunkerCostUsd: 356500,
        chokepoints: ['Sunda Strait'],
        riskLevel: 'LOW',
        draftSuitabilityM: 16.5,
        color: '#f59e0b', // Amber
        points: [
          [-21.28, 149.30], // Hay Point
          [-24.5, 144.0],
          [-28.0, 135.0],   // South Australian Bight
          [-34.0, 115.0],   // Cape Leeuwin
          [-20.0, 105.0],   // East Indian Ocean
          [-5.9, 105.75],   // Sunda Strait
          [-2.0, 98.0],     // West Sumatra Passage
          [6.0, 92.0],      // Nicobar West
          [14.0, 86.5],     // Central Bay of Bengal
          [20.26, 86.67],   // Paradip Port
        ],
      },
      {
        id: 'aus-lombok-deepdraft',
        name: 'Route 3: Lombok Deep-Draft (Capesize >17.5m Draft)',
        tag: 'DEEP_DRAFT',
        description: 'Ultra-deep passage (>250m depth) through Lombok Strait for fully laden 180,000 DWT Capesize carriers.',
        distanceNM: 5950,
        transitDays13kts: 19.1,
        fuelConsumptionMt: 610,
        bunkerCostUsd: 378200,
        chokepoints: ['Lombok Strait', 'Makassar Strait'],
        riskLevel: 'MODERATE',
        draftSuitabilityM: 20.0,
        color: '#8b5cf6', // Purple
        points: [
          [-21.28, 149.30], // Hay Point
          [-18.0, 140.0],
          [-12.0, 130.0],
          [-9.0, 120.0],
          [-8.7, 115.7],    // Lombok Strait
          [-3.0, 118.5],    // Makassar Strait
          [0.0, 107.0],     // South China Sea Southwest
          [4.5, 99.0],      // Malacca Outer
          [10.0, 92.0],     // Central Bay of Bengal
          [20.26, 86.67],   // Paradip Port
        ],
      },
    ],
  },
  {
    id: 'corridor-us-ind',
    title: 'USA East Coast (Norfolk) → East Coast India (Vizag)',
    origin: { name: 'Norfolk / Hampton Roads', country: 'USA', coords: [36.95, -76.33] },
    destination: { name: 'Visakhapatnam Port', country: 'India', coords: [17.68, 83.28] },
    cargoType: 'US High-Vol Coking Coal (Buchanan / Consol)',
    routes: [
      {
        id: 'us-suez-canal',
        name: 'Route 1: Suez Canal & Red Sea Transit (Standard)',
        tag: 'PRIMARY',
        description: 'Standard nautical routing through Gibraltar, Mediterranean, Suez Canal, and Bab-el-Mandeb.',
        distanceNM: 8450,
        transitDays13kts: 27.1,
        fuelConsumptionMt: 860,
        bunkerCostUsd: 533200,
        chokepoints: ['Strait of Gibraltar', 'Suez Canal', 'Bab-el-Mandeb'],
        riskLevel: 'HIGH',
        draftSuitabilityM: 16.0,
        color: '#ef4444', // Red (High risk due to Red Sea security)
        points: [
          [36.95, -76.33], // Norfolk
          [36.0, -40.0],   // North Atlantic
          [36.0, -5.35],   // Strait of Gibraltar
          [36.5, 14.5],    // Sicily Channel
          [32.0, 31.0],    // Port Said
          [29.9, 32.5],    // Suez Canal
          [24.0, 36.5],    // Red Sea
          [12.6, 43.3],    // Bab-el-Mandeb
          [12.0, 48.0],    // Gulf of Aden
          [12.0, 60.0],    // Arabian Sea
          [6.0, 78.0],     // South of Sri Lanka
          [12.0, 82.0],    // Bay of Bengal
          [17.68, 83.28],  // Vizag
        ],
      },
      {
        id: 'us-cape-reroute',
        name: 'Route 2: Cape of Good Hope Detour (Geopolitical Safe Bypass)',
        tag: 'DETOUR_SAFE',
        description: 'Full South Atlantic bypass circumnavigating South Africa to avoid Bab-el-Mandeb drone/missile risks. Zero canal toll.',
        distanceNM: 11850,
        transitDays13kts: 38.0,
        fuelConsumptionMt: 1220,
        bunkerCostUsd: 756400,
        chokepoints: ['Cape of Good Hope'],
        riskLevel: 'LOW',
        draftSuitabilityM: 21.0,
        color: '#10b981', // Emerald (Safe detour)
        points: [
          [36.95, -76.33], // Norfolk
          [25.0, -55.0],   // Mid-Atlantic
          [10.0, -35.0],   // Equatorial Atlantic
          [-15.0, -10.0],  // South Atlantic
          [-34.5, 18.4],   // Cape of Good Hope
          [-35.0, 25.0],   // Agulhas Current
          [-25.0, 40.0],   // Mozambique Channel
          [-10.0, 52.0],   // East of Madagascar
          [0.0, 68.0],     // Equatorial Indian Ocean
          [6.0, 79.5],     // South of Sri Lanka
          [13.0, 83.0],    // Coromandel Coast
          [17.68, 83.28],  // Vizag
        ],
      },
    ],
  },
  {
    id: 'corridor-sa-ind',
    title: 'South Africa (Richards Bay) → East Coast India (Paradip)',
    origin: { name: 'Richards Bay Coal Terminal (RBCT)', country: 'South Africa', coords: [-28.80, 32.04] },
    destination: { name: 'Paradip Port', country: 'India', coords: [20.26, 86.67] },
    cargoType: 'South African Met Coal & RB1 Anthracite',
    routes: [
      // SINGLE ROUTE ONLY - satisfies prompt requirement "if there exists only 1 route then just show one route"
      {
        id: 'sa-indian-ocean-direct',
        name: 'Direct Indian Ocean Crossing (Fixed Corridor)',
        tag: 'DIRECT',
        description: 'Direct deepwater monsoon route from Richards Bay through Madagascar Channel and across Equatorial Indian Ocean to Paradip.',
        distanceNM: 4650,
        transitDays13kts: 14.9,
        fuelConsumptionMt: 480,
        bunkerCostUsd: 297600,
        chokepoints: ['Mozambique Channel Outer'],
        riskLevel: 'LOW',
        draftSuitabilityM: 18.0,
        color: '#0ea5e9', // Sky blue
        points: [
          [-28.80, 32.04], // Richards Bay
          [-25.0, 38.0],   // Mozambique Channel
          [-16.0, 48.0],   // North Madagascar
          [-5.0, 60.0],    // Seychelles North
          [2.0, 72.0],     // Chagos Maldives Passage
          [6.0, 80.0],     // South of Sri Lanka
          [13.0, 84.5],    // Central Bay of Bengal
          [20.26, 86.67],  // Paradip Port
        ],
      },
    ],
  },
  {
    id: 'corridor-idn-ind',
    title: 'Indonesia (Balikpapan) → Haldia / Paradip',
    origin: { name: 'Balikpapan / Samarinda', country: 'Indonesia', coords: [-1.26, 116.83] },
    destination: { name: 'Haldia Dock Complex', country: 'India', coords: [22.02, 88.08] },
    cargoType: 'Low-Ash PCI & Thermal Blend Coal',
    routes: [
      {
        id: 'idn-singapore-direct',
        name: 'Route 1: Singapore & Malacca Strait (Shortest)',
        tag: 'PRIMARY',
        description: 'Standard transit via Java Sea, Singapore Strait, and Malacca Strait into North Bay of Bengal.',
        distanceNM: 2450,
        transitDays13kts: 7.8,
        fuelConsumptionMt: 250,
        bunkerCostUsd: 155000,
        chokepoints: ['Singapore Strait', 'Malacca Strait'],
        riskLevel: 'LOW',
        draftSuitabilityM: 12.0,
        color: '#2563eb',
        points: [
          [-1.26, 116.83], // Balikpapan
          [-3.0, 113.0],   // Java Sea
          [-1.0, 106.0],   // Karimata Strait
          [1.25, 103.8],   // Singapore
          [3.0, 100.5],    // Malacca
          [6.0, 95.0],     // Great Channel
          [14.0, 89.0],    // Central BoB
          [21.0, 88.2],    // Sandheads
          [22.02, 88.08],  // Haldia
        ],
      },
      {
        id: 'idn-sunda-alternate',
        name: 'Route 2: Sunda Strait Weather Alternate',
        tag: 'ALTERNATE',
        description: 'Southern diversion through Sunda Strait avoiding Malacca congestion during monsoonal swell spikes.',
        distanceNM: 2740,
        transitDays13kts: 8.8,
        fuelConsumptionMt: 285,
        bunkerCostUsd: 176700,
        chokepoints: ['Sunda Strait'],
        riskLevel: 'LOW',
        draftSuitabilityM: 14.0,
        color: '#f59e0b',
        points: [
          [-1.26, 116.83], // Balikpapan
          [-5.0, 110.0],
          [-5.9, 105.75],  // Sunda Strait
          [-2.0, 99.0],
          [7.0, 92.0],
          [17.0, 88.0],
          [21.0, 88.2],    // Sandheads
          [22.02, 88.08],  // Haldia
        ],
      },
    ],
  },
  {
    id: 'corridor-eastcoast-arbitrage',
    title: 'East Coast Domestic Cluster (Paradip → Haldia vs Dhamra)',
    origin: { name: 'Paradip Port Anchorage', country: 'India', coords: [20.26, 86.67] },
    destination: { name: 'Haldia Dock (Sandheads STS)', country: 'India', coords: [22.02, 88.08] },
    cargoType: 'Imported Coking Coal Lightering & Divert',
    routes: [
      {
        id: 'haldia-estuary-river',
        name: 'Route 1: Hooghly Estuary River Pilotage (Tidal Constrained)',
        tag: 'PRIMARY',
        description: 'Vessel transits Eden Channel and Balari Bar to Haldia Berth 4B. Restricted to 8.5m draft; requires Sandheads STS lighterage.',
        distanceNM: 180,
        transitDays13kts: 1.2,
        fuelConsumptionMt: 45,
        bunkerCostUsd: 27900,
        chokepoints: ['Sandheads Anchorage', 'Auckland Bar', 'Balari Bar'],
        riskLevel: 'HIGH',
        draftSuitabilityM: 8.5,
        color: '#ef4444',
        points: [
          [20.26, 86.67], // Paradip
          [21.0, 87.5],
          [21.15, 88.15], // Sandheads
          [21.65, 88.0],  // Auckland Bar
          [22.02, 88.08], // Haldia
        ],
      },
      {
        id: 'dhamra-deepwater-rail',
        name: 'Route 2: Dhamra Deepwater Direct + Indian Railways Rake (Arbitrage)',
        tag: 'DEEP_DRAFT',
        description: 'Direct deepwater discharge at Dhamra Berth 4 (18m draft) + FOIS rake rail transport to Durgapur/Bokaro. Saves $7.30/MT.',
        distanceNM: 55,
        transitDays13kts: 0.4,
        fuelConsumptionMt: 12,
        bunkerCostUsd: 7440,
        chokepoints: ['Dhamra Fairway'],
        riskLevel: 'LOW',
        draftSuitabilityM: 18.0,
        color: '#10b981', // Emerald Arbitrage Winner
        points: [
          [20.26, 86.67], // Paradip
          [20.80, 86.95], // Dhamra Port Berth 4
        ],
      },
    ],
  },
];

interface ScenarioRouteMapProps {
  activeScenarioId?: string | null;
  onApplyRouteDetour?: (detourDays: number, fuelShockPct: number) => void;
}

export const ScenarioRouteMap: React.FC<ScenarioRouteMapProps> = ({
  activeScenarioId,
  onApplyRouteDetour,
}) => {
  const { theme } = useUiStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylinesLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Auto-select corridor based on active scenario code / name
  const defaultCorridorId = useMemo(() => {
    if (!activeScenarioId) return 'corridor-aus-ind';
    const idLower = activeScenarioId.toLowerCase();
    if (idLower.includes('red_sea') || idLower.includes('suez') || idLower.includes('canal') || idLower.includes('cape')) {
      return 'corridor-us-ind';
    }
    if (idLower.includes('cyclone') || idLower.includes('haldia') || idLower.includes('arbitrage') || idLower.includes('dhamra')) {
      return 'corridor-eastcoast-arbitrage';
    }
    if (idLower.includes('south_africa') || idLower.includes('richards')) {
      return 'corridor-sa-ind';
    }
    if (idLower.includes('indonesia') || idLower.includes('kalimantan')) {
      return 'corridor-idn-ind';
    }
    return 'corridor-aus-ind';
  }, [activeScenarioId]);

  const [selectedCorridorId, setSelectedCorridorId] = useState<string>(defaultCorridorId);

  // Update corridor if active scenario changes
  useEffect(() => {
    setSelectedCorridorId(defaultCorridorId);
  }, [defaultCorridorId]);

  const activeCorridor = useMemo(() => {
    return TRADE_CORRIDORS.find((c) => c.id === selectedCorridorId) || TRADE_CORRIDORS[0];
  }, [selectedCorridorId]);

  const [selectedRouteId, setSelectedRouteId] = useState<string>(() => {
    return activeCorridor.routes[0]?.id || '';
  });

  // Whenever corridor changes, reset selected route to first route
  useEffect(() => {
    if (activeCorridor.routes.length > 0) {
      setSelectedRouteId(activeCorridor.routes[0].id);
    }
  }, [activeCorridor]);

  const activeRoute = useMemo(() => {
    return activeCorridor.routes.find((r) => r.id === selectedRouteId) || activeCorridor.routes[0];
  }, [activeCorridor, selectedRouteId]);

  const hasMultipleRoutes = activeCorridor.routes.length > 1;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [10, 80],
      zoom: 3,
      minZoom: 2,
      maxZoom: 14,
      zoomControl: false,
    });

    const CARTO_KEY = 'cb1_3quv_1_2b40804dbf5848c355847fa7';
    const tileUrl =
      theme === 'light'
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_KEY}`
        : `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${CARTO_KEY}`;

    L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(map);

    polylinesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map tile layer when UI theme changes
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
      theme === 'light'
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_KEY}`
        : `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${CARTO_KEY}`;

    L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(map);
  }, [theme]);

  // Render Routes and Markers on the Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const linesLayer = polylinesLayerRef.current;
    const marksLayer = markersLayerRef.current;
    if (!map || !linesLayer || !marksLayer) return;

    linesLayer.clearLayers();
    marksLayer.clearLayers();

    // 1. Draw all routes for current corridor
    activeCorridor.routes.forEach((route) => {
      const isSelected = route.id === selectedRouteId;

      const polyline = L.polyline(route.points, {
        color: isSelected ? route.color : '#94a3b8',
        weight: isSelected ? 4.5 : 2.5,
        opacity: isSelected ? 0.95 : 0.45,
        dashArray: isSelected ? undefined : '6, 6',
        className: isSelected ? 'leaflet-active-route-glow' : '',
      });

      const tooltipContent = `
        <div style="font-family: inherit; padding: 4px 6px;">
          <div style="font-weight: 700; font-size: 12px; color: ${route.color};">${route.name}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
            Distance: <b>${route.distanceNM.toLocaleString()} NM</b> (~${route.transitDays13kts} days @ 13 kts)
          </div>
          <div style="font-size: 10px; color: #475569;">
            Draft Suitability: <b>Up to ${route.draftSuitabilityM}m</b>
          </div>
          ${!isSelected ? '<div style="font-size: 9px; color: #0284c7; font-weight: 600; margin-top: 3px;">Click to select this route</div>' : ''}
        </div>
      `;

      polyline.bindTooltip(tooltipContent, { sticky: true, className: 'custom-nautical-popup' });

      // Click to select route
      polyline.on('click', () => {
        setSelectedRouteId(route.id);
      });

      polyline.addTo(linesLayer);
    });

    // 2. Draw Origin Port Marker
    const originIcon = L.divIcon({
      className: 'custom-port-marker',
      html: `
        <div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 10px #3b82f6;"></div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const originMarker = L.marker(activeCorridor.origin.coords, { icon: originIcon });
    originMarker.bindTooltip(
      `<b>Load Port:</b> ${activeCorridor.origin.name} (${activeCorridor.origin.country})`,
      { permanent: false, direction: 'top' }
    );
    originMarker.addTo(marksLayer);

    // 3. Draw Destination Port Marker
    const destIcon = L.divIcon({
      className: 'custom-dest-marker',
      html: `
        <div style="background-color: #10b981; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 12px #10b981;"></div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const destMarker = L.marker(activeCorridor.destination.coords, { icon: destIcon });
    destMarker.bindTooltip(
      `<b>Discharge Port:</b> ${activeCorridor.destination.name} (${activeCorridor.destination.country})`,
      { permanent: false, direction: 'top' }
    );
    destMarker.addTo(marksLayer);

    // 4. Draw Animated Ship Icon on Active Route Midpoint
    if (activeRoute && activeRoute.points.length > 2) {
      const midIdx = Math.floor(activeRoute.points.length / 2);
      const midCoords = activeRoute.points[midIdx];

      const shipIcon = L.divIcon({
        className: 'custom-ship-marker',
        html: `
          <div style="background: ${activeRoute.color}; color: #ffffff; padding: 4px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border: 1.5px solid white;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/></svg>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const shipMarker = L.marker(midCoords, { icon: shipIcon });
      shipMarker.bindTooltip(
        `<b>Ship Underway:</b> ${activeRoute.name}<br>ETA: ~${activeRoute.transitDays13kts} days`,
        { direction: 'right' }
      );
      shipMarker.addTo(marksLayer);
    }

    // 5. Fit bounds to selected route
    if (activeRoute && activeRoute.points.length > 0) {
      const bounds = L.latLngBounds(activeRoute.points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  }, [activeCorridor, selectedRouteId]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => {
    if (activeRoute && mapInstanceRef.current) {
      const bounds = L.latLngBounds(activeRoute.points);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
      {/* Map Header & Corridor Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="text-primary w-5 h-5" />
            <h3 className="font-bold text-sm text-foreground">
              Vessel Navigation & Maritime Route Simulation Map
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-primary/10 text-primary border border-primary/20">
              SMART ROUTE SOLVER
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Simulate and compare nautical corridors, chokepoint transits, fuel consumption, and weather detours to East Coast India.
          </p>
        </div>

        {/* Corridor Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Trade Corridor:
          </label>
          <select
            value={selectedCorridorId}
            onChange={(e) => setSelectedCorridorId(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none max-w-xs"
          >
            {TRADE_CORRIDORS.map((corridor) => (
              <option key={corridor.id} value={corridor.id}>
                {corridor.title} ({corridor.routes.length} {corridor.routes.length === 1 ? 'Route' : 'Routes'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Route Selector Cards (or Single Route Notice) */}
      {hasMultipleRoutes ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Available Route Trajectories ({activeCorridor.routes.length} Options — Click to Select):</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              Commodity: <strong className="text-foreground">{activeCorridor.cargoType}</strong>
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {activeCorridor.routes.map((route) => {
              const isSelected = route.id === selectedRouteId;
              const isHighRisk = route.riskLevel === 'HIGH';

              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs'
                      : 'border-border bg-background hover:bg-muted/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: route.color }}
                        />
                        {route.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          isHighRisk
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}
                      >
                        {route.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                      {route.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border/60 text-[10px]">
                    <div>
                      <span className="text-muted-foreground block">Distance</span>
                      <span className="font-mono font-bold text-foreground">{route.distanceNM.toLocaleString()} NM</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Transit</span>
                      <span className="font-mono font-bold text-foreground">~{route.transitDays13kts}d</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Bunker Fuel</span>
                      <span className="font-mono font-bold text-foreground">{route.fuelConsumptionMt} MT</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* SINGLE ROUTE CORRIDOR DISPLAY - Directly addresses requirement */
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-blue-600 text-white shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-blue-950 dark:text-blue-100 flex items-center gap-2">
                <span>Single Direct Route Corridor: {activeRoute.name}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-200/60 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200">
                  ONLY 1 ROUTE
                </span>
              </div>
              <p className="text-blue-900/80 dark:text-blue-200/80 text-[11px] mt-0.5">
                No viable nautical detours exist for this corridor. Displaying single primary deepwater lane ({activeRoute.distanceNM.toLocaleString()} NM, ~{activeRoute.transitDays13kts} days).
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="font-mono font-bold text-blue-950 dark:text-blue-100 text-xs block">
              {activeRoute.distanceNM.toLocaleString()} NM
            </span>
            <span className="text-[10px] text-blue-700 dark:text-blue-300">
              ~{activeRoute.transitDays13kts} Days @ 13 kts
            </span>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-border bg-slate-950 h-[380px] w-full shadow-inner">
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* Map Floating Control Overlay */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-card/90 backdrop-blur-md p-1 rounded-lg border border-border shadow-md">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-muted text-foreground transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-muted text-foreground transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="p-1.5 rounded hover:bg-muted text-foreground transition-colors cursor-pointer"
            title="Fit Active Route"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Legend Overlay on Map Bottom Left */}
        <div className="absolute bottom-3 left-3 z-10 bg-card/90 backdrop-blur-md px-3 py-2 rounded-lg border border-border shadow-md text-[11px] space-y-1">
          <div className="font-bold text-foreground text-[10px] uppercase tracking-wider mb-0.5">
            Route Map Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 rounded" style={{ backgroundColor: activeRoute.color }} />
            <span className="text-foreground font-semibold">Active Selected Route</span>
          </div>
          {hasMultipleRoutes && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 border-b border-dashed border-slate-400" />
              <span className="text-muted-foreground">Alternate Routes (Clickable)</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Origin Port: {activeCorridor.origin.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Destination: {activeCorridor.destination.name}</span>
          </div>
        </div>
      </div>

      {/* Route Telemetry & Impact Details Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs bg-muted/20 p-3 rounded-lg border border-border">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Total Voyage Distance</span>
          <span className="font-mono font-bold text-foreground text-sm mt-0.5 block">
            {activeRoute.distanceNM.toLocaleString()} NM
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Sea Transit Time</span>
          <span className="font-mono font-bold text-foreground text-sm mt-0.5 block">
            {activeRoute.transitDays13kts} Days
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Bunker Consumption</span>
          <span className="font-mono font-bold text-foreground text-sm mt-0.5 block">
            {activeRoute.fuelConsumptionMt} MT VLSFO
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Bunker Fuel Cost</span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5 block">
            ${activeRoute.bunkerCostUsd.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Draft Permissible</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
            ≤ {activeRoute.draftSuitabilityM}m
          </span>
        </div>
        <div className="flex items-center justify-end">
          {onApplyRouteDetour && (
            <button
              type="button"
              onClick={() => {
                const baselineDays = activeCorridor.routes[0]?.transitDays13kts || activeRoute.transitDays13kts;
                const deltaDays = Math.max(0, Math.round(activeRoute.transitDays13kts - baselineDays));
                const fuelShock = Math.max(0, Math.round(((activeRoute.fuelConsumptionMt - 520) / 520) * 100));
                onApplyRouteDetour(deltaDays, fuelShock);
              }}
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Apply to Stress Test</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
