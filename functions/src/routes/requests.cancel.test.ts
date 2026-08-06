import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Timestamp, REQUEST_TIMEOUT_MS } from '../db';
import type { RequestDoc } from '../types';
import { executeCancelTx } from '../services/cancel';

const SEEKER_ID = 'seeker-1';
const REQUEST_ID = 'req-cancel-1';
const NOW = 1_700_000_000_000;

function pendingDoc(
  expiresAtMs: number,
  status: RequestDoc['status'] = 'PENDING',
  seekerId = SEEKER_ID,
): RequestDoc {
  return {
    seekerId,
    providerId: 'provider-1',
    categoryId: 'cat-1',
    message: 'Potrzebuję pomocy',
    status,
    expiresAt: Timestamp.fromMillis(expiresAtMs),
    createdAt: Timestamp.fromMillis(expiresAtMs - REQUEST_TIMEOUT_MS),
  };
}

function mockTxContext(snap: { exists: boolean; data: () => RequestDoc | undefined }) {
  const update = vi.fn();
  const requestRef = { id: REQUEST_ID };
  const tx = {
    get: vi.fn().mockResolvedValue(snap),
    update,
  };
  return { tx, update, requestRef };
}

describe('POST .../cancel — seeker soft-delete PENDING', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('happy path: PENDING + own seeker → CANCELLED', async () => {
    const { tx, update, requestRef } = mockTxContext({
      exists: true,
      data: () => pendingDoc(NOW + 60_000),
    });

    const result = await executeCancelTx(tx as never, requestRef as never, SEEKER_ID);

    expect(result).toEqual({ status: 'CANCELLED' });
    expect(update).toHaveBeenCalledWith(requestRef, { status: 'CANCELLED' });
  });

  it('seekerId ≠ uid → FORBIDDEN', async () => {
    const { tx, requestRef } = mockTxContext({
      exists: true,
      data: () => pendingDoc(NOW + 60_000, 'PENDING', 'other-seeker'),
    });

    await expect(executeCancelTx(tx as never, requestRef as never, SEEKER_ID)).rejects.toThrow(
      'FORBIDDEN',
    );
  });

  it('status ≠ PENDING → NOT_PENDING', async () => {
    const { tx, requestRef } = mockTxContext({
      exists: true,
      data: () => pendingDoc(NOW + 60_000, 'ACCEPTED'),
    });

    await expect(executeCancelTx(tx as never, requestRef as never, SEEKER_ID)).rejects.toThrow(
      'NOT_PENDING',
    );
  });

  it('expiresAt in the past → errorCode TIMEOUT + status TIMEOUT persist', async () => {
    const { tx, update, requestRef } = mockTxContext({
      exists: true,
      data: () => pendingDoc(NOW - 1_000),
    });

    const result = await executeCancelTx(tx as never, requestRef as never, SEEKER_ID);

    expect(result).toEqual({ errorCode: 'TIMEOUT' });
    expect(update).toHaveBeenCalledWith(requestRef, { status: 'TIMEOUT' });
  });
});
