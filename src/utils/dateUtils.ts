// OurMoney — Date Utilities

import { Timestamp } from 'firebase/firestore';

/**
 * Get current month as 'YYYY-MM' string.
 */
export function getCurrentMonth(): string {
  return formatMonth(new Date());
}

/**
 * Format a Date as 'YYYY-MM'.
 */
export function formatMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Get previous month as 'YYYY-MM'.
 */
export function getPreviousMonth(month?: string): string {
  const base = month ? new Date(`${month}-01`) : new Date();
  base.setMonth(base.getMonth() - 1);
  return formatMonth(base);
}

/**
 * Get N months ago as 'YYYY-MM'.
 */
export function getMonthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return formatMonth(d);
}

/**
 * Get start of month as Date.
 */
export function getMonthStart(month: string): Date {
  return new Date(`${month}-01T00:00:00.000`);
}

/**
 * Get end of month as Date.
 */
export function getMonthEnd(month: string): Date {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon, 0, 23, 59, 59, 999);
}

/**
 * Convert Firestore Timestamp to Date.
 */
export function timestampToDate(ts: Timestamp | Date): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  return ts;
}

/**
 * Format a date for display.
 * Today → "Today"
 * Yesterday → "Yesterday"
 * This year → "15 Mar"
 * Other → "15 Mar 2025"
 */
export function formatDisplayDate(date: Date | Timestamp): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  const now = new Date();

  const todayStr = formatDateKey(now);
  const inputStr = formatDateKey(d);

  if (todayStr === inputStr) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (formatDateKey(yesterday) === inputStr) return 'Yesterday';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];

  if (d.getFullYear() === now.getFullYear()) {
    return `${day} ${month}`;
  }
  return `${day} ${month} ${d.getFullYear()}`;
}

/**
 * Format a date as a grouping key (YYYY-MM-DD).
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format date for group headers in transaction list.
 */
export function formatGroupHeader(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  const now = new Date();

  if (formatDateKey(d) === formatDateKey(now)) return 'TODAY';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (formatDateKey(d) === formatDateKey(yesterday)) return 'YESTERDAY';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()].toUpperCase()} ${
    d.getFullYear() !== now.getFullYear() ? d.getFullYear() : ''
  }`.trim();
}

/**
 * Get display name for a month string.
 * '2026-09' → 'September 2026'
 */
export function formatMonthDisplay(month: string): string {
  const d = new Date(`${month}-01`);
  return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

/**
 * Get short month name.
 * '2026-09' → 'Sep'
 */
export function formatMonthShort(month: string): string {
  const d = new Date(`${month}-01`);
  return d.toLocaleString('en-IN', { month: 'short' });
}
