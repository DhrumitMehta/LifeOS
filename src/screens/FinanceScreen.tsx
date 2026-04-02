import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  FAB,
  Text,
  IconButton,
  List,
  TextInput,
  Button,
  Chip,
  Searchbar,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Transaction, Investment, Budget, Subscription, RootStackParamList } from '../types';
import { formatDate } from '../utils/dateFormat';
import { scopedStorageKey } from '../services/userSession';
import {
  accountCardColor,
  accountDisplayName,
  computedBalanceForAccount,
  formatFinanceAmount,
  formatExpenseCategoryLabel,
  pickDefaultAccountName,
} from '../utils/financeAccounts';
import { daysLeftInPeriod, remainingBudget, spentForBudget } from '../utils/budgetAnalytics';

type FinanceScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

type FinanceTabValue =
  | 'overview'
  | 'budgets'
  | 'transactions'
  | 'investments'
  | 'subscriptions';

const FINANCE_TAB_ROWS: ReadonlyArray<
  ReadonlyArray<{ value: FinanceTabValue; label: string; accessibilityLabel: string }>
> = [
  [
    { value: 'overview', label: 'Dashboard', accessibilityLabel: 'Dashboard' },
    { value: 'budgets', label: 'Budgets', accessibilityLabel: 'Budgets' },
    { value: 'transactions', label: 'Transactions', accessibilityLabel: 'Transactions' },
  ],
  [
    { value: 'investments', label: 'Investments', accessibilityLabel: 'Investments' },
    { value: 'subscriptions', label: 'Subscriptions', accessibilityLabel: 'Subscriptions' },
  ],
];

