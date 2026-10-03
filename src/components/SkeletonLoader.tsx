// OurMoney — Skeleton Loader Component
// Provides smooth, lightweight placeholder loaders during initial data fetching.

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonItem({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { theme, isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const backgroundColor = isDark ? '#1E293B' : theme.colors.borderLight;

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ height = 120, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { minHeight: height, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, style]}>
      <View style={styles.cardHeader}>
        <SkeletonItem width={40} height={40} borderRadius={20} />
        <View style={styles.headerText}>
          <SkeletonItem width="60%" height={14} style={{ marginBottom: 6 }} />
          <SkeletonItem width="40%" height={10} />
        </View>
        <SkeletonItem width={60} height={18} borderRadius={6} />
      </View>
      <View style={{ height: 12 }} />
      <SkeletonItem width="80%" height={12} />
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={styles.container}>
      {/* Total Card Skeleton */}
      <SkeletonCard height={140} style={{ marginBottom: 16 }} />

      {/* Category breakdown header skeleton */}
      <View style={styles.rowBetween}>
        <SkeletonItem width={120} height={18} />
        <SkeletonItem width={60} height={14} />
      </View>
      <SkeletonCard height={80} style={{ marginBottom: 12 }} />
      <SkeletonCard height={80} style={{ marginBottom: 20 }} />

      {/* Recent transactions header skeleton */}
      <View style={styles.rowBetween}>
        <SkeletonItem width={140} height={18} />
        <SkeletonItem width={50} height={14} />
      </View>
      <SkeletonCard height={70} style={{ marginBottom: 10 }} />
      <SkeletonCard height={70} style={{ marginBottom: 10 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
});
