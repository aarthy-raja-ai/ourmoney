// OurMoney — Authentication Context
// Provides current auth state, user profile, and loading states throughout the app.
// Uses a Firestore real-time listener for the user profile so changes (e.g.
// householdId being set after household creation) propagate instantly to the
// NavigationGuard without needing manual refreshProfile() calls.

import React, { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from '../services/authService';
import type { User } from '../models/user';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../services/collections';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  /** Alias for firebaseUser — for convenience in screens */
  user: FirebaseUser | null;
  userProfile: User | null;
  isLoading: boolean;
  /** True once profile has been fetched (may still be null if no doc exists) */
  profileLoaded: boolean;
  isAuthenticated: boolean;
  /** Force-refetch the user profile from Firestore (kept for API compatibility) */
  refreshProfile: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Keep a ref to the active Firestore profile listener so we can unsub on user change
  const profileUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged((user) => {
      setFirebaseUser(user);

      // Cancel any previous profile listener
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }

      if (user) {
        // Subscribe to the user's Firestore document in real-time.
        // When householdId changes (solo/shared setup), NavigationGuard
        // automatically re-renders and routes to the correct screen.
        const userRef = doc(db, COLLECTIONS.USERS, user.uid);
        const unsubProfile = onSnapshot(
          userRef,
          async (snap) => {
            if (snap.exists()) {
              // Profile exists — use it
              setUserProfile({ id: snap.id, ...snap.data() } as User);
            } else {
              // No Firestore profile doc yet (e.g. signed in before doc was created).
              // Auto-create a minimal profile from Firebase Auth data so the app
              // doesn't get stuck in an infinite loading loop.
              try {
                const profileData = {
                  displayName: user.displayName ?? user.email?.split('@')[0] ?? 'User',
                  email: user.email ?? '',
                  photoUrl: user.photoURL ?? undefined,
                  householdId: undefined,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                };
                await setDoc(userRef, profileData);
                // The onSnapshot will fire again with the newly created doc
                return;
              } catch {
                // If auto-create also fails (e.g. offline), set null and continue
                setUserProfile(null);
              }
            }
            setIsLoading(false);
            setProfileLoaded(true);
          },
          (_err) => {
            // Profile read failed (permission denied / offline) — don't get stuck
            setUserProfile(null);
            setIsLoading(false);
            setProfileLoaded(true);
          },
        );
        profileUnsubRef.current = unsubProfile;
      } else {
        setUserProfile(null);
        setIsLoading(false);
        setProfileLoaded(false);
      }
    });

    return () => {
      unsubAuth();
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
      }
    };
  }, []);

  // refreshProfile is now a no-op (real-time listener handles updates)
  // kept for API compatibility with screens that call it
  const refreshProfile = async () => {
    // Real-time listener will already have the latest data — nothing to do.
  };

  const signOut = async () => {
    const { signOut: firebaseSignOut } = await import('../services/authService');
    await firebaseSignOut();
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user: firebaseUser, // alias
        userProfile,
        isLoading,
        profileLoaded,
        isAuthenticated: firebaseUser !== null,
        refreshProfile,
        refreshUserProfile: refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
