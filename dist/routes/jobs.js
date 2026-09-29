"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const JobQueueService_js_1 = require("../services/JobQueueService.js");
const ingestionJobs_js_1 = require("../jobs/ingestionJobs.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get('/', auth_js_1.authenticateToken, (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const jobs = JobQueueService_js_1.JobQueueService.listJobs(limit);
    return res.json({
        success: true,
        data: jobs,
        meta: { total: jobs.length, limit }
    });
});
router.get('/:id', auth_js_1.authenticateToken, (req, res) => {
    const job = JobQueueService_js_1.JobQueueService.getJob(req.params.id);
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
router.get('/:id/logs', auth_js_1.authenticateToken, (req, res) => {
    const job = JobQueueService_js_1.JobQueueService.getJob(req.params.id);
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
router.get('/ingestion/status', auth_js_1.authenticateToken, (_req, res) => {
    const status = ingestionJobs_js_1.IngestionJobManager.getStatus();
    return res.json({
        success: true,
        data: status,
    });
});
router.post('/ingestion/trigger', auth_js_1.authenticateToken, async (req, res) => {
    const { jobName } = req.body;
    if (!jobName) {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_PARAMETER', message: 'Missing jobName (e.g. weather, fx, commodities, baltic, ais)' },
        });
    }
    try {
        const result = await ingestionJobs_js_1.IngestionJobManager.triggerJob(jobName);
        return res.json({
            success: result.success,
            data: result,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: { code: 'INGESTION_ERROR', message: err.message },
        });
    }
});
router.post('/:id/cancel', auth_js_1.authenticateToken, (req, res) => {
    const cancelled = JobQueueService_js_1.JobQueueService.cancelJob(req.params.id);
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
exports.default = router;
//# sourceMappingURL=jobs.js.map