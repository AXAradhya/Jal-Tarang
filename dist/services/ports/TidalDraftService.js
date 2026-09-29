"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TidalDraftService = void 0;
class TidalDraftService {
    static BARS = [
        { name: 'Auckland Bar (Estuary)', datumM: 4.8 },
        { name: 'Jellingham Shoal (Haldia approach)', datumM: 4.9 },
        { name: 'Balari Bar (Upper Hooghly)', datumM: 4.5 },
    ];
    static predict(input) {
        const targetDate = new Date(input.targetArrivalDate);
        const vesselDraft = input.vesselDraftM;
        const demurrageDay = input.demurrageRateUsdDay ?? 35000;
        const siltation = input.siltationCorrectionM ?? -0.3;
        const ukc = input.requiredUkcM ?? 0.9;
        const fx = 83.50;
        const governingDatum = 4.8;
        const governingBar = 'Auckland Bar';
        const windows = [];
        let bestWindow = null;
        let targetWindow = null;
        const epochRef = new Date('2026-01-01T00:00:00Z').getTime();
        for (let offset = -2; offset <= 11; offset++) {
            const d = new Date(targetDate);
            d.setDate(d.getDate() + offset);
            const dateStr = d.toISOString().split('T')[0];
            const daysFromEpoch = (d.getTime() - epochRef) / (1000 * 60 * 60 * 24);
            const cycle = Math.sin((daysFromEpoch / 14.77) * 2 * Math.PI);
            const tideHeight = 4.6 + cycle * 0.8;
            let phase = 'TRANSITIONAL';
            if (cycle > 0.45)
                phase = 'SPRING_TIDE';
            else if (cycle < -0.45)
                phase = 'NEAP_TIDE';
            const permissibleDraft = governingDatum + tideHeight + siltation - ukc;
            const canTransit = permissibleDraft >= vesselDraft;
            const draftDiff = Math.max(0, permissibleDraft - 7.5);
            const extraCapacity = Math.round(draftDiff * 12000);
            const hwHour = (18 + Math.floor((offset * 0.8) % 6)) % 24;
            const hwMinute = Math.floor((Math.abs(offset) * 23) % 60);
            const hwTime = `${String(hwHour).padStart(2, '0')}:${String(hwMinute).padStart(2, '0')} IST`;
            const win = {
                date: dateStr,
                dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' }),
                tidePhase: phase,
                highWaterTimeIst: hwTime,
                tidalHeightM: Number(tideHeight.toFixed(2)),
                barDatumDepthM: governingDatum,
                siltationCorrectionM: siltation,
                permissibleDraftM: Number(permissibleDraft.toFixed(2)),
                canTransit,
                extraCargoCapacityMt: extraCapacity,
                governingBar,
            };
            windows.push(win);
            if (offset === 0) {
                targetWindow = win;
            }
            if (canTransit && (!bestWindow || win.permissibleDraftM > bestWindow.permissibleDraftM)) {
                if (offset >= 0 && offset <= 5) {
                    bestWindow = win;
                }
            }
        }
        if (!bestWindow) {
            bestWindow = windows.find(w => w.canTransit) || windows[windows.length - 1];
        }
        const canTransitTarget = targetWindow ? targetWindow.canTransit : false;
        const targetDraft = targetWindow ? targetWindow.permissibleDraftM : 7.2;
        const targetDateObj = new Date(input.targetArrivalDate);
        const bestDateObj = new Date(bestWindow.date);
        const daysDelay = Math.max(0, Math.round((bestDateObj.getTime() - targetDateObj.getTime()) / (1000 * 3600 * 24)));
        let demurrageAvoided = 0;
        let charterDelayCost = 0;
        if (!canTransitTarget && daysDelay > 0) {
            demurrageAvoided = 2 * demurrageDay;
            charterDelayCost = daysDelay * 2800;
        }
        const netSavingsUsd = Math.max(0, demurrageAvoided - charterDelayCost);
        const netSavingsCrore = (netSavingsUsd * fx) / 10000000;
        const extraCargoUnlocked = Math.max(0, bestWindow.extraCargoCapacityMt - (targetWindow?.extraCargoCapacityMt ?? 0));
        const advisory = canTransitTarget
            ? `Transit feasible on scheduled arrival date (${targetWindow?.date}). Permissible draft of ${targetDraft}m clears vessel draft (${vesselDraft}m) over Auckland Bar.`
            : `Transit restricted on target date (${targetWindow?.date}, draft limit ${targetDraft}m < vessel ${vesselDraft}m). Delaying arrival ${daysDelay} days to ${bestWindow.date} (Spring Tide, ${bestWindow.permissibleDraftM}m) unlocks +${extraCargoUnlocked.toLocaleString()} MT capacity and saves $${demurrageAvoided.toLocaleString()} in tidal demurrage.`;
        return {
            targetArrivalDate: input.targetArrivalDate,
            vesselDraftM: vesselDraft,
            canTransitOnTargetDate: canTransitTarget,
            targetDatePermissibleDraftM: targetDraft,
            recommendedLaycanDate: bestWindow.date,
            recommendedDraftM: bestWindow.permissibleDraftM,
            extraCargoUnlockedMt: extraCargoUnlocked,
            daysToDelay: daysDelay,
            demurrageAvoidedUsd: demurrageAvoided,
            charterDelayCostUsd: charterDelayCost,
            netTidalOptimizationSavingsUsd: netSavingsUsd,
            netSavingsInrCrore: Number(netSavingsCrore.toFixed(2)),
            dailyWindows: windows,
            pilotageAdvisory: advisory,
        };
    }
}
exports.TidalDraftService = TidalDraftService;
//# sourceMappingURL=TidalDraftService.js.map