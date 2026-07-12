import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Timestamp, db, REQUEST_TIMEOUT_MS } from '../db';
import type { RequestDoc } from '../types';
import { executeRespondTx } from './providers';

vi.mock('../db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../db')>();
  return {
    ...actual,
    db: vi.fn(),
  };
});

const PROVIDER_ID = 'provider-1';
const REQUEST_ID = 'req-respond-1';
const NOW = 1_700_000_000_000;

function pendingDoc(
  expiresAtMs: number,
  status: RequestDoc['status'] = 'PENDING',
  providerId = PROVIDER_ID,
): RequestDoc {
  return {
    seekerId: 'seeker-1',
    providerId,
    categoryId: 'cat-1',
    message: 'Potrzebuję pomocy',
    status,
    expiresAt: Timestamp.fromMillis(expiresAtMs),
    createdAt: Timestamp.fromMillis(expiresAtMs - REQUEST_TIMEOUT_MS),
  };
}

function mockTxContext(snap: { exists: boolean; data: () => RequestDoc | undefined }) {
  const update = vi.fn();
  const set = vi.fn();
  const bookingRef = { id: 'booking-new-1' };
  const requestRef = { id: REQUEST_ID };
  const tx = {
    get: vi.fn().mockResolvedValue(snap),
    update,
    set,
  };
  const bookingsCollection = {
    doc: vi.fn().mockReturnValue(bookingRef),
  };
  const providersCollection = {
    doc: vi.fn().mockReturnValue({ id: PROVIDER_ID }),
  };
  vi.mocked(db).mockReturnValue({
    collection: vi.fn((name: string) => {
      if (name === 'bookings') return bookingsCollection;
      if (name === 'providers') return providersCollection;
      return { doc: vi.fn().mockReturnValue(requestRef) };
    }),
  } as unknown as ReturnType<typeof db>);
  return { tx, update, set, bookingRef, requestRef };
}

describe('POST .../respond — characterization (R-01 / R-02 / R-06)', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accept: PENDING + valid expiry → ACCEPTED + bookingId + tx writes', async () => {
    const { tx, update, set, bookingRef, requestRef } = mockTxContext({
      exists: true,
      data: () => pendingDoc(NOW + 60_000),
    });

    const result = await executeRespondTx(
      tx as never,
      requestRef as never,
      PROVIDER_ID,
      'accept',
      REQUEST_ID,
    );

    expect(result).toEqual({ status: 'ACCEPTED', bookingId: 'booking-new-1' });
    expect(update).toHaveBeenCalledWith(requestRef, { status: 'ACCEPTED' });
    expect(set).toHaveBeenCalledWith(
      bookingRef,
      expect.objectContaining({
        requestId: REQUEST_ID,
        providerId: PROVIDER_ID,
        seekerId: 'seeker-1',
        status: 'CONFIRMED',
      }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ id: PROVIDER_ID }),
      expect.objectContaining({ isOnline: false }),
    );
  });

  it('decline: PENDING + valid expiry → DECLINED + bookingId null', async () => {
    const { tx, update, requestRef } = mockTxContext({
      exists: true,
      data: () => pendingDoc(NOW + 60_000),
    });

    const result = await executeRespondTx(
      tx as never,
      requestRef as never,
      PROVIDER_ID,
      'decline',
      REQUEST_ID,
    );

    expect(result).toEqual({ status: 'DECLINED', bookingId: null });
    expect(update).toHaveBeenCalledWith(requestRef, { status: 'DECLINED' });
  });

  it('expiresAt in the past → errorCode TIMEOUT + status TIMEOUT persist', async () => {
    const { tx, update, requestRef } = mockTxContext({
      exists: true,
      data: () => pendingDoc(NOW - 1_000),
    });

    const result = await executeRespondTx(
      tx as never,
      requestRef as never,
      PROVIDER_ID,
      'accept',
      REQUEST_ID,
    );

    expect(result).toEqual({ errorCode: 'TIMEOUT' });
    expect(update).toHaveBeenCalledWith(requestRef, { status: 'TIMEOUT' });
  });

  it('status ≠ PENDING → NOT_PENDING', async () => {
    const { tx, requestRef } = mockTxContext({
      exists: true,
      data: () => pendingDoc(NOW + 60_000, 'ACCEPTED'),
    });

    await expect(
      executeRespondTx(tx as never, requestRef as never, PROVIDER_ID, 'accept', REQUEST_ID),
    ).rejects.toThrow('NOT_PENDING');
  });

  it('providerId ≠ uid → FORBIDDEN', async () => {
    const { tx, requestRef } = mockTxContext({
      exists: true,
      data: () => pendingDoc(NOW + 60_000, 'PENDING', 'other-provider'),
    });

    await expect(
      executeRespondTx(tx as never, requestRef as never, PROVIDER_ID, 'accept', REQUEST_ID),
    ).rejects.toThrow('FORBIDDEN');
  });

  it('missing document → NOT_FOUND', async () => {
    const { tx, requestRef } = mockTxContext({
      exists: false,
      data: () => undefined,
    });

    await expect(
      executeRespondTx(tx as never, requestRef as never, PROVIDER_ID, 'accept', REQUEST_ID),
    ).rejects.toThrow('NOT_FOUND');
  });
});
