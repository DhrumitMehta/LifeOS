import { Account, Transaction } from '../types';

export function accountAliases(name: string): string[] {
  if (name === 'Airtel Money') return ['Airtel Money', 'Mobile'];
  if (name === 'NMB Virtual Card') return ['NMB Virtual Card', 'NMB Virtual'];
  return [name];
}

export function accountDisplayName(name: string): string {
  if (name === 'Cash') return 'Cash Balance';
  if (name === 'NMB Virtual Card') return 'NMB Virtual';
  return name;
}

export function computedBalanceForAccount(account: Account, transactions: Transaction[]): number {
  const names = new Set(accountAliases(account.name));
  const txs = transactions
    .filter((t) => (t.account ? names.has(t.account) : false))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  let balance = account.balance;
  for (const t of txs) {
    if (t.type === 'income') balance += t.amount;
    else balance -= t.amount;
  }
  return balance;
}

export function netTransactionDeltaForAccountName(accountName: string, transactions: Transaction[]): number {
  const aliases = new Set(accountAliases(accountName));
  return transactions.reduce((sum, t) => {
    if (!t.account || !aliases.has(t.account)) return sum;
    return sum + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);
}

export function pickDefaultAccountName(accounts: Account[]): string {
  const active = accounts.filter((a) => a.isActive).map((a) => a.name);
  if (active.includes('Cash')) return 'Cash';
  return active[0] ?? 'Cash';
}

/** Distinct accent colors for account cards (stable per account id). */
const ACCOUNT_CARD_PALETTE = [
  '#9333ea',
  '#ef4444',
  '#3b82f6',
  '#1e40af',
  '#0891b2',
  '#c026d3',
  '#ea580c',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#db2777',
  '#0d9488',
];

export function accountCardColor(accountId: string): string {
  let h = 2166136261;
  for (let i = 0; i < accountId.length; i++) {
    h ^= accountId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const idx = Math.abs(h) % ACCOUNT_CARD_PALETTE.length;
  return ACCOUNT_CARD_PALETTE[idx];
}

export function formatFinanceAmount(amount: number, currency: string = 'TZS'): string {
  if (currency === 'TZS') {
    if (Math.abs(amount) >= 1_000_000) {
      const millions = amount / 1_000_000;
      return `TSh ${millions.toFixed(2)}M`;
    }
    const n = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `TSh ${n}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/**
 * Pretty label for expense categories in the UI (e.g. "food&drink" → "Food&Drink").
 * Does not change stored values — only for display.
 */
export function formatExpenseCategoryLabel(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  return s
    .split('&')
    .map((segment) =>
      segment
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => {
          const lower = word.toLowerCase();
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(' ')
    )
    .join('&');
}
