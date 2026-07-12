import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import app from './app';
import { expireStalePendingRequests } from './services/requests';

/** Functions emulator uses production Auth + Firestore unless firebase CLI sets emulator hosts. */
admin.initializeApp();

export const api = onRequest({ region: 'europe-west1', cors: false }, app);

export const expireRequests = onSchedule(
  { schedule: 'every 1 minutes', region: 'europe-west1' },
  async () => {
    const count = await expireStalePendingRequests();
    if (count > 0) {
      console.log(`Expired ${count} pending requests`);
    }
  },
);
