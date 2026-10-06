// OurMoney — Spending Trend Chart Component
// Lightweight, responsive bar visualization for Day / Week / Month spending trends.
// Handles zero data gracefully, adapts to light/dark themes without external heavy chart libraries.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { formatAmountCompact } from '../utils/currency';
import type { TrendBarData } from '../hooks/useInsights';

interface SpendingTrendChartProps {
  data: TrendBarData[];
  height?: number;
}

export function SpendingTrendChart({ data, height = 160 }: SpendingTrendChartProps) {
  const { theme, isDark } = useTheme();

  const maxAmount = Math.max(...data.map((d) => d.amountPaise), 0);

  if (data.length === 0 || maxAmount === 0) {
    return (
      <View style={[styles.emptyContainer, { height, backgroundColor: theme.colors.surfaceOverlay }]}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No spending recorded for this trend period
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.chartBody, { height }]}>
        {data.map((item, index) => {
          const ratio = maxAmount > 0 ? item.amountPaise / maxAmount : 0;
          // Scale bar height between 8% min height and 85% max height
          const barHeightPct = ratio > 0 ? Math.max(10, Math.round(ratio * 80)) : 4;
          const isHighlighted = item.isCurrent;

          const barBgColor = isHighlighted
            ? theme.colors.accent
            : item.amountPaise > 0
            ? theme.colors.primary
            : isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.06)';

          return (
            <View key={`${item.label}-${index}`} style={styles.barColumn}>
              {/* Value Label on top of bar */}
              <View style={styles.valueLabelContainer}>
                {item.amountPaise > 0 && (
                  <Text
                    style={[
                      styles.valueText,
                      { color: isHighlighted ? theme.colors.accent : theme.colors.textSecondary },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatAmountCompact(item.amountPaise)}
                  </Text>
                )}
              </View>

              {/* Bar Outer Track */}
              <View style={styles.track}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${barHeightPct}%`,
                      backgroundColor: barBgColor,
                    },
                  ]}
                />
              </View>

              {/* X-Axis Label */}
              <Text
                style={[
                  styles.axisLabel,
                  {
                    color: isHighlighted ? theme.colors.primary : theme.colors.textSecondary,
                    fontWeight: isHighlighted ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  emptyContainer: {
    width: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  chartBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  valueLabelContainer: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 10,
    fontWeight: '700',
  },
  track: {
    flex: 1,
    width: '100%',
    maxWidth: 32,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    borderRadius: 6,
    minHeight: 4,
  },
  axisLabel: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
});
