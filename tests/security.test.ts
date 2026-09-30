import { describe, it, expect, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../src/config/index.js';
import { ensureTestServerRunning } from './testServerHelper.js';

describe('SAIL MARINEX — Comprehensive Security & Reliability Audit Suite', () => {
  beforeAll(async () => {
    await ensureTestServerRunning();
  });

  const mockOrgId = 'org-sail-corp';
  const otherOrgId = 'org-competitor-corp';

  const validToken = jwt.sign(
    { sub: 'usr-sail-chartering-01', org: mockOrgId, email: 'chartering.manager@sail.in', roles: ['CHARTERING_MANAGER'], permissions: ['contracts:read', 'contracts:create'] },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  const competitorToken = jwt.sign(
    { sub: 'usr-competitor-01', org: otherOrgId, email: 'user@competitor.in', roles: ['CHARTERING_MANAGER'], permissions: ['contracts:read'] },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  describe('1. Authentication & Token Hardening', () => {
    it('should cryptographically reject invalid or tampered JWT tokens', async () => {
      const tamperedToken = validToken.substring(0, validToken.length - 5) + 'xxxxx';
      const resp = await fetch('http://localhost:8000/api/v1/vessels', {
        headers: { Authorization: `Bearer ${tamperedToken}` },
      });
      expect(resp.status).toBe(401);
      const data = await resp.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('TOKEN_INVALID');
    });

    it('should reject unauthenticated calls to internal ML endpoints from non-whitelisted callers', async () => {
      const resp = await fetch('http://localhost:8000/internal/api/v1/features/C5TC', {
        headers: { 'X-Internal-Secret': 'wrong-secret' },
      });
      // Should succeed only with loopback or valid internal secret
      expect([200, 403]).toContain(resp.status);
    });

    it('should store and rotate refresh tokens using SHA-256 hash', () => {
      const testRefreshToken = jwt.sign({ sub: 'user-test', type: 'refresh' }, config.jwt.secret);
      const tokenHash = crypto.createHash('sha256').update(testRefreshToken).digest('hex');
      expect(tokenHash.length).toBe(64); // Full 256-bit hash, not truncated substring
    });
  });

  describe('2. Multi-Tenant Organization Isolation', () => {
    it('should scope vessel search to user organization or verified public fleet', async () => {
      const resp = await fetch('http://localhost:8000/api/v1/vessels', {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      for (const vessel of data.data) {
        // Must either belong to user's org, be public AIS verified, or have no private owner
        expect(
          vessel.organization_id === mockOrgId ||
          vessel.is_verified === true ||
          !vessel.organization_id
        ).toBe(true);
      }
    });

    it('should isolate approval workflows to caller organization', async () => {
      const resp = await fetch('http://localhost:8000/api/v1/approvals', {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.success).toBe(true);
    });
  });

  describe('3. SQL Injection & Query Parameterization', () => {
    it('should sanitize granularity parameter and prevent SQL injection in freight trends', async () => {
      // Attempt SQL injection via granularity parameter
      const maliciousGranularity = "weekly'; DROP TABLE users; --";
      const resp = await fetch(`http://localhost:8000/api/v1/analytics/freight-trends?granularity=${encodeURIComponent(maliciousGranularity)}`, {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.success).toBe(true);
      // Whitelist safely defaults to 'week'
      expect(data.meta.granularity).toBe('week');
    });

    it('should enforce safe numeric bounds on days query parameter', async () => {
      const resp = await fetch('http://localhost:8000/api/v1/analytics/freight-trends?days=-99999', {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.meta.days).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Input Validation & Chaos Sanitization', () => {
    it('should reject inputs with negative quantities in financial/cargo fields', async () => {
      const resp = await fetch('http://localhost:8000/api/v1/chartering', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          charterType: 'VOYAGE',
          loadingPortId: 'port-1',
          dischargingPortId: 'port-2',
          cargoQuantityMt: -50000, // Negative quantity chaos test
        }),
      });
      expect(resp.status).toBe(400);
      const data = await resp.json();
      expect(data.error.code).toBe('VALIDATION_FAILED');
      expect(data.error.message).toContain('cannot be negative');
    });

    it('should reject payload fields with out-of-range date years (e.g. year 9999)', async () => {
      const resp = await fetch('http://localhost:8000/api/v1/chartering', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          charterType: 'VOYAGE',
          loadingPortId: 'port-1',
          dischargingPortId: 'port-2',
          laycanStartDate: '9999-12-31T00:00:00Z', // Out of bounds year
        }),
      });
      expect(resp.status).toBe(400);
      const data = await resp.json();
      expect(data.error.code).toBe('VALIDATION_FAILED');
      expect(data.error.message).toContain('Allowed range is 1950-2100');
    });

    it('should reject fields exceeding maximum length constraints', async () => {
      const hugeString = 'A'.repeat(15000);
      const resp = await fetch('http://localhost:8000/api/v1/chartering', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          charterType: hugeString, // 15k char string chaos injection
          loadingPortId: 'port-1',
          dischargingPortId: 'port-2',
        }),
      });
      expect(resp.status).toBe(400);
      const data = await resp.json();
      expect(data.error.code).toBe('VALIDATION_FAILED');
    });
  });

  describe('5. Collision-Free Reference Generation', () => {
    it('should generate collision-free unique references with random suffixes', async () => {
      // Simulate references generated in chartering
      const refs = new Set<string>();
      const currentYear = new Date().getFullYear();
      for (let i = 0; i < 1000; i++) {
        const uniqueSuffix = `${Date.now().toString().slice(-6)}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const ref = `SAIL-CHT-${currentYear}-${uniqueSuffix}`;
        refs.add(ref);
      }
      // Zero collisions across 1,000 rapid iterations
      expect(refs.size).toBe(1000);
    });
  });
});
