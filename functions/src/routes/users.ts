import { Router } from 'express';
import { db, Timestamp } from '../db';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import type { UserDoc } from '../types';

const router = Router();

router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const snap = await db().collection('users').doc(req.uid!).get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Profil nie znaleziony' });
    return;
  }
  res.json({ uid: req.uid, ...(snap.data() as UserDoc) });
});

router.put('/profile', requireAuth, async (req: AuthedRequest, res) => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: 'Imię jest wymagane' });
    return;
  }
  const trimmed = name.trim();
  await db().collection('users').doc(req.uid!).update({
    name: trimmed,
    updatedAt: Timestamp.now(),
  });
  const providerRef = db().collection('providers').doc(req.uid!);
  const providerSnap = await providerRef.get();
  if (providerSnap.exists) {
    await providerRef.update({ name: trimmed, updatedAt: Timestamp.now() });
  }
  res.json({ name: trimmed });
});

export default router;
