import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { getPerformance } from 'firebase/performance';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

import { environment } from '../../../environments/environment';
import {
  FIREBASE_APP,
  FIREBASE_AUTH,
  FIREBASE_FIRESTORE,
  FIREBASE_STORAGE,
} from './firebase.tokens';

function initPerformanceMonitoringIfEnabled(): void {
  const performanceEnabled =
    'enablePerformanceMonitoring' in environment &&
    (environment as { enablePerformanceMonitoring?: boolean }).enablePerformanceMonitoring ===
      true;
  if (!environment.production || !performanceEnabled || environment.useEmulators) {
    return;
  }
  getPerformance(inject(FIREBASE_APP));
}

function connectEmulatorsIfEnabled(): void {
  if (!environment.useEmulators) {
    return;
  }
  const auth = inject(FIREBASE_AUTH);
  const firestore = inject(FIREBASE_FIRESTORE);
  const storage = inject(FIREBASE_STORAGE);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}

export function provideRentMeFirebase(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: FIREBASE_APP,
      useFactory: () => initializeApp(environment.firebase),
    },
    {
      provide: FIREBASE_AUTH,
      useFactory: () => getAuth(inject(FIREBASE_APP)),
    },
    {
      provide: FIREBASE_FIRESTORE,
      useFactory: () => getFirestore(inject(FIREBASE_APP)),
    },
    {
      provide: FIREBASE_STORAGE,
      useFactory: () => getStorage(inject(FIREBASE_APP)),
    },
    provideEnvironmentInitializer(connectEmulatorsIfEnabled),
    provideEnvironmentInitializer(initPerformanceMonitoringIfEnabled),
  ]);
}
