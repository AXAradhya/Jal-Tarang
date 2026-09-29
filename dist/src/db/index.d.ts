import pg, { QueryResultRow } from 'pg';
export declare const pool: import("pg").Pool;
export declare const query: <T extends QueryResultRow = any>(text: string, params?: any[]) => Promise<pg.QueryResult<T>>;
export declare const getClient: () => Promise<import("pg").PoolClient>;
