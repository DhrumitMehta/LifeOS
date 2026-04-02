import { Budget, Transaction } from '../types';

const MS_PER_DAY = 86400000;

/** Rolling window: last 12 calendar months from today (approximate). */
export function averageMonthlyExpenseLast12Months(
  transactions: Transaction[],
  category: string
): number {
  if (!category.trim()) return 0;
  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - 12);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const total = transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.category === category &&
        t.date.getTime() >= start.getTime() &&
        t.date.getTime() <= end.getTime()
    )
    .reduce((sum, t) => sum + t.amount, 0);

  return total / 12;
}

/** Map each category to its average monthly spend (last 12 months). */
export function averageMonthlyByCategory(
  transactions: Transaction[],
  categories: string[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of categories) {
    out[c] = averageMonthlyExpenseLast12Months(transactions, c);
  }
  return out;
}

/** Current calendar period for the budget frequency (week starts Monday). */
export function currentPeriodBounds(
  period: Budget['period'],
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth();
  const day = referenceDate.getDate();

  if (period === 'monthly') {
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (period === 'yearly') {
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59, 999);
    return { start, end };
  }

  // weekly (ISO week: Monday–Sunday)
  const ref = new Date(y, m, day);
  const dow = ref.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const start = new Date(ref);
  start.setDate(ref.getDate() + mondayOffset);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Sum of expenses in the budget's category for the intersection of:
 * - current period (month/week/year), and
 * - [budget.startDate, budget.endDate].
 */
export function spentForBudget(budget: Budget, transactions: Transaction[], now: Date = new Date()): number {
  const { start: pStart, end: pEnd } = currentPeriodBounds(budget.period, now);
  const rangeStart = new Date(Math.max(pStart.getTime(), budget.startDate.getTime()));
  const rangeEnd = new Date(Math.min(pEnd.getTime(), budget.endDate.getTime()));
  if (rangeStart.getTime() > rangeEnd.getTime()) return 0;

  return transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.category === budget.category &&
        t.date.getTime() >= rangeStart.getTime() &&
        t.date.getTime() <= rangeEnd.getTime()
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

export function budgetProgressRatio(spent: number, budgetAmount: number): number {
  if (budgetAmount <= 0) return 0;
  return Math.min(spent / budgetAmount, 1);
}

export function remainingBudget(spent: number, budgetAmount: number): number {
  return budgetAmount - spent;
}

/** Days until period ends (for copy); minimum 0. */
export function daysLeftInPeriod(period: Budget['period'], now: Date = new Date()): number {
  const { end } = currentPeriodBounds(period, now);
  const diff = Math.ceil((end.getTime() - now.getTime()) / MS_PER_DAY);
  return Math.max(0, diff);
}
