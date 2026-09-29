// OurMoney — SpendingReflectionModal
// Modal popup triggered before saving an expense when smart reflection flags notice
// budget threshold, large transaction, or high category spending.

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';
import { formatCurrency } from '../utils/currency';
import type { SpendingReflectionResult } from '../services/spendingInsightsService';

interface SpendingReflectionModalProps {
  visible: boolean;
  reflection: SpendingReflectionResult | null;
  amountPaise: number;
  categoryName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const SpendingReflectionModal: React.FC<SpendingReflectionModalProps> = ({
  visible,
  reflection,
  amountPaise,
  categoryName,
  onConfirm,
  onCancel,
  isSubmitting = false,
}) => {
  const { theme } = useTheme();

  if (!reflection) return null;

  const getAlertIcon = () => {
    switch (reflection.highestSeverity) {
      case 'exceeded':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'notice':
        return 'information-circle';
      default:
        return 'sparkles';
    }
  };

  const getAlertColor = () => {
    switch (reflection.highestSeverity) {
      case 'exceeded':
        return theme.colors.danger;
      case 'warning':
        return theme.colors.warning;
      case 'notice':
        return theme.colors.primary;
      default:
        return theme.colors.success;
    }
  };

  const getAlertBg = () => {
    switch (reflection.highestSeverity) {
      case 'exceeded':
        return theme.colors.dangerLight;
      case 'warning':
        return theme.colors.warningLight;
      case 'notice':
        return theme.colors.primaryLight;
      default:
        return theme.colors.successLight;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.surfaceOverlay }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.headerIconContainer, { backgroundColor: getAlertBg() }]}>
            <Ionicons name={getAlertIcon()} size={32} color={getAlertColor()} />
          </View>

          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Spending Reflection
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Adding {formatCurrency(amountPaise)} in <Text style={{ fontWeight: '700' }}>{categoryName}</Text>
          </Text>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {reflection.insights.map((insight, index) => (
              <View
                key={index}
                style={[
                  styles.insightBox,
                  {
                    backgroundColor:
                      insight.severity === 'exceeded'
                        ? theme.colors.dangerLight
                        : insight.severity === 'warning'
                        ? theme.colors.warningLight
                        : theme.colors.background,
                    borderColor:
                      insight.severity === 'exceeded'
                        ? theme.colors.danger
                        : insight.severity === 'warning'
                        ? theme.colors.warning
                        : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.insightText,
                    {
                      color:
                        insight.severity === 'exceeded'
                          ? theme.colors.danger
                          : insight.severity === 'warning'
                          ? theme.colors.warning
                          : theme.colors.textPrimary,
                    },
                  ]}
                >
                  {insight.message}
                </Text>
              </View>
            ))}

            <View style={[styles.nudgeContainer, { backgroundColor: theme.colors.background }]}>
              <Ionicons name="sparkles-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.nudgeText, { color: theme.colors.textSecondary }]}>
                {reflection.nudge}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.actionButtons}>
            <Button
              title="Adjust Amount"
              variant="outline"
              onPress={onCancel}
              style={{ flex: 1, marginRight: theme.spacing.sm }}
            />
            <Button
              title="Add Expense"
              variant={reflection.highestSeverity === 'exceeded' ? 'danger' : 'primary'}
              onPress={onConfirm}
              loading={isSubmitting}
              style={{ flex: 1, marginLeft: theme.spacing.sm }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollArea: {
    maxHeight: 220,
    width: '100%',
    marginBottom: 20,
  },
  insightBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  insightText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  nudgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  nudgeText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
  },
});
