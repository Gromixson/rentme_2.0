import { Router, Response } from 'express';
import { db, Timestamp } from '../db';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { executeCancelTx } from '../services/cancel';
import { getProvider } from '../services/provider';
import { requestExpiresAt, resolveRequestStatus } from '../services/requests';
import type { RequestDoc } from '../types';

const router = Router();

function cancelHttpError(res: Response, code: string, err?: unknown): void {
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
  console.error('cancel transaction error:', err ?? code);
  res.status(500).json({ error: 'Błąd serwera' });
}

router.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const { providerId, categoryId, message } = req.body as {
    providerId?: string;
    categoryId?: string;
    message?: string;
  };
  if (!providerId || !categoryId || !message?.trim()) {
    res.status(400).json({ error: 'providerId, categoryId i wiadomość są wymagane' });
    return;
  }
  const trimmed = message.trim();
  if (trimmed.length < 10 || trimmed.length > 500) {
    res.status(400).json({ error: 'Wiadomość: 10–500 znaków' });
    return;
  }

  const provider = await getProvider(providerId);
  if (!provider?.isOnline) {
    res.status(400).json({ error: 'Usługodawca nie jest online' });
    return;
  }
  if (!provider.categories.includes(categoryId)) {
    res.status(400).json({ error: 'Usługodawca nie obsługuje tej kategorii' });
    return;
  }

  const userSnap = await db().collection('users').doc(req.uid!).get();
  const seekerName = userSnap.data()?.name ?? 'Klient';

  const ref = db().collection('requests').doc();
  const doc: RequestDoc = {
    seekerId: req.uid!,
    providerId,
    categoryId,
    message: trimmed,
    status: 'PENDING',
    expiresAt: requestExpiresAt(),
    createdAt: Timestamp.now(),
    seekerName,
  };
  await ref.set(doc);
  res.status(201).json({ id: ref.id, ...doc });
});

router.get('/my', requireAuth, async (req: AuthedRequest, res) => {
  const snap = await db()
    .collection('requests')
    .where('seekerId', '==', req.uid)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  const items = [];
  for (const doc of snap.docs) {
    const data = doc.data() as RequestDoc;
    const status = await resolveRequestStatus(doc.id, data);
    items.push({ id: doc.id, ...data, status });
  }
  res.json(items);
});

router.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
  const snap = await db().collection('requests').doc(req.params.id).get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Prośba nie znaleziona' });
    return;
  }
  const data = snap.data() as RequestDoc;
  if (data.seekerId !== req.uid && data.providerId !== req.uid) {
    res.status(403).json({ error: 'Brak dostępu' });
    return;
  }
  const status = await resolveRequestStatus(snap.id, data);
  res.json({ id: snap.id, ...data, status });
});

router.post('/:id/cancel', requireAuth, async (req: AuthedRequest, res) => {
  const requestId = req.params.id;
  const requestRef = db().collection('requests').doc(requestId);
  try {
    const result = await db().runTransaction(async (tx) =>
      executeCancelTx(tx, requestRef, req.uid!),
    );
    if ('errorCode' in result) {
      cancelHttpError(res, result.errorCode);
      return;
    }
    res.json(result);
  } catch (err) {
    const code = err instanceof Error ? err.message : 'UNKNOWN';
    cancelHttpError(res, code, err);
  }
});

export default router;
