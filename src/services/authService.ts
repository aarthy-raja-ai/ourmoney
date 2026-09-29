// OurMoney — Authentication Service
// Wraps Firebase Auth. Architected for future Google Sign-In addition.
// Never stores passwords manually.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  deleteUser,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User as FirebaseUser,
  type Unsubscribe,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User, CreateUserInput, UpdateUserInput } from '../models/user';
import { COLLECTIONS } from './collections';
import { toUserFriendlyError } from '../utils/errorMessages';

// ── Auth Operations ────────────────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<{ user: FirebaseUser }> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = credential;

    // Set display name on Firebase Auth profile
    await firebaseUpdateProfile(user, { displayName });

    // Create Firestore user document
    const userDoc: Omit<User, 'id'> & { createdAt: unknown; updatedAt: unknown } = {
      displayName,
      email: user.email ?? email,
      photoUrl: undefined,
      householdId: undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userDoc);

    return { user };
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'sign-up'));
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ user: FirebaseUser }> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return { user: credential.user };
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'sign-in'));
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'sign-out'));
  }
}

export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

export function onAuthStateChanged(
  callback: (user: FirebaseUser | null) => void,
): Unsubscribe {
  return firebaseOnAuthStateChanged(auth, callback);
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'password-reset'));
  }
}

// ── Profile Operations ─────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as User;
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'profile-fetch'));
  }
}

export async function updateUserProfile(
  userId: string,
  updates: UpdateUserInput,
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user || user.uid !== userId) {
      throw new Error('You can only update your own profile.');
    }

    // Update Firestore document
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // Update Firebase Auth display name if changed
    if (updates.displayName) {
      await firebaseUpdateProfile(user, { displayName: updates.displayName });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('own profile')) throw error;
    throw new Error(toUserFriendlyError(error, 'profile-update'));
  }
}

export async function deleteAccount(userId: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user || user.uid !== userId) {
      throw new Error('Cannot delete this account.');
    }

    // Remove user document (household membership is preserved for partner)
    // The householdId reference is intentionally left in shared collections
    // so partner's historical data is not destroyed
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));

    // Delete Firebase Auth account
    await deleteUser(user);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot delete')) throw error;
    throw new Error(toUserFriendlyError(error, 'account-delete'));
  }
}
