// OurMoney — User Model
// Stores only information necessary to operate the application.
// NEVER stores: passwords, PINs, bank credentials, Aadhaar, PAN.

import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  displayName: string;
  email: string;
  photoUrl?: string;
  householdId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserProfile {
  id: string;
  displayName: string;
  photoUrl?: string;
}

export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserInput = Partial<Pick<User, 'displayName' | 'photoUrl' | 'householdId'>>;
