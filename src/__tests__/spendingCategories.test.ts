// OurMoney — Category Hierarchy, Data Migration, & Aggregation Unit Tests

import {
  CATEGORIES,
  getCategoryById,
  getNormalizedCategory,
  getSubcategoryLabel,
} from '../constants/categories';
import {
  getNormalizedCategoryTotals,
  calculateSafePercentageChange,
} from '../services/spendingInsightsService';

describe('12 Main Categories & Subcategories Catalog', () => {
  test('contains exactly 12 main categories', () => {
    expect(CATEGORIES.length).toBe(12);
  });

  test('verifies each main category has required properties and subcategories', () => {
    CATEGORIES.forEach((cat) => {
      expect(cat.id).toBeDefined();
      expect(cat.label).toBeDefined();
      expect(cat.iconName).toBeDefined();
      expect(cat.color).toBeDefined();
      expect(cat.subcategories.length).toBeGreaterThan(0);
    });
  });

  test('retrieves category by ID or legacy ID', () => {
    expect(getCategoryById('food_dining').label).toBe('Food & Dining');
    expect(getCategoryById('food').label).toBe('Food & Dining');
    expect(getCategoryById('groceries').label).toBe('Food & Dining');
    expect(getCategoryById('home').label).toBe('Home & Utilities');
    expect(getCategoryById('medical').label).toBe('Health & Medical');
  });

  test('retrieves subcategory labels correctly', () => {
    expect(getSubcategoryLabel('food_dining', 'groceries')).toBe('Groceries');
    expect(getSubcategoryLabel('transport', 'fuel')).toBe('Fuel');
    expect(getSubcategoryLabel('financial_loans', 'loan_emi')).toBe('Loan EMI');
    expect(getSubcategoryLabel('food_dining', 'non_existent')).toBeUndefined();
  });
});

describe('Legacy Category Normalization & Migration', () => {
  test('maps legacy food to food_dining / restaurants', () => {
    const norm = getNormalizedCategory('food');
    expect(norm.mainCategoryId).toBe('food_dining');
    expect(norm.subcategoryId).toBe('restaurants');
  });

  test('maps legacy groceries to food_dining / groceries', () => {
    const norm = getNormalizedCategory('groceries');
    expect(norm.mainCategoryId).toBe('food_dining');
    expect(norm.subcategoryId).toBe('groceries');
  });

  test('maps legacy home to home_utilities / home_supplies', () => {
    const norm = getNormalizedCategory('home');
    expect(norm.mainCategoryId).toBe('home_utilities');
  });

  test('maps unknown category string to other / uncategorized', () => {
    const norm = getNormalizedCategory('some_random_legacy_cat');
    expect(norm.mainCategoryId).toBe('other');
    expect(norm.subcategoryId).toBe('uncategorized');
  });
});

describe('Hierarchical Category Aggregation without Double-Counting', () => {
  test('aggregates expenses exactly once into main category, subcategory, and total', () => {
    const expenses = [
      { categoryId: 'food_dining', subcategoryId: 'groceries', amountPaise: 150000 },
      { categoryId: 'food', amountPaise: 80000 }, // legacy expense
      { categoryId: 'transport', subcategoryId: 'fuel', amountPaise: 200000 },
      { categoryId: 'financial_loans', subcategoryId: 'loan_emi', amountPaise: 1177000 },
    ];

    const result = getNormalizedCategoryTotals(expenses);

    // Total expense sum: 150000 + 80000 + 200000 + 1177000 = 1607000 paise (₹16,070)
    expect(result.totalPaise).toBe(1607000);

    // Main category sums
    expect(result.mainCategoryTotals['food_dining']).toBe(230000); // 150000 + 80000
    expect(result.mainCategoryTotals['transport']).toBe(200000);
    expect(result.mainCategoryTotals['financial_loans']).toBe(1177000);

    // Subcategory sums
    expect(result.subcategoryTotals['food_dining:groceries']).toBe(150000);
    expect(result.subcategoryTotals['food_dining:restaurants']).toBe(80000); // legacy default
    expect(result.subcategoryTotals['transport:fuel']).toBe(200000);
    expect(result.subcategoryTotals['financial_loans:loan_emi']).toBe(1177000);
  });
});

describe('Safe Month-over-Month Comparison', () => {
  test('prevents misleading infinity percentage change when previous period is 0 or null', () => {
    expect(calculateSafePercentageChange(500000, null)).toBeNull();
    expect(calculateSafePercentageChange(500000, 0)).toBeNull();
  });

  test('calculates correct percentage change when previous period data exists', () => {
    const increase = calculateSafePercentageChange(1500000, 1000000);
    expect(increase).toEqual({ pct: 50, label: '+50.0%', isIncrease: true });

    const decrease = calculateSafePercentageChange(800000, 1000000);
    expect(decrease).toEqual({ pct: -20, label: '-20.0%', isIncrease: false });
  });
});
