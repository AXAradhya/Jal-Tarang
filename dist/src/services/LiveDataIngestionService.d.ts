/**
 * Service to poll and ingest live marine weather from Open-Meteo
 * (100% Free, no API key needed) for East Coast Indian Ports
 */
export declare class LiveDataIngestionService {
    /**
     * Fetches real-time wave and marine weather for a port from Open-Meteo
     */
    static fetchAndStorePortWeather(portId: string, lat: number, lon: number): Promise<void>;
    /**
     * Fetches real-time USD/INR exchange rate from Frankfurter (100% Free ECB feed)
     */
    static fetchAndStoreLiveExchangeRate(): Promise<void>;
}
