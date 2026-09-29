import pg, { QueryResultRow } from 'pg';
export declare function handleFallbackQuery(text: string, params?: any[]): {
    rows: any[];
    rowCount: number;
};
export declare const pool: pg.Pool;
export declare const query: <T extends QueryResultRow = any>(text: string, params?: any[]) => Promise<pg.QueryResult<T>>;
export declare const getClient: () => Promise<pg.PoolClient>;
