// OurMoney — Smart Balanced Spending Categories & Hierarchy
// 12 Main Categories with Subcategories & Legacy Compatibility Mapping.

export type MainCategoryId =
  | 'food_dining'
  | 'home_utilities'
  | 'transport'
  | 'shopping_personal'
  | 'health_medical'
  | 'bills_subscriptions'
  | 'education'
  | 'entertainment_hobbies'
  | 'travel'
  | 'financial_loans'
  | 'family_gifts'
  | 'other';

export type LegacyCategoryId =
  | 'food'
  | 'groceries'
  | 'home'
  | 'shopping'
  | 'medical'
  | 'bills'
  | 'entertainment';

export type CategoryId = MainCategoryId | LegacyCategoryId;

export interface Subcategory {
  id: string;
  label: string;
}

export interface Category {
  id: MainCategoryId;
  label: string;
  iconName: string; // Lucide icon name
  color: string;
  bgColor: string;
  subcategories: Subcategory[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'food_dining',
    label: 'Food & Dining',
    iconName: 'UtensilsCrossed',
    color: '#FF6B6B',
    bgColor: '#FFF1F1',
    subcategories: [
      { id: 'groceries', label: 'Groceries' },
      { id: 'restaurants', label: 'Restaurants' },
      { id: 'food_delivery', label: 'Food Delivery' },
      { id: 'snacks_beverages', label: 'Snacks & Beverages' },
    ],
  },
  {
    id: 'home_utilities',
    label: 'Home & Utilities',
    iconName: 'Home',
    color: '#3B8FD4',
    bgColor: '#EBF4FB',
    subcategories: [
      { id: 'rent', label: 'Rent' },
      { id: 'electricity', label: 'Electricity' },
      { id: 'water', label: 'Water' },
      { id: 'gas', label: 'Gas' },
      { id: 'home_supplies', label: 'Home Supplies' },
      { id: 'repairs_maintenance', label: 'Repairs & Maintenance' },
    ],
  },
  {
    id: 'transport',
    label: 'Transport',
    iconName: 'Car',
    color: '#34A853',
    bgColor: '#E8F8EC',
    subcategories: [
      { id: 'fuel', label: 'Fuel' },
      { id: 'public_transport', label: 'Public Transport' },
      { id: 'taxi_ride', label: 'Taxi & Ride-hailing' },
      { id: 'vehicle_maintenance', label: 'Vehicle Maintenance' },
      { id: 'parking_tolls', label: 'Parking & Tolls' },
    ],
  },
  {
    id: 'shopping_personal',
    label: 'Shopping & Personal Care',
    iconName: 'ShoppingBag',
    color: '#9B59B6',
    bgColor: '#F5EEF8',
    subcategories: [
      { id: 'clothing', label: 'Clothing' },
      { id: 'electronics', label: 'Electronics' },
      { id: 'personal_care', label: 'Personal Care' },
      { id: 'accessories', label: 'Accessories' },
    ],
  },
  {
    id: 'health_medical',
    label: 'Health & Medical',
    iconName: 'Heart',
    color: '#E74C3C',
    bgColor: '#FDEDEC',
    subcategories: [
      { id: 'medicines', label: 'Medicines' },
      { id: 'doctor_hospital', label: 'Doctor & Hospital' },
      { id: 'medical_tests', label: 'Medical Tests' },
      { id: 'health_insurance', label: 'Health Insurance' },
    ],
  },
  {
    id: 'bills_subscriptions',
    label: 'Bills & Subscriptions',
    iconName: 'FileText',
    color: '#F39C12',
    bgColor: '#FEF9E7',
    subcategories: [
      { id: 'mobile_recharge', label: 'Mobile Recharge' },
      { id: 'internet', label: 'Internet' },
      { id: 'ott_subscriptions', label: 'OTT Subscriptions' },
      { id: 'software_subscriptions', label: 'Software Subscriptions' },
    ],
  },
  {
    id: 'education',
    label: 'Education',
    iconName: 'GraduationCap',
    color: '#2980B9',
    bgColor: '#EBF5FB',
    subcategories: [
      { id: 'school_college_fees', label: 'School & College Fees' },
      { id: 'courses', label: 'Courses' },
      { id: 'books', label: 'Books' },
      { id: 'stationery', label: 'Stationery' },
    ],
  },
  {
    id: 'entertainment_hobbies',
    label: 'Entertainment & Hobbies',
    iconName: 'Film',
    color: '#8E44AD',
    bgColor: '#F4ECF7',
    subcategories: [
      { id: 'movies_events', label: 'Movies & Events' },
      { id: 'gaming', label: 'Gaming' },
      { id: 'music', label: 'Music' },
      { id: 'hobbies', label: 'Hobbies' },
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    iconName: 'Plane',
    color: '#D4AC0D',
    bgColor: '#FEF9E7',
    subcategories: [
      { id: 'accommodation', label: 'Accommodation' },
      { id: 'tickets', label: 'Tickets' },
      { id: 'holiday_activities', label: 'Holiday Activities' },
      { id: 'trip_expenses', label: 'Trip Expenses' },
    ],
  },
  {
    id: 'financial_loans',
    label: 'Financial & Loan Payments',
    iconName: 'Landmark',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    subcategories: [
      { id: 'loan_emi', label: 'Loan EMI' },
      { id: 'bank_charges', label: 'Bank Charges' },
      { id: 'interest_charges', label: 'Interest Charges' },
      { id: 'financial_fees', label: 'Financial Fees' },
    ],
  },
  {
    id: 'family_gifts',
    label: 'Family, Gifts & Donations',
    iconName: 'Gift',
    color: '#EC4899',
    bgColor: '#FCE7F3',
    subcategories: [
      { id: 'family_needs', label: 'Family Needs' },
      { id: 'gifts', label: 'Gifts' },
      { id: 'donations', label: 'Donations' },
      { id: 'celebrations', label: 'Celebrations' },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    iconName: 'MoreHorizontal',
    color: '#7F8C8D',
    bgColor: '#F2F3F4',
    subcategories: [
      { id: 'uncategorized', label: 'Uncategorized' },
      { id: 'miscellaneous', label: 'Miscellaneous' },
    ],
  },
];

export const CATEGORIES_MAP: Record<MainCategoryId, Category> = CATEGORIES.reduce(
  (acc, cat) => ({ ...acc, [cat.id]: cat }),
  {} as Record<MainCategoryId, Category>,
);

export const LEGACY_CATEGORY_MAP: Record<string, { mainCategoryId: MainCategoryId; defaultSubcategoryId?: string }> = {
  food: { mainCategoryId: 'food_dining', defaultSubcategoryId: 'restaurants' },
  groceries: { mainCategoryId: 'food_dining', defaultSubcategoryId: 'groceries' },
  home: { mainCategoryId: 'home_utilities', defaultSubcategoryId: 'home_supplies' },
  transport: { mainCategoryId: 'transport', defaultSubcategoryId: 'fuel' },
  shopping: { mainCategoryId: 'shopping_personal', defaultSubcategoryId: 'clothing' },
  medical: { mainCategoryId: 'health_medical', defaultSubcategoryId: 'medicines' },
  bills: { mainCategoryId: 'bills_subscriptions', defaultSubcategoryId: 'mobile_recharge' },
  entertainment: { mainCategoryId: 'entertainment_hobbies', defaultSubcategoryId: 'movies_events' },
  education: { mainCategoryId: 'education', defaultSubcategoryId: 'courses' },
  travel: { mainCategoryId: 'travel', defaultSubcategoryId: 'tickets' },
  other: { mainCategoryId: 'other', defaultSubcategoryId: 'miscellaneous' },
};

/**
 * Maps any legacy or main category ID to the official MainCategory object.
 * Falls back to 'other' if invalid.
 */
export function getCategoryById(id: CategoryId | string): Category {
  const normalized = getNormalizedCategory(id);
  return CATEGORIES_MAP[normalized.mainCategoryId] ?? CATEGORIES_MAP['other'];
}

/**
 * Normalizes any category string & optional subcategory string into clean main + subcategory IDs.
 */
export function getNormalizedCategory(
  categoryId: string,
  subcategoryId?: string,
): { mainCategoryId: MainCategoryId; subcategoryId?: string } {
  const legacy = LEGACY_CATEGORY_MAP[categoryId];
  if (legacy) {
    return {
      mainCategoryId: legacy.mainCategoryId,
      subcategoryId: subcategoryId || legacy.defaultSubcategoryId,
    };
  }

  const mainCat = CATEGORIES.find((c) => c.id === categoryId);
  if (mainCat) {
    return {
      mainCategoryId: mainCat.id,
      subcategoryId,
    };
  }

  return { mainCategoryId: 'other', subcategoryId: subcategoryId || 'uncategorized' };
}

/**
 * Finds a subcategory label given a main category ID and subcategory ID.
 */
export function getSubcategoryLabel(categoryId: string, subcategoryId?: string): string | undefined {
  if (!subcategoryId) return undefined;
  const cat = getCategoryById(categoryId);
  const sub = cat.subcategories.find((s) => s.id === subcategoryId);
  return sub?.label;
}
