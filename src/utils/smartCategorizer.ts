// OurMoney — Smart Deterministic Vendor Auto-Categorizer
// Privacy-preserving, local auto-categorization based on vendor title & notes.
// NO external AI services or raw financial data transmission.

import type { MainCategoryId } from '../constants/categories';

export interface VendorMapping {
  vendorKey: string;
  rawVendorName: string;
  categoryId: MainCategoryId;
  subcategoryId?: string;
  updatedAt?: any;
  updatedBy?: string;
}

export interface CategorySuggestion {
  categoryId: MainCategoryId;
  subcategoryId?: string;
  confidence: 'high' | 'medium' | 'low';
  isLearned?: boolean;
  matchedRule?: string;
}

interface CategoryRule {
  ruleName: string;
  keywords: string[];
  categoryId: MainCategoryId;
  subcategoryId?: string;
  confidence: 'high' | 'medium';
}

/**
 * Normalizes vendor/title string to a clean matching key.
 * Example: "Aavin Milk Shop #12!" -> "aavin milk shop 12"
 */
export function normalizeVendorText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Common Indian and International vendor & keyword auto-categorization rules.
 */
const CATEGORY_RULES: CategoryRule[] = [
  // 1. Food & Dining / Groceries
  {
    ruleName: 'groceries',
    keywords: ['groceries', 'grocery', 'aavin', 'milk', 'supermarket', 'bigbasket', 'blinkit', 'zepto', 'instamart', 'd mart', 'dmart', 'reliance fresh', 'spencer', 'vegetable', 'fruit', 'bakery', 'kirana'],
    categoryId: 'food_dining',
    subcategoryId: 'groceries',
    confidence: 'high',
  },
  {
    ruleName: 'food_delivery',
    keywords: ['swiggy', 'zomato', 'ubereats', 'eatsure', 'dominos', 'pizza hut', 'kfc', 'mcdonalds', 'burger king'],
    categoryId: 'food_dining',
    subcategoryId: 'food_delivery',
    confidence: 'high',
  },
  {
    ruleName: 'restaurants',
    keywords: ['restaurant', 'hotel', 'dining', 'bhavan', 'cafe', 'starbucks', 'bistro', 'dhabha', 'canteen'],
    categoryId: 'food_dining',
    subcategoryId: 'restaurants',
    confidence: 'high',
  },
  {
    ruleName: 'snacks_beverages',
    keywords: ['tea', 'coffee', 'chai', 'snack', 'juice', 'boba', 'ice cream'],
    categoryId: 'food_dining',
    subcategoryId: 'snacks_beverages',
    confidence: 'medium',
  },

  // 2. Home & Utilities
  {
    ruleName: 'rent',
    keywords: ['rent', 'house rent', 'flat rent', 'apartment rent', 'lease'],
    categoryId: 'home_utilities',
    subcategoryId: 'rent',
    confidence: 'high',
  },
  {
    ruleName: 'electricity',
    keywords: ['electricity', 'tneb', 'bescom', 'cesc', 'uppcl', 'mahadiscom', 'power bill', 'electric bill', 'eb bill', 'adani power'],
    categoryId: 'home_utilities',
    subcategoryId: 'electricity',
    confidence: 'high',
  },
  {
    ruleName: 'water',
    keywords: ['water bill', 'metro water', 'water supply', 'water tanker', 'can water'],
    categoryId: 'home_utilities',
    subcategoryId: 'water',
    confidence: 'high',
  },
  {
    ruleName: 'gas',
    keywords: ['gas cylinder', 'indane', 'bharatgas', 'hp gas', 'piped gas', 'lpg'],
    categoryId: 'home_utilities',
    subcategoryId: 'gas',
    confidence: 'high',
  },
  {
    ruleName: 'home_supplies',
    keywords: ['ikea', 'urban ladder', 'pepperfry', 'hardware', 'furniture', 'plumber', 'electrician'],
    categoryId: 'home_utilities',
    subcategoryId: 'home_supplies',
    confidence: 'medium',
  },

  // 3. Transport
  {
    ruleName: 'fuel',
    keywords: ['petrol', 'diesel', 'fuel', 'indian oil', 'iocl', 'hpcl', 'bpcl', 'shell', 'cng', 'petrol bunk', 'gas station'],
    categoryId: 'transport',
    subcategoryId: 'fuel',
    confidence: 'high',
  },
  {
    ruleName: 'taxi_ride',
    keywords: ['uber', 'ola', 'rapido', 'namma yatri', 'cab', 'taxi', 'auto fare'],
    categoryId: 'transport',
    subcategoryId: 'taxi_ride',
    confidence: 'high',
  },
  {
    ruleName: 'public_transport',
    keywords: ['metro', 'bus ticket', 'irctc', 'train ticket', 'redbus', 'ksrtc', 'msrtc', 'bmtc'],
    categoryId: 'transport',
    subcategoryId: 'public_transport',
    confidence: 'high',
  },
  {
    ruleName: 'parking_tolls',
    keywords: ['fastag', 'toll', 'parking', 'parking fee'],
    categoryId: 'transport',
    subcategoryId: 'parking_tolls',
    confidence: 'high',
  },

  // 4. Shopping & Personal Care
  {
    ruleName: 'clothing',
    keywords: ['myntra', 'zara', 'h&m', 'trends', 'pantaloons', 'lifestyle', 'clothes', 'apparel', 'fashion'],
    categoryId: 'shopping_personal',
    subcategoryId: 'clothing',
    confidence: 'high',
  },
  {
    ruleName: 'electronics',
    keywords: ['croma', 'reliance digital', 'apple', 'samsung', 'amazon', 'flipkart', 'gadget', 'laptop', 'mobile phone'],
    categoryId: 'shopping_personal',
    subcategoryId: 'electronics',
    confidence: 'medium',
  },
  {
    ruleName: 'personal_care',
    keywords: ['salon', 'spa', 'barber', 'haircut', 'cosmetics', 'nykaa', 'makeup', 'skincare'],
    categoryId: 'shopping_personal',
    subcategoryId: 'personal_care',
    confidence: 'high',
  },

  // 5. Health & Medical
  {
    ruleName: 'medicines',
    keywords: ['pharmacy', 'chemist', 'apollo pharmacy', 'netmeds', 'pharmeasy', 'medplus', '1mg', 'medicine', 'tablets'],
    categoryId: 'health_medical',
    subcategoryId: 'medicines',
    confidence: 'high',
  },
  {
    ruleName: 'doctor_hospital',
    keywords: ['hospital', 'doctor', 'clinic', 'dentist', 'consultation', 'physician'],
    categoryId: 'health_medical',
    subcategoryId: 'doctor_hospital',
    confidence: 'high',
  },
  {
    ruleName: 'medical_tests',
    keywords: ['pathology', 'lab test', 'thyrocare', 'lal pathlabs', 'blood test', 'mri', 'x-ray', 'scan'],
    categoryId: 'health_medical',
    subcategoryId: 'medical_tests',
    confidence: 'high',
  },

  // 6. Bills & Subscriptions
  {
    ruleName: 'mobile_recharge',
    keywords: ['recharge', 'airtel', 'jio', 'vi', 'vodafone', 'bsnl', 'mobile bill'],
    categoryId: 'bills_subscriptions',
    subcategoryId: 'mobile_recharge',
    confidence: 'high',
  },
  {
    ruleName: 'internet',
    keywords: ['broadband', 'wifi', 'act fibernet', 'jiofiber', 'airtel xtream', 'hathway'],
    categoryId: 'bills_subscriptions',
    subcategoryId: 'internet',
    confidence: 'high',
  },
  {
    ruleName: 'ott_subscriptions',
    keywords: ['netflix', 'spotify', 'prime video', 'hotstar', 'youtube premium', 'apple music', 'disney'],
    categoryId: 'bills_subscriptions',
    subcategoryId: 'ott_subscriptions',
    confidence: 'high',
  },

  // 7. Education
  {
    ruleName: 'education',
    keywords: ['school', 'college', 'tuition', 'udemy', 'coursera', 'unacademy', 'byju', 'books', 'stationery'],
    categoryId: 'education',
    subcategoryId: 'courses',
    confidence: 'high',
  },

  // 8. Entertainment & Hobbies
  {
    ruleName: 'movies_events',
    keywords: ['pvr', 'inox', 'bookmyshow', 'movie', 'cinema', 'concert', 'event ticket'],
    categoryId: 'entertainment_hobbies',
    subcategoryId: 'movies_events',
    confidence: 'high',
  },
  {
    ruleName: 'gaming',
    keywords: ['steam', 'playstation', 'xbox', 'nintendo', 'gaming'],
    categoryId: 'entertainment_hobbies',
    subcategoryId: 'gaming',
    confidence: 'high',
  },

  // 9. Travel
  {
    ruleName: 'travel',
    keywords: ['flight', 'makemytrip', 'goibibo', 'airasia', 'indigo', 'hotel booking', 'airbnb', 'resort', 'vacation'],
    categoryId: 'travel',
    subcategoryId: 'tickets',
    confidence: 'high',
  },

  // 10. Financial & Loan Payments
  {
    ruleName: 'loan_emi',
    keywords: ['emi', 'loan payment', 'mortgage', 'sbi home loan', 'muthoot', 'hdfc loan'],
    categoryId: 'financial_loans',
    subcategoryId: 'loan_emi',
    confidence: 'high',
  },
];

