/**
 * SAIL MARINEX — Copilot Open Data & Live Telemetry Intelligence Test Suite
 */

import { describe, it, expect } from 'vitest';
import { CopilotService } from '../src/services/copilot/CopilotService.js';

describe('MARINEX Copilot Open Data & Live Telemetry Intelligence', () => {
  it('should answer questions about IMD cyclone alerts and port sea states', async () => {
    const res = await CopilotService.answerQuery('Are there any cyclone alerts or high swells for Paradip port?');
    expect(res.answer.toLowerCase()).toContain('paradip');
    expect(res.answer.toLowerCase()).toContain('cyclone');
    expect(res.evidence.length).toBeGreaterThan(0);
    expect(res.confidence).toBeGreaterThan(0.9);
  }, 15000);

  it('should answer questions about live USD/INR exchange rates and landed costs', async () => {
    const res = await CopilotService.answerQuery('What is the current USD/INR rate and landed freight cost?');
    const answer = res.answer.toLowerCase();
    expect(answer.includes('usd') || answer.includes('inr') || answer.includes('₹') || answer.includes('95')).toBe(true);
    expect(res.evidence.length).toBeGreaterThan(0);
  }, 15000);

  it('should answer questions about World Bank Pink Sheet commodity benchmarks', async () => {
    const res = await CopilotService.answerQuery('What are the latest World Bank commodity benchmarks for coking coal?');
    const answer = res.answer.toLowerCase();
    expect(answer).toContain('coking coal');
    expect(answer.includes('248') || answer.includes('world bank') || answer.includes('benchmark')).toBe(true);
    expect(res.evidence.length).toBeGreaterThan(0);
  }, 15000);

  it('should answer questions about Indian Major Ports logistics from Data.gov.in / IPA', async () => {
    const res = await CopilotService.answerQuery('What is the turnaround time and rake capacity at Paradip and Bhilai plant demand?');
    const answer = res.answer.toLowerCase();
    expect(answer).toContain('paradip');
    expect(answer).toContain('48.2');
    expect(answer).toContain('bhilai');
    expect(res.evidence.length).toBeGreaterThan(0);
  }, 15000);
});
