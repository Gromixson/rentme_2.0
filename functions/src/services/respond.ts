import { db, Timestamp } from '../db';
import type { BookingDoc, RequestDoc } from '../types';
import { isPendingPastExpiry } from './requests';

export type RespondTxResult =
  | { status: 'ACCEPTED'; bookingId: string }
  | { status: 'DECLINED'; bookingId: null }
  | { errorCode: string };

/** Transaction body for provider respond (accept / decline). */
export async function executeRespondTx(
  tx: FirebaseFirestore.Transaction,
  requestRef: FirebaseFirestore.DocumentReference,
  providerId: string,
  action: 'accept' | 'decline',
  requestId: string,
): Promise<RespondTxResult> {
  const snap = await tx.get(requestRef);
  if (!snap.exists) throw new Error('NOT_FOUND');
  const data = snap.data() as RequestDoc;
  if (data.providerId !== providerId) throw new Error('FORBIDDEN');
  if (data.status !== 'PENDING') throw new Error('NOT_PENDING');
  if (isPendingPastExpiry(data)) {
    tx.update(requestRef, { status: 'TIMEOUT' });
    return { errorCode: 'TIMEOUT' };
  }

  if (action === 'decline') {
    tx.update(requestRef, { status: 'DECLINED' });
    return { status: 'DECLINED', bookingId: null };
  }

  tx.update(requestRef, { status: 'ACCEPTED' });
  const bookingRef = db().collection('bookings').doc();
  const booking: BookingDoc = {
    requestId,
    providerId: data.providerId,
    seekerId: data.seekerId,
    categoryId: data.categoryId,
    status: 'CONFIRMED',
    createdAt: Timestamp.now(),
    startTime: Timestamp.now(),
  };
  tx.set(bookingRef, booking);

  const providerRef = db().collection('providers').doc(providerId);
  tx.update(providerRef, { isOnline: false, updatedAt: Timestamp.now() });

  return { status: 'ACCEPTED', bookingId: bookingRef.id };
}
