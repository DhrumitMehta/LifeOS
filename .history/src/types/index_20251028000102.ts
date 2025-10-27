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

export type RootStackParamList = {
  Main: undefined;
  HabitDetail: { habitId: string };
  JournalDetail: { entryId?: string };
  TransactionDetail: { transactionId?: string };
  InvestmentDetail: { investmentId?: string };
  BudgetDetail: { budgetId?: string };
  Analytics: undefined;
  Settings: undefined;
};

export type TabParamList = {
  Habits: undefined;
  Journal: undefined;
  Finance: undefined;
  Analytics: undefined;
  Settings: undefined;
};
