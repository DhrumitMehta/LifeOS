import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { database } from '../database/database';
import { Habit, HabitEntry, JournalEntry, Transaction, Investment, Budget, Account, Analytics } from '../types';

interface AppState {
  habits: Habit[];
  habitEntries: HabitEntry[];
  journalEntries: JournalEntry[];
  transactions: Transaction[];
  investments: Investment[];
  budgets: Budget[];
  accounts: Account[];
  analytics: Analytics | null;
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_HABITS'; payload: Habit[] }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'SET_HABIT_ENTRIES'; payload: HabitEntry[] }
  | { type: 'ADD_HABIT_ENTRY'; payload: HabitEntry }
  | { type: 'UPDATE_HABIT_ENTRY'; payload: HabitEntry }
  | { type: 'SET_JOURNAL_ENTRIES'; payload: JournalEntry[] }
  | { type: 'ADD_JOURNAL_ENTRY'; payload: JournalEntry }
  | { type: 'UPDATE_JOURNAL_ENTRY'; payload: JournalEntry }
  | { type: 'DELETE_JOURNAL_ENTRY'; payload: string }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_INVESTMENTS'; payload: Investment[] }
  | { type: 'ADD_INVESTMENT'; payload: Investment }
  | { type: 'UPDATE_INVESTMENT'; payload: Investment }
  | { type: 'DELETE_INVESTMENT'; payload: string }
  | { type: 'SET_BUDGETS'; payload: Budget[] }
  | { type: 'ADD_BUDGET'; payload: Budget }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'SET_ACCOUNTS'; payload: Account[] }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'SET_ANALYTICS'; payload: Analytics };

