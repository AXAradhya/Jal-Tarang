export interface MaritimeJobRecord {
    id: string;
    queueName: string;
    name: string;
    data: any;
    status: 'QUEUED' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    progress: number;
    result?: any;
    error?: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    logs: string[];
}
export declare class JobQueueService {
    private static redisClient;
    private static queues;
    private static inMemoryJobs;
    private static isRedisAvailable;
    static initialize(): Promise<void>;
    static enqueueJob(queueName: string, name: string, data: any): Promise<MaritimeJobRecord>;
    static getJob(jobId: string): MaritimeJobRecord | undefined;
    static listJobs(limit?: number): MaritimeJobRecord[];
    static cancelJob(jobId: string): boolean;
    private static processAsync;
}
