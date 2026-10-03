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
  arrayRemove,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User, CreateUserInput, UpdateUserInput } from '../models/user';
export type { CreateUserInput };
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
    const userDoc: Record<string, any> = {
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

    // 1. Fetch user profile to check household association
    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const householdId = userData.householdId;

      if (householdId) {
        const householdRef = doc(db, COLLECTIONS.HOUSEHOLDS, householdId);
        const householdSnap = await getDoc(householdRef);

        if (householdSnap.exists()) {
          const householdData = householdSnap.data();
          const memberIds: string[] = householdData.memberIds ?? [];
          const remainingMembers = memberIds.filter((id) => id !== userId);

          if (remainingMembers.length === 0) {
            // Solo household with no other members -> Delete household document
            console.log('[DELETE_ACCOUNT] Deleting solo household document:', householdId);
            await deleteDoc(householdRef);
          } else {
            // Shared household -> Remove user from memberIds and transfer ownership if creator
            console.log('[DELETE_ACCOUNT] Removing user from shared household:', householdId);
            const updates: Record<string, any> = {
              memberIds: arrayRemove(userId),
              updatedAt: serverTimestamp(),
            };

            if (householdData.createdByUserId === userId && remainingMembers[0]) {
              updates.createdByUserId = remainingMembers[0];
            }

            await updateDoc(householdRef, updates);
          }
        }
      }
    }

    // 2. Delete Firestore user profile document
    await deleteDoc(userDocRef);

    // 3. Delete Firebase Auth user credentials
    await deleteUser(user);
  } catch (error: any) {
    console.error('[DELETE_ACCOUNT] Error during account deletion:', error);
    if (error?.code === 'auth/requires-recent-login') {
      throw new Error(
        'For security reasons, please sign out and sign back in before deleting your account.',
      );
    }
    if (error instanceof Error && error.message.includes('Cannot delete')) throw error;
    throw new Error(toUserFriendlyError(error, 'account-delete'));
  }
}

export const deleteUserAccount = deleteAccount;
export async function updateProfileName(userId: string, displayName: string): Promise<void> {
  return updateUserProfile(userId, { displayName });
}
