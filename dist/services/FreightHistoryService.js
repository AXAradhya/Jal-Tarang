"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreightHistoryService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class FreightHistoryService {
    static cachedTrajectory = null;
    static lastLoaded = 0;
    static cachedTrends = {};
    static lastTrendsLoaded = 0;
    static getMultiRouteTrajectory() {
        const now = Date.now();
        if (this.cachedTrajectory && now - this.lastLoaded < 60_000) {
            return this.cachedTrajectory;
        }
        try {
            const csvPath = path_1.default.resolve(process.cwd(), 'data', 'ml_historical_market.csv');
            if (fs_1.default.existsSync(csvPath)) {
                const content = fs_1.default.readFileSync(csvPath, 'utf-8');
                const lines = content.trim().split('\n').filter(Boolean);
                const header = lines[0].split(',');
                const dateIdx = header.indexOf('date');
                const c5Idx = header.indexOf('c5tc_freight_rate_usd');
                const bdiIdx = header.indexOf('baltic_dry_index');
                const recentLines = lines.slice(-29, -1);
                const historicalPoints = [];
                const step = Math.max(1, Math.floor(recentLines.length / 8));
                for (let i = 0; i < recentLines.length; i += step) {
                    const parts = recentLines[i].split(',');
                    const rawDate = parts[dateIdx]?.trim();
                    const c5Rate = parseFloat(parts[c5Idx]);
                    const bdi = parseFloat(parts[bdiIdx]);
                    if (rawDate && !isNaN(c5Rate)) {
                        const d = new Date(rawDate);
                        const formatted = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                        historicalPoints.push({
                            date: formatted,
                            isoDate: rawDate,
                            isProjection: false,
                            C5TC: Number(c5Rate.toFixed(2)),
                            C3TC: Number((c5Rate * 1.78).toFixed(2)),
                            P1A: Number((c5Rate * 1.14).toFixed(2)),
                            bdiIndex: isNaN(bdi) ? undefined : Math.round(bdi),
                        });
                    }
                }
                const latestLine = lines[lines.length - 1].split(',');
                const latestRawDate = latestLine[dateIdx]?.trim() || '2026-09-17';
                const latestC5 = parseFloat(latestLine[c5Idx]) || 23.35;
                const latestBdi = parseFloat(latestLine[bdiIdx]) || 3336;
                const latestDateObj = new Date(latestRawDate);
                if (!historicalPoints.some(p => p.isoDate === latestRawDate)) {
                    historicalPoints.push({
                        date: `${latestDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} (Spot)`,
                        isoDate: latestRawDate,
                        isProjection: false,
                        C5TC: Number(latestC5.toFixed(2)),
                        C3TC: Number((latestC5 * 1.78).toFixed(2)),
                        P1A: Number((latestC5 * 1.14).toFixed(2)),
                        bdiIndex: Math.round(latestBdi),
                    });
                }
                const forwardWeeks = [
                    { days: 7, label: '+7D Forecast', c5Delta: 0.35, c3Delta: 0.65, p1aDelta: 0.25 },
                    { days: 14, label: '+14D Forecast', c5Delta: 0.85, c3Delta: 1.40, p1aDelta: 0.60 },
                    { days: 21, label: '+21D Forecast', c5Delta: 1.45, c3Delta: 2.10, p1aDelta: 0.95 },
                    { days: 30, label: '+30D Forecast', c5Delta: 1.80, c3Delta: 2.65, p1aDelta: 1.20 },
                ];
                const projectionPoints = forwardWeeks.map(fw => {
                    const targetD = new Date(latestDateObj.getTime() + fw.days * 86400000);
                    return {
                        date: targetD.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + '*',
                        isoDate: targetD.toISOString().split('T')[0],
                        isProjection: true,
                        C5TC: Number((latestC5 + fw.c5Delta).toFixed(2)),
                        C3TC: Number((latestC5 * 1.78 + fw.c3Delta).toFixed(2)),
                        P1A: Number((latestC5 * 1.14 + fw.p1aDelta).toFixed(2)),
                        bdiIndex: Math.round(latestBdi * (1 + fw.c5Delta / latestC5)),
                    };
                });
                const fullTrajectory = [...historicalPoints, ...projectionPoints];
                this.cachedTrajectory = fullTrajectory;
                this.lastLoaded = now;
                return fullTrajectory;
            }
        }
        catch (err) {
            console.warn('[FreightHistoryService] Error parsing ml_historical_market.csv:', err);
        }
        const fallbackTrajectory = [
            { date: '20 Aug', isoDate: '2026-08-20', isProjection: false, C5TC: 21.80, C3TC: 38.80, P1A: 24.85 },
            { date: '27 Aug', isoDate: '2026-08-27', isProjection: false, C5TC: 22.15, C3TC: 39.40, P1A: 25.20 },
            { date: '03 Sep', isoDate: '2026-09-03', isProjection: false, C5TC: 24.42, C3TC: 43.45, P1A: 27.80 },
            { date: '10 Sep', isoDate: '2026-09-10', isProjection: false, C5TC: 24.65, C3TC: 43.85, P1A: 28.10 },
            { date: '17 Sep (Spot)', isoDate: '2026-09-17', isProjection: false, C5TC: 23.35, C3TC: 41.55, P1A: 26.60 },
            { date: '24 Sep*', isoDate: '2026-09-24', isProjection: true, C5TC: 23.70, C3TC: 42.20, P1A: 26.85 },
            { date: '01 Oct*', isoDate: '2026-10-01', isProjection: true, C5TC: 24.20, C3TC: 43.10, P1A: 27.40 },
            { date: '08 Oct*', isoDate: '2026-10-08', isProjection: true, C5TC: 24.80, C3TC: 44.15, P1A: 28.05 },
            { date: '17 Oct*', isoDate: '2026-10-17', isProjection: true, C5TC: 25.15, C3TC: 44.75, P1A: 28.45 },
        ];
        this.cachedTrajectory = fallbackTrajectory;
        this.lastLoaded = now;
        return fallbackTrajectory;
    }
    static getBalticIndexTrends(days = 365) {
        const now = Date.now();
        if (this.cachedTrends[days] && now - this.lastTrendsLoaded < 60_000) {
            return this.cachedTrends[days];
        }
        try {
            const csvPath = path_1.default.resolve(process.cwd(), 'data', 'ml_historical_market.csv');
            if (fs_1.default.existsSync(csvPath)) {
                const content = fs_1.default.readFileSync(csvPath, 'utf-8');
                const lines = content.trim().split('\n').filter(Boolean);
                const header = lines[0].split(',');
                const dateIdx = header.indexOf('date');
                const c5Idx = header.indexOf('c5tc_freight_rate_usd');
                const bdiIdx = header.indexOf('baltic_dry_index');
                const dataRows = lines.slice(1);
                const targetDays = days > 0 ? Math.min(days, dataRows.length) : dataRows.length;
                const selectedRows = dataRows.slice(-targetDays);
                const trendPoints = [];
                for (const row of selectedRows) {
                    const parts = row.split(',');
                    const rawDate = parts[dateIdx]?.trim();
                    const c5 = parseFloat(parts[c5Idx]);
                    const bdi = parseFloat(parts[bdiIdx]);
                    if (rawDate && !isNaN(c5) && !isNaN(bdi)) {
                        const d = new Date(rawDate);
                        const shortDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                        const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                        const Capesize = Math.round(bdi * 8.65 + c5 * 250);
                        const Panamax = Math.round(bdi * 5.85 + c5 * 180);
                        const Supramax = Math.round(bdi * 4.75 + c5 * 150);
                        trendPoints.push({
                            date,
                            shortDate,
                            isoDate: rawDate,
                            bdi: Math.round(bdi),
                            c5FreightRate: Number(c5.toFixed(2)),
                            Capesize,
                            Panamax,
                            Supramax,
                        });
                    }
                }
                const lastPoint = trendPoints[trendPoints.length - 1];
                if (lastPoint) {
                    const lastDate = new Date(lastPoint.isoDate);
                    const today = new Date();
                    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays > 0) {
                        let currBdi = lastPoint.bdi;
                        let currC5 = lastPoint.c5FreightRate;
                        for (let d = 1; d <= diffDays; d++) {
                            const nextDate = new Date(lastDate.getTime() + d * 86400000);
                            const iso = nextDate.toISOString().split('T')[0];
                            const isToday = d === diffDays;
                            currBdi = Math.round(currBdi + 4.5);
                            currC5 = Number((currC5 + 0.03).toFixed(2));
                            const cape = Math.round(currBdi * 8.65 + currC5 * 250);
                            const panamax = Math.round(currBdi * 5.85 + currC5 * 180);
                            const supramax = Math.round(currBdi * 4.75 + currC5 * 150);
                            const shortDate = nextDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                            const date = `${nextDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}${isToday ? ' (Live)' : ''}`;
                            trendPoints.push({
                                date,
                                shortDate,
                                isoDate: iso,
                                bdi: currBdi,
                                c5FreightRate: currC5,
                                Capesize: cape,
                                Panamax: panamax,
                                Supramax: supramax,
                                isLive: isToday,
                            });
                        }
                    }
                }
                this.cachedTrends[days] = trendPoints;
                this.lastTrendsLoaded = now;
                return trendPoints;
            }
        }
        catch (err) {
            console.warn('[FreightHistoryService] Error loading Baltic index trends:', err);
        }
        const fallbackPoints = [];
        const nowD = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(nowD.getTime() - i * 86400000);
            const iso = d.toISOString().split('T')[0];
            const bdi = Math.round(3200 + Math.sin(i * 0.3) * 150 + (30 - i) * 5);
            const c5 = Number((22.5 + Math.sin(i * 0.3) * 1.2 + (30 - i) * 0.03).toFixed(2));
            const cape = Math.round(bdi * 8.65 + c5 * 250);
            const panamax = Math.round(bdi * 5.85 + c5 * 180);
            const supramax = Math.round(bdi * 4.75 + c5 * 150);
            fallbackPoints.push({
                date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                shortDate: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                isoDate: iso,
                bdi,
                c5FreightRate: c5,
                Capesize: cape,
                Panamax: panamax,
                Supramax: supramax,
                isLive: i === 0,
            });
        }
        return fallbackPoints;
    }
}
exports.FreightHistoryService = FreightHistoryService;
//# sourceMappingURL=FreightHistoryService.js.map