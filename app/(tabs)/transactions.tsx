import React, { useState, useMemo } from 'react';
import {
  ScrollView, View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { useExpenses } from '../../src/hooks/useExpenses';
import { Card } from '../../src/components/Card';
import { AmountDisplay } from '../../src/components/AmountDisplay';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { getCategoryById, CATEGORIES } from '../../src/constants/categories';
import type { CategoryId } from '../../src/constants/categories';
import { formatDisplayDate, formatGroupHeader, formatDateKey, getCurrentMonth } from '../../src/utils/dateUtils';
import { formatAmount } from '../../src/utils/currency';
import { Search, Filter } from 'lucide-react-native';
import { Timestamp } from 'firebase/firestore';

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const { firebaseUser } = useAuth();
  const { partner } = useHousehold();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [selectedPerson, setSelectedPerson] = useState<'all' | 'me' | 'partner'>('all');

  const { expenses, isLoading, error, retry } = useExpenses({ month: getCurrentMonth() });

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch = searchQuery === '' ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'all' || e.categoryId === selectedCategory;
      const matchPerson = selectedPerson === 'all' ||
        (selectedPerson === 'me' && e.paidByUserId === firebaseUser?.uid) ||
        (selectedPerson === 'partner' && e.paidByUserId !== firebaseUser?.uid);
      return matchSearch && matchCategory && matchPerson;
    });
  }, [expenses, searchQuery, selectedCategory, selectedPerson, firebaseUser]);

  // Group by date
  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const e of filtered) {
      const d = e.date instanceof Timestamp ? e.date.toDate() : e.date as Date;
      const key = formatDateKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  if (isLoading) return <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}><LoadingSpinner fullScreen /></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold }]}>Transactions</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: theme.colors.surfaceOverlay }]}>
        <Search size={16} color={theme.colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.textPrimary, fontSize: theme.fontSize.base }]}
          placeholder="Search expenses"
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search expenses"
        />
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {(['all', 'me', 'partner'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.filterChip, { backgroundColor: selectedPerson === p ? theme.colors.primary : theme.colors.surface, borderColor: selectedPerson === p ? theme.colors.primary : theme.colors.border }]}
            onPress={() => setSelectedPerson(p)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${p}`}
          >
            <Text style={[{ color: selectedPerson === p ? '#fff' : theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium }]}>
              {p === 'all' ? 'Everyone' : p === 'me' ? 'You' : (partner?.displayName ?? 'Partner')}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={[styles.filterDivider, { backgroundColor: theme.colors.separator }]} />
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.filterChip, { backgroundColor: selectedCategory === cat.id ? cat.color : theme.colors.surface, borderColor: selectedCategory === cat.id ? cat.color : theme.colors.border }]}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${cat.label}`}
          >
            <Text style={[{ color: selectedCategory === cat.id ? '#fff' : theme.colors.textSecondary, fontSize: theme.fontSize.sm }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={false} onRefresh={retry} tintColor={theme.colors.primary} />} showsVerticalScrollIndicator={false}>
        {error && <ErrorBanner message={error} onRetry={retry} />}

        {groups.length === 0 ? (
          <EmptyState
            title="No expenses found"
            subtitle={searchQuery ? 'Try a different search term.' : 'Add an expense using the + button.'}
            actionLabel="Add expense"
            onAction={() => router.push('/(modals)/add-expense')}
          />
        ) : (
          groups.map(([dateKey, items]) => (
            <View key={dateKey} style={styles.group}>
              <Text style={[styles.groupHeader, { color: theme.colors.textTertiary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold }]}>
                {formatGroupHeader(dateKey)}
              </Text>
              <Card padding={0}>
                {items.map((expense, idx) => {
                  const isMe = expense.paidByUserId === firebaseUser?.uid;
                  const paidByLabel = isMe ? 'You' : (partner?.displayName ?? 'Partner');
                  return (
                    <TouchableOpacity
                      key={expense.id}
                      style={[styles.expenseRow, idx < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.separator }]}
                      onPress={() => router.push(`/(modals)/expense-detail?id=${expense.id}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`${expense.description}, ${formatAmount(expense.amountPaise)}, paid by ${paidByLabel}`}
                    >
                      <CategoryIcon categoryId={expense.categoryId} size={38} iconSize={19} />
                      <View style={styles.expenseInfo}>
                        <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.medium }]} numberOfLines={1}>{expense.description}</Text>
                        <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>{getCategoryById(expense.categoryId).label} · {paidByLabel}</Text>
                      </View>
                      <AmountDisplay paise={expense.amountPaise} size="sm" bold />
                    </TouchableOpacity>
                  );
                })}
              </Card>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title: {},
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, gap: 8 },
  searchInput: { flex: 1 },
  filters: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  filterDivider: { width: 1, height: '100%', marginHorizontal: 4 },
  scroll: { paddingHorizontal: 16, gap: 16 },
  group: { gap: 8 },
  groupHeader: { letterSpacing: 0.5, paddingHorizontal: 4 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  expenseInfo: { flex: 1, gap: 3 },
});