const initialState: AppState = {
  habits: [],
  habitEntries: [],
  journalEntries: [],
  transactions: [],
  investments: [],
  budgets: [],
  accounts: [],
  analytics: null,
  isLoading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_HABITS':
      return { ...state, habits: action.payload };
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map(habit =>
          habit.id === action.payload.id ? action.payload : habit
        ),
      };
    case 'DELETE_HABIT':
      return {
        ...state,
        habits: state.habits.filter(habit => habit.id !== action.payload),
      };
    case 'SET_HABIT_ENTRIES':
      return { ...state, habitEntries: action.payload };
    case 'ADD_HABIT_ENTRY':
      return { ...state, habitEntries: [...state.habitEntries, action.payload] };
    case 'UPDATE_HABIT_ENTRY':
      return {
        ...state,
        habitEntries: state.habitEntries.map(entry =>
          entry.id === action.payload.id ? action.payload : entry
        ),
      };
    case 'SET_JOURNAL_ENTRIES':
      return { ...state, journalEntries: action.payload };
    case 'ADD_JOURNAL_ENTRY':
      return { ...state, journalEntries: [...state.journalEntries, action.payload] };
    case 'UPDATE_JOURNAL_ENTRY':
      return {
        ...state,
        journalEntries: state.journalEntries.map(entry =>
          entry.id === action.payload.id ? action.payload : entry
        ),
      };
    case 'DELETE_JOURNAL_ENTRY':
      return {
        ...state,
        journalEntries: state.journalEntries.filter(entry => entry.id !== action.payload),
      };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(transaction =>
          transaction.id === action.payload.id ? action.payload : transaction
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(transaction => transaction.id !== action.payload),
      };
    case 'SET_INVESTMENTS':
      return { ...state, investments: action.payload };
    case 'ADD_INVESTMENT':
      return { ...state, investments: [...state.investments, action.payload] };
    case 'UPDATE_INVESTMENT':
      return {
        ...state,
        investments: state.investments.map(investment =>
          investment.id === action.payload.id ? action.payload : investment
        ),
      };
    case 'DELETE_INVESTMENT':
      return {
        ...state,
        investments: state.investments.filter(investment => investment.id !== action.payload),
      };
    case 'SET_BUDGETS':
      return { ...state, budgets: action.payload };
    case 'ADD_BUDGET':
      return { ...state, budgets: [...state.budgets, action.payload] };
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(budget =>
          budget.id === action.payload.id ? action.payload : budget
        ),
      };
    case 'DELETE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter(budget => budget.id !== action.payload),
      };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.payload] };
    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map(account =>
          account.id === action.payload.id ? action.payload : account
        ),
      };
    case 'DELETE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.filter(account => account.id !== action.payload),
      };
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Habit methods
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  addHabitEntry: (entry: Omit<HabitEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateHabitEntry: (entry: HabitEntry) => Promise<void>;
  // Journal methods
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateJournalEntry: (entry: JournalEntry) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  // Transaction methods
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Investment methods
  addInvestment: (investment: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInvestment: (investment: Investment) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  // Budget methods
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  // Account methods
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  // Utility methods
  refreshData: () => Promise<void>;
  calculateAnalytics: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await database.init();
      await refreshData();
      await calculateAnalytics();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshData = async () => {
    try {
      // Load habits
      const habits = await database.getHabits();
      dispatch({ type: 'SET_HABITS', payload: habits });

      // Load habit entries
      const habitEntries = await database.getHabitEntries();
      dispatch({ type: 'SET_HABIT_ENTRIES', payload: habitEntries });

      // Load journal entries
      const journalEntries = await database.getJournalEntries();
      dispatch({ type: 'SET_JOURNAL_ENTRIES', payload: journalEntries });

      // Load transactions
      const transactions = await database.getTransactions();
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });

      // Load investments
      const investments = await database.getInvestments();
      dispatch({ type: 'SET_INVESTMENTS', payload: investments });

      // Load budgets
      const budgets = await database.getBudgets();
      dispatch({ type: 'SET_BUDGETS', payload: budgets });

      // Load accounts
      const accounts = await database.getAccounts();
      dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load data' });
    }
  };

  const calculateAnalytics = async () => {
    try {
      const transactions = state.transactions;
      const investments = state.investments;
      const habits = state.habits;
      const habitEntries = state.habitEntries;
      
      // Calculate financial analytics
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalInvestments = investments
        .filter(i => i.totalValue)
        .reduce((sum, i) => sum + (i.totalValue || 0), 0);
      
      const netWorth = totalIncome - totalExpenses + totalInvestments;

      // Get monthly trends (last 12 months)
      const monthlyTrend = transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          const twelveMonthsAgo = new Date();
          twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
          return transactionDate >= twelveMonthsAgo;
        })
        .reduce((acc, transaction) => {
          const month = transaction.date.toISOString().substring(0, 7);
          if (!acc[month]) {
            acc[month] = { month, income: 0, expenses: 0 };
          }
          if (transaction.type === 'income') {
            acc[month].income += transaction.amount;
          } else {
            acc[month].expenses += transaction.amount;
          }
          return acc;
        }, {} as Record<string, { month: string; income: number; expenses: number }>);

      const monthlyTrendArray = Object.values(monthlyTrend)
        .map(item => ({
          month: item.month,
          income: item.income,
          expenses: item.expenses,
          savings: item.income - item.expenses,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Get top categories
      const categoryTotals = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, transaction) => {
          acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
          return acc;
        }, {} as Record<string, number>);

      const totalExpenseAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
      
      const topCategories = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalExpenseAmount > 0 ? (amount / totalExpenseAmount) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Get habit streaks
      const habitStreaks = habits
        .filter(h => h.isActive)
        .map(habit => {
          const entries = habitEntries
            .filter(entry => entry.habitId === habit.id && entry.completed)
            .sort((a, b) => b.date.getTime() - a.date.getTime());

          let currentStreak = 0;
          let currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0);

          for (const entry of entries) {
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            
            if (entryDate.getTime() === currentDate.getTime()) {
              currentStreak++;
              currentDate.setDate(currentDate.getDate() - 1);
            } else if (entryDate.getTime() < currentDate.getTime()) {
              break;
            }
          }

          return {
            habitId: habit.id,
            habitName: habit.name,
            currentStreak,
            longestStreak: currentStreak, // Simplified for now
          };
        });

      const analytics: Analytics = {
        totalIncome,
        totalExpenses,
        netWorth,
        monthlyTrend: monthlyTrendArray,
        topCategories,
        habitStreaks,
      };

      dispatch({ type: 'SET_ANALYTICS', payload: analytics });
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  };

  // Habit methods
  const addHabit = async (habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = Date.now().toString();
      const now = new Date();
      const habit: Habit = {
        ...habitData,
        id,
        createdAt: now,
        updatedAt: now,
      };

      const habits = await database.getHabits();
      habits.push(habit);
      await database.saveHabits(habits);

      dispatch({ type: 'ADD_HABIT', payload: habit });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add habit' });
    }
  };

  const updateHabit = async (habit: Habit) => {
    try {
      const updatedHabit = { ...habit, updatedAt: new Date() };
      const db = database.getDatabase();
      
      await db.runAsync(
        'UPDATE habits SET name = ?, description = ?, category = ?, frequency = ?, target_value = ?, unit = ?, color = ?, icon = ?, is_active = ?, updated_at = ? WHERE id = ?',
        [updatedHabit.name, updatedHabit.description || null, updatedHabit.category, updatedHabit.frequency, updatedHabit.targetValue, updatedHabit.unit, updatedHabit.color, updatedHabit.icon, updatedHabit.isActive ? 1 : 0, updatedHabit.updatedAt.toISOString(), updatedHabit.id]
      );

      dispatch({ type: 'UPDATE_HABIT', payload: updatedHabit });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update habit' });
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      const db = database.getDatabase();
      await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
      dispatch({ type: 'DELETE_HABIT', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete habit' });
    }
  };

  const addHabitEntry = async (entryData: Omit<HabitEntry, 'id' | 'createdAt'>) => {
    try {
      const id = Date.now().toString();
      const now = new Date();
      const entry: HabitEntry = {
        ...entryData,
        id,
        createdAt: now,
      };

      const db = database.getDatabase();
      await db.runAsync(
        'INSERT INTO habit_entries (id, habit_id, date, value, notes, completed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, entry.habitId, entry.date.toISOString().split('T')[0], entry.value, entry.notes || null, entry.completed ? 1 : 0, entry.createdAt.toISOString()]
      );

      dispatch({ type: 'ADD_HABIT_ENTRY', payload: entry });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add habit entry' });
    }
  };

  const updateHabitEntry = async (entry: HabitEntry) => {
    try {
      const db = database.getDatabase();
      
      await db.runAsync(
        'UPDATE habit_entries SET habit_id = ?, date = ?, value = ?, notes = ?, completed = ? WHERE id = ?',
        [entry.habitId, entry.date.toISOString().split('T')[0], entry.value, entry.notes || null, entry.completed ? 1 : 0, entry.id]
      );

      dispatch({ type: 'UPDATE_HABIT_ENTRY', payload: entry });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update habit entry' });
    }
  };

  // Journal methods
  const addJournalEntry = async (entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = Date.now().toString();
      const now = new Date();
      const entry: JournalEntry = {
        ...entryData,
        id,
        createdAt: now,
        updatedAt: now,
      };

      const db = database.getDatabase();
      await db.runAsync(
        'INSERT INTO journal_entries (id, title, content, mood, tags, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, entry.title, entry.content, entry.mood, JSON.stringify(entry.tags), entry.date.toISOString().split('T')[0], entry.createdAt.toISOString(), entry.updatedAt.toISOString()]
      );

      dispatch({ type: 'ADD_JOURNAL_ENTRY', payload: entry });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add journal entry' });
    }
  };

  const updateJournalEntry = async (entry: JournalEntry) => {
    try {
      const updatedEntry = { ...entry, updatedAt: new Date() };
      const db = database.getDatabase();
      
      await db.runAsync(
        'UPDATE journal_entries SET title = ?, content = ?, mood = ?, tags = ?, date = ?, updated_at = ? WHERE id = ?',
        [updatedEntry.title, updatedEntry.content, updatedEntry.mood, JSON.stringify(updatedEntry.tags), updatedEntry.date.toISOString().split('T')[0], updatedEntry.updatedAt.toISOString(), updatedEntry.id]
      );

      dispatch({ type: 'UPDATE_JOURNAL_ENTRY', payload: updatedEntry });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update journal entry' });
    }
  };

  const deleteJournalEntry = async (id: string) => {
    try {
      const db = database.getDatabase();
      await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
      dispatch({ type: 'DELETE_JOURNAL_ENTRY', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete journal entry' });
    }
  };

  // Transaction methods
  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = Date.now().toString();
      const now = new Date();
      const transaction: Transaction = {
        ...transactionData,
        id,
        createdAt: now,
        updatedAt: now,
      };

      const db = database.getDatabase();
      await db.runAsync(
        'INSERT INTO transactions (id, type, category, subcategory, amount, description, date, account, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, transaction.type, transaction.category, transaction.subcategory || null, transaction.amount, transaction.description, transaction.date.toISOString().split('T')[0], transaction.account || null, JSON.stringify(transaction.tags), transaction.createdAt.toISOString(), transaction.updatedAt.toISOString()]
      );

      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      await calculateAnalytics();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add transaction' });
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    try {
      const updatedTransaction = { ...transaction, updatedAt: new Date() };
      const db = database.getDatabase();
      
      await db.runAsync(
        'UPDATE transactions SET type = ?, category = ?, subcategory = ?, amount = ?, description = ?, date = ?, account = ?, tags = ?, updated_at = ? WHERE id = ?',
        [updatedTransaction.type, updatedTransaction.category, updatedTransaction.subcategory || null, updatedTransaction.amount, updatedTransaction.description, updatedTransaction.date.toISOString().split('T')[0], updatedTransaction.account || null, JSON.stringify(updatedTransaction.tags), updatedTransaction.updatedAt.toISOString(), updatedTransaction.id]
      );

      dispatch({ type: 'UPDATE_TRANSACTION', payload: updatedTransaction });
      await calculateAnalytics();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update transaction' });
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const db = database.getDatabase();
      await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      await calculateAnalytics();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete transaction' });
    }
  };

  // Investment methods
  const addInvestment = async (investmentData: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = Date.now().toString();
      const now = new Date();
      const investment: Investment = {
        ...investmentData,
        id,
        createdAt: now,
        updatedAt: now,
      };

      const db = database.getDatabase();
      await db.runAsync(
        'INSERT INTO investments (id, name, type, symbol, quantity, average_price, current_price, total_value, purchase_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, investment.name, investment.type, investment.symbol || null, investment.quantity, investment.averagePrice, investment.currentPrice || null, investment.totalValue || null, investment.purchaseDate.toISOString().split('T')[0], investment.createdAt.toISOString(), investment.updatedAt.toISOString()]
      );

      dispatch({ type: 'ADD_INVESTMENT', payload: investment });
      await calculateAnalytics();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add investment' });
    }
  };

  const updateInvestment = async (investment: Investment) => {
    try {
      const updatedInvestment = { ...investment, updatedAt: new Date() };
      const db = database.getDatabase();
      
      await db.runAsync(
        'UPDATE investments SET name = ?, type = ?, symbol = ?, quantity = ?, average_price = ?, current_price = ?, total_value = ?, purchase_date = ?, updated_at = ? WHERE id = ?',
        [updatedInvestment.name, updatedInvestment.type, updatedInvestment.symbol || null, updatedInvestment.quantity, updatedInvestment.averagePrice, updatedInvestment.currentPrice || null, updatedInvestment.totalValue || null, updatedInvestment.purchaseDate.toISOString().split('T')[0], updatedInvestment.updatedAt.toISOString(), updatedInvestment.id]
      );

      dispatch({ type: 'UPDATE_INVESTMENT', payload: updatedInvestment });
      await calculateAnalytics();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update investment' });
    }
  };

  const deleteInvestment = async (id: string) => {
    try {
      const db = database.getDatabase();
      await db.runAsync('DELETE FROM investments WHERE id = ?', [id]);
      dispatch({ type: 'DELETE_INVESTMENT', payload: id });
      await calculateAnalytics();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete investment' });
    }
  };

  // Budget methods
  const addBudget = async (budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = Date.now().toString();
      const now = new Date();
      const budget: Budget = {
        ...budgetData,
        id,
        createdAt: now,
        updatedAt: now,
      };

      const db = database.getDatabase();
      await db.runAsync(
        'INSERT INTO budgets (id, name, category, amount, spent, period, start_date, end_date, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, budget.name, budget.category, budget.amount, budget.spent, budget.period, budget.startDate.toISOString().split('T')[0], budget.endDate.toISOString().split('T')[0], budget.isActive ? 1 : 0, budget.createdAt.toISOString(), budget.updatedAt.toISOString()]
      );

      dispatch({ type: 'ADD_BUDGET', payload: budget });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add budget' });
    }
  };

  const updateBudget = async (budget: Budget) => {
    try {
      const updatedBudget = { ...budget, updatedAt: new Date() };
      const db = database.getDatabase();
      
      await db.runAsync(
        'UPDATE budgets SET name = ?, category = ?, amount = ?, spent = ?, period = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = ? WHERE id = ?',
        [updatedBudget.name, updatedBudget.category, updatedBudget.amount, updatedBudget.spent, updatedBudget.period, updatedBudget.startDate.toISOString().split('T')[0], updatedBudget.endDate.toISOString().split('T')[0], updatedBudget.isActive ? 1 : 0, updatedBudget.updatedAt.toISOString(), updatedBudget.id]
      );

      dispatch({ type: 'UPDATE_BUDGET', payload: updatedBudget });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update budget' });
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const db = database.getDatabase();
      await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
      dispatch({ type: 'DELETE_BUDGET', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete budget' });
    }
  };

  // Account methods
  const addAccount = async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = Date.now().toString();
      const now = new Date();
      const account: Account = {
        ...accountData,
        id,
        createdAt: now,
        updatedAt: now,
      };

      const db = database.getDatabase();
      await db.runAsync(
        'INSERT INTO accounts (id, name, type, balance, currency, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, account.name, account.type, account.balance, account.currency, account.isActive ? 1 : 0, account.createdAt.toISOString(), account.updatedAt.toISOString()]
      );

      dispatch({ type: 'ADD_ACCOUNT', payload: account });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add account' });
    }
  };

  const updateAccount = async (account: Account) => {
    try {
      const updatedAccount = { ...account, updatedAt: new Date() };
      const db = database.getDatabase();
      
      await db.runAsync(
        'UPDATE accounts SET name = ?, type = ?, balance = ?, currency = ?, is_active = ?, updated_at = ? WHERE id = ?',
        [updatedAccount.name, updatedAccount.type, updatedAccount.balance, updatedAccount.currency, updatedAccount.isActive ? 1 : 0, updatedAccount.updatedAt.toISOString(), updatedAccount.id]
      );

      dispatch({ type: 'UPDATE_ACCOUNT', payload: updatedAccount });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update account' });
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const db = database.getDatabase();
      await db.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
      dispatch({ type: 'DELETE_ACCOUNT', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete account' });
    }
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    addHabit,
    updateHabit,
    deleteHabit,
    addHabitEntry,
    updateHabitEntry,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addBudget,
    updateBudget,
    deleteBudget,
    addAccount,
    updateAccount,
    deleteAccount,
    refreshData,
    calculateAnalytics,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
