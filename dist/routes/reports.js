"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const JobQueueService_js_1 = require("../services/JobQueueService.js");
const router = (0, express_1.Router)();
router.get('/', auth_js_1.authenticateToken, async (req, res) => {
    const templates = [
        { type: 'DAILY_MARKET_BRIEF', name: 'Daily Freight & Bunker Brief', description: 'Daily Baltic index updates and East Coast bunker price shifts' },
        { type: 'WEEKLY_FREIGHT_INTELLIGENCE', name: 'Weekly Freight Intelligence', description: 'Weekly time-series trends and Capesize/Panamax route analysis' },
        { type: 'MONTHLY_CHARTER_STRATEGY', name: 'Monthly Charter Strategy Review', description: 'Spot vs COA performance comparison and forward recommendations' },
        { type: 'VOYAGE_ECONOMICS', name: 'Voyage Economics Comprehensive', description: 'Break-even TCE and detailed cost component breakdowns' },
        { type: 'PORT_RISK', name: 'East Coast Port Congestion & Weather Risk', description: 'Anchorage waiting time analysis for Paradip, Vizag, and Haldia' },
        { type: 'EXECUTIVE_SUMMARY', name: 'SAIL Maritime Procurement Executive Summary', description: 'Board-level quarterly procurement KPIs and freight savings realized' }
    ];
    return res.json({
        success: true,
        data: {
            templates,
            recentJobs: JobQueueService_js_1.JobQueueService.listJobs(10).filter(j => j.queueName === 'reports')
        }
    });
});
router.post('/generate', auth_js_1.authenticateToken, async (req, res) => {
    const { reportType = 'DAILY_MARKET_BRIEF', format = 'PDF', parameters = {} } = req.body;
    const job = await JobQueueService_js_1.JobQueueService.enqueueJob('reports', 'generate_report', {
        reportType,
        format,
        parameters,
        requestedBy: req.user?.email
    });
    return res.status(202).json({
        success: true,
        data: {
            jobId: job.id,
            reportType,
            format,
            status: job.status,
            message: 'Report compilation queued. Check /api/v1/reports/' + job.id + ' for status.'
        }
    });
});
router.get('/:id', auth_js_1.authenticateToken, async (req, res) => {
    const job = JobQueueService_js_1.JobQueueService.getJob(req.params.id);
    if (!job) {
        return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Report job not found' } });
    }
    return res.json({
        success: true,
        data: {
            reportJobId: job.id,
            reportType: job.data.reportType,
            format: job.data.format || 'PDF',
            status: job.status,
            progress: job.progress,
            result: job.result,
            createdAt: job.createdAt,
            completedAt: job.completedAt
        }
    });
});
router.get('/:id/download', auth_js_1.authenticateToken, async (req, res) => {
    const job = JobQueueService_js_1.JobQueueService.getJob(req.params.id);
    if (!job || job.status !== 'COMPLETED') {
        return res.status(400).json({ success: false, error: { code: 'REPORT_NOT_READY', message: 'Report is still compiling or does not exist' } });
    }
    const reportPayload = {
        title: `SAGAR DRISHTI — ${job.data.reportType}`,
        generatedFor: 'Steel Authority of India Limited (SAIL)',
        generatedAt: job.completedAt,
        executiveSummary: 'Bulk shipping rates on the Australia-East Coast India corridor demonstrate favorable chartering conditions with projected spot rates stabilizing at $14.20/MT.',
        keyMetrics: {
            activeVoyages: 6,
            averageTceUsdDay: 21450,
            totalTonnageEnRouteMt: 480000,
            realizedSavingsUsd: 1850000
        }
    };
    return res.json({
        success: true,
        data: reportPayload
    });
});
router.post('/verify', async (req, res) => {
    const { code, sha256: rawSha256 } = req.body;
    const input = (code || rawSha256 || '').trim();
    if (!input) {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_INPUT', message: 'Missing SHA-256 verification code or reference' }
        });
    }
    const cleaned = input
        .replace(/^SHA-?256\s*[:=\s]\s*/i, '')
        .replace(/^REF\s*[:=\s]\s*/i, '')
        .replace(/^SAIL-VERIFY-/i, '')
        .replace(/[\s\-_:]/g, '')
        .toLowerCase();
    const verifiedTemplates = {
        '4f8b2a9cd1e094f27b9c6a1e8d4f3b2a9c1e8d4f3b2a9c1e8d4f3b2a9c1e8d4f': {
            dossierRef: 'SAIL/MRX/REP-CH-01/2026-Q4',
            reportId: 'REP-CH-01',
            title: 'Vessel Fixture & TCE Audit',
            category: 'Chartering',
            issuingAuthority: 'Steel Authority of India Limited — Central Transport & Shipping Division',
            signatory: 'Deputy General Manager (Shipping & Chartering)',
            statutoryDelegation: 'Charter Party Clearance Tier 2 · Statutory Authority Delegation',
            auditBlockRef: 'BL-2026-09-88219',
            issuedAt: '2026-09-21T10:30:00.000Z',
            tamperStatus: 'AUTHENTIC',
            securityClassification: 'RESTRICTED / COMMERCIAL-IN-CONFIDENCE',
            description: 'Audit of fleet fixtures, TCE performance against Baltic benchmarks, and spot charter executions.'
        },
        '9a3b7c8d1e2f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b': {
            dossierRef: 'SAIL/MRX/REP-PR-01/2026-Q4',
            reportId: 'REP-PR-01',
            title: 'SAIL Steel Plants Raw Material Runway',
            category: 'Procurement',
            issuingAuthority: 'Raw Materials Directorate, SAIL Corporate Office',
            signatory: 'Chief General Manager (Raw Materials Sourcing)',
            statutoryDelegation: 'Statutory 21-Day Inventory Adherence Directive',
            auditBlockRef: 'BL-2026-09-88194',
            issuedAt: '2026-09-20T16:45:00.000Z',
            tamperStatus: 'AUTHENTIC',
            securityClassification: 'RESTRICTED / COMMERCIAL-IN-CONFIDENCE',
            description: 'Coking coal stockpile buffer status across BSP, BSL, RSP, DSP, and ISP against statutory 21-day thresholds.'
        },
        'e8d4f3b2a9c1e8d4f3b2a9c1e8d4f3b2a9c1e8d4f3b2a9c1e8d4f3b2a9c1e8d4': {
            dossierRef: 'SAIL/MRX/REP-PT-01/2026-Q4',
            reportId: 'REP-PT-01',
            title: 'East Coast Port Congestion Analysis',
            category: 'Port Operations',
            issuingAuthority: 'Shipping & Logistics Operations Division, Kolkata',
            signatory: 'Assistant General Manager (Port Logistics)',
            statutoryDelegation: 'Demurrage Mitigation & Port Diversion Authority',
            auditBlockRef: 'BL-2026-09-88203',
            issuedAt: '2026-09-21T08:15:00.000Z',
            tamperStatus: 'AUTHENTIC',
            securityClassification: 'RESTRICTED / COMMERCIAL-IN-CONFIDENCE',
            description: 'Turnaround times, pre-berthing wait days, and draft clearance for Paradip, Vizag, Haldia, Dhamra.'
        },
        '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d': {
            dossierRef: 'SAIL/MRX/REP-PUB-01/2026-Q4',
            reportId: 'REP-PUB-01',
            title: 'Ministry of Steel — Public Feeds & Sagarmala Logistics Audit',
            category: 'Executive Audit',
            issuingAuthority: 'Ministry of Steel Oversight Liaison Cell, New Delhi',
            signatory: 'Executive Director (Logistics & Commercial)',
            statutoryDelegation: 'Ministry of Steel Public Transparency Mandate 2026',
            auditBlockRef: 'BL-2026-09-88225',
            issuedAt: '2026-09-21T12:00:00.000Z',
            tamperStatus: 'AUTHENTIC',
            securityClassification: 'RESTRICTED / COMMERCIAL-IN-CONFIDENCE',
            description: 'Statutory audit of 8 zero-cost public data feeds with SLA latency and $48,000/yr savings verification.'
        }
    };
    let match = verifiedTemplates[cleaned];
    if (!match) {
        for (const [hash, data] of Object.entries(verifiedTemplates)) {
            if (hash.startsWith(cleaned) ||
                data.reportId.toLowerCase() === input.toLowerCase() ||
                data.dossierRef.toLowerCase().includes(input.toLowerCase())) {
                match = { ...data, sha256: hash };
                break;
            }
        }
    }
    if (match) {
        return res.json({
            success: true,
            data: {
                isValid: true,
                sha256: match.sha256 || cleaned,
                ...match
            }
        });
    }
    return res.status(404).json({
        success: false,
        error: {
            code: 'VERIFICATION_FAILED',
            message: 'SHA-256 checksum does not match any authenticated SAIL MarineX recorded dossier or has been tampered with.'
        }
    });
});
exports.default = router;
//# sourceMappingURL=reports.js.map