/**
 * JAL TARANG - Jobs API Route
 * Provides real-time status, logs, and cancellation for background BullMQ jobs.
 */

import { Router, Request, Response } from 'express';
import { JobQueueService } from '../services/JobQueueService.js';
import { IngestionJobManager } from '../jobs/ingestionJobs.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/jobs - List background jobs
router.get('/', authenticateToken, (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const jobs = JobQueueService.listJobs(limit);
  return res.json({
    success: true,
    data: jobs,
    meta: { total: jobs.length, limit }
  });
});

// GET /api/v1/jobs/:id - Get job status
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  const job = JobQueueService.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({
      success: false,
      error: { code: 'RESOURCE_NOT_FOUND', message: `Job ${req.params.id} not found` }
    });
  }
  return res.json({
    success: true,
    data: job
  });
});

// GET /api/v1/jobs/:id/logs - Get job logs
router.get('/:id/logs', authenticateToken, (req: Request, res: Response) => {
  const job = JobQueueService.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({
      success: false,
      error: { code: 'RESOURCE_NOT_FOUND', message: `Job ${req.params.id} not found` }
    });
  }
  return res.json({
    success: true,
    data: {
      jobId: job.id,
      status: job.status,
      logs: job.logs
    }
  });
});

// GET /api/v1/jobs/ingestion/status - Get all ingestion job statuses and circuit breaker telemetry
router.get('/ingestion/status', authenticateToken, (_req: Request, res: Response) => {
  const status = IngestionJobManager.getStatus();
  return res.json({
    success: true,
    data: status,
  });
});

// POST /api/v1/jobs/ingestion/trigger - Manually trigger an ingestion job
router.post('/ingestion/trigger', authenticateToken, async (req: Request, res: Response) => {
  const { jobName } = req.body;
  if (!jobName) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PARAMETER', message: 'Missing jobName (e.g. weather, fx, commodities, baltic, ais)' },
    });
  }

  try {
    const result = await IngestionJobManager.triggerJob(jobName);
    return res.json({
      success: result.success,
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'INGESTION_ERROR', message: err.message },
    });
  }
});

// POST /api/v1/jobs/:id/cancel - Cancel background job
router.post('/:id/cancel', authenticateToken, (req: Request, res: Response) => {
  const cancelled = JobQueueService.cancelJob(req.params.id);
  if (!cancelled) {
    return res.status(400).json({
      success: false,
      error: { code: 'OPERATION_FAILED', message: `Job ${req.params.id} could not be cancelled (either not found or already completed/failed)` }
    });
  }
  return res.json({
    success: true,
    data: { jobId: req.params.id, status: 'CANCELLED', message: 'Job successfully cancelled' }
  });
});

export default router;

