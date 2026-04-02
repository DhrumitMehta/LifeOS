import { supabase, isSupabaseConfigured } from '../config/supabase';
import {
  Habit,
  HabitEntry,
  JournalEntry,
  Transaction,
  Investment,
  Budget,
  Account,
  Subscription,
  Review,
  Profile,
} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineSync } from '../services/offlineSync';
import { scopedStorageKey, getActiveUserId } from '../services/userSession';

class SupabaseDatabase {
  private useSupabase: boolean = true;

  private k(short: string): string {
    return scopedStorageKey(short);
  }

  private requireUserId(): string {
    const id = getActiveUserId();
    if (!id) {
      throw new Error('LifeOS: signed-in user required for Supabase');
    }
    return id;
  }

  /** Row payload for insert/replace with `user_id` set (via camelCase → snake_case). */
  private serializeRowForDb<T extends Record<string, any>>(entity: T): Record<string, any> {
    return this.serializeDates({ ...entity, userId: this.requireUserId() });
  }

  private deserializeEntity<T>(row: Record<string, any>): T {
    const o = this.deserializeDates(row) as Record<string, unknown>;
    delete o.userId;
    return o as T;
  }

  private serializeReviewForDb(review: Review): Record<string, any> {
    const serialized = this.serializeRowForDb(review as unknown as Record<string, any>);
    if (serialized.journal_stats) {
      serialized.journal_stats = JSON.stringify(serialized.journal_stats);
    }
    if (serialized.habit_stats) {
      serialized.habit_stats = JSON.stringify(serialized.habit_stats);
    }
    if (serialized.finance_stats) {
      serialized.finance_stats = JSON.stringify(serialized.finance_stats);
    }
    return serialized;
  }

