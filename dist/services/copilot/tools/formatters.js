"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USD_TO_INR = void 0;
exports.formatMoney = formatMoney;
exports.formatRate = formatRate;
exports.formatDaily = formatDaily;
exports.USD_TO_INR = 95.00;
function formatMoney(usdAmount, currency = 'INR') {
    if (currency.toUpperCase() === 'INR') {
        const inr = usdAmount * exports.USD_TO_INR;
        if (Math.abs(inr) >= 10_000_000) {
            return `₹${(inr / 10_000_000).toFixed(2)} Cr`;
        }
        if (Math.abs(inr) >= 100_000) {
            return `₹${(inr / 100_000).toFixed(2)} Lakh`;
        }
        return `₹${Math.round(inr).toLocaleString('en-IN')}`;
    }
    if (Math.abs(usdAmount) >= 1_000_000) {
        return `$${(usdAmount / 1_000_000).toFixed(2)}M`;
    }
    return `$${Math.round(usdAmount).toLocaleString('en-US')}`;
}
function formatRate(usdPerMt, currency = 'INR') {
    if (currency.toUpperCase() === 'INR') {
        return `₹${(usdPerMt * exports.USD_TO_INR).toFixed(2)}/MT`;
    }
    return `$${usdPerMt.toFixed(2)}/MT`;
}
function formatDaily(usdDay, currency = 'INR') {
    if (currency.toUpperCase() === 'INR') {
        const inr = usdDay * exports.USD_TO_INR;
        if (inr >= 100_000) {
            return `₹${(inr / 100_000).toFixed(1)}L/day`;
        }
        return `₹${Math.round(inr).toLocaleString('en-IN')}/day`;
    }
    return `$${Math.round(usdDay).toLocaleString('en-US')}/day`;
}
//# sourceMappingURL=formatters.js.map