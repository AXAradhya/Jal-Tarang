export declare class LiveDataIngestionService {
    static fetchAndStorePortWeather(portId: string, lat: number, lon: number): Promise<void>;
    static fetchAndStoreLiveExchangeRate(): Promise<void>;
}
