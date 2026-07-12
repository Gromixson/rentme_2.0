import type { FirebaseOptions } from 'firebase/app';

/** Production: Firebase Hosting rewrites same-origin /api to Cloud Function `api`. */
export const environment = {
  production: true,
  enablePerformanceMonitoring: true,
  useEmulators: false,
  apiUrl: '/api',
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.firebasestorage.app',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
  } satisfies FirebaseOptions,
};
