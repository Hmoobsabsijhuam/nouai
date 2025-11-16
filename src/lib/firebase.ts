import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDfso3JD68vAg-SzAbWaJXkdFUzqfMJol8',
  authDomain: 'login-page-787af.firebaseapp.com',
  projectId: 'login-page-787af',
  storageBucket: 'login-page-787af.appspot.com',
  messagingSenderId: '1059831679022',
  appId: '1:1059831679022:web:bb588a721127806a0e37bf',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
