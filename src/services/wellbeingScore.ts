import { Habit, HabitEntry, JournalEntry, Transaction, Account } from '../types';

const WEIGHT_HABITS = 1 / 3;
const WEIGHT_JOURNAL = 1 / 3;
const WEIGHT_FINANCE = 1 / 3;

/** Expense categories that are "good" (quality of life) and soften overspend impact */
const GOOD_EXPENSE_CATEGORIES = ['charity', 'entertainment', 'health', 'sport', 'education'];

function getTodayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getTodayEnd(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function getYesterdayStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getYesterdayEnd(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(23, 59, 59, 999);
  return d;
}

function isInRange(d: Date, start: Date, end: Date): boolean {
  const t = d.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

/** Higher-is-better (e.g. sleep): above average => >50%. Lower-is-better (e.g. screen time): below average => >50%. */
function isLowerIsBetter(habit: Habit): boolean {
  const name = (habit.name || '').toLowerCase();
  const unit = (habit.unit || '').toLowerCase();
  if (name.includes('screen') || unit.includes('screen')) return true;
  if (name.includes('time') && (name.includes('screen') || name.includes('phone'))) return true;
  return false;
}

const WEIGHT_HABITS_TODAY = 0.75;
const WEIGHT_HABITS_YESTERDAY = 0.25;

/** Score for a single day (0–100): boolean completion + numeric vs average. */
function scoreHabitsForDay(
  active: Habit[],
  habitEntries: HabitEntry[],
  dayStart: Date,
  dayEnd: Date
): number {
  const booleanHabits = active.filter((h) => h.habitType === 'boolean');
  const numericHabits = active.filter((h) => h.habitType === 'numeric');

  let booleanScore = 100;
  if (booleanHabits.length > 0) {
    const done = booleanHabits.filter((h) => {
      const entry = habitEntries.find(
        (e) => e.habitId === h.id && isInRange(new Date(e.date), dayStart, dayEnd)
      );
      return entry && entry.completed;
    }).length;
    booleanScore = (done / booleanHabits.length) * 100;
  }

  let numericScore = 50;
  if (numericHabits.length > 0) {
    const scores: number[] = [];
    for (const habit of numericHabits) {
      const entries = habitEntries.filter((e) => e.habitId === habit.id);
      const dayEntry = entries.find((e) =>
        isInRange(new Date(e.date), dayStart, dayEnd)
      );
      if (!dayEntry && entries.length === 0) {
        scores.push(50);
        continue;
      }
      const values = entries.map((e) => e.value).filter((v) => typeof v === 'number');
      const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : habit.targetValue || 0;
      const value = dayEntry ? dayEntry.value : avg;
      const lowerBetter = isLowerIsBetter(habit);
      let s: number;
      if (Math.abs(avg) < 1e-6) {
        s = 50;
      } else if (lowerBetter) {
        s = value <= avg ? 50 + (50 * (avg - value)) / avg : Math.max(0, 50 - (50 * (value - avg)) / avg);
      } else {
        s = value >= avg ? 50 + Math.min(50, (50 * (value - avg)) / (avg || 1)) : (50 * value) / avg;
      }
      scores.push(Math.max(0, Math.min(100, s)));
    }
    numericScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  if (booleanHabits.length > 0 && numericHabits.length > 0) {
    return (booleanScore + numericScore) / 2;
  }
  if (booleanHabits.length > 0) return booleanScore;
  return numericScore;
}

/** Habits score (0–100): 75% today + 25% yesterday. */
function scoreHabits(habits: Habit[], habitEntries: HabitEntry[]): number {
  const active = habits.filter((h) => h.isActive);
  if (active.length === 0) return 50;

  const todayStart = getTodayStart();
  const todayEnd = getTodayEnd();
  const yesterdayStart = getYesterdayStart();
  const yesterdayEnd = getYesterdayEnd();

  const todayScore = scoreHabitsForDay(active, habitEntries, todayStart, todayEnd);
  const yesterdayScore = scoreHabitsForDay(active, habitEntries, yesterdayStart, yesterdayEnd);

  return (
    WEIGHT_HABITS_TODAY * todayScore +
    WEIGHT_HABITS_YESTERDAY * yesterdayScore
  );
}

const MOOD_SCORE: Record<string, number> = {
  'very-happy': 100,
  happy: 75,
  neutral: 50,
  sad: 25,
  'very-sad': 0,
};

/** Journal score (0–100): mood + positive/negative yesterday + reflection balance. If using yesterday's entry, halved. */
function scoreJournal(journalEntries: JournalEntry[]): number {
  const todayStart = getTodayStart();
  const todayEnd = getTodayEnd();
  const yesterdayStart = getYesterdayStart();
  const yesterdayEnd = getYesterdayEnd();

  const todayEntry = journalEntries.find((e) =>
    isInRange(new Date(e.date), todayStart, todayEnd)
  );
  const yesterdayEntry = journalEntries.find((e) =>
    isInRange(new Date(e.date), yesterdayStart, yesterdayEnd)
  );

  const entry = todayEntry || yesterdayEntry;
  if (!entry) return 50;

  let moodScore = MOOD_SCORE[entry.mood] ?? 50;
  const positiveBonus = entry.yesterdayMood === 'positive' ? 10 : entry.yesterdayMood === 'negative' ? -10 : 0;
  let score = moodScore + positiveBonus;

  // Reflection balance: (who/what made yesterday better length) − (what to improve today length). Positive diff adds %, negative subtracts %.
  const madeBetterLen = (entry.madeYesterdayBetter ?? '').length;
  const improveLen = (entry.improveToday ?? '').length;
  const reflectionDiff = madeBetterLen - improveLen;
  score += reflectionDiff;

  score = Math.max(0, Math.min(100, score));

  if (!todayEntry && yesterdayEntry) {
    score = score / 2;
  }
  return Math.max(0, Math.min(100, score));
}

/** Finance score (0–100): income vs expenses, good categories, spending trend, liquid cash vs typical. */
function scoreFinance(
  transactions: Transaction[],
  accounts: Account[]
): number {
  const todayStart = getTodayStart();
  const todayEnd = getTodayEnd();
  const yesterdayStart = getYesterdayStart();
  const yesterdayEnd = getYesterdayEnd();

  const inPeriod = (t: Transaction) => {
    const d = new Date(t.date);
    return isInRange(d, yesterdayStart, todayEnd);
  };
  const periodTx = transactions.filter(inPeriod);

  let income = 0;
  let expenses = 0;
  let goodCategorySpend = 0;
  for (const t of periodTx) {
    if (t.type === 'income') income += t.amount;
    else {
      expenses += t.amount;
      const cat = (t.category || '').toLowerCase();
      if (GOOD_EXPENSE_CATEGORIES.some((g) => cat.includes(g))) {
        goodCategorySpend += t.amount;
      }
    }
  }

  // 1) Income vs expenses (0–100)
  const net = income - expenses;
  let incomeVsExpenseScore = 50;
  if (income + expenses > 0) {
    if (net >= 0) {
      incomeVsExpenseScore = 50 + Math.min(50, (net / (income || 1)) * 50);
    } else {
      const overspend = -net;
      if (goodCategorySpend > 0 && goodCategorySpend >= overspend * 0.5) {
        incomeVsExpenseScore = 45;
      } else {
        incomeVsExpenseScore = Math.max(0, 50 - (overspend / (income || 1)) * 50);
      }
    }
  }

  // 2) Spending trend: less than previous similar period = good
  const prevPeriodStart = new Date(yesterdayStart);
  prevPeriodStart.setDate(prevPeriodStart.getDate() - 2);
  const prevPeriodEnd = new Date(yesterdayEnd);
  prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 2);
  const prevPeriodTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= prevPeriodStart && d <= prevPeriodEnd;
  });
  const prevExpenses = prevPeriodTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const currExpenses = periodTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  let trendScore = 50;
  if (prevExpenses > 0) {
    if (currExpenses < prevExpenses) trendScore = 50 + Math.min(50, ((prevExpenses - currExpenses) / prevExpenses) * 100);
    else trendScore = Math.max(0, 50 - ((currExpenses - prevExpenses) / prevExpenses) * 50);
  }

  // 3) Liquid cash: higher current balance = good (no historical snapshots, so we score positively if they have liquid)
  const liquidAccounts = accounts.filter(
    (a) => a.isActive && ['checking', 'savings', 'cash'].includes(a.type)
  );
  const liquidNow = liquidAccounts.reduce((s, a) => s + a.balance, 0);
  let cashScore = 50;
  if (liquidAccounts.length === 0) cashScore = 50;
  else if (liquidNow > 0) cashScore = 60 + Math.min(40, Math.log10(liquidNow + 1) * 15);
  else cashScore = 40;

  const financeScore =
    (incomeVsExpenseScore * 0.45 + trendScore * 0.35 + cashScore * 0.2);
  return Math.max(0, Math.min(100, financeScore));
}

export interface WellbeingBreakdown {
  habits: number;
  journal: number;
  finance: number;
}

export interface WellbeingResult {
  score: number;
  breakdown: WellbeingBreakdown;
}

export function calculateWellbeingScore(
  habits: Habit[],
  habitEntries: HabitEntry[],
  journalEntries: JournalEntry[],
  transactions: Transaction[],
  accounts: Account[]
): WellbeingResult {
  const habitsScore = scoreHabits(habits, habitEntries);
  const journalScore = scoreJournal(journalEntries);
  const financeScore = scoreFinance(transactions, accounts);

  const score =
    habitsScore * WEIGHT_HABITS +
    journalScore * WEIGHT_JOURNAL +
    financeScore * WEIGHT_FINANCE;

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    breakdown: {
      habits: Math.round(habitsScore),
      journal: Math.round(journalScore),
      finance: Math.round(financeScore),
    },
  };
}