const FinanceScreen = () => {
  const navigation = useNavigation<FinanceScreenNavigationProp>();
  const {
    state,
    deleteTransaction,
    deleteInvestment,
    deleteBudget,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    refreshData,
    processDueSubscriptions,
  } = useApp();
  const [activeTab, setActiveTab] = useState<FinanceTabValue>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [transactionLimit, setTransactionLimit] = useState(50);
  const [expandedHistories, setExpandedHistories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [financialGoals, setFinancialGoals] = useState<string[]>([
    'Be independent - not take a single penny from my parents',
    'Save for future while still enjoying the present',
  ]);
  const [editingGoals, setEditingGoals] = useState<string[]>([]);
  const [showAccountTransactions, setShowAccountTransactions] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [subscriptionForm, setSubscriptionForm] = useState({
    name: '',
    amount: '',
    recurringDate: '1',
    account: 'Cash',
  });
  const [loansSectionExpanded, setLoansSectionExpanded] = useState(false);

  const goalsStorageKey = () => scopedStorageKey('financial_goals');

  useEffect(() => {
    loadGoals();
    // Process due subscriptions when Finance screen is opened
    processDueSubscriptions();
  }, []);

  const loadGoals = async () => {
    try {
      const stored = await AsyncStorage.getItem(goalsStorageKey());
      if (stored) {
        const goals = JSON.parse(stored);
        if (Array.isArray(goals) && goals.length > 0) {
          setFinancialGoals(goals);
        }
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const saveGoals = async (goals: string[]) => {
    try {
      await AsyncStorage.setItem(goalsStorageKey(), JSON.stringify(goals));
      setFinancialGoals(goals);
      setIsEditingGoals(false);
    } catch (error) {
      console.error('Error saving goals:', error);
      Alert.alert('Error', 'Failed to save goals');
    }
  };

  const handleStartEditing = () => {
    setEditingGoals([...financialGoals]);
    setIsEditingGoals(true);
  };

  const handleCancelEditing = () => {
    setIsEditingGoals(false);
    setEditingGoals([]);
  };

  const handleSaveGoals = () => {
    const filteredGoals = editingGoals.filter(goal => goal.trim().length > 0);
    if (filteredGoals.length === 0) {
      Alert.alert('Error', 'Please enter at least one goal');
      return;
    }
    saveGoals(filteredGoals);
  };

  const handleGoalChange = (index: number, value: string) => {
    const updated = [...editingGoals];
    updated[index] = value;
    setEditingGoals(updated);
  };

  const handleAddGoal = () => {
    setEditingGoals([...editingGoals, '']);
  };

  const handleRemoveGoal = (index: number) => {
    if (editingGoals.length > 1) {
      const updated = editingGoals.filter((_, i) => i !== index);
      setEditingGoals(updated);
    } else {
      Alert.alert('Error', 'You must have at least one goal');
    }
  };

  const handleAddTransaction = () => {
    navigation.navigate('TransactionDetail', {});
  };

  const handleAddInvestment = () => {
    navigation.navigate('InvestmentDetail', {});
  };

  const handleAddSubscription = () => {
    setEditingSubscription(null);
    setSubscriptionForm({
      name: '',
      amount: '',
      recurringDate: '1',
      account: pickDefaultAccountName(state.accounts),
    });
    setShowSubscriptionModal(true);
  };

  const handleAddBudget = () => {
    navigation.navigate('BudgetDetail', {});
  };

  const renderBudgets = () => (
    <ScrollView
      style={styles.scrollView}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Card style={styles.budgetsCard}>
        <Card.Content>
          <View style={styles.budgetsHeaderRow}>
            <Title>Budgets</Title>
            <Button mode="contained" onPress={handleAddBudget} style={styles.addBudgetButton}>
              Add Budget
            </Button>
          </View>
          {getActiveBudgets().length > 0 ? (
            getActiveBudgets().map((budget) => renderBudgetRow(budget))
          ) : (
            <View style={styles.emptyBudgetsContainer}>
              <Ionicons name="pie-chart-outline" size={56} color="#9ca3af" />
              <Title style={styles.emptyTitle}>No Budgets Yet</Title>
              <Paragraph style={styles.emptyDescription}>
                Create a budget per category to track spend vs your cap.
              </Paragraph>
              <Button mode="contained" onPress={handleAddBudget} style={styles.addBudgetButtonEmpty}>
                Create your first budget
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'TZS') =>
    formatFinanceAmount(amount, currency);

  const activeAccounts = useMemo(
    () => state.accounts.filter((a) => a.isActive).sort((a, b) => a.name.localeCompare(b.name)),
    [state.accounts]
  );

  const totalsCurrency = useMemo(() => {
    const nonInvestment = activeAccounts.filter((a) => a.type !== 'investment');
    return nonInvestment[0]?.currency ?? 'TZS';
  }, [activeAccounts]);

  const liquidTotal = useMemo(() => {
    // Avoid mixing currencies: sum accounts matching `totalsCurrency`.
    return activeAccounts
      .filter((a) => a.type !== 'investment' && a.currency === totalsCurrency)
      .reduce((sum, a) => sum + computedBalanceForAccount(a, state.transactions), 0);
  }, [activeAccounts, totalsCurrency, state.transactions]);

  const getTotalIncome = () => {
    return state.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpenses = () => {
    return state.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalInvestments = () => {
    return state.investments
      .filter(i => i.totalValue)
      .reduce((sum, i) => sum + (i.totalValue || 0), 0);
  };

  // Legacy hard-coded account balance helpers removed; balances come from `state.accounts`.

  const getRecentTransactions = () => {
    return state.transactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  };

  const getActiveBudgets = () => {
    return state.budgets.filter(b => b.isActive);
  };

  const renderBudgetRow = (budget: Budget) => {
    const spent = spentForBudget(budget, state.transactions);
    const pctCap = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const remaining = remainingBudget(spent, budget.amount);
    const daysLeft = daysLeftInPeriod(budget.period);
    const barPct = Math.min(pctCap, 100);
    const barColor =
      pctCap >= 100 ? '#ef4444' : pctCap >= 80 ? '#f59e0b' : '#10b981';
    const title = (budget.name || '').trim() || 'Budget';
    const categoryLabel = formatExpenseCategoryLabel(budget.category ?? '');

    return (
      <TouchableOpacity
        key={budget.id}
        style={styles.budgetItem}
        onPress={() => navigation.navigate('BudgetDetail', { budgetId: budget.id })}
        activeOpacity={0.7}
      >
        <View style={styles.budgetInfo}>
          <Text style={styles.budgetName} numberOfLines={2}>
            {title}
          </Text>
          {categoryLabel ? (
            <Text style={styles.budgetCategory} numberOfLines={1}>
              {categoryLabel}
            </Text>
          ) : null}
          <Text style={styles.budgetAmount} numberOfLines={1}>
            {formatCurrency(spent)} / {formatCurrency(budget.amount)}
          </Text>
          <Text style={styles.budgetSubline} numberOfLines={2}>
            {remaining >= 0
              ? `${formatCurrency(remaining)} left before cap · ${daysLeft} day${
                  daysLeft === 1 ? '' : 's'
                } left in period`
              : `${formatCurrency(Math.abs(remaining))} over cap`}
          </Text>
        </View>
        <View style={styles.budgetProgress}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${barPct}%`,
                  backgroundColor: barColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.budgetPercentage, { color: barColor }]}>
            {Math.round(Math.min(pctCap, 999))}%
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const loanAnalytics = useMemo(() => {
    const loanTx = state.transactions.filter(
      (t) => (t.category || '').trim().toLowerCase() === 'loan'
    );
    const loansOut = loanTx
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const loansIn = loanTx
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const netBalance = loansIn - loansOut;

    const byDesc = new Map<
      string,
      {
        description: string;
        inAmount: number;
        outAmount: number;
        lastDate: Date;
        lastId: string;
      }
    >();
    for (const t of loanTx) {
      const key = (t.description || '').trim() || 'Untitled';
      const cur = byDesc.get(key) || {
        description: key,
        inAmount: 0,
        outAmount: 0,
        lastDate: new Date(0),
        lastId: t.id,
      };
      if (t.type === 'income') cur.inAmount += t.amount;
      else cur.outAmount += t.amount;
      if (t.date.getTime() >= cur.lastDate.getTime()) {
        cur.lastDate = t.date;
        cur.lastId = t.id;
      }
      byDesc.set(key, cur);
    }
    const loanLines = Array.from(byDesc.values()).sort(
      (a, b) => b.lastDate.getTime() - a.lastDate.getTime()
    );

    return { loansOut, loansIn, netBalance, loanLines };
  }, [state.transactions]);

  const getAccountTransactions = (accountName: string): Transaction[] => {
    return state.transactions
      .filter((t) => {
        if (!t.account) return false;
        if (t.account === accountName) return true;
        if (accountName === 'Airtel Money' && t.account === 'Mobile') return true;
        if (accountName === 'NMB Virtual Card' && t.account === 'NMB Virtual') return true;
        return false;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
  };

  const handleAccountPress = (accountName: string) => {
    setSelectedAccount(accountName);
    setShowAccountTransactions(true);
  };

  const renderOverview = () => (
    <ScrollView 
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card style={[styles.goalsCard, { backgroundColor: '#10b981' }]}>
        <Card.Content style={styles.goalsCardContent}>
          <View style={styles.goalsHeader}>
            <View style={styles.goalsHeaderLeft}>
              <Ionicons name="flag" size={18} color="#fff" />
              <Title style={styles.goalsTitle}>Current Financial Goals</Title>
            </View>
            {!isEditingGoals ? (
              <IconButton
                icon="pencil"
                size={18}
                iconColor="#fff"
                onPress={handleStartEditing}
                style={styles.editButton}
              />
            ) : (
              <View style={styles.editActions}>
                <IconButton
                  icon="check"
                  size={18}
                  iconColor="#fff"
                  onPress={handleSaveGoals}
                  style={styles.editButton}
                />
                <IconButton
                  icon="close"
                  size={18}
                  iconColor="#fff"
                  onPress={handleCancelEditing}
                  style={styles.editButton}
                />
              </View>
            )}
          </View>
          {isEditingGoals ? (
            <View style={styles.goalsList}>
              {editingGoals.map((goal, index) => (
                <View key={index} style={styles.goalEditItem}>
                  <TextInput
                    value={goal}
                    onChangeText={(text) => handleGoalChange(index, text)}
                    style={styles.goalInput}
                    mode="flat"
                    dense
                    placeholder={`Goal ${index + 1}`}
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    underlineColor="rgba(255, 255, 255, 0.3)"
                    activeUnderlineColor="#fff"
                    textColor="#fff"
                    contentStyle={styles.goalInputContent}
                  />
                  {editingGoals.length > 1 && (
                    <IconButton
                      icon="close-circle"
                      size={18}
                      iconColor="#fff"
                      onPress={() => handleRemoveGoal(index)}
                      style={styles.removeGoalButton}
                    />
                  )}
                </View>
              ))}
              <Button
                mode="text"
                onPress={handleAddGoal}
                textColor="#fff"
                icon="plus"
                style={styles.addGoalButton}
                labelStyle={styles.addGoalButtonLabel}
              >
                Add Goal
              </Button>
            </View>
          ) : (
            <View style={styles.goalsList}>
              {financialGoals.map((goal, index) => (
                <View key={index} style={styles.goalItem}>
                  <Ionicons name="alert-circle" size={16} color="#fff" />
                  <Text style={styles.goalText}>{goal}</Text>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      <Text style={styles.financeSettingsHint}>
        Manage accounts (add, remove, currency) in Settings → Finance accounts.
      </Text>

      <View>
        {Array.from({ length: Math.ceil(activeAccounts.length / 2) }).map((_, rowIdx) => {
          const pair = activeAccounts.slice(rowIdx * 2, rowIdx * 2 + 2);
          return (
            <View key={`acc-${rowIdx}`} style={styles.summaryRow}>
              {pair.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.summaryCard}
                  onPress={() => handleAccountPress(a.name)}
                >
                  <Card style={[styles.summaryCardInner, { backgroundColor: accountCardColor(a.id) }]}>
                    <Card.Content>
                      <Title style={styles.summaryTitle} numberOfLines={2}>
                        {accountDisplayName(a.name)}
                      </Title>
                      <Text style={styles.summaryAmount}>
                        {formatCurrency(computedBalanceForAccount(a, state.transactions), a.currency)}
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
              {pair.length === 1 ? <View style={styles.summaryCard} /> : null}
            </View>
          );
        })}

        <View style={styles.summaryRow}>
          <Card style={[styles.liquidCashCard, { flex: 1, backgroundColor: '#1f2937' }]}>
            <Card.Content>
              <View style={styles.liquidCashHeader}>
                <Title style={styles.summaryTitle}>Liquid Cash</Title>
                <Text style={styles.totalLabel}>{totalsCurrency}</Text>
              </View>
              <Text style={styles.summaryAmount}>{formatCurrency(liquidTotal, totalsCurrency)}</Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      <Card style={styles.loanCard}>
        <Card.Content>
          <TouchableOpacity
            style={[
              styles.loanCardHeaderTouchable,
              loansSectionExpanded && styles.loanCardHeaderTouchableExpanded,
            ]}
            onPress={() => setLoansSectionExpanded((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={styles.loanCardHeader}>
              <Ionicons name="git-compare-outline" size={22} color="#b45309" />
              <View style={styles.loanCardHeaderText}>
                <Title style={styles.loanCardTitle}>Loans (category)</Title>
                {!loansSectionExpanded && (
                  <Text style={styles.loanCollapsedHint}>
                    {loanAnalytics.loanLines.length > 0
                      ? `${loanAnalytics.loanLines.length} description${loanAnalytics.loanLines.length === 1 ? '' : 's'} · tap to expand`
                      : 'Tap to expand'}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.loanHeaderRight}>
              <Text
                style={[
                  styles.loanCollapsedNet,
                  {
                    color:
                      loanAnalytics.netBalance > 0
                        ? '#059669'
                        : loanAnalytics.netBalance < 0
                          ? '#dc2626'
                          : '#6b7280',
                  },
                ]}
              >
                {loanAnalytics.netBalance > 0 ? '+' : ''}
                {formatCurrency(loanAnalytics.netBalance)}
              </Text>
              <Ionicons
                name={loansSectionExpanded ? 'chevron-up' : 'chevron-down'}
                size={22}
                color="#b45309"
              />
            </View>
          </TouchableOpacity>

          {loansSectionExpanded && (
            <>
              <Paragraph style={styles.loanCardSubtitle}>
                Totals from transactions with category Loan: out = expenses, in = income. Net = in − out.
              </Paragraph>

              <View style={styles.loanSummaryRow}>
                <View style={styles.loanSummaryHalf}>
                  <Text style={styles.loanStatLabel}>Loans out</Text>
                  <Text style={styles.loanStatValue}>{formatCurrency(loanAnalytics.loansOut)}</Text>
                </View>
                <View style={styles.loanSummaryHalf}>
                  <Text style={styles.loanStatLabel}>Loans in</Text>
                  <Text style={styles.loanStatValue}>{formatCurrency(loanAnalytics.loansIn)}</Text>
                </View>
              </View>

              <View style={styles.loanNetRow}>
                <Text style={styles.loanNetLabel}>Current loan balance (net)</Text>
                <Text
                  style={[
                    styles.loanNetAmount,
                    {
                      color:
                        loanAnalytics.netBalance > 0
                          ? '#059669'
                          : loanAnalytics.netBalance < 0
                            ? '#dc2626'
                            : '#6b7280',
                    },
                  ]}
                >
                  {loanAnalytics.netBalance > 0 ? '+' : ''}
                  {formatCurrency(loanAnalytics.netBalance)}
                </Text>
              </View>

              <Title style={styles.loanListTitle}>Loans by description</Title>
              {loanAnalytics.loanLines.length > 0 ? (
                loanAnalytics.loanLines.map((line) => {
                  const lineNet = line.inAmount - line.outAmount;
                  return (
                    <List.Item
                      key={line.description}
                      title={line.description}
                      description={`In ${formatCurrency(line.inAmount)} · Out ${formatCurrency(line.outAmount)} · ${formatDate(line.lastDate)}`}
                      titleNumberOfLines={2}
                      onPress={() =>
                        navigation.navigate('TransactionDetail', { transactionId: line.lastId })
                      }
                      right={() => (
                        <Text
                          style={[
                            styles.loanLineNet,
                            {
                              color: lineNet > 0 ? '#059669' : lineNet < 0 ? '#dc2626' : '#6b7280',
                            },
                          ]}
                        >
                          {lineNet > 0 ? '+' : ''}
                          {formatCurrency(lineNet)}
                        </Text>
                      )}
                      style={styles.loanListItem}
                    />
                  );
                })
              ) : (
                <Text style={styles.emptyText}>
                  No loan transactions yet. Record them with category Loan (income or expense).
                </Text>
              )}
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.recentCard}>
        <Card.Content>
          <Title>Recent Transactions</Title>
          {getRecentTransactions().length > 0 ? (
            getRecentTransactions().map((transaction) => (
              <List.Item
                key={transaction.id}
                title={transaction.description}
                description={`${transaction.category} • ${formatDate(transaction.date)}`}
                right={() => (
                  <Text style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'income' ? '#10b981' : '#ef4444' }
                  ]}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </Text>
                )}
                onPress={() => navigation.navigate('TransactionDetail', { transactionId: transaction.id })}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No transactions yet</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.budgetsCard}>
        <Card.Content>
          <Title>Active Budgets</Title>
          {getActiveBudgets().length > 0 ? (
            getActiveBudgets().map((budget) => renderBudgetRow(budget))
          ) : (
            <Text style={styles.emptyText}>No active budgets</Text>
          )}
        </Card.Content>
      </Card>

      {/* Account Transactions Modal */}
      <Modal
        visible={showAccountTransactions}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAccountTransactions(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Title style={styles.modalTitle}>{selectedAccount} - Last 10 Transactions</Title>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setShowAccountTransactions(false)}
            />
          </View>

          <ScrollView style={styles.modalContent}>
            {getAccountTransactions(selectedAccount).length > 0 ? (
              getAccountTransactions(selectedAccount).map((transaction) => (
                <Card key={transaction.id} style={styles.transactionCard}>
                  <Card.Content>
                    <View style={styles.modalTransactionRow}>
                      <View style={styles.modalTransactionInfo}>
                        <Text style={styles.transactionDescription}>{transaction.description}</Text>
                        <Text style={styles.modalTransactionCategory}>{transaction.category}</Text>
                        <Text style={styles.modalTransactionDate}>{formatDate(transaction.date)}</Text>
                      </View>
                      <View style={styles.transactionAmountContainer}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount,
                          ]}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="wallet-outline" size={64} color="#9ca3af" />
                <Title style={styles.emptyTitle}>No Transactions</Title>
                <Paragraph style={styles.emptyDescription}>
                  No transactions found for this account.
                </Paragraph>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );

  const handleLoadMore = () => {
    setTransactionLimit(prev => prev + 50);
  };

  // Filter transactions based on search query - must be at component level
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) {
      return state.transactions;
    }

    const query = searchQuery.toLowerCase().trim();
    return state.transactions.filter(transaction => {
      // Search in description
      if (transaction.description.toLowerCase().includes(query)) {
        return true;
      }
      // Search in category
      if (transaction.category.toLowerCase().includes(query)) {
        return true;
      }
      // Search in subcategory
      if (transaction.subcategory?.toLowerCase().includes(query)) {
        return true;
      }
      // Search in account
      if (transaction.account?.toLowerCase().includes(query)) {
        return true;
      }
      // Search in tags
      if (transaction.tags.some(tag => tag.toLowerCase().includes(query))) {
        return true;
      }
      // Search in amount (convert to string and search)
      if (transaction.amount.toString().includes(query)) {
        return true;
      }
      // Search in formatted currency (remove currency symbols)
      const formattedAmount = formatCurrency(transaction.amount).toLowerCase();
      if (formattedAmount.includes(query)) {
        return true;
      }
      return false;
    });
  }, [state.transactions, searchQuery]);

  const renderTransactions = () => {

    const displayedTransactions = filteredTransactions.slice(0, transactionLimit);
    const hasMore = filteredTransactions.length > transactionLimit;

    return (
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search Bar */}
        <Card style={styles.searchCard}>
          <Card.Content>
            <Searchbar
              placeholder="Search transactions..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
              inputStyle={styles.searchbarInput}
              iconColor="#6366f1"
              clearIcon="close-circle"
              onClearIconPress={() => setSearchQuery('')}
            />
            {searchQuery.trim() && (
              <Text style={styles.searchResultsText}>
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
              </Text>
            )}
          </Card.Content>
        </Card>

        {filteredTransactions.length > 0 ? (
          <>
            {displayedTransactions.map((transaction) => (
              <Card key={transaction.id} style={styles.transactionCard}>
                <Card.Content>
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionInfo}>
                      <Title style={styles.transactionTitle}>{transaction.description}</Title>
                      <Paragraph style={styles.transactionCategory}>{transaction.category}</Paragraph>
                    </View>
                    <View style={styles.transactionActions}>
                      <Text style={[
                        styles.transactionAmount,
                        { color: transaction.type === 'income' ? '#10b981' : '#ef4444' }
                      ]}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </Text>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => navigation.navigate('TransactionDetail', { transactionId: transaction.id })}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => {
                          Alert.alert(
                            'Delete Transaction',
                            `Are you sure you want to delete "${transaction.description}"?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => deleteTransaction(transaction.id)
                              },
                            ]
                          );
                        }}
                        iconColor="#ef4444"
                      />
                    </View>
                  </View>
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.date)}
                  </Text>
                </Card.Content>
              </Card>
            ))}
            {hasMore && (
              <Card style={styles.loadMoreCard}>
                <Card.Content>
                  <TouchableOpacity onPress={handleLoadMore} style={styles.loadMoreButton}>
                    <Text style={styles.loadMoreText}>
                      Load More ({filteredTransactions.length - transactionLimit} remaining)
                    </Text>
                  </TouchableOpacity>
                </Card.Content>
              </Card>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#9ca3af" />
            <Title style={styles.emptyTitle}>
              {searchQuery.trim() ? 'No Transactions Found' : 'No Transactions'}
            </Title>
            <Paragraph style={styles.emptyDescription}>
              {searchQuery.trim() 
                ? `No transactions match "${searchQuery}". Try a different search term.`
                : 'Start tracking your income and expenses!'
              }
            </Paragraph>
            {searchQuery.trim() && (
              <Button
                mode="outlined"
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchButton}
              >
                Clear Search
              </Button>
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  const getInvestmentTransactions = (investment: Investment) => {
    return state.transactions
      .filter(t => {
        if (t.category !== 'Investment') return false;
        
        // Match by investment name
        if (t.description.includes(investment.name) || t.subcategory === investment.name) {
          return true;
        }
        
        // For mutual funds, also match by fund name
        if (investment.type === 'mutual-fund' && investment.fundName) {
          if (t.description.includes(investment.fundName) || t.subcategory === investment.fundName) {
            return true;
          }
        }
        
        return false;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const renderInvestments = () => {
    // Investment labels and goals mapping
    const investmentConfig: { [key: string]: { label: string; goal: number } } = {
      'iTrust iGrowth Fund': { label: 'Emergency Fund', goal: 12000000 },
      'UTT Umoja Fund': { label: 'Health Fund', goal: 10000000 },
      'Quiver 15% Fund': { label: 'Future Expenses Fund', goal: 15000000 },
    };
    
    // Sort investments in the specified order
    const investmentOrder = ['iTrust iGrowth Fund', 'UTT Umoja Fund', 'Quiver 15% Fund'];
    const sortedInvestments = [...state.investments].sort((a, b) => {
      const indexA = investmentOrder.indexOf(a.name);
      const indexB = investmentOrder.indexOf(b.name);
      // If not found in order, put at the end
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    
    // Calculate totals across all investments
    const totals = state.investments.reduce((acc, investment) => {
      const investmentTransactions = getInvestmentTransactions(investment);
      const amountInvested = investmentTransactions.reduce((sum, t) => sum + t.amount, 0) || investment.amountPurchased || 0;
      const currentValue = investment.totalValue || 0;
      
      acc.totalInvested += amountInvested;
      acc.currentValue += currentValue;
      
      return acc;
    }, { totalInvested: 0, currentValue: 0 });
    
    const interestMade = totals.currentValue - totals.totalInvested;
    
    return (
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {state.investments.length > 0 ? (
          <>
            {/* Summary Headers */}
            <Card style={styles.investmentSummaryCard}>
              <Card.Content>
                <View style={styles.investmentSummaryRow}>
                  <Text style={styles.investmentSummaryLabel}>TOTAL INVESTED:</Text>
                  <Text style={styles.investmentSummaryValue}>{formatCurrency(totals.totalInvested)}</Text>
                </View>
                <View style={styles.investmentSummaryRow}>
                  <Text style={styles.investmentSummaryLabel}>CURRENT VALUE:</Text>
                  <Text style={styles.investmentSummaryValue}>{formatCurrency(totals.currentValue)}</Text>
                </View>
                <View style={styles.investmentSummaryRow}>
                  <Text style={styles.investmentSummaryLabel}>INTEREST MADE:</Text>
                  <Text style={[
                    styles.investmentSummaryValue,
                    interestMade >= 0 ? styles.profitText : styles.lossText
                  ]}>
                    {interestMade >= 0 ? '+' : ''}{formatCurrency(interestMade)}
                  </Text>
                </View>
              </Card.Content>
            </Card>
            
            {sortedInvestments.map((investment) => {
              const config = investmentConfig[investment.name] || { label: investment.name, goal: 0 };
              const currentValue = investment.totalValue || 0;
              const progress = config.goal > 0 ? Math.min((currentValue / config.goal) * 100, 100) : 0;
            const investmentTransactions = getInvestmentTransactions(investment);
            // Sort transactions by date ascending for first/last calculation
            const sortedTransactions = [...investmentTransactions].sort((a, b) => a.date.getTime() - b.date.getTime());
            const firstInvestmentDate = sortedTransactions.length > 0 ? sortedTransactions[0].date : investment.purchaseDate;
            const latestInvestmentDate = sortedTransactions.length > 0 ? sortedTransactions[sortedTransactions.length - 1].date : investment.purchaseDate;
            return (
            <Card key={investment.id} style={styles.investmentCard}>
              <Card.Content>
                <View style={styles.investmentHeader}>
                  <View style={styles.investmentInfo}>
                    <Title style={styles.investmentName}>{investment.name}</Title>
                    <Paragraph style={styles.investmentLabel}>{config.label}</Paragraph>
                    <Paragraph style={styles.investmentType}>{investment.type}</Paragraph>
                  </View>
                  <View style={styles.investmentActions}>
                    <Text style={styles.investmentValue}>
                      {formatCurrency(investment.totalValue || 0)}
                    </Text>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => navigation.navigate('InvestmentDetail', { investmentId: investment.id })}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => {
                        Alert.alert(
                          'Delete Investment',
                          `Are you sure you want to delete "${investment.name}"?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => deleteInvestment(investment.id)
                            },
                          ]
                        );
                      }}
                      iconColor="#ef4444"
                    />
                  </View>
                </View>
                <View style={styles.investmentDetails}>
                  {/* Calculate amount invested and profit/loss */}
                  {(() => {
                    const amountInvested = investmentTransactions.reduce((sum, t) => sum + t.amount, 0) || investment.amountPurchased || 0;
                    const currentValue = investment.totalValue || 0;
                    const profitLoss = currentValue - amountInvested;
                    const profitLossPercent = amountInvested > 0 ? ((profitLoss / amountInvested) * 100) : 0;
                    
                    return (
                      <>
                        <Text style={styles.investmentAmountInvested}>
                          Amount Invested: {formatCurrency(amountInvested)}
                        </Text>
                        <Text style={styles.investmentQuantity}>
                          {investment.quantity.toFixed(4)} units @ {formatCurrency(investment.averagePrice)}
                        </Text>
                        <Text style={[
                          styles.investmentProfitLoss,
                          profitLoss >= 0 ? styles.profitText : styles.lossText
                        ]}>
                          {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)} ({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                        </Text>
                        {investmentTransactions.length > 0 ? (
                          <>
                            <Text style={styles.investmentDate}>
                              First Investment: {formatDate(firstInvestmentDate)}
                            </Text>
                            <Text style={styles.investmentDate}>
                              Latest Investment: {formatDate(latestInvestmentDate)}
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.investmentDate}>
                            First Investment: {formatDate(investment.purchaseDate)}
                          </Text>
                        )}
                      </>
                    );
                  })()}
                </View>
                
                {/* Progress Bar */}
                {config.goal > 0 && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Goal: {formatCurrency(config.goal)}</Text>
                      <Text style={styles.progressPercentage}>{progress.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                      {formatCurrency(currentValue)} / {formatCurrency(config.goal)}
                    </Text>
                  </View>
                )}
                
                <View style={styles.investmentTransactions}>
                  <View style={styles.transactionsHeader}>
                    <Text style={styles.transactionsTitle}>Investment History</Text>
                    <IconButton
                      icon={expandedHistories.has(investment.id) ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      onPress={() => {
                        const newExpanded = new Set(expandedHistories);
                        if (newExpanded.has(investment.id)) {
                          newExpanded.delete(investment.id);
                        } else {
                          newExpanded.add(investment.id);
                        }
                        setExpandedHistories(newExpanded);
                      }}
                    />
                  </View>
                  {expandedHistories.has(investment.id) && (
                    <>
                      {investmentTransactions.length > 0 ? (
                        investmentTransactions.map((transaction) => (
                          <View key={transaction.id} style={styles.investmentHistoryRow}>
                            <View style={styles.investmentHistoryInfo}>
                              <Text style={styles.investmentHistoryDate}>
                                {formatDate(transaction.date)}
                              </Text>
                              {transaction.account && (
                                <Text style={styles.investmentHistoryAccount}>
                                  {transaction.account}
                                </Text>
                              )}
                            </View>
                            <Text style={styles.investmentHistoryAmount}>
                              {formatCurrency(transaction.amount)}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.emptyTransactionText}>
                          No investment transactions recorded yet. Transactions will appear here when you add new investments.
                        </Text>
                      )}
                    </>
                  )}
                </View>
              </Card.Content>
            </Card>
          );
        })}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="trending-up-outline" size={64} color="#9ca3af" />
          <Title style={styles.emptyTitle}>No Investments</Title>
          <Paragraph style={styles.emptyDescription}>
            Start tracking your investment portfolio!
          </Paragraph>
        </View>
      )}
      </ScrollView>
    );
  };

  const renderSubscriptions = () => {
    const accounts = ['Cash', 'NMB Main A/C', 'Selcom', 'NMB Virtual Card', 'Airtel Money', 'Inv'];
    const activeSubscriptions = state.subscriptions.filter(sub => sub.isActive);
    const inactiveSubscriptions = state.subscriptions.filter(sub => !sub.isActive);

    return (
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeSubscriptions.length > 0 || inactiveSubscriptions.length > 0 ? (
          <>
            {activeSubscriptions.length > 0 && (
              <Card style={styles.card}>
                <Card.Content>
                  <Title style={styles.cardTitle}>Active Subscriptions</Title>
                  {activeSubscriptions.map((subscription) => (
                    <Card key={subscription.id} style={styles.subscriptionCard}>
                      <Card.Content>
                        <View style={styles.subscriptionHeader}>
                          <View style={styles.subscriptionInfo}>
                            <Text style={styles.subscriptionName}>{subscription.name}</Text>
                            <Text style={styles.subscriptionDetails}>
                              {formatCurrency(subscription.amount)} • Day {subscription.recurringDate} • {subscription.account}
                            </Text>
                          </View>
                          <View style={styles.subscriptionActions}>
                            <IconButton
                              icon="pencil"
                              size={20}
                              onPress={() => {
                                setEditingSubscription(subscription);
                                setSubscriptionForm({
                                  name: subscription.name,
                                  amount: subscription.amount.toString(),
                                  recurringDate: subscription.recurringDate.toString(),
                                  account: subscription.account,
                                });
                                setShowSubscriptionModal(true);
                              }}
                            />
                            <IconButton
                              icon="delete"
                              size={20}
                              iconColor="#ef4444"
                              onPress={() => {
                                Alert.alert(
                                  'Delete Subscription',
                                  `Are you sure you want to delete "${subscription.name}"?`,
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                      text: 'Delete',
                                      style: 'destructive',
                                      onPress: async () => {
                                        try {
                                          await deleteSubscription(subscription.id);
                                          Alert.alert('Success', 'Subscription deleted successfully');
                                        } catch (error) {
                                          Alert.alert('Error', 'Failed to delete subscription');
                                        }
                                      },
                                    },
                                  ]
                                );
                              }}
                            />
                          </View>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}
                </Card.Content>
              </Card>
            )}

            {inactiveSubscriptions.length > 0 && (
              <Card style={styles.card}>
                <Card.Content>
                  <Title style={styles.cardTitle}>Inactive Subscriptions</Title>
                  {inactiveSubscriptions.map((subscription) => (
                    <Card key={subscription.id} style={[styles.subscriptionCard, styles.inactiveCard]}>
                      <Card.Content>
                        <View style={styles.subscriptionHeader}>
                          <View style={styles.subscriptionInfo}>
                            <Text style={[styles.subscriptionName, styles.inactiveText]}>{subscription.name}</Text>
                            <Text style={[styles.subscriptionDetails, styles.inactiveText]}>
                              {formatCurrency(subscription.amount)} • Day {subscription.recurringDate} • {subscription.account}
                            </Text>
                          </View>
                          <View style={styles.subscriptionActions}>
                            <IconButton
                              icon="pencil"
                              size={20}
                              onPress={() => {
                                setEditingSubscription(subscription);
                                setSubscriptionForm({
                                  name: subscription.name,
                                  amount: subscription.amount.toString(),
                                  recurringDate: subscription.recurringDate.toString(),
                                  account: subscription.account,
                                });
                                setShowSubscriptionModal(true);
                              }}
                            />
                            <IconButton
                              icon="delete"
                              size={20}
                              iconColor="#ef4444"
                              onPress={() => {
                                Alert.alert(
                                  'Delete Subscription',
                                  `Are you sure you want to delete "${subscription.name}"?`,
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                      text: 'Delete',
                                      style: 'destructive',
                                      onPress: async () => {
                                        try {
                                          await deleteSubscription(subscription.id);
                                          Alert.alert('Success', 'Subscription deleted successfully');
                                        } catch (error) {
                                          Alert.alert('Error', 'Failed to delete subscription');
                                        }
                                      },
                                    },
                                  ]
                                );
                              }}
                            />
                          </View>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}
                </Card.Content>
              </Card>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={64} color="#9ca3af" />
            <Title style={styles.emptyTitle}>No Subscriptions</Title>
            <Paragraph style={styles.emptyDescription}>
              Start tracking your recurring subscriptions!
            </Paragraph>
          </View>
        )}

        {/* Subscription Modal */}
        <Modal
          visible={showSubscriptionModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => {
            setShowSubscriptionModal(false);
            setEditingSubscription(null);
            setSubscriptionForm({ name: '', amount: '', recurringDate: '1', account: 'Cash' });
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Title style={styles.modalTitle}>
                {editingSubscription ? 'Edit Subscription' : 'Add Subscription'}
              </Title>
              <IconButton
                icon="close"
                size={24}
                onPress={() => {
                  setShowSubscriptionModal(false);
                  setEditingSubscription(null);
                  setSubscriptionForm({ name: '', amount: '', recurringDate: '1', account: 'Cash' });
                }}
              />
            </View>

            <ScrollView style={styles.modalContent}>
              <Card style={styles.formCard}>
                <Card.Content>
                  <TextInput
                    label="Subscription Name"
                    value={subscriptionForm.name}
                    onChangeText={(text) => setSubscriptionForm({ ...subscriptionForm, name: text })}
                    mode="outlined"
                    style={styles.input}
                    placeholder="e.g., Netflix, Spotify"
                  />

                  <TextInput
                    label="Amount (TZS)"
                    value={subscriptionForm.amount}
                    onChangeText={(text) => setSubscriptionForm({ ...subscriptionForm, amount: text })}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                    placeholder="0"
                  />

                  <TextInput
                    label="Recurring Date (Day of Month)"
                    value={subscriptionForm.recurringDate}
                    onChangeText={(text) => {
                      const num = parseInt(text);
                      if (!isNaN(num) && num >= 1 && num <= 31) {
                        setSubscriptionForm({ ...subscriptionForm, recurringDate: text });
                      } else if (text === '') {
                        setSubscriptionForm({ ...subscriptionForm, recurringDate: '' });
                      }
                    }}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                    placeholder="1-31"
                  />

                  <Text style={styles.label}>Account</Text>
                  <View style={styles.accountChips}>
                    {accounts.map((account) => (
                      <Chip
                        key={account}
                        selected={subscriptionForm.account === account}
                        onPress={() => setSubscriptionForm({ ...subscriptionForm, account })}
                        style={styles.accountChip}
                        selectedColor="#6366f1"
                      >
                        {account}
                      </Chip>
                    ))}
                  </View>

                  <View style={styles.formButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setShowSubscriptionModal(false);
                        setEditingSubscription(null);
                        setSubscriptionForm({ name: '', amount: '', recurringDate: '1', account: 'Cash' });
                      }}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={async () => {
                        if (!subscriptionForm.name.trim() || !subscriptionForm.amount || !subscriptionForm.recurringDate) {
                          Alert.alert('Error', 'Please fill in all fields');
                          return;
                        }

                        const amount = parseFloat(subscriptionForm.amount);
                        const recurringDate = parseInt(subscriptionForm.recurringDate);

                        if (isNaN(amount) || amount <= 0) {
                          Alert.alert('Error', 'Please enter a valid amount');
                          return;
                        }

                        if (isNaN(recurringDate) || recurringDate < 1 || recurringDate > 31) {
                          Alert.alert('Error', 'Recurring date must be between 1 and 31');
                          return;
                        }

                        try {
                          if (editingSubscription) {
                            await updateSubscription({
                              ...editingSubscription,
                              name: subscriptionForm.name.trim(),
                              amount,
                              recurringDate,
                              account: subscriptionForm.account,
                            });
                            Alert.alert('Success', 'Subscription updated successfully');
                          } else {
                            await addSubscription({
                              name: subscriptionForm.name.trim(),
                              amount,
                              recurringDate,
                              account: subscriptionForm.account,
                              isActive: true,
                            });
                            Alert.alert('Success', 'Subscription added successfully');
                          }
                          setShowSubscriptionModal(false);
                          setEditingSubscription(null);
                          setSubscriptionForm({ name: '', amount: '', recurringDate: '1', account: 'Cash' });
                        } catch (error) {
                          Alert.alert('Error', 'Failed to save subscription');
                        }
                      }}
                      style={styles.saveButton}
                    >
                      {editingSubscription ? 'Update' : 'Add'}
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <View style={styles.financeTabGrid} accessibilityRole="tablist">
          {FINANCE_TAB_ROWS.map((row, rowIndex) => (
            <View
              key={`tab-row-${rowIndex}`}
              style={[
                styles.financeTabRow,
                rowIndex < FINANCE_TAB_ROWS.length - 1 && styles.financeTabRowSpacing,
              ]}
            >
              {row.map((tab) => {
                const selected = activeTab === tab.value;
                return (
                  <TouchableOpacity
                    key={tab.value}
                    style={[styles.financeTabButton, selected && styles.financeTabButtonSelected]}
                    onPress={() => setActiveTab(tab.value)}
                    activeOpacity={0.7}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    accessibilityLabel={tab.accessibilityLabel}
                  >
                    <Text
                      style={[styles.financeTabLabel, selected && styles.financeTabLabelSelected]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'budgets' && renderBudgets()}
      {activeTab === 'transactions' && renderTransactions()}
      {activeTab === 'investments' && renderInvestments()}
      {activeTab === 'subscriptions' && renderSubscriptions()}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={
          activeTab === 'overview' ? handleAddTransaction :
          activeTab === 'budgets' ? handleAddBudget :
          activeTab === 'transactions' ? handleAddTransaction :
          activeTab === 'investments' ? handleAddInvestment :
          handleAddSubscription
        }
        label={
          activeTab === 'overview' ? 'Add Transaction' :
          activeTab === 'budgets' ? 'Add Budget' :
          activeTab === 'transactions' ? 'Add Transaction' :
          activeTab === 'investments' ? 'Add Investment' :
          'Add Subscription'
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  financeTabGrid: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  financeTabRow: {
    flexDirection: 'row',
    gap: 4,
  },
  financeTabRowSpacing: {
    marginBottom: 4,
  },
  financeTabButton: {
    flex: 1,
    minHeight: 32,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  financeTabButtonSelected: {
    backgroundColor: '#6366f1',
  },
  financeTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 16,
  },
  financeTabLabelSelected: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  financeSettingsHint: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 12,
    marginTop: -4,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
  },
  summaryCardInner: {
    borderRadius: 12,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryAmount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  recentCard: {
    marginBottom: 16,
  },
  loanCard: {
    marginBottom: 16,
    backgroundColor: '#fffbeb',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  loanCardHeaderTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 0,
    paddingVertical: 2,
  },
  loanCardHeaderTouchableExpanded: {
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  loanCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  loanCardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  loanHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  loanCollapsedNet: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  loanCollapsedHint: {
    fontSize: 11,
    color: '#78716c',
    marginTop: 2,
  },
  loanCardTitle: {
    fontSize: 18,
    marginBottom: 0,
    color: '#92400e',
  },
  loanCardSubtitle: {
    fontSize: 12,
    color: '#78716c',
    marginBottom: 14,
    lineHeight: 18,
  },
  loanSummaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  loanSummaryHalf: {
    flex: 1,
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  loanStatLabel: {
    fontSize: 12,
    color: '#9a3412',
    fontWeight: '600',
    marginBottom: 4,
  },
  loanStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#431407',
  },
  loanNetRow: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  loanNetLabel: {
    fontSize: 13,
    color: '#78350f',
    fontWeight: '600',
    marginBottom: 6,
  },
  loanNetAmount: {
    fontSize: 22,
    fontWeight: '800',
  },
  loanListTitle: {
    fontSize: 16,
    marginBottom: 4,
    color: '#1f2937',
  },
  loanListItem: {
    paddingLeft: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 8,
    marginBottom: 6,
  },
  loanLineNet: {
    fontSize: 15,
    fontWeight: '700',
    alignSelf: 'center',
    marginRight: 4,
  },
  budgetsCard: {
    marginBottom: 16,
  },
  budgetsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  addBudgetButton: {
    backgroundColor: '#6366f1',
  },
  emptyBudgetsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  addBudgetButtonEmpty: {
    marginTop: 12,
    backgroundColor: '#6366f1',
  },
  goalsCard: {
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  goalsCardContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  goalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  goalsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  editButton: {
    margin: 0,
    padding: 0,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalsList: {
    marginTop: 2,
  },
  goalItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 8,
  },
  goalText: {
    fontSize: 13,
    color: '#fff',
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  goalEditItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  goalInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    fontSize: 13,
  },
  goalInputContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 36,
  },
  removeGoalButton: {
    margin: 0,
    padding: 0,
  },
  addGoalButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  addGoalButtonLabel: {
    fontSize: 12,
    color: '#fff',
  },
  budgetItem: {
    marginBottom: 12,
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  budgetInfo: {
    width: '100%',
  },
  budgetName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  budgetCategory: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 4,
    fontWeight: '600',
  },
  budgetAmount: {
    fontSize: 13,
    color: '#475569',
    marginTop: 6,
    fontWeight: '500',
  },
  budgetSubline: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 16,
  },
  budgetProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    width: '100%',
  },
  progressBar: {
    flex: 1,
    flexGrow: 1,
    minWidth: 0,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetPercentage: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 44,
    textAlign: 'right',
    color: '#0f172a',
  },
  transactionCard: {
    marginBottom: 12,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  investmentSummaryCard: {
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  investmentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  investmentSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  investmentSummaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  investmentCard: {
    marginBottom: 12,
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  investmentInfo: {
    flex: 1,
  },
  investmentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  investmentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
    marginTop: 2,
    marginBottom: 2,
  },
  investmentType: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  investmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  investmentValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginRight: 8,
  },
  investmentDetails: {
    marginTop: 8,
  },
  investmentAmountInvested: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  investmentQuantity: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  investmentProfitLoss: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  profitText: {
    color: '#10b981',
  },
  lossText: {
    color: '#ef4444',
  },
  investmentDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  investmentTransactions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  investmentHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    marginBottom: 6,
  },
  investmentHistoryInfo: {
    flex: 1,
  },
  investmentHistoryDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  investmentHistoryAccount: {
    fontSize: 11,
    color: '#6b7280',
  },
  investmentHistoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  emptyTransactionText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#6b7280',
  },
  emptyDescription: {
    textAlign: 'center',
    color: '#9ca3af',
    marginBottom: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  loadMoreCard: {
    marginTop: 12,
    marginBottom: 12,
  },
  loadMoreButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366f1',
  },
  liquidCashCard: {
    borderWidth: 3,
    borderColor: '#fbbf24',
    elevation: 8,
  },
  liquidCashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fbbf24',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#6366f1',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  searchCard: {
    marginBottom: 12,
    elevation: 2,
  },
  searchbar: {
    backgroundColor: '#ffffff',
    elevation: 0,
  },
  searchbarInput: {
    fontSize: 14,
  },
  searchResultsText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 16,
    borderColor: '#6366f1',
  },
  modalTransactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTransactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  modalTransactionCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  modalTransactionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  incomeAmount: {
    color: '#10b981',
  },
  expenseAmount: {
    color: '#ef4444',
  },
  subscriptionCard: {
    marginBottom: 12,
    elevation: 2,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  subscriptionDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  subscriptionActions: {
    flexDirection: 'row',
  },
  inactiveCard: {
    opacity: 0.6,
  },
  inactiveText: {
    color: '#9ca3af',
  },
  formCard: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  accountChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  accountChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  cancelButton: {
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#6366f1',
  },
});

export default FinanceScreen;
