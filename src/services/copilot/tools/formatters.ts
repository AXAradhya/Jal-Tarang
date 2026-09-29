/**
 * JAL TARANG — Copilot Currency & Rate Formatters
 */

export const USD_TO_INR = 95.00;

export function formatMoney(usdAmount: number, currency: string = 'INR'): string {
  if (currency.toUpperCase() === 'INR') {
    const inr = usdAmount * USD_TO_INR;
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

export function formatRate(usdPerMt: number, currency: string = 'INR'): string {
  if (currency.toUpperCase() === 'INR') {
    return `₹${(usdPerMt * USD_TO_INR).toFixed(2)}/MT`;
  }
  return `$${usdPerMt.toFixed(2)}/MT`;
}

export function formatDaily(usdDay: number, currency: string = 'INR'): string {
  if (currency.toUpperCase() === 'INR') {
    const inr = usdDay * USD_TO_INR;
    if (inr >= 100_000) {
      return `₹${(inr / 100_000).toFixed(1)}L/day`;
    }
    return `₹${Math.round(inr).toLocaleString('en-IN')}/day`;
  }
  return `$${Math.round(usdDay).toLocaleString('en-US')}/day`;
}