function matchesKeyword(text: string, kw: string): boolean {
  if (kw.length <= 2) {
    const regex = new RegExp(`\\b${kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    return regex.test(text);
  }
  return text.includes(kw);
}

/**
 * Predicts category for an expense based on vendor/title, notes, and household custom mappings.
 */
export function categorizeExpense(
  title: string,
  notes?: string,
  customMappings?: Record<string, VendorMapping>,
): CategorySuggestion {
  const normTitle = normalizeVendorText(title);
  const normNotes = normalizeVendorText(notes || '');
  const combined = `${normTitle} ${normNotes}`.trim();

  if (!combined) {
    return { categoryId: 'other', subcategoryId: 'uncategorized', confidence: 'low' };
  }

  // Priority 1: User-confirmed learned mapping for household
  if (customMappings) {
    // Exact vendor key match
    if (customMappings[normTitle]) {
      const mapping = customMappings[normTitle];
      return {
        categoryId: mapping.categoryId,
        subcategoryId: mapping.subcategoryId,
        confidence: 'high',
        isLearned: true,
      };
    }
    // Partial key match
    for (const [key, mapping] of Object.entries(customMappings)) {
      if (key.length >= 3 && normTitle.includes(key)) {
        return {
          categoryId: mapping.categoryId,
          subcategoryId: mapping.subcategoryId,
          confidence: 'high',
          isLearned: true,
        };
      }
    }
  }

  // Priority 2: Built-in deterministic rules
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (matchesKeyword(combined, kw)) {
        return {
          categoryId: rule.categoryId,
          subcategoryId: rule.subcategoryId,
          confidence: rule.confidence,
          matchedRule: rule.ruleName,
        };
      }
    }
  }

  // Fallback: low confidence
  return { categoryId: 'other', subcategoryId: 'uncategorized', confidence: 'low' };
}
