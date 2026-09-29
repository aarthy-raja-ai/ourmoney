// OurMoney — Firebase Initialization
// Initializes Firebase app, Auth with AsyncStorage persistence, and Firestore.

import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './firebaseConfig';

// Prevent multiple app initialization on Metro fast-refresh
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Safe Auth initialization with React Native persistence (AsyncStorage)
let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
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
