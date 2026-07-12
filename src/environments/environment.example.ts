import type { FirebaseOptions } from 'firebase/app';

export const environment = {
  production: false,
  /** Firebase Performance Monitoring (web). Enable in Console first; prod only. */
  enablePerformanceMonitoring: false,
  /** Set true when running firebase emulators (Auth 9099, Firestore 8080). */
  useEmulators: true,
  /** Dev: use Angular proxy (proxy.conf.json). Prod: often '' with Hosting rewrite. */
  apiUrl: '/api',
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'rentme2-76ba8.firebaseapp.com',
    projectId: 'rentme2-76ba8',
    storageBucket: 'rentme2-76ba8.firebasestorage.app',
    messagingSenderId: '96938767356',
    appId: 'YOUR_APP_ID',
  } satisfies FirebaseOptions,
};
