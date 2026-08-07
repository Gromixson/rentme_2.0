import { Router } from 'express';
import { db, Timestamp } from '../db';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { updateProviderRating } from '../services/provider';
import type { BookingDoc, RatingDoc } from '../types';

const router = Router();

router.get('/my', requireAuth, async (req: AuthedRequest, res) => {
  const [asSeeker, asProvider] = await Promise.all([
    db().collection('bookings').where('seekerId', '==', req.uid).get(),
    db().collection('bookings').where('providerId', '==', req.uid).get(),
  ]);

  const map = new Map<string, BookingDoc & { id: string }>();
  for (const snap of [asSeeker, asProvider]) {
    for (const doc of snap.docs) {
      map.set(doc.id, { id: doc.id, ...(doc.data() as BookingDoc) });
    }
  }
  const items = [...map.values()].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  res.json(items);
});

router.post('/:id/complete', requireAuth, async (req: AuthedRequest, res) => {
  const bookingRef = db().collection('bookings').doc(req.params.id);
  const snap = await bookingRef.get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Rezerwacja nie znaleziona' });
    return;
  }
  const data = snap.data() as BookingDoc;
  if (data.providerId !== req.uid && data.seekerId !== req.uid) {
    res.status(403).json({ error: 'Brak dostępu' });
    return;
  }
  if (data.status !== 'CONFIRMED') {
    res.status(400).json({ error: 'Rezerwacja nie jest aktywna' });
    return;
  }
  await bookingRef.update({
    status: 'COMPLETED',
    endTime: Timestamp.now(),
  });
  res.json({ status: 'COMPLETED' });
});

router.post('/:id/rate', requireAuth, async (req: AuthedRequest, res) => {
  const { rating, comment } = req.body as { rating?: number; comment?: string };
  if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    res.status(400).json({ error: 'Ocena musi być liczbą całkowitą 1–5' });
    return;
  }

  const bookingRef = db().collection('bookings').doc(req.params.id);
  const snap = await bookingRef.get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Rezerwacja nie znaleziona' });
    return;
  }
  const booking = snap.data() as BookingDoc;
  if (booking.seekerId !== req.uid) {
    res.status(403).json({ error: 'Tylko klient może ocenić' });
    return;
  }
  if (booking.status !== 'COMPLETED') {
    res.status(400).json({ error: 'Można ocenić tylko zakończoną usługę' });
    return;
  }

  const existing = await db()
    .collection('ratings')
    .where('bookingId', '==', req.params.id)
    .limit(1)
    .get();
  if (!existing.empty) {
    res.status(409).json({ error: 'Ocena już została wystawiona' });
    return;
  }

  const ratingDoc: RatingDoc = {
    bookingId: req.params.id,
    providerId: booking.providerId,
    seekerId: req.uid!,
    rating,
    comment: comment?.trim() || undefined,
    createdAt: Timestamp.now(),
  };
  await db().collection('ratings').add(ratingDoc);
  await updateProviderRating(booking.providerId);
  res.status(201).json(ratingDoc);
});

export default router;
