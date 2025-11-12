import { supabase } from '../config/supabase';
import { Habit, HabitEntry, JournalEntry, Transaction, Investment, Budget, Account, Subscription } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineSync } from '../services/offlineSync';

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
    
    // Convert camelCase to snake_case for database columns
    const dbSerialized: any = {};
    for (const key in serialized) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      dbSerialized[dbKey] = serialized[key];
    }
    
    return dbSerialized;
  }

  // Helper method to convert ISO strings back to Date objects
  private deserializeDates<T extends Record<string, any>>(obj: T): T {
    // Convert snake_case to camelCase
    const camelCaseObj: any = {};
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      camelCaseObj[camelKey] = obj[key];
    }
    
    // Convert date strings back to Date objects
    for (const key in camelCaseObj) {
      if (typeof camelCaseObj[key] === 'string' && 
          (key.includes('date') || key.includes('Date') || key.includes('At'))) {
        camelCaseObj[key] = new Date(camelCaseObj[key]);
      }
    }
    
    return camelCaseObj;
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

  saveHabitEntries = async (entries: HabitEntry[]): Promise<void> => {
    if (!this.useSupabase) {
      return this.setAsyncStorageData('lifeos_habit_entries', entries);
    }

    try {
      // For now, use the replace all approach but this should be improved
      // with individual CRUD operations in a real app
      const serializedEntries = entries.map(entry => this.serializeDates(entry));
      
      // Clear and insert all entries (temporary solution)
      await supabase.from('habit_entries').delete().neq('id', '');
      
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

  // Individual CRUD methods for better data management
  addHabit = async (habit: Habit): Promise<void> => {
    if (!this.useSupabase) {
      const existing = await this.getAsyncStorageData<Habit>('lifeos_habits');
      await this.setAsyncStorageData('lifeos_habits', [...existing, habit]);
      return;
    }

    try {
      const serializedHabit = this.serializeDates(habit);
      const { error } = await supabase
        .from('habits')
        .insert(serializedHabit);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error adding habit:', error);
      // Fallback to AsyncStorage
      const existing = await this.getAsyncStorageData<Habit>('lifeos_habits');
      await this.setAsyncStorageData('lifeos_habits', [...existing, habit]);
      
      // Queue for sync when online
      await offlineSync.queueOperation('create', 'habits', habit);
    }
  }

  addHabitEntry = async (entry: HabitEntry): Promise<void> => {
    if (!this.useSupabase) {
      const existing = await this.getAsyncStorageData<HabitEntry>('lifeos_habit_entries');
      await this.setAsyncStorageData('lifeos_habit_entries', [...existing, entry]);
      return;
    }

    try {
      const serializedEntry = this.serializeDates(entry);
      const { error } = await supabase
        .from('habit_entries')
        .insert(serializedEntry);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error adding habit entry:', error);
      // Save to AsyncStorage as fallback
      const existing = await this.getAsyncStorageData<HabitEntry>('lifeos_habit_entries');
      await this.setAsyncStorageData('lifeos_habit_entries', [...existing, entry]);
      
      // Queue for sync when online
      await offlineSync.queueOperation('create', 'habit_entries', entry);
    }
  }

  deleteHabit = async (habitId: string): Promise<void> => {
    if (!this.useSupabase) {
      const existing = await this.getAsyncStorageData<Habit>('lifeos_habits');
      const filtered = existing.filter(habit => habit.id !== habitId);
      await this.setAsyncStorageData('lifeos_habits', filtered);
      return;
    }

    try {
      // Delete the habit
      const { error: habitError } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);
      
      if (habitError) throw habitError;

      // Also delete related habit entries (optional - you might want to keep them for analytics)
      const { error: entriesError } = await supabase
        .from('habit_entries')
        .delete()
        .eq('habit_id', habitId);
      
      if (entriesError) {
        console.warn('Error deleting habit entries:', entriesError);
        // Don't throw here as the main habit deletion succeeded
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
      // Fallback to AsyncStorage
      const existing = await this.getAsyncStorageData<Habit>('lifeos_habits');
      const filtered = existing.filter(habit => habit.id !== habitId);
      await this.setAsyncStorageData('lifeos_habits', filtered);
    }
  }

  deleteHabitEntry = async (entryId: string): Promise<void> => {
    if (!this.useSupabase) {
      const existing = await this.getAsyncStorageData<HabitEntry>('lifeos_habit_entries');
      const filtered = existing.filter(entry => entry.id !== entryId);
      await this.setAsyncStorageData('lifeos_habit_entries', filtered);
      return;
    }

    try {
      const { error } = await supabase
        .from('habit_entries')
        .delete()
        .eq('id', entryId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting habit entry:', error);
      // Fallback to AsyncStorage
      const existing = await this.getAsyncStorageData<HabitEntry>('lifeos_habit_entries');
      const filtered = existing.filter(entry => entry.id !== entryId);
      await this.setAsyncStorageData('lifeos_habit_entries', filtered);
    }
  }

  // Journal Entries
  getJournalEntries = async (): Promise<JournalEntry[]> => {
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

  saveJournalEntries = async (entries: JournalEntry[]): Promise<void> => {
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

  // Individual CRUD methods for journal entries
  addJournalEntry = async (entry: JournalEntry): Promise<void> => {
    if (!this.useSupabase) {
      const existing = await this.getAsyncStorageData<JournalEntry>('lifeos_journal_entries');
      await this.setAsyncStorageData('lifeos_journal_entries', [...existing, entry]);
      return;
    }

    try {
      const serializedEntry = this.serializeDates(entry);
      const { error } = await supabase
        .from('journal_entries')
        .insert(serializedEntry);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error adding journal entry:', error);
      // Save to AsyncStorage as fallback
      const existing = await this.getAsyncStorageData<JournalEntry>('lifeos_journal_entries');
      await this.setAsyncStorageData('lifeos_journal_entries', [...existing, entry]);
      
      // Queue for sync when online
      await offlineSync.queueOperation('create', 'journal_entries', entry);
    }
  }

  updateJournalEntry = async (entry: JournalEntry): Promise<void> => {
    if (!this.useSupabase) {
      const existing = await this.getAsyncStorageData<JournalEntry>('lifeos_journal_entries');
      const updated = existing.map(e => e.id === entry.id ? entry : e);
      await this.setAsyncStorageData('lifeos_journal_entries', updated);
      return;
    }

    try {
      const serializedEntry = this.serializeDates(entry);
      const { error } = await supabase
        .from('journal_entries')
        .update(serializedEntry)
        .eq('id', entry.id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating journal entry:', error);
      // Fallback to AsyncStorage
      const existing = await this.getAsyncStorageData<JournalEntry>('lifeos_journal_entries');
      const updated = existing.map(e => e.id === entry.id ? entry : e);
      await this.setAsyncStorageData('lifeos_journal_entries', updated);
    }
  }

  deleteJournalEntry = async (entryId: string): Promise<void> => {
    if (!this.useSupabase) {
      const existing = await this.getAsyncStorageData<JournalEntry>('lifeos_journal_entries');
      const filtered = existing.filter(entry => entry.id !== entryId);
      await this.setAsyncStorageData('lifeos_journal_entries', filtered);
      return;
    }

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      // Fallback to AsyncStorage
      const existing = await this.getAsyncStorageData<JournalEntry>('lifeos_journal_entries');
      const filtered = existing.filter(entry => entry.id !== entryId);
      await this.setAsyncStorageData('lifeos_journal_entries', filtered);
    }
  }

  // Transactions
  getTransactions = async (): Promise<Transaction[]> => {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<Transaction>('lifeos_transactions');
    }

    try {
      // Fetch all transactions with pagination to avoid 1000 row limit
      let allTransactions: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allTransactions = allTransactions.concat(data);
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      console.log(`Fetched ${allTransactions.length} transactions from Supabase`);
      return allTransactions.map(transaction => this.deserializeDates(transaction)) || [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return this.getAsyncStorageData<Transaction>('lifeos_transactions');
    }
  }

  saveTransactions = async (transactions: Transaction[]): Promise<void> => {
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
      // Fallback to AsyncStorage
      await this.setAsyncStorageData('lifeos_transactions', transactions);
      // The AsyncStorage sync will handle syncing these when online
    }
  }

  // Investments
  getInvestments = async (): Promise<Investment[]> => {
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

  saveInvestments = async (investments: Investment[]): Promise<void> => {
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
  getBudgets = async (): Promise<Budget[]> => {
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

  saveBudgets = async (budgets: Budget[]): Promise<void> => {
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
  getAccounts = async (): Promise<Account[]> => {
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

  saveAccounts = async (accounts: Account[]): Promise<void> => {
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

  // Subscriptions
  getSubscriptions = async (): Promise<Subscription[]> => {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<Subscription>('lifeos_subscriptions');
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('recurring_date', { ascending: true });

      if (error) throw error;
      return data?.map(sub => this.deserializeDates(sub)) || [];
    } catch (error) {
      console.error('Error getting subscriptions:', error);
      return this.getAsyncStorageData<Subscription>('lifeos_subscriptions');
    }
  };

  saveSubscriptions = async (subscriptions: Subscription[]): Promise<void> => {
    if (!this.useSupabase) {
      return this.setAsyncStorageData('lifeos_subscriptions', subscriptions);
    }

    try {
      const serializedSubscriptions = subscriptions.map(sub => this.serializeDates(sub));
      
      // First, clear existing subscriptions
      await supabase.from('subscriptions').delete().neq('id', '');
      
      // Then insert all subscriptions
      if (serializedSubscriptions.length > 0) {
        const { error } = await supabase
          .from('subscriptions')
          .insert(serializedSubscriptions);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving subscriptions:', error);
      return this.setAsyncStorageData('lifeos_subscriptions', subscriptions);
    }
  };

  addSubscription = async (subscription: Subscription): Promise<void> => {
    if (!this.useSupabase) {
      const subscriptions = await this.getSubscriptions();
      subscriptions.push(subscription);
      return this.saveSubscriptions(subscriptions);
    }

    try {
      const serialized = this.serializeDates(subscription);
      const { error } = await supabase
        .from('subscriptions')
        .insert(serialized);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error adding subscription:', error);
      const subscriptions = await this.getSubscriptions();
      subscriptions.push(subscription);
      return this.saveSubscriptions(subscriptions);
    }
  };

  updateSubscription = async (subscription: Subscription): Promise<void> => {
    if (!this.useSupabase) {
      const subscriptions = await this.getSubscriptions();
      const index = subscriptions.findIndex(s => s.id === subscription.id);
      if (index !== -1) {
        subscriptions[index] = subscription;
        return this.saveSubscriptions(subscriptions);
      }
      return;
    }

    try {
      const serialized = this.serializeDates(subscription);
      const { error } = await supabase
        .from('subscriptions')
        .update(serialized)
        .eq('id', subscription.id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating subscription:', error);
      const subscriptions = await this.getSubscriptions();
      const index = subscriptions.findIndex(s => s.id === subscription.id);
      if (index !== -1) {
        subscriptions[index] = subscription;
        return this.saveSubscriptions(subscriptions);
      }
    }
  };

  deleteSubscription = async (id: string): Promise<void> => {
    if (!this.useSupabase) {
      const subscriptions = await this.getSubscriptions();
      const filtered = subscriptions.filter(s => s.id !== id);
      return this.saveSubscriptions(filtered);
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting subscription:', error);
      const subscriptions = await this.getSubscriptions();
      const filtered = subscriptions.filter(s => s.id !== id);
      return this.saveSubscriptions(filtered);
    }
  };

  async close(): Promise<void> {
    // Supabase doesn't need explicit closing
  }
}

export const supabaseDatabase = new SupabaseDatabase();
