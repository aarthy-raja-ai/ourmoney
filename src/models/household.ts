// OurMoney — Household Model

import { Timestamp } from 'firebase/firestore';

export interface Household {
  id: string;
  createdByUserId: string;
  memberIds: string[]; // max 2 in MVP
  inviteCode?: string | null; // 6-char alphanumeric, expires after 24h
  inviteCodeExpiresAt?: Timestamp | null;
  isSolo?: boolean; // true when user chose "Just me" during onboarding
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HouseholdMember {
  userId: string;
  displayName: string;
  photoUrl?: string;
  joinedAt: Timestamp;
}

export type CreateHouseholdInput = Pick<Household, 'createdByUserId'>;

export interface HouseholdWithMembers extends Household {
  members: HouseholdMember[];
}
