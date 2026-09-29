// OurMoney — Expense Categories
// 11 categories with Lucide icon names and display colors.

export type CategoryId =
  | 'food'
  | 'groceries'
  | 'home'
  | 'transport'
  | 'shopping'
  | 'medical'
  | 'bills'
  | 'entertainment'
  | 'education'
  | 'travel'
  | 'other';

export interface Category {
  id: CategoryId;
  label: string;
  iconName: string; // Lucide icon name
  color: string;
  bgColor: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'food',
    label: 'Food',
    iconName: 'UtensilsCrossed',
    color: '#FF6B6B',
    bgColor: '#FFF1F1',
  },
  {
    id: 'groceries',
    label: 'Groceries',
    iconName: 'ShoppingCart',
    color: '#00B4A0',
    bgColor: '#E6FAF8',
  },
  {
    id: 'home',
    label: 'Home',
    iconName: 'Home',
    color: '#3B8FD4',
    bgColor: '#EBF4FB',
  },
  {
    id: 'transport',
    label: 'Transport',
    iconName: 'Car',
    color: '#34A853',
    bgColor: '#E8F8EC',
  },
  {
    id: 'shopping',
    label: 'Shopping',
    iconName: 'Bag',
    color: '#9B59B6',
    bgColor: '#F5EEF8',
  },
  {
    id: 'medical',
    label: 'Medical',
    iconName: 'Heart',
    color: '#E74C3C',
    bgColor: '#FDEDEC',
  },
  {
    id: 'bills',
    label: 'Bills',
    iconName: 'FileText',
    color: '#F39C12',
    bgColor: '#FEF9E7',
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    iconName: 'Film',
    color: '#8E44AD',
    bgColor: '#F4ECF7',
  },
  {
    id: 'education',
    label: 'Education',
    iconName: 'GraduationCap',
    color: '#2980B9',
    bgColor: '#EBF5FB',
  },
  {
    id: 'travel',
    label: 'Travel',
    iconName: 'Plane',
    color: '#D4AC0D',
    bgColor: '#FEF9E7',
  },
  {
    id: 'other',
    label: 'Other',
    iconName: 'MoreHorizontal',
    color: '#7F8C8D',
    bgColor: '#F2F3F4',
  },
];

export const CATEGORIES_MAP: Record<CategoryId, Category> = CATEGORIES.reduce(
  (acc, cat) => ({ ...acc, [cat.id]: cat }),
  {} as Record<CategoryId, Category>,
);

export function getCategoryById(id: CategoryId): Category {
  return CATEGORIES_MAP[id];
}
