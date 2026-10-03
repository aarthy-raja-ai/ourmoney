// OurMoney — Firebase Initialization
// Initializes Firebase app, Auth with AsyncStorage persistence, and Firestore.

import { initializeApp, getApps } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe configuration resolution (supports EAS Build & local config)
let firebaseConfig: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  firebaseConfig = require('./firebaseConfig').firebaseConfig;
} catch {
  firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCxrRrCwP8IBLsrbhOzBpRF2CeYWAlPsPY',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ourmoney-cf631.firebaseapp.com',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'ourmoney-cf631',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ourmoney-cf631.firebasestorage.app',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '963803062214',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:963803062214:web:739f01eae997b042c75cc7',
  };
}

// Prevent multiple app initialization on Metro fast-refresh
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Safe Auth initialization with React Native persistence (AsyncStorage)
let authInstance: FirebaseAuth.Auth;
try {
  const getPersistence = (FirebaseAuth as any).getReactNativePersistence;
  authInstance = FirebaseAuth.initializeAuth(app, {
    persistence: getPersistence ? getPersistence(AsyncStorage) : undefined,
  });
} catch {
  authInstance = FirebaseAuth.getAuth(app);
}

// Safe Firestore initialization with React Native memory cache (eliminates IndexedDB warning)
let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
} catch {
  dbInstance = getFirestore(app);
}

export const auth = authInstance;
export const db = dbInstance;
export default app;

