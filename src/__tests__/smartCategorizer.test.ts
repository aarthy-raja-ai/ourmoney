// OurMoney — Smart Deterministic Auto-Categorizer Unit Tests

import {
  categorizeExpense,
  normalizeVendorText,
  type VendorMapping,
} from '../utils/smartCategorizer';

describe('Smart Auto-Categorizer & Vendor Matching', () => {
  test('normalizes vendor text consistently', () => {
    expect(normalizeVendorText('  Aavin Milk Shop #12! ')).toBe('aavin milk shop 12');
    expect(normalizeVendorText('PETROL BUNK @ IOCL')).toBe('petrol bunk iocl');
    expect(normalizeVendorText('Swiggy Order #8923')).toBe('swiggy order 8923');
  });

  test('auto-categorizes Aavin Milk to Food & Dining / Groceries', () => {
    const result = categorizeExpense('Aavin Milk');
    expect(result.categoryId).toBe('food_dining');
    expect(result.subcategoryId).toBe('groceries');
    expect(result.confidence).toBe('high');
  });

  test('auto-categorizes Petrol Bunk to Transport / Fuel', () => {
    const result = categorizeExpense('Indian Oil Petrol Bunk');
    expect(result.categoryId).toBe('transport');
    expect(result.subcategoryId).toBe('fuel');
    expect(result.confidence).toBe('high');
  });

  test('auto-categorizes Electricity Board to Home & Utilities / Electricity', () => {
    const result = categorizeExpense('TNEB Electricity Bill');
    expect(result.categoryId).toBe('home_utilities');
    expect(result.subcategoryId).toBe('electricity');
    expect(result.confidence).toBe('high');
  });

  test('auto-categorizes Pharmacy to Health & Medical / Medicines', () => {
    const result = categorizeExpense('Apollo Pharmacy');
    expect(result.categoryId).toBe('health_medical');
    expect(result.subcategoryId).toBe('medicines');
    expect(result.confidence).toBe('high');
  });

  test('auto-categorizes Movie ticket to Entertainment & Hobbies / Movies & Events', () => {
    const result = categorizeExpense('PVR Movie ticket');
    expect(result.categoryId).toBe('entertainment_hobbies');
    expect(result.subcategoryId).toBe('movies_events');
    expect(result.confidence).toBe('high');
  });

  test('auto-categorizes Zomato / Swiggy to Food & Dining / Food Delivery', () => {
    const result = categorizeExpense('Swiggy Order');
    expect(result.categoryId).toBe('food_dining');
    expect(result.subcategoryId).toBe('food_delivery');
    expect(result.confidence).toBe('high');
  });

  test('auto-categorizes Netflix to Bills & Subscriptions / OTT Subscriptions', () => {
    const result = categorizeExpense('Netflix Monthly Subscription');
    expect(result.categoryId).toBe('bills_subscriptions');
    expect(result.subcategoryId).toBe('ott_subscriptions');
    expect(result.confidence).toBe('high');
  });

  test('returns low confidence for unknown / ambiguous descriptions', () => {
    const result = categorizeExpense('Random Store Purchase 998');
    expect(result.categoryId).toBe('other');
    expect(result.subcategoryId).toBe('uncategorized');
    expect(result.confidence).toBe('low');
  });

  test('prioritizes learned user vendor mappings over generic rules', () => {
    const customMappings: Record<string, VendorMapping> = {
      'random store': {
        vendorKey: 'random store',
        rawVendorName: 'Random Store',
        categoryId: 'education',
        subcategoryId: 'stationery',
      },
    };

    const result = categorizeExpense('Random Store', undefined, customMappings);
    expect(result.categoryId).toBe('education');
    expect(result.subcategoryId).toBe('stationery');
    expect(result.confidence).toBe('high');
    expect(result.isLearned).toBe(true);
  });
});
