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
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Transaction, Investment, Budget, RootStackParamList } from '../types';

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
  const { state, deleteTransaction, deleteInvestment, deleteBudget, refreshData } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [transactionLimit, setTransactionLimit] = useState(50);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [financialGoals, setFinancialGoals] = useState<string[]>([
    'Be independent - not take a single penny from my parents',
    'Save for future while still enjoying the present',
  ]);
  const [editingGoals, setEditingGoals] = useState<string[]>([]);

  const GOALS_STORAGE_KEY = 'lifeos_financial_goals';

  useEffect(() => {
    loadGoals();
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
      .filter(t => t.account === 'Mobile')
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
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
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
          <Card style={[styles.summaryCard, { backgroundColor: '#9333ea' }]}>
            <Card.Content>
              <Title style={styles.summaryTitle}>Cash Balance</Title>
              <Text style={styles.summaryAmount}>{formatCurrency(getCashBalance())}</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, { backgroundColor: '#ef4444' }]}>
            <Card.Content>
              <Title style={styles.summaryTitle}>Airtel Money</Title>
              <Text style={styles.summaryAmount}>{formatCurrency(getMobileBalance())}</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Row 2: NMB Main and NMB Virtual */}
        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, { backgroundColor: '#3b82f6' }]}>
            <Card.Content>
              <Title style={styles.summaryTitle}>NMB Main A/C</Title>
              <Text style={styles.summaryAmount}>{formatCurrency(getNMBMainBalance())}</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, { backgroundColor: '#1e40af' }]}>
            <Card.Content>
              <Title style={styles.summaryTitle}>NMB Virtual</Title>
              <Text style={styles.summaryAmount}>{formatCurrency(getNMBVirtualCardBalance())}</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Row 3: Selcom and placeholder */}
        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, { backgroundColor: '#1f2937' }]}>
            <Card.Content>
              <Title style={styles.summaryTitle}>Selcom</Title>
              <Text style={styles.summaryAmount}>{formatCurrency(getSelcomBalance())}</Text>
            </Card.Content>
          </Card>

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
                description={`${transaction.category} • ${transaction.date.toLocaleDateString()}`}
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
                    {transaction.date.toLocaleDateString()}
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

  const renderInvestments = () => (
    <ScrollView 
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {state.investments.length > 0 ? (
        state.investments.map((investment) => (
          <Card key={investment.id} style={styles.investmentCard}>
            <Card.Content>
              <View style={styles.investmentHeader}>
                <View style={styles.investmentInfo}>
                  <Title style={styles.investmentName}>{investment.name}</Title>
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
                <Text style={styles.investmentQuantity}>
                  {investment.quantity} shares @ {formatCurrency(investment.averagePrice)}
                </Text>
                <Text style={styles.investmentDate}>
                  Purchased: {investment.purchaseDate.toLocaleDateString()}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))
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
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'transactions' && renderTransactions()}
      {activeTab === 'investments' && renderInvestments()}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={
          activeTab === 'overview' ? handleAddTransaction :
          activeTab === 'transactions' ? handleAddTransaction :
          handleAddInvestment
        }
        label={
          activeTab === 'overview' ? 'Add Transaction' :
          activeTab === 'transactions' ? 'Add Transaction' :
          'Add Investment'
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
  investmentQuantity: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  investmentDate: {
    fontSize: 12,
    color: '#9ca3af',
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
});

export default FinanceScreen;
