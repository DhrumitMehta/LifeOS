import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  ProgressBar,
  Chip,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const { state } = useApp();
  const { analytics } = state;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getNetWorthColor = (netWorth: number) => {
    if (netWorth > 0) return '#10b981';
    if (netWorth < 0) return '#ef4444';
    return '#6b7280';
  };

  const getHabitStreakColor = (streak: number) => {
    if (streak >= 30) return '#10b981';
    if (streak >= 7) return '#3b82f6';
    if (streak >= 3) return '#f59e0b';
    return '#6b7280';
  };

  if (state.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading analytics...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={64} color="#9ca3af" />
        <Title style={styles.emptyTitle}>No Data Available</Title>
        <Paragraph style={styles.emptyDescription}>
          Start adding habits and transactions to see your analytics!
        </Paragraph>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Financial Overview */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Financial Overview</Title>
          <View style={styles.financialGrid}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Total Income</Text>
              <Text style={[styles.financialAmount, { color: '#10b981' }]}>
                {formatCurrency(analytics.totalIncome)}
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Total Expenses</Text>
              <Text style={[styles.financialAmount, { color: '#ef4444' }]}>
                {formatCurrency(analytics.totalExpenses)}
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Net Worth</Text>
              <Text style={[
                styles.financialAmount, 
                { color: getNetWorthColor(analytics.netWorth) }
              ]}>
                {formatCurrency(analytics.netWorth)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Monthly Trend */}
      {analytics.monthlyTrend.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Monthly Trend</Title>
            <View style={styles.monthlyTrend}>
              {analytics.monthlyTrend.slice(-6).map((month, index) => {
                const total = month.income + month.expenses;
                const incomePercentage = total > 0 ? (month.income / total) * 100 : 0;
                const expensePercentage = total > 0 ? (month.expenses / total) * 100 : 0;
                
                return (
                  <View key={index} style={styles.monthItem}>
                    <Text style={styles.monthLabel}>{month.month}</Text>
                    <View style={styles.monthBar}>
                      <View 
                        style={[
                          styles.monthBarIncome, 
                          { width: `${incomePercentage}%` }
                        ]} 
                      />
                      <View 
                        style={[
                          styles.monthBarExpense, 
                          { width: `${expensePercentage}%` }
                        ]} 
                      />
                    </View>
                    <View style={styles.monthAmounts}>
                      <Text style={styles.monthIncome}>
                        +{formatCurrency(month.income)}
                      </Text>
                      <Text style={styles.monthExpense}>
                        -{formatCurrency(month.expenses)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Top Categories */}
      {analytics.topCategories.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Top Expense Categories</Title>
            {analytics.topCategories.map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.category}</Text>
                  <Text style={styles.categoryAmount}>
                    {formatCurrency(category.amount)}
                  </Text>
                </View>
                <View style={styles.categoryProgress}>
                  <ProgressBar
                    progress={category.percentage / 100}
                    color="#ef4444"
                    style={styles.categoryProgressBar}
                  />
                  <Text style={styles.categoryPercentage}>
                    {Math.round(category.percentage)}%
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Habit Streaks */}
      {analytics.habitStreaks.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Habit Streaks</Title>
            {analytics.habitStreaks.map((habit, index) => (
              <View key={index} style={styles.habitItem}>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{habit.habitName}</Text>
                  <Text style={styles.habitStreakText}>
                    {habit.currentStreak} day streak
                  </Text>
                </View>
                <View style={styles.habitStreak}>
                  <Chip
                    style={[
                      styles.streakChip,
                      { backgroundColor: getHabitStreakColor(habit.currentStreak) + '20' }
                    ]}
                    textStyle={{ 
                      color: getHabitStreakColor(habit.currentStreak),
                      fontWeight: 'bold'
                    }}
                  >
                    {habit.currentStreak}
                  </Chip>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Insights */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Insights</Title>
          <View style={styles.insightsContainer}>
            {analytics.netWorth > 0 && (
              <View style={styles.insightItem}>
                <Ionicons name="trending-up" size={24} color="#10b981" />
                <Text style={styles.insightText}>
                  Great job! You have a positive net worth of {formatCurrency(analytics.netWorth)}.
                </Text>
              </View>
            )}
            
            {analytics.totalExpenses > analytics.totalIncome && (
              <View style={styles.insightItem}>
                <Ionicons name="warning" size={24} color="#f59e0b" />
                <Text style={styles.insightText}>
                  You're spending more than you're earning. Consider reviewing your expenses.
                </Text>
              </View>
            )}

            {analytics.habitStreaks.some(h => h.currentStreak >= 30) && (
              <View style={styles.insightItem}>
                <Ionicons name="trophy" size={24} color="#8b5cf6" />
                <Text style={styles.insightText}>
                  Amazing! You have habits with 30+ day streaks. Keep it up!
                </Text>
              </View>
            )}

            {analytics.habitStreaks.length === 0 && (
              <View style={styles.insightItem}>
                <Ionicons name="bulb" size={24} color="#6b7280" />
                <Text style={styles.insightText}>
                  Start tracking habits to build consistency and see your progress over time.
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  financialItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  financialLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  financialAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  monthlyTrend: {
    gap: 12,
  },
  monthItem: {
    marginBottom: 8,
  },
  monthLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  monthBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    flexDirection: 'row',
    marginBottom: 4,
  },
  monthBarIncome: {
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  monthBarExpense: {
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  monthAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthIncome: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  monthExpense: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  categoryItem: {
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryProgressBar: {
    flex: 1,
    height: 6,
  },
  categoryPercentage: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  habitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  habitStreakText: {
    fontSize: 12,
    color: '#6b7280',
  },
  habitStreak: {
    marginLeft: 12,
  },
  streakChip: {
    minWidth: 40,
  },
  insightsContainer: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
});

export default AnalyticsScreen;
