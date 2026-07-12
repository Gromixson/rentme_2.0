import type { FirebaseOptions } from 'firebase/app';

/** Production: Firebase Hosting rewrites same-origin /api to Cloud Function `api`. */
export const environment = {
  production: true,
  enablePerformanceMonitoring: true,
  useEmulators: false,
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
