// Core types for the LifeOS app

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  habitType: 'boolean' | 'numeric';
  targetValue: number; // For boolean habits (completion target)
  maxValue?: number; // For numeric habits (maximum allowed value)
  unit: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: Date;
  value: number;
  notes?: string;
  completed: boolean;
  createdAt: Date;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: 'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad';
  tags: string[];
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  // New structured format fields
  memorableMoment?: string;
  madeYesterdayBetter?: string;
  improveToday?: string;
  makeTodayGreat?: string;
  yesterdayMood?: 'positive' | 'negative';
  affirmations?: string;
  openThoughts?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  amount: number;
  description: string;
  date: Date;
  account?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Investment {
  id: string;
  name: string;
  type: 'stock' | 'bond' | 'crypto' | 'mutual-fund' | 'real-estate';
  symbol?: string;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  totalValue?: number;
  purchaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields for mutual funds
  buyingPrice?: number; // Price to buy a unit
  sellingPrice?: number; // Price when selling a unit
  provider?: string; // Fund provider (e.g., 'UTT', 'Itrust', 'Quiver')
  fundName?: string; // Specific fund name (e.g., 'Umoja Fund')
  amountPurchased?: number; // Total amount invested (for mutual funds)
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'other';
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  recurringDate: number; // Day of month (1-31)
  account: string; // Account name to deduct from
  isActive: boolean;
  lastProcessedDate?: Date; // Last date this subscription was processed
  createdAt: Date;
  updatedAt: Date;
}

/** Signed-in user for UI + storage scope (Supabase Auth UUID or local profile id). */
export interface AppAuthUser {
  id: string;
  email: string | null;
  displayName: string;
  provider: 'supabase' | 'local';
}

export interface Analytics {
  totalIncome: number;
  totalExpenses: number;
  netWorth: number;
  monthlyTrend: {
    month: string;
    income: number;
    expenses: number;
    savings: number;
  }[];
  topCategories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  habitStreaks: {
    habitId: string;
    habitName: string;
    currentStreak: number;
    longestStreak: number;
  }[];
}

export interface Profile {
  id: string;
  name?: string;
  bio?: string;
  likes?: string[]; // Things I like
  principles?: string[]; // My principles/values
  strengths?: string[]; // My strengths
  weaknesses?: string[]; // Areas for improvement
  goals?: string[]; // Personal goals
  interests?: string[]; // Interests and hobbies
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  type: 'monthly' | 'yearly';
  period: string; // e.g., "2024-01" for monthly, "2024" for yearly
  startDate: Date;
  endDate: Date;
  // Generated statistics
  journalStats?: {
    totalEntries: number;
    averageMood: string;
    mostCommonTags: string[];
    memorableMoments: string[];
    madeYesterdayBetter: string[];
    improveToday: string[];
    makeTodayGreat: string[];
    yesterdayMood: { mood: 'positive' | 'negative'; date: Date }[];
    affirmations: string[];
    openThoughts: string[];
  };
  habitStats?: {
    totalHabits: number;
    completedHabits: number;
    averageCompletionRate: number;
    longestStreak: { habitName: string; days: number };
    topPerformingHabits: { habitName: string; completionRate: number }[];
    habitCounts: { habitName: string; count: number }[];
    mostPerformedHabit: { habitName: string; count: number };
    numericHabitAverages: { habitName: string; unit: string; average: number; totalEntries: number }[];
  };
  financeStats?: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    topExpenseCategories: { category: string; amount: number }[];
    topIncomeCategories: { category: string; amount: number }[];
    highestSpendingCategory: { category: string; amount: number } | null;
    highestTransaction: { description: string; amount: number; type: 'income' | 'expense'; date: Date } | null;
    investmentProgress: {
      periodInvestments: number;
      allTimeInvestments: number;
      periodCount: number;
      allTimeCount: number;
      newInvestmentsThisPeriod: number;
    };
  };
  // User's open writing
  reflections?: string;
  achievements?: string;
  challenges?: string;
  goalsForNextPeriod?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RootStackParamList = {
  Main: { screen?: string } | undefined;
  HabitDetail: { habitId: string };
  JournalDetail: { entryId?: string };
  TransactionDetail: { transactionId?: string };
  InvestmentDetail: { investmentId?: string };
  BudgetDetail: { budgetId?: string };
  Profile: undefined;
  Reviews: undefined;
  Analytics: undefined;
  Settings: undefined;
};

export type TabParamList = {
  Home: undefined;
  Habits: undefined;
  Journal: undefined;
  Finance: undefined;
  Visualization: undefined;
};
