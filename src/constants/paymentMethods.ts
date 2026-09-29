// OurMoney — Payment Methods

export type PaymentMethodId =
  | 'cash'
  | 'upi'
  | 'debit_card'
  | 'credit_card'
  | 'bank_transfer'
  | 'other';

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  iconName: string; // Lucide icon name
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash',          label: 'Cash',          iconName: 'Banknote' },
  { id: 'upi',           label: 'UPI',           iconName: 'Smartphone' },
  { id: 'debit_card',    label: 'Debit Card',    iconName: 'CreditCard' },
  { id: 'credit_card',   label: 'Credit Card',   iconName: 'CreditCard' },
  { id: 'bank_transfer', label: 'Bank Transfer', iconName: 'ArrowLeftRight' },
  { id: 'other',         label: 'Other',         iconName: 'MoreHorizontal' },
];

export const PAYMENT_METHODS_MAP: Record<PaymentMethodId, PaymentMethod> = PAYMENT_METHODS.reduce(
  (acc, pm) => ({ ...acc, [pm.id]: pm }),
  {} as Record<PaymentMethodId, PaymentMethod>,
);

export function getPaymentMethodById(id: PaymentMethodId): PaymentMethod {
  return PAYMENT_METHODS_MAP[id];
}
