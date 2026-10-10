// OurMoney — Reverse Interest Calculator Modal
// Computes implied nominal & effective annual interest rates from Principal, EMI, and Tenure.

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import { rupeesToPaise, formatCurrency } from '../utils/currency';
import { calculateReverseInterestRate, type ReverseInterestResult } from '../utils/loanCalculations';
import type { InterestType } from '../models/loan';

export interface ReverseInterestModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (result: {
    annualRatePercent: string;
    plannedPaymentRupees: string;
    interestType: InterestType;
    tenureMonths: string;
    principalRupees?: string;
  }) => void;
  initialPrincipalRupees?: string;
  initialEmiRupees?: string;
  initialTenureMonths?: string;
  initialInterestType?: InterestType;
}

export function ReverseInterestModal({
  visible,
  onClose,
  onApply,
  initialPrincipalRupees = '',
  initialEmiRupees = '',
  initialTenureMonths = '36',
  initialInterestType = 'reducing_balance',
}: ReverseInterestModalProps) {
  const { theme } = useTheme();

  const [principalRupees, setPrincipalRupees] = useState(initialPrincipalRupees);
  const [emiRupees, setEmiRupees] = useState(initialEmiRupees);
  const [tenureMonths, setTenureMonths] = useState(initialTenureMonths);
  const [interestType, setInterestType] = useState<InterestType>(initialInterestType);

  useEffect(() => {
    if (visible) {
      if (initialPrincipalRupees) setPrincipalRupees(initialPrincipalRupees);
      if (initialEmiRupees) setEmiRupees(initialEmiRupees);
      if (initialTenureMonths) setTenureMonths(initialTenureMonths);
      if (initialInterestType) setInterestType(initialInterestType);
    }
  }, [visible, initialPrincipalRupees, initialEmiRupees, initialTenureMonths, initialInterestType]);

  const pPaise = rupeesToPaise(parseFloat(principalRupees) || 0);
  const emiPaise = rupeesToPaise(parseFloat(emiRupees) || 0);
  const tMonths = parseInt(tenureMonths, 10) || 0;

  let calcResult: ReverseInterestResult | null = null;
  if (pPaise > 0 && emiPaise > 0 && tMonths > 0) {
    calcResult = calculateReverseInterestRate({
      principalPaise: pPaise,
      monthlyEmiPaise: emiPaise,
      tenureMonths: tMonths,
      interestType,
    });
  }

  const handleApply = () => {
    if (!calcResult || !calcResult.isValid) return;
    onApply({
      annualRatePercent: calcResult.annualRatePercent.toString(),
      plannedPaymentRupees: emiRupees,
      interestType,
      tenureMonths,
      principalRupees,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.borderLight }]}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="calculator-outline" size={22} color={theme.colors.primary} />
              <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                Calculate Interest from EMI
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <Text style={[styles.introText, { color: theme.colors.textSecondary }]}>
              Enter your known loan principal, monthly EMI, and tenure to estimate the implied annual interest rate.
            </Text>

            {/* Method Selection */}
            <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
              Calculation Method
            </Text>
            <View style={styles.typeRow}>
              {[
                { id: 'reducing_balance', label: 'Reducing Balance' },
                { id: 'flat', label: 'Flat Interest' },
              ].map((m) => {
                const isSelected = interestType === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.surface,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    onPress={() => setInterestType(m.id as InterestType)}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        { color: isSelected ? theme.colors.primary : theme.colors.textPrimary },
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Input Controls */}
            <Input
              label="Loan Principal Amount (₹) *"
              placeholder="e.g. 300000"
              value={principalRupees}
              onChangeText={setPrincipalRupees}
              keyboardType="numeric"
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Input
                  label="Monthly EMI (₹) *"
                  placeholder="e.g. 11770"
                  value={emiRupees}
                  onChangeText={setEmiRupees}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Input
                  label="Tenure (Months) *"
                  placeholder="e.g. 36"
                  value={tenureMonths}
                  onChangeText={setTenureMonths}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Results Display */}
            {calcResult && (
              <View style={{ marginTop: 16 }}>
                {!calcResult.isValid ? (
                  <Card style={[styles.errorCard, { backgroundColor: theme.colors.dangerLight || '#FFF1F2' }]}>
                    <Ionicons name="alert-circle-outline" size={20} color={theme.colors.danger} />
                    <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                      {calcResult.errorMessage}
                    </Text>
                  </Card>
                ) : (
                  <Card style={[styles.resultCard, { backgroundColor: theme.colors.surfaceElevated }]}>
                    <View style={styles.resultHeader}>
                      <Text style={[styles.resultTitle, { color: theme.colors.textPrimary }]}>
                        Estimated Interest Rate
                      </Text>
                      <Badge label="Estimated" variant="info" size="sm" />
                    </View>

                    <Text style={[styles.rateValue, { color: theme.colors.primary }]}>
                      {calcResult.annualRatePercent}%{' '}
                      <Text style={[styles.rateSub, { color: theme.colors.textSecondary }]}>
                        p.a. nominal ({interestType === 'flat' ? 'Flat' : 'Reducing'})
                      </Text>
                    </Text>

                    {calcResult.effectiveAnnualRatePercent !== null && (
                      <Text style={[styles.earText, { color: theme.colors.textSecondary }]}>
                        Effective Annual Rate (EAR): <Text style={{ fontWeight: '700' }}>{calcResult.effectiveAnnualRatePercent}%</Text>
                      </Text>
                    )}

                    <View style={styles.metricGrid}>
                      <View style={styles.metricItem}>
                        <Text style={[styles.metricLabel, { color: theme.colors.textTertiary }]}>Total Repayment</Text>
                        <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
                          {formatCurrency(calcResult.totalRepaymentPaise)}
                        </Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={[styles.metricLabel, { color: theme.colors.textTertiary }]}>Total Interest</Text>
                        <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
                          {formatCurrency(calcResult.totalInterestPaise)}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.disclaimerText, { color: theme.colors.textTertiary }]}>
                      {calcResult.disclaimer}
                    </Text>
                  </Card>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ marginTop: 24, marginBottom: 30, gap: 10 }}>
              <Button
                title="Apply Rate to Loan"
                variant="primary"
                size="lg"
                disabled={!calcResult || !calcResult.isValid}
                onPress={handleApply}
              />
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={onClose}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  introText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 6,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  resultCard: {
    padding: 16,
    borderRadius: 14,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  rateValue: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  rateSub: {
    fontSize: 13,
    fontWeight: '500',
  },
  earText: {
    fontSize: 12,
    marginBottom: 12,
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(120, 120, 120, 0.15)',
    marginBottom: 8,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 6,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
});
