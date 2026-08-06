import { NextFunction, Request, Response } from 'express';
import * as admin from 'firebase-admin';

export interface AuthedRequest extends Request {
  uid?: string;
  email?: string;
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Brak tokenu autoryzacji' });
    return;
  }
  const token = header.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email;
    next();
  } catch (err) {
    console.warn('requireAuth: invalid or expired token', err);
    res.status(401).json({ error: 'Nieprawidłowy token' });
  }
}
