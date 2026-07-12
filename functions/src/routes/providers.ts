import { Router, Response } from 'express';
import { db, Timestamp } from '../db';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import {
  getProvider,
  isProviderProfileComplete,
  recalcCategoryOnlineCounts,
} from '../services/provider';
import { resolveRequestStatus } from '../services/requests';
import type { BookingDoc, ProviderDoc, RequestDoc } from '../types';

const router = Router();

router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const provider = await getProvider(req.uid!);
  if (!provider) {
    res.status(404).json({ error: 'Profil usługodawcy nie istnieje' });
    return;
  }
  res.json({ ...provider, userId: req.uid });
});

router.put('/status', requireAuth, async (req: AuthedRequest, res) => {
  const { isOnline } = req.body as { isOnline?: boolean };
  if (typeof isOnline !== 'boolean') {
    res.status(400).json({ error: 'isOnline musi być boolean' });
    return;
  }
  const provider = await getProvider(req.uid!);
  if (isOnline && !isProviderProfileComplete(provider)) {
    res.status(400).json({
      error: 'Uzupełnij profil usługodawcy: kategorie i stawka > 0',
    });
    return;
  }
  await db().collection('providers').doc(req.uid!).update({
    isOnline,
    updatedAt: Timestamp.now(),
  });
  await recalcCategoryOnlineCounts();
  res.json({ isOnline });
});

router.put('/categories', requireAuth, async (req: AuthedRequest, res) => {
  const { categories, hourlyRate, bio } = req.body as {
    categories?: string[];
    hourlyRate?: number;
    bio?: string;
  };
  const updates: Partial<ProviderDoc> = { updatedAt: Timestamp.now() };
  if (Array.isArray(categories)) {
    updates.categories = categories;
  }
  if (typeof hourlyRate === 'number') {
    if (hourlyRate < 0) {
      res.status(400).json({ error: 'Stawka musi być >= 0' });
      return;
    }
    updates.hourlyRate = hourlyRate;
  }
  if (typeof bio === 'string') {
    updates.bio = bio.trim();
  }
  const ref = db().collection('providers').doc(req.uid!);
  const snap = await ref.get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Profil usługodawcy nie istnieje' });
    return;
  }
  await ref.update(updates);
  const updated = (await ref.get()).data() as ProviderDoc;
  if (updated.isOnline) {
    await recalcCategoryOnlineCounts();
  }
  res.json(updated);
});

router.get('/requests', requireAuth, async (req: AuthedRequest, res) => {
  const snap = await db()
    .collection('requests')
    .where('providerId', '==', req.uid)
    .where('status', '==', 'PENDING')
    .orderBy('createdAt', 'desc')
    .get();

  const items = [];
  for (const doc of snap.docs) {
    const data = doc.data() as RequestDoc;
    const status = await resolveRequestStatus(doc.id, data);
    if (status === 'PENDING') {
      items.push({ id: doc.id, ...data, status });
    }
  }
  res.json(items);
});

function respondHttpError(res: Response, code: string, err?: unknown): void {
  const map: Record<string, { status: number; error: string }> = {
    NOT_FOUND: { status: 404, error: 'Prośba nie istnieje' },
    FORBIDDEN: { status: 403, error: 'Brak dostępu' },
    NOT_PENDING: { status: 409, error: 'Prośba nie jest już oczekująca' },
    TIMEOUT: { status: 410, error: 'Czas na odpowiedź minął' },
  };
  const mapped = map[code];
  if (mapped) {
    res.status(mapped.status).json({ error: mapped.error });
    return;
  }
  console.error('respond transaction error:', err ?? code);
  res.status(500).json({ error: 'Błąd serwera' });
}

export type RespondTxResult =
  | { status: 'ACCEPTED'; bookingId: string }
  | { status: 'DECLINED'; bookingId: null }
  | { errorCode: string };

/** Transaction body for respond — exported for Phase 1 characterization tests; moves to services/ in Phase 3. */
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
  if (data.expiresAt.toMillis() <= Date.now()) {
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

router.post('/requests/:id/respond', requireAuth, async (req: AuthedRequest, res) => {
  const requestId = req.params.id;
  const { action } = req.body as { action?: 'accept' | 'decline' };
  if (action !== 'accept' && action !== 'decline') {
    res.status(400).json({ error: 'action musi być accept lub decline' });
    return;
  }

  const requestRef = db().collection('requests').doc(requestId);
  try {
    const result = await db().runTransaction(async (tx) =>
      executeRespondTx(tx, requestRef, req.uid!, action, requestId),
    );

    if ('errorCode' in result) {
      respondHttpError(res, result.errorCode);
      return;
    }

    try {
      await recalcCategoryOnlineCounts();
    } catch (recalcErr) {
      console.error('recalcCategoryOnlineCounts after respond failed:', recalcErr);
    }
    res.json(result);
  } catch (err) {
    const code = err instanceof Error ? err.message : 'UNKNOWN';
    respondHttpError(res, code, err);
  }
});

export default router;
