
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

let firebaseApp: FirebaseApp;

// A function to initialize Firebase and get the services.
// This will only initialize the app once.
export function initializeFirebase(): { firebaseApp: FirebaseApp, auth: Auth, firestore: Firestore } {
  if (!getApps().length) {
    if (!firebaseConfig.apiKey) {
        throw new Error('Firebase API key is not set. Please check your environment variables.');
    }
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  return { firebaseApp, auth, firestore };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
