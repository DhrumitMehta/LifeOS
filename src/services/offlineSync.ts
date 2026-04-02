/**
 * Offline Sync Service
 * 
 * Handles queuing operations when offline and syncing them when connection is restored.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { Habit, HabitEntry, JournalEntry, Transaction, Investment, Budget, Account, Subscription } from '../types';
import { getActiveUserId, scopedStorageKey } from './userSession';

const SYNC_IN_PROGRESS_KEY = 'lifeos_sync_in_progress';

function offlineQueueStorageKey(): string {
  const id = getActiveUserId();
  if (!id) return 'lifeos_offline_queue';
  return scopedStorageKey('offline_queue');
}

interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

class OfflineSyncService {
  private syncInProgress: boolean = false;
  private networkListener: any = null;

  /**
   * Initialize the offline sync service
   */
  async init(): Promise<void> {
    // Try to sync pending operations on init
    await this.syncPendingOperations();
  }

  /**
   * Check if we're online by attempting a simple Supabase query
   */
  private async isOnline(): Promise<boolean> {
    try {
      const { error } = await supabase.from('habits').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Queue an operation for later sync
   */
  async queueOperation(
    type: 'create' | 'update' | 'delete',
    table: string,
    data: any
  ): Promise<void> {
    try {
      const queue = await this.getQueue();
      const operation: QueuedOperation = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        table,
        data,
        timestamp: Date.now(),
      };
      queue.push(operation);
      await AsyncStorage.setItem(offlineQueueStorageKey(), JSON.stringify(queue));
      console.log(`Queued ${type} operation for ${table}`);
    } catch (error) {
      console.error('Error queueing operation:', error);
    }
  }

  /**
   * Get the current queue of pending operations
   */
  private async getQueue(): Promise<QueuedOperation[]> {
    try {
      const queueData = await AsyncStorage.getItem(offlineQueueStorageKey());
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Error getting queue:', error);
      return [];
    }
  }

  /**
   * Clear the queue
   */
  private async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(offlineQueueStorageKey());
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  }

  /**
   * Serialize dates for Supabase
   */
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

  /**
   * Sync all pending operations to Supabase
   */
  async syncPendingOperations(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    const online = await this.isOnline();
    if (!online) {
      console.log('No internet connection, cannot sync');
      return;
    }

    this.syncInProgress = true;
    console.log('Starting offline sync...');

    try {
      const queue = await this.getQueue();
      if (queue.length === 0) {
        console.log('No pending operations to sync');
        this.syncInProgress = false;
        return;
      }

      console.log(`Syncing ${queue.length} pending operations...`);

      const successfulOps: string[] = [];
      const failedOps: QueuedOperation[] = [];

      for (const operation of queue) {
        try {
          await this.executeOperation(operation);
          successfulOps.push(operation.id);
          console.log(`Successfully synced operation ${operation.id} (${operation.type} ${operation.table})`);
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          failedOps.push(operation);
        }
      }

      // Remove successful operations from queue
      if (failedOps.length > 0) {
        await AsyncStorage.setItem(offlineQueueStorageKey(), JSON.stringify(failedOps));
        console.log(`${failedOps.length} operations failed and will be retried later`);
      } else {
        await this.clearQueue();
        console.log('All operations synced successfully!');
      }

      // Also sync any data that was saved to AsyncStorage while offline
      await this.syncAsyncStorageData();
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Execute a single queued operation
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    const uid = getActiveUserId();
    if (!uid) {
      throw new Error('No active user for offline sync');
    }

    const serializedData: Record<string, unknown> = {
      ...this.serializeDates(operation.data),
      user_id: uid,
    };

    switch (operation.type) {
      case 'create': {
        const { error: insertError } = await supabase
          .from(operation.table)
          .insert(serializedData);
        if (insertError) throw insertError;
        break;
      }

      case 'update': {
        const { error: updateError } = await supabase
          .from(operation.table)
          .update(serializedData)
          .eq('id', operation.data.id)
          .eq('user_id', uid);
        if (updateError) throw updateError;
        break;
      }

      case 'delete': {
        const { error: deleteError } = await supabase
          .from(operation.table)
          .delete()
          .eq('id', operation.data.id)
          .eq('user_id', uid);
        if (deleteError) throw deleteError;
        break;
      }
    }
  }

  /**
   * Sync data from AsyncStorage to Supabase
   * This handles cases where data was saved to AsyncStorage while offline
   */
  private async syncAsyncStorageData(): Promise<void> {
    if (!getActiveUserId()) return;

    const tables: { storageShort: string; tableName: string }[] = [
      { storageShort: 'habits', tableName: 'habits' },
      { storageShort: 'habit_entries', tableName: 'habit_entries' },
      { storageShort: 'journal_entries', tableName: 'journal_entries' },
      { storageShort: 'transactions', tableName: 'transactions' },
      { storageShort: 'investments', tableName: 'investments' },
      { storageShort: 'budgets', tableName: 'budgets' },
      { storageShort: 'accounts', tableName: 'accounts' },
      { storageShort: 'subscriptions', tableName: 'subscriptions' },
    ];

    for (const { storageShort, tableName } of tables) {
      const key = scopedStorageKey(storageShort);
      try {
        const data = await AsyncStorage.getItem(key);
        if (!data) continue;

        const items = JSON.parse(data);
        if (items.length === 0) continue;
        
        // Get existing data from Supabase to avoid duplicates
        const { data: existingData } = await supabase
          .from(tableName)
          .select('id');

        const existingIds = new Set((existingData || []).map((item: any) => item.id));
        
        // Filter out items that already exist
        const newItems = items.filter((item: any) => !existingIds.has(item.id));
        
        if (newItems.length > 0) {
          const uid = getActiveUserId();
          if (!uid) continue;
          const serializedItems = newItems.map((item: any) => ({
            ...this.serializeDates(item),
            user_id: uid,
          }));
          const { error } = await supabase
            .from(tableName)
            .insert(serializedItems);
          
          if (!error) {
            console.log(`Synced ${newItems.length} items from AsyncStorage for ${tableName}`);
            // Clear AsyncStorage after successful sync
            await AsyncStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error(`Error syncing AsyncStorage data for ${key}:`, error);
      }
    }
  }

  /**
   * Get the number of pending operations
   */
  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.networkListener) {
      this.networkListener();
      this.networkListener = null;
    }
  }
}

export const offlineSync = new OfflineSyncService();

