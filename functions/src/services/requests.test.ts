import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Timestamp } from '../db';
import { REQUEST_TIMEOUT_MS } from '../db';
import type { RequestDoc } from '../types';
import {
  expirePendingRequest,
  isPendingPastExpiry,
  requestExpiresAt,
  resolveRequestStatus,
} from './requests';

vi.mock('../db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../db')>();
  return {
    ...actual,
    db: vi.fn(),
  };
});

import { db } from '../db';

function pendingDoc(expiresAtMs: number, status: RequestDoc['status'] = 'PENDING'): RequestDoc {
  return {
    seekerId: 'seeker-1',
    providerId: 'provider-1',
    categoryId: 'cat-1',
    message: 'Potrzebuję pomocy',
    status,
    expiresAt: Timestamp.fromMillis(expiresAtMs),
    createdAt: Timestamp.fromMillis(expiresAtMs - REQUEST_TIMEOUT_MS),
  };
}

function mockTransaction(snap: { exists: boolean; data: () => RequestDoc | undefined }) {
  const update = vi.fn();
  const tx = {
    get: vi.fn().mockResolvedValue(snap),
    update,
  };
  const runTransaction = vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx));
  const docRef = { id: 'req-1' };
  const collection = {
    doc: vi.fn().mockReturnValue(docRef),
  };
  vi.mocked(db).mockReturnValue({
    collection: vi.fn().mockReturnValue(collection),
    runTransaction,
  } as unknown as ReturnType<typeof db>);
  return { update, runTransaction };
}

describe('request timeout (R-04 / FR-011)', () => {
  describe('isPendingPastExpiry — oracle: MVP §3.5 PENDING → TIMEOUT after window', () => {
    const now = 1_700_000_000_000;

    it('returns true when PENDING and expiresAt is in the past', () => {
      expect(isPendingPastExpiry(pendingDoc(now - 1), now)).toBe(true);
    });

    it('returns false when PENDING but expiry is still in the future (edge: seeker still waiting)', () => {
      expect(isPendingPastExpiry(pendingDoc(now + 30_000), now)).toBe(false);
    });

    it('returns false for terminal statuses even if expiresAt is past (edge: no re-expiry)', () => {
      const base = pendingDoc(now - 1);
      for (const status of ['ACCEPTED', 'DECLINED', 'TIMEOUT'] as const) {
        expect(isPendingPastExpiry({ ...base, status }, now)).toBe(false);
      }
    });
  });

  describe('requestExpiresAt — oracle: PRD ~1–2 min response window', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-12T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('sets expiry ~120s after creation (REQUEST_TIMEOUT_MS)', () => {
      const before = Date.now();
      expect(requestExpiresAt().toMillis() - before).toBe(REQUEST_TIMEOUT_MS);
    });
  });

  describe('expirePendingRequest — transactional persist TIMEOUT', () => {
    const now = 1_700_000_000_000;

    beforeEach(() => {
      vi.spyOn(Date, 'now').mockReturnValue(now);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('writes TIMEOUT when PENDING is overdue', async () => {
      const { update } = mockTransaction({
        exists: true,
        data: () => pendingDoc(now - 1_000),
      });

      await expect(expirePendingRequest('req-1')).resolves.toBe('TIMEOUT');
      expect(update).toHaveBeenCalledWith(expect.anything(), { status: 'TIMEOUT' });
    });

    it('does not mutate when PENDING is still inside the window', async () => {
      const { update } = mockTransaction({
        exists: true,
        data: () => pendingDoc(now + 60_000),
      });

      await expect(expirePendingRequest('req-1')).resolves.toBe('PENDING');
      expect(update).not.toHaveBeenCalled();
    });

    it('does not mutate terminal statuses (edge: ACCEPTED stays ACCEPTED)', async () => {
      const { update } = mockTransaction({
        exists: true,
        data: () => pendingDoc(now - 1_000, 'ACCEPTED'),
      });

      await expect(expirePendingRequest('req-1')).resolves.toBe('ACCEPTED');
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('resolveRequestStatus — lazy read-path expiry', () => {
    const now = 1_700_000_000_000;

    beforeEach(() => {
      vi.spyOn(Date, 'now').mockReturnValue(now);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns TIMEOUT after persisting when overdue PENDING is read', async () => {
      mockTransaction({
        exists: true,
        data: () => pendingDoc(now - 1_000),
      });

      await expect(resolveRequestStatus('req-42', pendingDoc(now - 1_000))).resolves.toBe(
        'TIMEOUT',
      );
    });

    it('returns PENDING without DB write when still inside the window', async () => {
      const { update } = mockTransaction({
        exists: true,
        data: () => pendingDoc(now + 60_000),
      });

      await expect(resolveRequestStatus('req-43', pendingDoc(now + 60_000))).resolves.toBe(
        'PENDING',
      );
      expect(update).not.toHaveBeenCalled();
    });
  });
});