  async init(): Promise<void> {
    try {
      if (!isSupabaseConfigured()) {
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
      return this.getAsyncStorageData<Habit>(this.k('habits'));
    }

    try {
      const uid = this.requireUserId();
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map((habit) => this.deserializeEntity<Habit>(habit)) || [];
    } catch (error) {
      console.error('Error getting habits:', error);
      return this.getAsyncStorageData<Habit>(this.k('habits'));
    }
  }

  saveHabits = async (habits: Habit[]): Promise<void> => {
    if (!this.useSupabase) {
      return this.setAsyncStorageData(this.k('habits'), habits);
    }

    try {
      const uid = this.requireUserId();
      const serializedHabits = habits.map((habit) => this.serializeRowForDb(habit));

      await supabase.from('habits').delete().eq('user_id', uid);

      if (serializedHabits.length > 0) {
        const { error } = await supabase
          .from('habits')
          .insert(serializedHabits);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving habits:', error);
      return this.setAsyncStorageData(this.k('habits'), habits);
    }
  }

  // Habit Entries
  getHabitEntries = async (): Promise<HabitEntry[]> => {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<HabitEntry>(this.k('habit_entries'));
    }

    try {
      const uid = this.requireUserId();
      const { data, error } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map((entry) => this.deserializeEntity<HabitEntry>(entry)) || [];
    } catch (error) {
      console.error('Error getting habit entries:', error);
      return this.getAsyncStorageData<HabitEntry>(this.k('habit_entries'));
    }
  }

  saveHabitEntries = async (entries: HabitEntry[]): Promise<void> => {
    if (!this.useSupabase) {
      return this.setAsyncStorageData(this.k('habit_entries'), entries);
    }

    try {
      // For now, use the replace all approach but this should be improved
      // with individual CRUD operations in a real app
      const uid = this.requireUserId();
      const serializedEntries = entries.map((entry) => this.serializeRowForDb(entry));

      await supabase.from('habit_entries').delete().eq('user_id', uid);

      if (serializedEntries.length > 0) {
        const { error } = await supabase
          .from('habit_entries')
          .insert(serializedEntries);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving habit entries:', error);
      return this.setAsyncStorageData(this.k('habit_entries'), entries);
    }
  }

  // Individual CRUD methods for better data management
  addHabit = async (habit: Habit): Promise<void> => {
    if (!this.useSupabase) {
      const existing = await this.getAsyncStorageData<Habit>(this.k('habits'));
      await this.setAsyncStorageData(this.k('habits'), [...existing, habit]);
      return;
    }

    try {
      const serializedHabit = this.serializeRowForDb(habit);
      const { error } = await supabase
        .from('habits')
        .insert(serializedHabit);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error adding habit:', error);
      // Fallback to AsyncStorage
      const existing = await this.getAsyncStorageData<Habit>(this.k('habits'));
      await this.setAsyncStorageData(this.k('habits'), [...existing, habit]);
      
      // Queue for sync when online
      await offlineSync.queueOperation('create', 'habits', habit);
    }
  }

  addHabitEntry = async (entry: HabitEntry): Promise<void> => {
    if (!this.useSupabase) {
      const existing = await this.getAsyncStorageData<HabitEntry>(this.k('habit_entries'));
      await this.setAsyncStorageData(this.k('habit_entries'), [...existing, entry]);
      return;
    }

    try {
      const serializedEntry = this.serializeRowForDb(entry);
      const { error } = await supabase
        .from('habit_entries')
        .insert(serializedEntry);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error adding habit entry:', error);
      // Save to AsyncStorage as fallback
      const existing = await this.getAsyncStorageData<HabitEntry>(this.k('habit_entries'));
      await this.setAsyncStorageData(this.k('habit_entries'), [...existing, entry]);
      
      // Queue for sync when online
      await offlineSync.queueOperation('create', 'habit_entries', entry);
    }
  }

  deleteHabit = async (habitId: string): Promise<void> => {
    if (!this.useSupabase) {
      const existing = await this.getAsyncStorageData<Habit>(this.k('habits'));
      const filtered = existing.filter(habit => habit.id !== habitId);
      await this.setAsyncStorageData(this.k('habits'), filtered);
      return;
    }

    try {
      const uid = this.requireUserId();
      const { error: habitError } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', uid);

      if (habitError) throw habitError;

      const { error: entriesError } = await supabase
        .from('habit_entries')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', uid);
      
      if (entriesError) {
        console.warn('Error deleting habit entries:', entriesError);
        // Don't throw here as the main habit deletion succeeded
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
      // Fallback to AsyncStorage
      const existing = await this.getAsyncStorageData<Habit>(this.k('habits'));
      const filtered = existing.filter(habit => habit.id !== habitId);
      await this.setAsyncStorageData(this.k('habits'), filtered);
    }
  }

  deleteHabitEntry = async (entryId: string): Promise<void> => {
    if (!this.useSupabase) {
      const existing = await this.getAsyncStorageData<HabitEntry>(this.k('habit_entries'));
      const filtered = existing.filter(entry => entry.id !== entryId);
      await this.setAsyncStorageData(this.k('habit_entries'), filtered);
      return;
    }

    try {
      const uid = this.requireUserId();
      const { error } = await supabase
        .from('habit_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', uid);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting habit entry:', error);
      // Fallback to AsyncStorage
      const existing = await this.getAsyncStorageData<HabitEntry>(this.k('habit_entries'));
      const filtered = existing.filter(entry => entry.id !== entryId);
      await this.setAsyncStorageData(this.k('habit_entries'), filtered);
    }
  }

  // Journal Entries
  getJournalEntries = async (): Promise<JournalEntry[]> => {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<JournalEntry>(this.k('journal_entries'));
    }

    try {
      const uid = this.requireUserId();
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map((entry) => this.deserializeEntity<JournalEntry>(entry)) || [];
    } catch (error) {
      console.error('Error getting journal entries:', error);
      return this.getAsyncStorageData<JournalEntry>(this.k('journal_entries'));
    }
  }

  saveJournalEntries = async (entries: JournalEntry[]): Promise<void> => {
    if (!this.useSupabase) {
      return this.setAsyncStorageData(this.k('journal_entries'), entries);
    }

    try {
      const uid = this.requireUserId();
      const serializedEntries = entries.map((entry) => this.serializeRowForDb(entry));

      await supabase.from('journal_entries').delete().eq('user_id', uid);

      if (serializedEntries.length > 0) {
        const { error } = await supabase
          .from('journal_entries')
          .insert(serializedEntries);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving journal entries:', error);
      return this.setAsyncStorageData(this.k('journal_entries'), entries);
    }
  }

  // Individual CRUD methods for journal entries
  addJournalEntry = async (entry: JournalEntry): Promise<void> => {
    if (!this.useSupabase) {
      const existing = await this.getAsyncStorageData<JournalEntry>(this.k('journal_entries'));
      await this.setAsyncStorageData(this.k('journal_entries'), [...existing, entry]);
      return;
    }

    try {
      const serializedEntry = this.serializeRowForDb(entry);
      const { error } = await supabase
        .from('journal_entries')
        .insert(serializedEntry);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error adding journal entry:', error);
      // Save to AsyncStorage as fallback
      const existing = await this.getAsyncStorageData<JournalEntry>(this.k('journal_entries'));
      await this.setAsyncStorageData(this.k('journal_entries'), [...existing, entry]);
      
      // Queue for sync when online
      await offlineSync.queueOperation('create', 'journal_entries', entry);
    }
  }

  updateJournalEntry = async (entry: JournalEntry): Promise<void> => {
    if (!this.useSupabase) {
      const existing = await this.getAsyncStorageData<JournalEntry>(this.k('journal_entries'));
      const updated = existing.map(e => e.id === entry.id ? entry : e);
      await this.setAsyncStorageData(this.k('journal_entries'), updated);
      return;
    }

    try {
      const uid = this.requireUserId();
      const serializedEntry = this.serializeRowForDb(entry);
      const { error } = await supabase
        .from('journal_entries')
        .update(serializedEntry)
        .eq('id', entry.id)
        .eq('user_id', uid);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating journal entry:', error);
      // Fallback to AsyncStorage
      const existing = await this.getAsyncStorageData<JournalEntry>(this.k('journal_entries'));
      const updated = existing.map(e => e.id === entry.id ? entry : e);
      await this.setAsyncStorageData(this.k('journal_entries'), updated);
    }
  }

  deleteJournalEntry = async (entryId: string): Promise<void> => {
    if (!this.useSupabase) {
      const existing = await this.getAsyncStorageData<JournalEntry>(this.k('journal_entries'));
      const filtered = existing.filter(entry => entry.id !== entryId);
      await this.setAsyncStorageData(this.k('journal_entries'), filtered);
      return;
    }

    try {
      const uid = this.requireUserId();
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', uid);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      // Fallback to AsyncStorage
      const existing = await this.getAsyncStorageData<JournalEntry>(this.k('journal_entries'));
      const filtered = existing.filter(entry => entry.id !== entryId);
      await this.setAsyncStorageData(this.k('journal_entries'), filtered);
    }
  }

  // Transactions
  getTransactions = async (): Promise<Transaction[]> => {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<Transaction>(this.k('transactions'));
    }

    try {
      // Fetch all transactions with pagination to avoid 1000 row limit
      const uid = this.requireUserId();
      let allTransactions: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', uid)
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
      return allTransactions.map((transaction) => this.deserializeEntity<Transaction>(transaction)) || [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return this.getAsyncStorageData<Transaction>(this.k('transactions'));
    }
  }

  saveTransactions = async (transactions: Transaction[]): Promise<void> => {
    if (!this.useSupabase) {
      return this.setAsyncStorageData(this.k('transactions'), transactions);
    }

    try {
      const uid = this.requireUserId();
      const serializedTransactions = transactions.map((transaction) => this.serializeRowForDb(transaction));

      await supabase.from('transactions').delete().eq('user_id', uid);

      if (serializedTransactions.length > 0) {
        const { error } = await supabase
          .from('transactions')
          .insert(serializedTransactions);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving transactions:', error);
      // Fallback to AsyncStorage
      await this.setAsyncStorageData(this.k('transactions'), transactions);
      // The AsyncStorage sync will handle syncing these when online
    }
  }

  // Investments
  getInvestments = async (): Promise<Investment[]> => {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<Investment>(this.k('investments'));
    }

    try {
      const uid = this.requireUserId();
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map((investment) => this.deserializeEntity<Investment>(investment)) || [];
    } catch (error) {
      console.error('Error getting investments:', error);
      return this.getAsyncStorageData<Investment>(this.k('investments'));
    }
  }

  saveInvestments = async (investments: Investment[]): Promise<void> => {
    if (!this.useSupabase) {
      return this.setAsyncStorageData(this.k('investments'), investments);
    }

    try {
      const uid = this.requireUserId();
      const serializedInvestments = investments.map((investment) => this.serializeRowForDb(investment));

      await supabase.from('investments').delete().eq('user_id', uid);

      if (serializedInvestments.length > 0) {
        const { error } = await supabase
          .from('investments')
          .insert(serializedInvestments);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving investments:', error);
      return this.setAsyncStorageData(this.k('investments'), investments);
    }
  }

  /** DB null/false on is_active should not hide budgets in the UI; coerce spent to number. */
  private normalizeBudget(b: Budget): Budget {
    const spent =
      typeof b.spent === 'number' && !Number.isNaN(b.spent)
        ? b.spent
        : typeof (b as unknown as { spent?: string }).spent === 'string'
          ? parseFloat((b as unknown as { spent: string }).spent) || 0
          : 0;
    return {
      ...b,
      isActive: b.isActive !== false,
      spent,
    };
  }

  // Budgets
  getBudgets = async (): Promise<Budget[]> => {
    if (!this.useSupabase) {
      const local = await this.getAsyncStorageData<Budget>(this.k('budgets'));
      return local.map((b) => this.normalizeBudget(b));
    }

    try {
      const uid = this.requireUserId();
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows = data?.map((budget) => this.deserializeEntity<Budget>(budget)) || [];
      return rows.map((b) => this.normalizeBudget(b));
    } catch (error) {
      console.error('Error getting budgets:', error);
      const fallback = await this.getAsyncStorageData<Budget>(this.k('budgets'));
      return fallback.map((b) => this.normalizeBudget(b));
    }
  }

  saveBudgets = async (budgets: Budget[]): Promise<void> => {
    if (!this.useSupabase) {
      return this.setAsyncStorageData(this.k('budgets'), budgets);
    }

    try {
      const uid = this.requireUserId();
      const serializedBudgets = budgets.map((budget) => this.serializeRowForDb(budget));

      await supabase.from('budgets').delete().eq('user_id', uid);

      if (serializedBudgets.length > 0) {
        const { error } = await supabase
          .from('budgets')
          .insert(serializedBudgets);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving budgets:', error);
      return this.setAsyncStorageData(this.k('budgets'), budgets);
    }
  }

  // Accounts
  getAccounts = async (): Promise<Account[]> => {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<Account>(this.k('accounts'));
    }

    try {
      const uid = this.requireUserId();
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map((account) => this.deserializeEntity<Account>(account)) || [];
    } catch (error) {
      console.error('Error getting accounts:', error);
      return this.getAsyncStorageData<Account>(this.k('accounts'));
    }
  }

  saveAccounts = async (accounts: Account[]): Promise<void> => {
    if (!this.useSupabase) {
      return this.setAsyncStorageData(this.k('accounts'), accounts);
    }

    try {
      const uid = this.requireUserId();
      const serializedAccounts = accounts.map((account) => this.serializeRowForDb(account));

      await supabase.from('accounts').delete().eq('user_id', uid);

      if (serializedAccounts.length > 0) {
        const { error } = await supabase
          .from('accounts')
          .insert(serializedAccounts);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving accounts:', error);
      return this.setAsyncStorageData(this.k('accounts'), accounts);
    }
  }

  // Subscriptions
  getSubscriptions = async (): Promise<Subscription[]> => {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<Subscription>(this.k('subscriptions'));
    }

    try {
      const uid = this.requireUserId();
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', uid)
        .order('recurring_date', { ascending: true });

      if (error) throw error;
      return data?.map((sub) => this.deserializeEntity<Subscription>(sub)) || [];
    } catch (error) {
      console.error('Error getting subscriptions:', error);
      return this.getAsyncStorageData<Subscription>(this.k('subscriptions'));
    }
  };

  saveSubscriptions = async (subscriptions: Subscription[]): Promise<void> => {
    if (!this.useSupabase) {
      return this.setAsyncStorageData(this.k('subscriptions'), subscriptions);
    }

    try {
      const uid = this.requireUserId();
      const serializedSubscriptions = subscriptions.map((sub) => this.serializeRowForDb(sub));

      await supabase.from('subscriptions').delete().eq('user_id', uid);

      if (serializedSubscriptions.length > 0) {
        const { error } = await supabase
          .from('subscriptions')
          .insert(serializedSubscriptions);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving subscriptions:', error);
      return this.setAsyncStorageData(this.k('subscriptions'), subscriptions);
    }
  };

  addSubscription = async (subscription: Subscription): Promise<void> => {
    if (!this.useSupabase) {
      const subscriptions = await this.getSubscriptions();
      subscriptions.push(subscription);
      return this.saveSubscriptions(subscriptions);
    }

    try {
      const serialized = this.serializeRowForDb(subscription);
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
      const uid = this.requireUserId();
      const serialized = this.serializeRowForDb(subscription);
      const { error } = await supabase
        .from('subscriptions')
        .update(serialized)
        .eq('id', subscription.id)
        .eq('user_id', uid);
      
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
      const uid = this.requireUserId();
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id)
        .eq('user_id', uid);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting subscription:', error);
      const subscriptions = await this.getSubscriptions();
      const filtered = subscriptions.filter(s => s.id !== id);
      return this.saveSubscriptions(filtered);
    }
  };

  // Reviews
  getReviews = async (): Promise<Review[]> => {
    if (!this.useSupabase) {
      return this.getAsyncStorageData<Review>(this.k('reviews'));
    }

    try {
      const uid = this.requireUserId();
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data) return [];

      return data.map((item: any) => {
        const review = this.deserializeEntity<Review>(item);
        if (review.journalStats) {
          review.journalStats =
            typeof review.journalStats === 'string'
              ? JSON.parse(review.journalStats)
              : review.journalStats;
        }
        if (review.habitStats) {
          review.habitStats =
            typeof review.habitStats === 'string'
              ? JSON.parse(review.habitStats)
              : review.habitStats;
        }
        if (review.financeStats) {
          review.financeStats =
            typeof review.financeStats === 'string'
              ? JSON.parse(review.financeStats)
              : review.financeStats;
        }
        return review;
      });
    } catch (error) {
      console.error('Error getting reviews:', error);
      return this.getAsyncStorageData<Review>(this.k('reviews'));
    }
  };

  saveReviews = async (reviews: Review[]): Promise<void> => {
    if (!this.useSupabase) {
      return this.setAsyncStorageData(this.k('reviews'), reviews);
    }

    try {
      const uid = this.requireUserId();
      const serializedReviews = reviews.map((review) => this.serializeReviewForDb(review));

      await supabase.from('reviews').delete().eq('user_id', uid);

      if (serializedReviews.length > 0) {
        const { error } = await supabase
          .from('reviews')
          .insert(serializedReviews);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving reviews:', error);
      return this.setAsyncStorageData(this.k('reviews'), reviews);
    }
  };

  addReview = async (review: Review): Promise<void> => {
    if (!this.useSupabase) {
      console.log('Using AsyncStorage for reviews');
      const existing = await this.getAsyncStorageData<Review>(this.k('reviews'));
      await this.setAsyncStorageData(this.k('reviews'), [...existing, review]);
      return;
    }

    try {
      console.log('Adding review to Supabase:', review.id);
      const serializedReview = this.serializeReviewForDb(review);

      console.log('Serialized review:', serializedReview);

      const { data, error } = await supabase
        .from('reviews')
        .insert(serializedReview)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Review added successfully:', data);
    } catch (error) {
      console.error('Error adding review to Supabase, falling back to AsyncStorage:', error);
      // Save to AsyncStorage as fallback
      const existing = await this.getAsyncStorageData<Review>(this.k('reviews'));
      await this.setAsyncStorageData(this.k('reviews'), [...existing, review]);

      // Queue for sync when online
      try {
        await offlineSync.queueOperation('create', 'reviews', review);
      } catch (syncError) {
        console.error('Error queueing for sync:', syncError);
      }
    }
  };

  updateReview = async (review: Review): Promise<void> => {
    if (!this.useSupabase) {
      console.log('Using AsyncStorage for reviews update');
      const reviews = await this.getReviews();
      const index = reviews.findIndex(r => r.id === review.id);
      if (index !== -1) {
        reviews[index] = review;
        return this.saveReviews(reviews);
      }
      return;
    }

    try {
      const uid = this.requireUserId();
      console.log('Updating review in Supabase:', review.id);
      const serializedReview = this.serializeReviewForDb(review);

      console.log('Serialized review for update:', serializedReview);

      const { data, error } = await supabase
        .from('reviews')
        .update(serializedReview)
        .eq('id', review.id)
        .eq('user_id', uid)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Review updated successfully:', data);
    } catch (error) {
      console.error('Error updating review in Supabase, falling back to AsyncStorage:', error);
      const reviews = await this.getReviews();
      const index = reviews.findIndex(r => r.id === review.id);
      if (index !== -1) {
        reviews[index] = review;
        return this.saveReviews(reviews);
      }
    }
  };

  deleteReview = async (id: string): Promise<void> => {
    if (!this.useSupabase) {
      const reviews = await this.getReviews();
      const filtered = reviews.filter(r => r.id !== id);
      return this.saveReviews(filtered);
    }

    try {
      const uid = this.requireUserId();
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id)
        .eq('user_id', uid);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting review:', error);
      const reviews = await this.getReviews();
      const filtered = reviews.filter(r => r.id !== id);
      return this.saveReviews(filtered);
    }
  };

  private parseProfileStringArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.filter((x) => typeof x === 'string');
    if (typeof value === 'string') {
      try {
        const p = JSON.parse(value);
        return Array.isArray(p) ? p.filter((x: unknown) => typeof x === 'string') : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private profileFromRow(row: Record<string, any>): Profile {
    return {
      id: row.user_id ?? row.id ?? '',
      name: row.name ?? '',
      bio: row.bio ?? '',
      likes: this.parseProfileStringArray(row.likes),
      principles: this.parseProfileStringArray(row.principles),
      strengths: this.parseProfileStringArray(row.strengths),
      weaknesses: this.parseProfileStringArray(row.weaknesses),
      goals: this.parseProfileStringArray(row.goals),
      interests: this.parseProfileStringArray(row.interests),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private profileToSupabaseRow(profile: Profile, userId: string): Record<string, unknown> {
    return {
      user_id: userId,
      name: profile.name ?? '',
      bio: profile.bio ?? '',
      likes: profile.likes ?? [],
      principles: profile.principles ?? [],
      strengths: profile.strengths ?? [],
      weaknesses: profile.weaknesses ?? [],
      goals: profile.goals ?? [],
      interests: profile.interests ?? [],
      created_at: profile.createdAt.toISOString(),
      updated_at: profile.updatedAt.toISOString(),
    };
  }

  /** My Profile: device-only AsyncStorage when cloud off; `profiles` table when Supabase is on. */
  getProfile = async (): Promise<Profile | null> => {
    if (!this.useSupabase) {
      try {
        const raw = await AsyncStorage.getItem(this.k('profile'));
        if (!raw) return null;
        const d = JSON.parse(raw);
        return {
          ...d,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
        };
      } catch (e) {
        console.error('getProfile AsyncStorage:', e);
        return null;
      }
    }

    try {
      const uid = this.requireUserId();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      if (error) throw error;
      if (data) return this.profileFromRow(data);

      const raw = await AsyncStorage.getItem(this.k('profile'));
      if (raw) {
        const d = JSON.parse(raw);
        const local: Profile = {
          ...d,
          id: uid,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
        };
        try {
          const row = this.profileToSupabaseRow(local, uid);
          await supabase.from('profiles').upsert(row, { onConflict: 'user_id' });
        } catch (e) {
          console.warn('Profile cloud sync skipped:', e);
        }
        return local;
      }
      return null;
    } catch (error) {
      console.error('Error getting profile from Supabase:', error);
      try {
        const raw = await AsyncStorage.getItem(this.k('profile'));
        if (!raw) return null;
        const d = JSON.parse(raw);
        return {
          ...d,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
        };
      } catch {
        return null;
      }
    }
  };

  saveProfile = async (profile: Profile): Promise<void> => {
    if (!this.useSupabase) {
      await AsyncStorage.setItem(this.k('profile'), JSON.stringify(profile));
      return;
    }

    try {
      const uid = this.requireUserId();
      const row = this.profileToSupabaseRow(
        {
          ...profile,
          id: uid,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        },
        uid
      );

      const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'user_id' });
      if (error) throw error;
    } catch (error) {
      console.error('Error saving profile to Supabase:', error);
      try {
        const uid = getActiveUserId();
        if (uid) {
          await AsyncStorage.setItem(
            this.k('profile'),
            JSON.stringify({ ...profile, id: uid })
          );
        }
      } catch {
        /* ignore */
      }
      throw error;
    }
  };

  async close(): Promise<void> {
    // Supabase doesn't need explicit closing
  }
}

export const supabaseDatabase = new SupabaseDatabase();
