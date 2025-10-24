import * as SQLite from 'expo-sqlite';
import { readFileSync } from 'fs';
import { join } from 'path';

const DB_NAME = 'lifeos.db';

class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const schema = `
      -- Habits table
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
        target_value REAL NOT NULL,
        unit TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Habit entries table
      CREATE TABLE IF NOT EXISTS habit_entries (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL,
        date DATE NOT NULL,
        value REAL NOT NULL DEFAULT 0,
        notes TEXT,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
      );

      -- Journal entries table
      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        mood TEXT NOT NULL CHECK (mood IN ('very-happy', 'happy', 'neutral', 'sad', 'very-sad')),
        tags TEXT, -- JSON array of tags
        date DATE NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Transactions table
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        category TEXT NOT NULL,
        subcategory TEXT,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        date DATE NOT NULL,
        account TEXT,
        tags TEXT, -- JSON array of tags
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Investments table
      CREATE TABLE IF NOT EXISTS investments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('stock', 'bond', 'crypto', 'mutual-fund', 'etf', 'real-estate', 'other')),
        symbol TEXT,
        quantity REAL NOT NULL,
        average_price REAL NOT NULL,
        current_price REAL,
        total_value REAL,
        purchase_date DATE NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Budgets table
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        spent REAL NOT NULL DEFAULT 0,
        period TEXT NOT NULL CHECK (period IN ('monthly', 'weekly', 'yearly')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Accounts table
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'cash', 'other')),
        balance REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_habit_entries_habit_id ON habit_entries(habit_id);
      CREATE INDEX IF NOT EXISTS idx_habit_entries_date ON habit_entries(date);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
      CREATE INDEX IF NOT EXISTS idx_investments_type ON investments(type);
      CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
      CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);
    `;

    await this.db.execAsync(schema);
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export const database = new Database();
