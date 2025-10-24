import { supabase } from '../config/supabase';
import { Habit, HabitEntry, JournalEntry, Transaction, Investment, Budget, Account } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SupabaseDatabase {
  private useSupabase: boolean = true;

  async init(): Promise<void> {
    try {
      // Check if Supabase is properly configured
      if (supabase.supabaseUrl === 'YOUR_SUPABASE_URL' || supabase.supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
        console.log('Supabase not configured, falling back to AsyncStorage');
        this.useSupabase = false;
      } else {
        // Test Supabase connection
        const { data, error } = await supabase.from('habits').select('count').limit(1);
        if (error) {
          console.log('Supabase connection failed, falling back to AsyncStorage:', error.message);
          this.useSupabase = false;
        } else {
          console.log('Supabase database initialized successfully');
        }
      }
    } catch (error) {
      console.log('Supabase initialization failed, falling back to AsyncStorage:', error);
      this.useSupabase = false;
    }
  }

  // Helper method to convert Date objects to ISO strings for Supabase
  private serializeDates<T extends Record<string, any>>(obj: T): T {
    const serialized = { ...obj };
    for (const key in serialized) {
      if (serialized[key] instanceof Date) {
        serialized[key] = serialized[key].toISOString() as any;
      }
    }
    return serialized;
  }

  // Helper method to convert ISO strings back to Date objects
  private deserializeDates<T extends Record<string, any>>(obj: T): T {
    const deserialized = { ...obj };
    for (const key in deserialized) {
      if (typeof deserialized[key] === 'string' && 
          (key.includes('date') || key.includes('Date') || key.includes('At'))) {
        deserialized[key] = new Date(deserialized[key]);
      }
    }
    return deserialized;
  }

  // AsyncStorage fallback methods
  private async getAsyncStorageData<T>(key: string): Promise<T[]> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting data from AsyncStorage for key ${key}:`, error);
      return [];
    }
  }

  private async setAsyncStorageData<T>(key: string, data: T[]): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting data in AsyncStorage for key ${key}:`, error);
      throw error;
    }
  }

  // Habits
  getHabits = async (): Promise<Habit[]> => {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<Habit>('lifeos_habits');
    }

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(habit => this.deserializeDates(habit)) || [];
    } catch (error) {
      console.error('Error getting habits:', error);
      return this.getAsyncStorageData<Habit>('lifeos_habits');
    }
  }

  saveHabits = async (habits: Habit[]): Promise<void> => {
    if (!this.useSupabase) {
      return this.setAsyncStorageData('lifeos_habits', habits);
    }

    try {
      const serializedHabits = habits.map(habit => this.serializeDates(habit));
      
      // First, clear existing habits
      await supabase.from('habits').delete().neq('id', '');
      
      // Then insert all habits
      if (serializedHabits.length > 0) {
        const { error } = await supabase
          .from('habits')
          .insert(serializedHabits);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving habits:', error);
      return this.setAsyncStorageData('lifeos_habits', habits);
    }
  }

  // Habit Entries
  getHabitEntries = async (): Promise<HabitEntry[]> => {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<HabitEntry>('lifeos_habit_entries');
    }

    try {
      const { data, error } = await supabase
        .from('habit_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(entry => this.deserializeDates(entry)) || [];
    } catch (error) {
      console.error('Error getting habit entries:', error);
      return this.getAsyncStorageData<HabitEntry>('lifeos_habit_entries');
    }
  }

  async saveHabitEntries(entries: HabitEntry[]): Promise<void> {
    if (!this.useSupabase) {
      return this.setAsyncStorageData('lifeos_habit_entries', entries);
    }

    try {
      const serializedEntries = entries.map(entry => this.serializeDates(entry));
      
      // First, clear existing entries
      await supabase.from('habit_entries').delete().neq('id', '');
      
      // Then insert all entries
      if (serializedEntries.length > 0) {
        const { error } = await supabase
          .from('habit_entries')
          .insert(serializedEntries);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving habit entries:', error);
      return this.setAsyncStorageData('lifeos_habit_entries', entries);
    }
  }

  // Journal Entries
  async getJournalEntries(): Promise<JournalEntry[]> {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<JournalEntry>('lifeos_journal_entries');
    }

    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(entry => this.deserializeDates(entry)) || [];
    } catch (error) {
      console.error('Error getting journal entries:', error);
      return this.getAsyncStorageData<JournalEntry>('lifeos_journal_entries');
    }
  }

  async saveJournalEntries(entries: JournalEntry[]): Promise<void> {
    if (!this.useSupabase) {
      return this.setAsyncStorageData('lifeos_journal_entries', entries);
    }

    try {
      const serializedEntries = entries.map(entry => this.serializeDates(entry));
      
      // First, clear existing entries
      await supabase.from('journal_entries').delete().neq('id', '');
      
      // Then insert all entries
      if (serializedEntries.length > 0) {
        const { error } = await supabase
          .from('journal_entries')
          .insert(serializedEntries);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving journal entries:', error);
      return this.setAsyncStorageData('lifeos_journal_entries', entries);
    }
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<Transaction>('lifeos_transactions');
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(transaction => this.deserializeDates(transaction)) || [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return this.getAsyncStorageData<Transaction>('lifeos_transactions');
    }
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    if (!this.useSupabase) {
      return this.setAsyncStorageData('lifeos_transactions', transactions);
    }

    try {
      const serializedTransactions = transactions.map(transaction => this.serializeDates(transaction));
      
      // First, clear existing transactions
      await supabase.from('transactions').delete().neq('id', '');
      
      // Then insert all transactions
      if (serializedTransactions.length > 0) {
        const { error } = await supabase
          .from('transactions')
          .insert(serializedTransactions);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving transactions:', error);
      return this.setAsyncStorageData('lifeos_transactions', transactions);
    }
  }

  // Investments
  async getInvestments(): Promise<Investment[]> {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<Investment>('lifeos_investments');
    }

    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(investment => this.deserializeDates(investment)) || [];
    } catch (error) {
      console.error('Error getting investments:', error);
      return this.getAsyncStorageData<Investment>('lifeos_investments');
    }
  }

  async saveInvestments(investments: Investment[]): Promise<void> {
    if (!this.useSupabase) {
      return this.setAsyncStorageData('lifeos_investments', investments);
    }

    try {
      const serializedInvestments = investments.map(investment => this.serializeDates(investment));
      
      // First, clear existing investments
      await supabase.from('investments').delete().neq('id', '');
      
      // Then insert all investments
      if (serializedInvestments.length > 0) {
        const { error } = await supabase
          .from('investments')
          .insert(serializedInvestments);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving investments:', error);
      return this.setAsyncStorageData('lifeos_investments', investments);
    }
  }

  // Budgets
  async getBudgets(): Promise<Budget[]> {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<Budget>('lifeos_budgets');
    }

    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(budget => this.deserializeDates(budget)) || [];
    } catch (error) {
      console.error('Error getting budgets:', error);
      return this.getAsyncStorageData<Budget>('lifeos_budgets');
    }
  }

  async saveBudgets(budgets: Budget[]): Promise<void> {
    if (!this.useSupabase) {
      return this.setAsyncStorageData('lifeos_budgets', budgets);
    }

    try {
      const serializedBudgets = budgets.map(budget => this.serializeDates(budget));
      
      // First, clear existing budgets
      await supabase.from('budgets').delete().neq('id', '');
      
      // Then insert all budgets
      if (serializedBudgets.length > 0) {
        const { error } = await supabase
          .from('budgets')
          .insert(serializedBudgets);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving budgets:', error);
      return this.setAsyncStorageData('lifeos_budgets', budgets);
    }
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<Account>('lifeos_accounts');
    }

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(account => this.deserializeDates(account)) || [];
    } catch (error) {
      console.error('Error getting accounts:', error);
      return this.getAsyncStorageData<Account>('lifeos_accounts');
    }
  }

  async saveAccounts(accounts: Account[]): Promise<void> {
    if (!this.useSupabase) {
      return this.setAsyncStorageData('lifeos_accounts', accounts);
    }

    try {
      const serializedAccounts = accounts.map(account => this.serializeDates(account));
      
      // First, clear existing accounts
      await supabase.from('accounts').delete().neq('id', '');
      
      // Then insert all accounts
      if (serializedAccounts.length > 0) {
        const { error } = await supabase
          .from('accounts')
          .insert(serializedAccounts);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving accounts:', error);
      return this.setAsyncStorageData('lifeos_accounts', accounts);
    }
  }

  async close(): Promise<void> {
    // Supabase doesn't need explicit closing
  }
}

export const supabaseDatabase = new SupabaseDatabase();
