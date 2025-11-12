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
  SegmentedButtons,
  IconButton,
  List,
  TextInput,
  Button,
  Chip,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Transaction, Investment, Budget, Subscription, RootStackParamList } from '../types';
import { formatDate } from '../utils/dateFormat';

type FinanceScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

// Category selector component similar to the journal screen's view toggle
const CategorySelector = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory 
}: { 
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <View>
      <TouchableOpacity
        onPress={() => setShowMenu(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
          backgroundColor: '#f3f4f6',
          gap: 6,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#6366f1' }}>
          {selectedCategory || 'Select Category'}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#6366f1" />
      </TouchableOpacity>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              paddingVertical: 8,
              minWidth: 200,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
            }}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => {
                  onSelectCategory(category);
                  setShowMenu(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: category === selectedCategory ? '#f3f4f6' : 'transparent',
                }}
              >
                <Text style={{ color: category === selectedCategory ? '#6366f1' : '#374151', fontSize: 16 }}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const FinanceScreen = () => {
  const navigation = useNavigation<FinanceScreenNavigationProp>();
  const { state, deleteTransaction, deleteInvestment, deleteBudget, addSubscription, updateSubscription, deleteSubscription, refreshData, processDueSubscriptions } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [transactionLimit, setTransactionLimit] = useState(50);
  const [expandedHistories, setExpandedHistories] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('');
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

  const GOALS_STORAGE_KEY = 'lifeos_financial_goals';

  useEffect(() => {
    loadGoals();
    // Process due subscriptions when Finance screen is opened
    processDueSubscriptions();
  }, []);

  const loadGoals = async () => {
    try {
      const stored = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
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
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
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
    setSubscriptionForm({ name: '', amount: '', recurringDate: '1', account: 'Cash' });
    setShowSubscriptionModal(true);
  };

  const handleAddBudget = () => {
    navigation.navigate('BudgetDetail', {});
  };

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

  const formatCurrency = (amount: number) => {
    // If amount is >= 1 million, show in millions
    if (Math.abs(amount) >= 1000000) {
      const millions = amount / 1000000;
      return `TSh ${millions.toFixed(2)}M`;
    }
    // Otherwise show full number
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
    }).format(amount);
  };

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

  const getNetWorth = () => {
    // Total balance = sum of all account balances
    return getCashBalance() + getBankBalance() + getMobileBalance();
  };

  // Calculate balance for each account from transactions
  const getCashBalance = () => {
    const cashTransactions = state.transactions
      .filter(t => t.account === 'Cash')
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    let balance = 0;
    cashTransactions.forEach(t => {
      if (t.type === 'income') {
        balance += t.amount;
      } else {
        balance -= t.amount;
      }
    });

    return balance;
  };

  const getNMBMainBalance = () => {
    const nmbMainTransactions = state.transactions
      .filter(t => t.account === 'NMB Main A/C')
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    let balance = 340071; // Initial balance
    nmbMainTransactions.forEach(t => {
      if (t.type === 'income') {
        balance += t.amount;
      } else {
        balance -= t.amount;
      }
    });

    return balance;
  };

  const getSelcomBalance = () => {
    const selcomTransactions = state.transactions
      .filter(t => t.account === 'Selcom')
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    let balance = 4295.75; // Initial balance
    selcomTransactions.forEach(t => {
      if (t.type === 'income') {
        balance += t.amount;
      } else {
        balance -= t.amount;
      }
    });

    return balance;
  };

  const getNMBVirtualCardBalance = () => {
    const nmbVirtualTransactions = state.transactions
      .filter(t => t.account === 'NMB Virtual Card')
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    let balance = 113818.35; // Initial balance
    nmbVirtualTransactions.forEach(t => {
      if (t.type === 'income') {
        balance += t.amount;
      } else {
        balance -= t.amount;
      }
    });

    return balance;
  };

  const getBankBalance = () => {
    return getNMBMainBalance() + getSelcomBalance() + getNMBVirtualCardBalance();
  };

  const getMobileBalance = () => {
    const mobileTransactions = state.transactions
      .filter(t => t.account === 'Airtel Money' || t.account === 'Mobile')
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    let balance = 0;
    mobileTransactions.forEach(t => {
      if (t.type === 'income') {
        balance += t.amount;
      } else {
        balance -= t.amount;
      }
    });

    return balance;
  };

  const getRecentTransactions = () => {
    return state.transactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  };

  const getActiveBudgets = () => {
    return state.budgets.filter(b => b.isActive);
  };

  // Get all unique expense categories
  const getExpenseCategories = () => {
    const categories = state.transactions
      .filter(t => t.type === 'expense')
      .map(t => t.category);
    const uniqueCategories = [...new Set(categories)].sort();
    // Add "All" option at the beginning
    return ['All', ...uniqueCategories];
  };

  // Calculate expense for a category over a specific time period
  const getExpenseForPeriod = (category: string, monthsBack: number) => {
    if (!category) return 0;
    
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());
    
    return state.transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        if (t.date < startDate || t.date > now) return false;
        
        // Handle "All" category - exclude Money Transfers and Investments
        if (category === 'All') {
          return t.category !== 'Money Transfers' && t.category !== 'Investments';
        }
        
        // Handle specific category
        return t.category === category;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const expenseCategories = getExpenseCategories();

  // Auto-select "All" category if available
  React.useEffect(() => {
    if (!selectedCategory && expenseCategories.length > 0) {
      setSelectedCategory('All');
    }
  }, [expenseCategories.length]);

  const categoryTrendData = useMemo(() => {
    if (!selectedCategory) return null;

    const periods = [
      { label: 'Current Month', months: 1 },
      { label: 'Last 2 Months', months: 2 },
      { label: 'Last 3 Months', months: 3 },
      { label: 'Last 6 Months', months: 6 },
      { label: 'Last 9 Months', months: 9 },
      { label: 'Last Year', months: 12 },
      { label: 'Last 2 Years', months: 24 },
    ];

    return periods.map(period => {
      const totalAmount = getExpenseForPeriod(selectedCategory, period.months);
      const averagePerMonth = period.months > 1 ? totalAmount / period.months : totalAmount;
      
      return {
        ...period,
        amount: totalAmount,
        averagePerMonth,
        isMultiMonth: period.months > 1,
      };
    });
  }, [selectedCategory, state.transactions]);

  // Get last 10 transactions for an account
  const getAccountTransactions = (accountName: string): Transaction[] => {
    // Map display names to actual account names
    const accountMap: { [key: string]: string } = {
      'Cash Balance': 'Cash',
      'Airtel Money': 'Airtel Money',
      'NMB Main A/C': 'NMB Main A/C',
      'NMB Virtual': 'NMB Virtual Card',
      'Selcom': 'Selcom',
    };
    
    const actualAccountName = accountMap[accountName] || accountName;
    
    return state.transactions
      .filter(t => t.account === actualAccountName)
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

      <View>
        {/* Row 1: Cash and Airtel Money */}
        <View style={styles.summaryRow}>
          <TouchableOpacity onPress={() => handleAccountPress('Cash Balance')}>
            <Card style={[styles.summaryCard, { backgroundColor: '#9333ea' }]}>
              <Card.Content>
                <Title style={styles.summaryTitle}>Cash Balance</Title>
                <Text style={styles.summaryAmount}>{formatCurrency(getCashBalance())}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleAccountPress('Airtel Money')}>
            <Card style={[styles.summaryCard, { backgroundColor: '#ef4444' }]}>
              <Card.Content>
                <Title style={styles.summaryTitle}>Airtel Money</Title>
                <Text style={styles.summaryAmount}>{formatCurrency(getMobileBalance())}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Row 2: NMB Main and NMB Virtual */}
        <View style={styles.summaryRow}>
          <TouchableOpacity onPress={() => handleAccountPress('NMB Main A/C')}>
            <Card style={[styles.summaryCard, { backgroundColor: '#3b82f6' }]}>
              <Card.Content>
                <Title style={styles.summaryTitle}>NMB Main A/C</Title>
                <Text style={styles.summaryAmount}>{formatCurrency(getNMBMainBalance())}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleAccountPress('NMB Virtual')}>
            <Card style={[styles.summaryCard, { backgroundColor: '#1e40af' }]}>
              <Card.Content>
                <Title style={styles.summaryTitle}>NMB Virtual</Title>
                <Text style={styles.summaryAmount}>{formatCurrency(getNMBVirtualCardBalance())}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Row 3: Selcom and placeholder */}
        <View style={styles.summaryRow}>
          <TouchableOpacity onPress={() => handleAccountPress('Selcom')}>
            <Card style={[styles.summaryCard, { backgroundColor: '#1f2937' }]}>
              <Card.Content>
                <Title style={styles.summaryTitle}>Selcom</Title>
                <Text style={styles.summaryAmount}>{formatCurrency(getSelcomBalance())}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <Card style={[styles.summaryCard, { backgroundColor: '#9ca3af' }]}>
            <Card.Content>
              <Title style={styles.summaryTitle}>Future Account</Title>
              <Text style={styles.summaryAmount}>-</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Row 4: Liquid Cash */}
        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, styles.liquidCashCard, { backgroundColor: '#1f2937' }]}>
            <Card.Content>
              <View style={styles.liquidCashHeader}>
                <Title style={styles.summaryTitle}>Liquid Cash</Title>
                <Text style={styles.totalLabel}>Total</Text>
              </View>
              <Text style={styles.summaryAmount}>{formatCurrency(getNetWorth())}</Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      <Card style={styles.categoryTrendCard}>
        <Card.Content>
          <View style={styles.categoryTrendHeader}>
            <Title>Category Spending Trends</Title>
            <CategorySelector
              categories={expenseCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </View>
          
          {selectedCategory && categoryTrendData && (
            <View style={styles.trendList}>
              {categoryTrendData.map((data, index) => {
                const currentMonth = categoryTrendData[0]; // First item is current month
                const compareWithCurrent = data.isMultiMonth && currentMonth;
                const comparison = compareWithCurrent 
                  ? ((data.averagePerMonth - currentMonth.amount) / currentMonth.amount) * 100 
                  : 0;
                const isHigher = comparison > 5; // 5% threshold
                const isLower = comparison < -5;

                return (
                  <View key={index} style={styles.trendItem}>
                    <View style={styles.trendInfo}>
                      <Text style={styles.trendLabel}>{data.label}</Text>
                      {data.isMultiMonth ? (
                        <>
                          <Text style={styles.trendAmount}>
                            Avg: {formatCurrency(data.averagePerMonth)}/mo
                          </Text>
                          <Text style={styles.trendTotal}>
                            Total: {formatCurrency(data.amount)} ({data.months} months)
                          </Text>
                          {compareWithCurrent && (
                            <Text style={[
                              styles.trendComparison,
                              { color: isHigher ? '#ef4444' : isLower ? '#10b981' : '#6b7280' }
                            ]}>
                              {isHigher ? '↑' : isLower ? '↓' : '→'} 
                              {' '}{Math.abs(Math.round(comparison))}% vs current month
                            </Text>
                          )}
                        </>
                      ) : (
                        <Text style={styles.trendAmount}>
                          {formatCurrency(data.amount)}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {expenseCategories.length === 0 && (
            <Text style={styles.emptyText}>No expense transactions yet</Text>
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
            getActiveBudgets().map((budget) => {
              const spentPercentage = (budget.spent / budget.amount) * 100;
              return (
                <View key={budget.id} style={styles.budgetItem}>
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetName}>{budget.name}</Text>
                    <Text style={styles.budgetAmount}>
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </Text>
                  </View>
                  <View style={styles.budgetProgress}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${Math.min(spentPercentage, 100)}%`,
                            backgroundColor: spentPercentage > 100 ? '#ef4444' : '#10b981'
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.budgetPercentage}>
                      {Math.round(spentPercentage)}%
                    </Text>
                  </View>
                </View>
              );
            })
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
                    <View style={styles.transactionRow}>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionDescription}>{transaction.description}</Text>
                        <Text style={styles.transactionCategory}>{transaction.category}</Text>
                        <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
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

  const renderTransactions = () => {
    const displayedTransactions = state.transactions.slice(0, transactionLimit);
    const hasMore = state.transactions.length > transactionLimit;

    return (
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {state.transactions.length > 0 ? (
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
                      Load More ({state.transactions.length - transactionLimit} remaining)
                    </Text>
                  </TouchableOpacity>
                </Card.Content>
              </Card>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#9ca3af" />
            <Title style={styles.emptyTitle}>No Transactions</Title>
            <Paragraph style={styles.emptyDescription}>
              Start tracking your income and expenses!
            </Paragraph>
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
                          <View key={transaction.id} style={styles.transactionRow}>
                            <View style={styles.transactionInfo}>
                              <Text style={styles.transactionDate}>
                                {formatDate(transaction.date)}
                              </Text>
                              {transaction.account && (
                                <Text style={styles.transactionAccount}>
                                  {transaction.account}
                                </Text>
                              )}
                            </View>
                            <Text style={styles.transactionAmount}>
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
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'overview', label: 'Overview' },
            { value: 'transactions', label: 'Transactions' },
            { value: 'investments', label: 'Investments' },
            { value: 'subscriptions', label: 'Subscriptions' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'transactions' && renderTransactions()}
      {activeTab === 'investments' && renderInvestments()}
      {activeTab === 'subscriptions' && renderSubscriptions()}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={
          activeTab === 'overview' ? handleAddTransaction :
          activeTab === 'transactions' ? handleAddTransaction :
          activeTab === 'investments' ? handleAddInvestment :
          handleAddSubscription
        }
        label={
          activeTab === 'overview' ? 'Add Transaction' :
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
  segmentedButtons: {
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
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
  budgetsCard: {
    marginBottom: 16,
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
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  budgetName: {
    fontSize: 14,
    fontWeight: '600',
  },
  budgetAmount: {
    fontSize: 12,
    color: '#6b7280',
  },
  budgetProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetPercentage: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  transactionCard: {
    marginBottom: 12,
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
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    marginBottom: 6,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  transactionAccount: {
    fontSize: 11,
    color: '#6b7280',
  },
  transactionAmount: {
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
  categoryTrendCard: {
    marginBottom: 16,
  },
  categoryTrendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendList: {
    gap: 8,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  trendInfo: {
    flex: 1,
  },
  trendLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  trendAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  trendTotal: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  trendComparison: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
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
  transactionCard: {
    marginBottom: 12,
    elevation: 2,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
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
