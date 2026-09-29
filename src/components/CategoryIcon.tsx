import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  UtensilsCrossed, ShoppingCart, Home, Car, Gem, Heart,
  FileText, Film, GraduationCap, Plane, MoreHorizontal,
  User, Users, CreditCard, type LucideIcon,
} from 'lucide-react-native';
import type { CategoryId } from '../constants/categories';
import { getCategoryById } from '../constants/categories';

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
  Bag: ShoppingCart, // fallback
};

interface CategoryIconProps {
  categoryId: CategoryId;
  size?: number;
  iconSize?: number;
  showBackground?: boolean;
}

export function CategoryIcon({
  categoryId,
  size = 40,
  iconSize = 20,
  showBackground = true,
}: CategoryIconProps) {
  const category = getCategoryById(categoryId);
  const IconComponent = ICON_MAP[category.iconName] ?? MoreHorizontal;

  if (!showBackground) {
    return <IconComponent size={iconSize} color={category.color} />;
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2.5,
          backgroundColor: category.bgColor,
        },
      ]}
    >
      <IconComponent size={iconSize} color={category.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
