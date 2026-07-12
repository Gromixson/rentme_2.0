import { db, REQUEST_TIMEOUT_MS, Timestamp } from '../db';
import type { RequestDoc, RequestStatus } from '../types';

export async function expirePendingRequest(requestId: string): Promise<RequestStatus | null> {
  const ref = db().collection('requests').doc(requestId);
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const data = snap.data() as RequestDoc;
    if (data.status !== 'PENDING') return data.status;
    const now = Date.now();
    if (data.expiresAt.toMillis() > now) return data.status;
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
  const batch = db().batch();
  for (const doc of snap.docs) {
    batch.update(doc.ref, { status: 'TIMEOUT' });
    count++;
  }
  if (count > 0) await batch.commit();
  return count;
}

export function requestExpiresAt(): FirebaseFirestore.Timestamp {
  return Timestamp.fromMillis(Date.now() + REQUEST_TIMEOUT_MS);
}

export async function resolveRequestStatus(
  requestId: string,
  data: RequestDoc,
): Promise<RequestStatus> {
  if (data.status === 'PENDING' && data.expiresAt.toMillis() <= Date.now()) {
    await expirePendingRequest(requestId);
    return 'TIMEOUT';
  }
  return data.status;
}
