import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabaseDatabase } from '../database/supabaseDatabase';
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
      await supabaseDatabase.init();
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
      const habits = await supabaseDatabase.getHabits();
      dispatch({ type: 'SET_HABITS', payload: habits });

      // Load habit entries
      const habitEntries = await supabaseDatabase.getHabitEntries();
      dispatch({ type: 'SET_HABIT_ENTRIES', payload: habitEntries });

      // Load journal entries
      const journalEntries = await supabaseDatabase.getJournalEntries();
      dispatch({ type: 'SET_JOURNAL_ENTRIES', payload: journalEntries });

      // Load transactions
      const transactions = await supabaseDatabase.getTransactions();
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });

      // Load investments
      const investments = await supabaseDatabase.getInvestments();
      dispatch({ type: 'SET_INVESTMENTS', payload: investments });

      // Load budgets
      const budgets = await supabaseDatabase.getBudgets();
      dispatch({ type: 'SET_BUDGETS', payload: budgets });

      // Load accounts
      const accounts = await supabaseDatabase.getAccounts();
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

  // Generic CRUD helper
  const performCRUD = async <T extends { id: string }>(
    getData: () => Promise<T[]>,
    saveData: (data: T[]) => Promise<void>,
    action: AppAction,
    operation: (items: T[]) => T[]
  ) => {
    try {
      console.log('performCRUD: Getting existing data...');
      const items = await getData();
      console.log('performCRUD: Existing items count:', items.length);
      
      console.log('performCRUD: Applying operation...');
      const updatedItems = operation(items);
      console.log('performCRUD: Updated items count:', updatedItems.length);
      
      console.log('performCRUD: Saving data...');
      await saveData(updatedItems);
      console.log('performCRUD: Data saved successfully');
      
      console.log('performCRUD: Dispatching action...');
      dispatch(action);
      console.log('performCRUD: Action dispatched');
    } catch (error) {
      console.error('performCRUD: Error occurred:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Operation failed' });
    }
  };

  // Habit methods
  const addHabit = async (habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Context: Adding habit:', habitData.name);
      const id = Date.now().toString();
      const now = new Date();
      const habit: Habit = {
        ...habitData,
        id,
        createdAt: now,
        updatedAt: now,
      };

      console.log('Context: Created habit object:', habit);
      
      // Use individual add method instead of bulk save
      await supabaseDatabase.addHabit(habit);
      
      // Update local state
      dispatch({ type: 'ADD_HABIT', payload: habit });
      
      console.log('Context: Habit added successfully');
    } catch (error) {
      console.error('Context: Error adding habit:', error);
      throw error;
    }
  };

  const updateHabit = async (habit: Habit) => {
    const updatedHabit = { ...habit, updatedAt: new Date() };
    await performCRUD(
      supabaseDatabase.getHabits,
      supabaseDatabase.saveHabits,
      { type: 'UPDATE_HABIT', payload: updatedHabit },
      (habits) => habits.map(h => h.id === habit.id ? updatedHabit : h)
    );
  };

  const deleteHabit = async (id: string) => {
    try {
      console.log('Context: Deleting habit:', id);
      
      // Use individual delete method instead of bulk save
      await supabaseDatabase.deleteHabit(id);
      
      // Update local state
      dispatch({ type: 'DELETE_HABIT', payload: id });
      
      console.log('Context: Habit deleted successfully');
    } catch (error) {
      console.error('Context: Error deleting habit:', error);
      throw error;
    }
  };

  const addHabitEntry = async (entryData: Omit<HabitEntry, 'id' | 'createdAt'>) => {
    try {
      console.log('Context: Adding habit entry:', entryData);
      const id = Date.now().toString();
      const now = new Date();
      const entry: HabitEntry = {
        ...entryData,
        id,
        createdAt: now,
      };

      console.log('Context: Created habit entry object:', entry);
      
      // Use individual add method instead of bulk save
      await supabaseDatabase.addHabitEntry(entry);
      
      // Update local state
      dispatch({ type: 'ADD_HABIT_ENTRY', payload: entry });
      
      console.log('Context: Habit entry added successfully');
    } catch (error) {
      console.error('Context: Error adding habit entry:', error);
      throw error;
    }
  };

  const updateHabitEntry = async (entry: HabitEntry) => {
    await performCRUD(
      supabaseDatabase.getHabitEntries,
      supabaseDatabase.saveHabitEntries,
      { type: 'UPDATE_HABIT_ENTRY', payload: entry },
      (entries) => entries.map(e => e.id === entry.id ? entry : e)
    );
  };

  // Journal methods
  const addJournalEntry = async (entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = Date.now().toString();
    const now = new Date();
    const entry: JournalEntry = {
      ...entryData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await performCRUD(
      supabaseDatabase.getJournalEntries,
      supabaseDatabase.saveJournalEntries,
      { type: 'ADD_JOURNAL_ENTRY', payload: entry },
      (entries) => [...entries, entry]
    );
  };

  const updateJournalEntry = async (entry: JournalEntry) => {
    const updatedEntry = { ...entry, updatedAt: new Date() };
    await performCRUD(
      supabaseDatabase.getJournalEntries,
      supabaseDatabase.saveJournalEntries,
      { type: 'UPDATE_JOURNAL_ENTRY', payload: updatedEntry },
      (entries) => entries.map(e => e.id === entry.id ? updatedEntry : e)
    );
  };

  const deleteJournalEntry = async (id: string) => {
    await performCRUD(
      supabaseDatabase.getJournalEntries,
      supabaseDatabase.saveJournalEntries,
      { type: 'DELETE_JOURNAL_ENTRY', payload: id },
      (entries) => entries.filter(e => e.id !== id)
    );
  };

  // Transaction methods
  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = Date.now().toString();
    const now = new Date();
    const transaction: Transaction = {
      ...transactionData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await performCRUD(
      supabaseDatabase.getTransactions,
      supabaseDatabase.saveTransactions,
      { type: 'ADD_TRANSACTION', payload: transaction },
      (transactions) => [...transactions, transaction]
    );
    await calculateAnalytics();
  };

  const updateTransaction = async (transaction: Transaction) => {
    const updatedTransaction = { ...transaction, updatedAt: new Date() };
    await performCRUD(
      supabaseDatabase.getTransactions,
      supabaseDatabase.saveTransactions,
      { type: 'UPDATE_TRANSACTION', payload: updatedTransaction },
      (transactions) => transactions.map(t => t.id === transaction.id ? updatedTransaction : t)
    );
    await calculateAnalytics();
  };

  const deleteTransaction = async (id: string) => {
    await performCRUD(
      supabaseDatabase.getTransactions,
      supabaseDatabase.saveTransactions,
      { type: 'DELETE_TRANSACTION', payload: id },
      (transactions) => transactions.filter(t => t.id !== id)
    );
    await calculateAnalytics();
  };

  // Investment methods
  const addInvestment = async (investmentData: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = Date.now().toString();
    const now = new Date();
    const investment: Investment = {
      ...investmentData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await performCRUD(
      supabaseDatabase.getInvestments,
      supabaseDatabase.saveInvestments,
      { type: 'ADD_INVESTMENT', payload: investment },
      (investments) => [...investments, investment]
    );
    await calculateAnalytics();
  };

  const updateInvestment = async (investment: Investment) => {
    const updatedInvestment = { ...investment, updatedAt: new Date() };
    await performCRUD(
      supabaseDatabase.getInvestments,
      supabaseDatabase.saveInvestments,
      { type: 'UPDATE_INVESTMENT', payload: updatedInvestment },
      (investments) => investments.map(i => i.id === investment.id ? updatedInvestment : i)
    );
    await calculateAnalytics();
  };

  const deleteInvestment = async (id: string) => {
    await performCRUD(
      supabaseDatabase.getInvestments,
      supabaseDatabase.saveInvestments,
      { type: 'DELETE_INVESTMENT', payload: id },
      (investments) => investments.filter(i => i.id !== id)
    );
    await calculateAnalytics();
  };

  // Budget methods
  const addBudget = async (budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = Date.now().toString();
    const now = new Date();
    const budget: Budget = {
      ...budgetData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await performCRUD(
      supabaseDatabase.getBudgets,
      supabaseDatabase.saveBudgets,
      { type: 'ADD_BUDGET', payload: budget },
      (budgets) => [...budgets, budget]
    );
  };

  const updateBudget = async (budget: Budget) => {
    const updatedBudget = { ...budget, updatedAt: new Date() };
    await performCRUD(
      supabaseDatabase.getBudgets,
      supabaseDatabase.saveBudgets,
      { type: 'UPDATE_BUDGET', payload: updatedBudget },
      (budgets) => budgets.map(b => b.id === budget.id ? updatedBudget : b)
    );
  };

  const deleteBudget = async (id: string) => {
    await performCRUD(
      supabaseDatabase.getBudgets,
      supabaseDatabase.saveBudgets,
      { type: 'DELETE_BUDGET', payload: id },
      (budgets) => budgets.filter(b => b.id !== id)
    );
  };

  // Account methods
  const addAccount = async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = Date.now().toString();
    const now = new Date();
    const account: Account = {
      ...accountData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await performCRUD(
      supabaseDatabase.getAccounts,
      supabaseDatabase.saveAccounts,
      { type: 'ADD_ACCOUNT', payload: account },
      (accounts) => [...accounts, account]
    );
  };

  const updateAccount = async (account: Account) => {
    const updatedAccount = { ...account, updatedAt: new Date() };
    await performCRUD(
      supabaseDatabase.getAccounts,
      supabaseDatabase.saveAccounts,
      { type: 'UPDATE_ACCOUNT', payload: updatedAccount },
      (accounts) => accounts.map(a => a.id === account.id ? updatedAccount : a)
    );
  };

  const deleteAccount = async (id: string) => {
    await performCRUD(
      supabaseDatabase.getAccounts,
      supabaseDatabase.saveAccounts,
      { type: 'DELETE_ACCOUNT', payload: id },
      (accounts) => accounts.filter(a => a.id !== id)
    );
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