// OurMoney — Household Learned Vendor Preferences Service
// Manages learned vendor-category mappings scoped to a household.

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { COLLECTIONS } from './collections';
import type { MainCategoryId } from '../constants/categories';
import { normalizeVendorText, type VendorMapping } from '../utils/smartCategorizer';
import { toUserFriendlyError } from '../utils/errorMessages';

const VENDOR_MAPPINGS_SUBCOLLECTION = 'vendor_mappings';

function vendorMappingsRef(householdId: string) {
  return collection(db, COLLECTIONS.HOUSEHOLDS, householdId, VENDOR_MAPPINGS_SUBCOLLECTION);
}

/**
 * Save a user-confirmed vendor-category preference for the household.
 */
export async function saveVendorMapping(
  householdId: string,
  rawVendorName: string,
  categoryId: MainCategoryId,
  subcategoryId?: string,
): Promise<VendorMapping> {
  const vendorKey = normalizeVendorText(rawVendorName);
  if (!vendorKey) {
    throw new Error('Invalid vendor name.');
  }

  try {
    const docRef = doc(db, COLLECTIONS.HOUSEHOLDS, householdId, VENDOR_MAPPINGS_SUBCOLLECTION, vendorKey);
    const userId = auth.currentUser?.uid ?? '';

    const mappingData = {
      vendorKey,
      rawVendorName: rawVendorName.trim(),
      categoryId,
      subcategoryId: subcategoryId || null,
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, mappingData, { merge: true });

    return {
      vendorKey,
      rawVendorName: rawVendorName.trim(),
      categoryId,
      subcategoryId,
      updatedBy: userId,
    };
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'expense-save'));
  }
}

/**
 * Remove a saved vendor mapping for a household.
 */
export async function deleteVendorMapping(
  householdId: string,
  vendorKey: string,
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.HOUSEHOLDS, householdId, VENDOR_MAPPINGS_SUBCOLLECTION, vendorKey);
    await deleteDoc(docRef);
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'expense-save'));
  }
}

/**
 * Get all learned vendor mappings for a household as a dictionary keyed by vendorKey.
 */
export async function getVendorMappings(
  householdId: string,
): Promise<Record<string, VendorMapping>> {
  try {
    const snap = await getDocs(vendorMappingsRef(householdId));
    const mappings: Record<string, VendorMapping> = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      mappings[data.vendorKey] = {
        vendorKey: data.vendorKey,
        rawVendorName: data.rawVendorName,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId ?? undefined,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt,
      };
    });
    return mappings;
  } catch (error) {
    console.warn('[VendorService] Could not fetch vendor mappings:', error);
    return {};
  }
}

/**
 * Real-time subscription to household vendor mappings.
 */
export function subscribeToVendorMappings(
  householdId: string,
  callback: (mappings: Record<string, VendorMapping>) => void,
): Unsubscribe {
  return onSnapshot(
    vendorMappingsRef(householdId),
    (snap) => {
      const mappings: Record<string, VendorMapping> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        mappings[data.vendorKey] = {
          vendorKey: data.vendorKey,
          rawVendorName: data.rawVendorName,
          categoryId: data.categoryId,
          subcategoryId: data.subcategoryId ?? undefined,
          updatedBy: data.updatedBy,
          updatedAt: data.updatedAt,
        };
      });
      callback(mappings);
    },
    (err) => {
      console.warn('[VendorService] Vendor mappings subscription error:', err);
      callback({});
    },
  );
}
