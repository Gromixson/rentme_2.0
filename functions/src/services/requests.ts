import { db, REQUEST_TIMEOUT_MS, Timestamp } from '../db';
import type { RequestDoc, RequestStatus } from '../types';

export function isPendingPastExpiry(data: RequestDoc, nowMs: number = Date.now()): boolean {
  return data.status === 'PENDING' && data.expiresAt.toMillis() <= nowMs;
}

export async function expirePendingRequest(requestId: string): Promise<RequestStatus | null> {
  const ref = db().collection('requests').doc(requestId);
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const data = snap.data() as RequestDoc;
    if (!isPendingPastExpiry(data)) return data.status;
    tx.update(ref, { status: 'TIMEOUT' });
    return 'TIMEOUT';
  });
}

export async function expireStalePendingRequests(): Promise<number> {
  const now = Timestamp.now();
  const snap = await db()
    .collection('requests')
    .where('status', '==', 'PENDING')
    .where('expiresAt', '<=', now)
    .limit(100)
    .get();

  let count = 0;
  for (const doc of snap.docs) {
    const status = await expirePendingRequest(doc.id);
    if (status === 'TIMEOUT') count++;
  }
  return count;
}

export function requestExpiresAt(): FirebaseFirestore.Timestamp {
  return Timestamp.fromMillis(Date.now() + REQUEST_TIMEOUT_MS);
}

export async function resolveRequestStatus(
  requestId: string,
  data: RequestDoc,
): Promise<RequestStatus> {
  if (isPendingPastExpiry(data)) {
    await expirePendingRequest(requestId);
    return 'TIMEOUT';
  }
  return data.status;
}
