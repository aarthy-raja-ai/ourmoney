import React, { useState, useMemo } from 'react';
import {
  ScrollView, View, Text, StyleSheet,
  TouchableOpacity, TextInput, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useExpenses } from '../../src/hooks/useExpenses';
import { Card } from '../../src/components/Card';
import { AmountDisplay } from '../../src/components/AmountDisplay';
import { EmptyState } from '../../src/components/EmptyState';
import { SkeletonCard } from '../../src/components/SkeletonLoader';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { getCategoryById, CATEGORIES } from '../../src/constants/categories';
import type { CategoryId } from '../../src/constants/categories';
import { getPaymentMethodById } from '../../src/constants/paymentMethods';
import type { PaymentMethodId } from '../../src/constants/paymentMethods';
import { formatGroupHeader, formatDateKey, getCurrentMonth } from '../../src/utils/dateUtils';
import { Search, X, Plus, FilterX } from 'lucide-react-native';
import { Timestamp } from 'firebase/firestore';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, StatusBar } from 'react-native';

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0,
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');

  const { expenses, isLoading, error, retry } = useExpenses({ month: getCurrentMonth() });

  // Combined filter logic
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return expenses.filter((e) => {
      const matchSearch =
        q === '' ||
        e.description.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q));

      const matchCategory =
        selectedCategory === 'all' || e.categoryId === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [expenses, searchQuery, selectedCategory]);

  // Group expenses chronologically by date
  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const e of filtered) {
      const d = e.date instanceof Timestamp ? e.date.toDate() : (e.date as Date);
      const key = formatDateKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all';

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background, paddingTop: topInset }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Transactions</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchRow, { backgroundColor: theme.colors.surfaceOverlay || '#162744' }]}>
            <Search size={18} color={theme.colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
              placeholder="Search expenses"
              placeholderTextColor={theme.colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search expenses"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <X size={18} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filters Section */}
        <View style={styles.filtersWrapper}>
          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScrollContainer}
            >
              <TouchableOpacity
                style={[
                  styles.chip,
                  selectedCategory === 'all'
                    ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                    : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
                onPress={() => setSelectedCategory('all')}
                accessibilityRole="button"
                accessibilityLabel="Filter by All Categories"
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selectedCategory === 'all' ? '#FFFFFF' : theme.colors.textSecondary },
                    selectedCategory === 'all' && styles.chipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>

              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.chip,
                      isSelected
                        ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                        : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    ]}
                    onPress={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${cat.label}`}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary },
                        isSelected && styles.chipTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Transaction History List */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={retry}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {error && <ErrorBanner message={error} onRetry={retry} />}

          {isLoading ? (
            <View style={{ gap: 12, paddingVertical: 8 }}>
              <SkeletonCard height={72} />
              <SkeletonCard height={72} />
              <SkeletonCard height={72} />
            </View>
          ) : groups.length === 0 ? (
            <EmptyState
              icon={<FilterX size={44} color={theme.colors.textTertiary} />}
              title="No expenses found"
              subtitle={
                expenses.length === 0
                  ? 'Add your first expense using the + button.'
                  : 'No expenses match your current filters.'
              }
              actionLabel={
                expenses.length === 0
                  ? 'Add expense'
                  : hasActiveFilters
                  ? 'Clear filters'
                  : undefined
              }
              onAction={
                expenses.length === 0
                  ? () => router.push('/(modals)/add-expense')
                  : handleClearFilters
              }
            />
          ) : (
            groups.map(([dateKey, items]) => (
              <View key={dateKey} style={styles.group}>
                <Text
                  style={[
                    styles.groupHeader,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {formatGroupHeader(dateKey)}
                </Text>

                <Card padding={0}>
                  {items.map((expense, idx) => {
                    const cat = getCategoryById(expense.categoryId);
                    const pm = getPaymentMethodById(expense.paymentMethod as PaymentMethodId);
                    const pmLabel = pm?.label ?? 'Cash';
                    const isPending = expense.paymentStatus === 'credit';

                    return (
                      <TouchableOpacity
                        key={expense.id}
                        style={[
                          styles.expenseRow,
                          idx < items.length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.separator,
                          },
                        ]}
                        onPress={() => router.push(`/(modals)/expense-detail?id=${expense.id}`)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`${expense.description}, ${cat.label}`}
                      >
                        <CategoryIcon categoryId={expense.categoryId} size={42} iconSize={20} />

                        <View style={styles.expenseInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text
                              style={[styles.expenseTitle, { color: theme.colors.textPrimary }]}
                              numberOfLines={1}
                            >
                              {expense.description}
                            </Text>
                            {isPending && (
                              <View style={{ backgroundColor: theme.colors.warningLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                <Text style={{ color: theme.colors.warning, fontSize: 10, fontWeight: '700' }}>
                                  🟠 Pending
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            style={[styles.expenseMeta, { color: theme.colors.textSecondary }]}
                            numberOfLines={1}
                          >
                            {cat.label} • {pmLabel}
                          </Text>
                        </View>

                        <AmountDisplay
                          paise={expense.amountPaise}
                          size="md"
                          bold
                          color="#FFFFFF"
                        />
                      </TouchableOpacity>
                    );
                  })}
                </Card>
              </View>
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating Action Button (FAB) */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push('/(modals)/add-expense')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Add expense"
        >
          <Plus size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  filtersWrapper: {
    gap: 12,
    paddingBottom: 10,
  },
  filterSection: {
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryScrollContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 16,
  },
  group: {
    gap: 8,
  },
  groupHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  expenseInfo: {
    flex: 1,
    gap: 2,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  expenseMeta: {
    fontSize: 12,
  },
  expensePayer: {
    fontSize: 11,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 99,
  },
});

