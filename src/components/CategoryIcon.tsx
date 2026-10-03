import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  UtensilsCrossed, ShoppingCart, Home, Car, Gem, Heart,
  FileText, Film, GraduationCap, Plane, MoreHorizontal,
  User, Users, CreditCard, type LucideIcon,
} from 'lucide-react-native';
import type { CategoryId } from '../constants/categories';
import { getCategoryById } from '../constants/categories';

import { useTheme } from '../context/ThemeContext';

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  ShoppingCart,
  Home,
  Car,
  Gem,
  Heart,
  FileText,
  Film,
  GraduationCap,
  Plane,
  MoreHorizontal,
  User,
  Users,
  CreditCard,
  Bag: ShoppingCart,
};

export interface CategoryIconProps {
  categoryId?: CategoryId;
  category?: any;
  size?: number;
  iconSize?: number;
  showBackground?: boolean;
  color?: string;
  style?: any;
}

export function CategoryIcon({
  categoryId,
  category: categoryProp,
  size = 40,
  iconSize = 20,
  showBackground = true,
  color: colorProp,
  style,
}: CategoryIconProps) {
  const { isDark } = useTheme();
  const categoryInfo = categoryProp ?? (categoryId ? getCategoryById(categoryId) : getCategoryById('other'));
  const IconComponent = ICON_MAP[categoryInfo.iconName] ?? MoreHorizontal;
  const iconColor = colorProp ?? categoryInfo.color;

  if (!showBackground) {
    return <IconComponent size={iconSize} color={iconColor} />;
  }

  const backgroundColor = isDark ? `${iconColor}26` : categoryInfo.bgColor;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2.5,
          backgroundColor,
        },
        style,
      ]}
    >
      <IconComponent size={iconSize} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
