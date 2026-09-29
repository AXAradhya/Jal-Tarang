export declare const config: {
    env: string;
    port: number;
    apiPrefix: string;
    database: {
        connectionString: string;
        poolSize: number;
    };
    redis: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    security: {
        maxLoginAttempts: number;
        lockoutMinutes: number;
    };
    openRouter: {
        apiKey: string;
        model: string;
        fallbackModel: string;
        apiUrl: string;
    };
};
