import { Router } from 'express';
import { CATEGORY_SEED, db, Timestamp } from '../db';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import type { CategoryDoc, ProviderDoc } from '../types';

const router = Router();

router.get('/', async (_req, res) => {
  const snap = await db().collection('categories').orderBy('name').get();
  const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as CategoryDoc) }));
  res.json(items);
});

router.get('/:id/providers', async (req, res) => {
  const categoryId = req.params.id;
  const snap = await db()
    .collection('providers')
    .where('isOnline', '==', true)
    .where('categories', 'array-contains', categoryId)
    .get();

  const providers = snap.docs.map((d) => {
    const p = d.data() as ProviderDoc;
    return {
      id: d.id,
      userId: p.userId,
      name: p.name,
      hourlyRate: p.hourlyRate,
      bio: p.bio ?? '',
      isOnline: p.isOnline,
      averageRating: p.averageRating,
      ratingCount: p.ratingCount,
      categories: p.categories,
    };
  });
  res.json(providers);
});

router.post('/seed', async (req, res) => {
  const existing = await db().collection('categories').limit(1).get();
  if (!existing.empty) {
    res.json({ message: 'Kategorie już istnieją', count: existing.size });
    return;
  }
  const batch = db().batch();
  for (const cat of CATEGORY_SEED) {
    const ref = db().collection('categories').doc();
    batch.set(ref, { ...cat, onlineCount: 0 });
  }
  await batch.commit();
  res.status(201).json({ message: 'Kategorie zaseedowane', count: CATEGORY_SEED.length });
});

router.post('/:id/interests', requireAuth, async (req: AuthedRequest, res) => {
  const categoryId = req.params.id;
  const userSnap = await db().collection('users').doc(req.uid!).get();
  if (!userSnap.exists) {
    res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    return;
  }
  const user = userSnap.data()!;
  const interestRef = db().collection('interests').doc();
  await interestRef.set({
    seekerId: req.uid,
    seekerName: user.name,
    categoryId,
    createdAt: Timestamp.now(),
  });
  res.status(201).json({ id: interestRef.id, categoryId });
});

router.get('/:id/interests/count', requireAuth, async (req: AuthedRequest, res) => {
  const categoryId = req.params.id;
  const snap = await db().collection('interests').where('categoryId', '==', categoryId).get();
  res.json({ count: snap.size });
});

export default router;
