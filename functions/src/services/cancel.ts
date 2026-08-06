import type { RequestDoc } from '../types';
import { isPendingPastExpiry } from './requests';

export type CancelTxResult = { status: 'CANCELLED' } | { errorCode: string };

/** Transaction body for seeker cancel of own PENDING request. */
export async function executeCancelTx(
  tx: FirebaseFirestore.Transaction,
  requestRef: FirebaseFirestore.DocumentReference,
  seekerId: string,
): Promise<CancelTxResult> {
  const snap = await tx.get(requestRef);
  if (!snap.exists) throw new Error('NOT_FOUND');
  const data = snap.data() as RequestDoc;
  if (data.seekerId !== seekerId) throw new Error('FORBIDDEN');
  if (data.status !== 'PENDING') throw new Error('NOT_PENDING');
  if (isPendingPastExpiry(data)) {
    tx.update(requestRef, { status: 'TIMEOUT' });
    return { errorCode: 'TIMEOUT' };
  }

  tx.update(requestRef, { status: 'CANCELLED' });
  return { status: 'CANCELLED' };
}
