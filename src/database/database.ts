import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitEntry, JournalEntry, Transaction, Investment, Budget, Account } from '../types';

class Database {
  private readonly STORAGE_KEYS = {
    HABITS: 'lifeos_habits',
    HABIT_ENTRIES: 'lifeos_habit_entries',
    JOURNAL_ENTRIES: 'lifeos_journal_entries',
    TRANSACTIONS: 'lifeos_transactions',
    INVESTMENTS: 'lifeos_investments',
    BUDGETS: 'lifeos_budgets',
    ACCOUNTS: 'lifeos_accounts',
  };

  async init(): Promise<void> {
    try {
      console.log('Database initialized successfully with AsyncStorage');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  // Generic storage methods
  private async getData<T>(key: string): Promise<T[]> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting data for key ${key}:`, error);
      return [];
    }
  }

  private async setData<T>(key: string, data: T[]): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting data for key ${key}:`, error);
      throw error;
    }
  }

  // Habits
  async getHabits(): Promise<Habit[]> {
    return this.getData<Habit>(this.STORAGE_KEYS.HABITS);
  }

  async saveHabits(habits: Habit[]): Promise<void> {
    await this.setData(this.STORAGE_KEYS.HABITS, habits);
  }

  // Habit Entries
  async getHabitEntries(): Promise<HabitEntry[]> {
    return this.getData<HabitEntry>(this.STORAGE_KEYS.HABIT_ENTRIES);
  }

  async saveHabitEntries(entries: HabitEntry[]): Promise<void> {
    await this.setData(this.STORAGE_KEYS.HABIT_ENTRIES, entries);
  }

  // Journal Entries
  async getJournalEntries(): Promise<JournalEntry[]> {
    return this.getData<JournalEntry>(this.STORAGE_KEYS.JOURNAL_ENTRIES);
  }

  async saveJournalEntries(entries: JournalEntry[]): Promise<void> {
    await this.setData(this.STORAGE_KEYS.JOURNAL_ENTRIES, entries);
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return this.getData<Transaction>(this.STORAGE_KEYS.TRANSACTIONS);
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    await this.setData(this.STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  // Investments
  async getInvestments(): Promise<Investment[]> {
    return this.getData<Investment>(this.STORAGE_KEYS.INVESTMENTS);
  }

  async saveInvestments(investments: Investment[]): Promise<void> {
    await this.setData(this.STORAGE_KEYS.INVESTMENTS, investments);
  }

  // Budgets
  async getBudgets(): Promise<Budget[]> {
    return this.getData<Budget>(this.STORAGE_KEYS.BUDGETS);
  }

  async saveBudgets(budgets: Budget[]): Promise<void> {
    await this.setData(this.STORAGE_KEYS.BUDGETS, budgets);
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    return this.getData<Account>(this.STORAGE_KEYS.ACCOUNTS);
  }

  async saveAccounts(accounts: Account[]): Promise<void> {
    await this.setData(this.STORAGE_KEYS.ACCOUNTS, accounts);
  }

  async close(): Promise<void> {
    // AsyncStorage doesn't need explicit closing
  }
}

export const database = new Database();
