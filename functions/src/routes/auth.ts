import { Router } from 'express';
import * as admin from 'firebase-admin';
import { db, Timestamp } from '../db';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import type { UserDoc, UserRole } from '../types';
import { withTimeout } from '../with-timeout';

const REGISTER_TIMEOUT_MS = 12_000;
const FIRESTORE_SETUP_MSG =
  'Firestore nie jest włączony w projekcie rentme-b5e34. Otwórz https://console.firebase.google.com/project/rentme-b5e34/firestore → Utwórz bazę (tryb testowy), poczekaj 2–3 min i spróbuj ponownie.';

const router = Router();

function normalizeRoles(input: unknown): UserRole[] {
  if (!Array.isArray(input) || input.length === 0) {
    return ['SEEKER', 'PROVIDER'];
  }
  const unique = [
    ...new Set(
      input.filter((r): r is UserRole => r === 'SEEKER' || r === 'PROVIDER'),
    ),
  ];
  return unique.length > 0 ? unique : ['SEEKER', 'PROVIDER'];
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, roles } = req.body as {
      email?: string;
      password?: string;
      name?: string;
      roles?: unknown;
    };
    if (!email || !password || !name?.trim()) {
      res.status(400).json({ error: 'Email, hasło i imię są wymagane' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Hasło musi mieć co najmniej 6 znaków' });
      return;
    }
    const userRoles = normalizeRoles(roles);
    const activeRole: UserRole = userRoles.includes('SEEKER') ? 'SEEKER' : 'PROVIDER';

    let record: admin.auth.UserRecord | undefined;
    try {
      record = await withTimeout(
        admin.auth().createUser({ email, password, displayName: name }),
        REGISTER_TIMEOUT_MS,
      );
      const now = Timestamp.now();
      const userDoc: UserDoc = {
        email,
        name: name.trim(),
        roles: userRoles,
        activeRole,
        createdAt: now,
      };
      await withTimeout(db().collection('users').doc(record.uid).set(userDoc), REGISTER_TIMEOUT_MS);

      await withTimeout(
        db()
          .collection('providers')
          .doc(record.uid)
          .set({
            userId: record.uid,
            hourlyRate: 0,
            bio: '',
            isOnline: false,
            averageRating: 0,
            ratingCount: 0,
            categories: [],
            name: name.trim(),
          }),
        REGISTER_TIMEOUT_MS,
      );
    } catch (inner) {
      if (record?.uid) {
        await admin.auth().deleteUser(record.uid).catch(() => undefined);
      }
      throw inner;
    }

    res.status(201).json({
      uid: record.uid,
      email,
      name: name.trim(),
      roles: userRoles,
      activeRole,
    });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/email-already-exists') {
      res.status(409).json({ error: 'Ten email jest już zarejestrowany' });
      return;
    }
    if (code === 'auth/configuration-not-found') {
      res.status(503).json({
        error:
          'Włącz logowanie Email/Hasło w Firebase Console (Authentication → Sign-in method) lub uruchom: npm run setup:auth',
      });
      return;
    }
    const message = String((err as { message?: string }).message ?? '');
    if (
      message === 'REQUEST_TIMEOUT' ||
      message.includes('Firestore API') ||
      (err as { code?: number }).code === 7
    ) {
      res.status(503).json({ error: FIRESTORE_SETUP_MSG });
      return;
    }
    console.error('register', err);
    res.status(500).json({ error: 'Rejestracja nie powiodła się' });
  }
});

/** Client auth uses Firebase SDK (signInWithEmailAndPassword). No password check on server. */
router.post('/login', (_req, res) => {
  res.status(410).json({
    error:
      'Logowanie tylko przez Firebase Auth w kliencie (signInWithEmailAndPassword). Ten endpoint nie weryfikuje hasła.',
  });
});

router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const snap = await db().collection('users').doc(req.uid!).get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Profil nie znaleziony' });
    return;
  }
  const data = snap.data() as UserDoc;
  res.json({ uid: req.uid, ...data });
});

router.post('/active-role', requireAuth, async (req: AuthedRequest, res) => {
  const { activeRole } = req.body as { activeRole?: UserRole };
  if (activeRole !== 'SEEKER' && activeRole !== 'PROVIDER') {
    res.status(400).json({ error: 'Nieprawidłowa rola' });
    return;
  }
  const userRef = db().collection('users').doc(req.uid!);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    res.status(404).json({ error: 'Profil nie znaleziony' });
    return;
  }
  const user = userSnap.data() as UserDoc;
  if (!user.roles.includes(activeRole)) {
    res.status(400).json({ error: 'Użytkownik nie ma tej roli' });
    return;
  }
  await userRef.update({ activeRole, updatedAt: Timestamp.now() });

  if (activeRole === 'SEEKER') {
    const providerRef = db().collection('providers').doc(req.uid!);
    const providerSnap = await providerRef.get();
    if (providerSnap.exists && (providerSnap.data()?.isOnline as boolean)) {
      await providerRef.update({ isOnline: false, updatedAt: Timestamp.now() });
      const { recalcCategoryOnlineCounts } = await import('../services/provider');
      await recalcCategoryOnlineCounts();
    }
  }

  res.json({ activeRole });
});

export default router;
