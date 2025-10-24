import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  ProgressBar,
  Chip,
  Button,
  Menu,
  Divider,
  Dialog,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Habit } from '../types';

const { width } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const { state, refreshData } = useApp();
  const { analytics } = state;
  const [refreshing, setRefreshing] = useState(false);
  
  // Chart selection states
  const [selectedBooleanHabit, setSelectedBooleanHabit] = useState<Habit | null>(null);
  const [selectedNumericHabit, setSelectedNumericHabit] = useState<Habit | null>(null);
  const [selectedNumericHabit2, setSelectedNumericHabit2] = useState<Habit | null>(null);
  const [dateRange, setDateRange] = useState(7);
  const [showBooleanMenu, setShowBooleanMenu] = useState(false);
  const [showNumericMenu, setShowNumericMenu] = useState(false);
  const [showNumericMenu2, setShowNumericMenu2] = useState(false);

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

  // Get boolean habits
  const booleanHabits = state.habits.filter(habit => habit.isActive && habit.habitType === 'boolean');
  const numericHabits = state.habits.filter(habit => habit.isActive && habit.habitType === 'numeric');

  // Chart 1: Yes/No completion by day of week
  const getBooleanChartData = (habit: Habit) => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = daysOfWeek.map(day => ({ day, count: 0 }));
    
    state.habitEntries
      .filter(entry => entry.habitId === habit.id && entry.completed)
      .forEach(entry => {
        const dayIndex = entry.date.getDay();
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert Sunday=0 to Sunday=6
        data[adjustedIndex].count++;
      });
    
    return data;
  };

  // Chart 2: Numeric values over time
  const getNumericTimeChartData = (habit: Habit, days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    
    const data = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const entry = state.habitEntries.find(
        e => e.habitId === habit.id && 
        e.date.toDateString() === d.toDateString()
      );
      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: entry ? entry.value : 0
      });
    }
    
    return data;
  };

  // Chart 3: Numeric average by day of week
  const getNumericDayChartData = (habit: Habit) => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = daysOfWeek.map(day => ({ day, average: 0, count: 0 }));
    
    state.habitEntries
      .filter(entry => entry.habitId === habit.id)
      .forEach(entry => {
        const dayIndex = entry.date.getDay();
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        data[adjustedIndex].count++;
        data[adjustedIndex].average += entry.value;
      });
    
    // Calculate averages
    data.forEach(day => {
      if (day.count > 0) {
        day.average = day.average / day.count;
      }
    });
    
    return data;
  };

  // Chart rendering functions
  const renderBooleanChart = (habit: Habit) => {
    const data = getBooleanChartData(habit);
    const maxCount = Math.max(...data.map(d => d.count), 1);
    
    return (
      <View style={styles.barChart}>
        {data.map((item, index) => (
          <View key={index} style={styles.barChartItem}>
            <View style={styles.barChartBar}>
              <View 
                style={[
                  styles.barChartFill, 
                  { 
                    height: `${(item.count / maxCount) * 100}%`,
                    backgroundColor: habit.color
                  }
                ]} 
              />
            </View>
            <Text style={styles.barChartLabel}>{item.day}</Text>
            <Text style={styles.barChartValue}>{item.count}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderNumericTimeChart = (habit: Habit) => {
    const data = getNumericTimeChartData(habit, dateRange);
    const maxValue = Math.max(...data.map(d => d.value), habit.maxValue || 10);
    
    return (
      <View style={styles.numericTimeChart}>
        <View style={styles.numericTimeChartContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.numericTimeChartItem}>
              <View style={styles.numericTimeChartBar}>
                <View 
                  style={[
                    styles.numericTimeChartFill, 
                    { 
                      height: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: habit.color
                    }
                  ]} 
                />
              </View>
              <Text style={styles.numericTimeChartLabel}>{item.date}</Text>
              <Text style={styles.numericTimeChartValue}>{item.value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.numericTimeChartAxis}>
          <Text style={styles.axisLabel}>0</Text>
          <Text style={styles.axisLabel}>{maxValue}</Text>
        </View>
      </View>
    );
  };

  const renderLineChart = (habit: Habit) => {
    const data = getNumericTimeChartData(habit, dateRange);
    const maxValue = Math.max(...data.map(d => d.value), habit.maxValue || 10);
    
    return (
      <View style={styles.trueLineChart}>
        <View style={styles.lineChartSvg}>
          {/* Simple line chart using View components */}
          <View style={styles.lineChartPath}>
            {data.map((item, index) => {
              const nextItem = data[index + 1];
              const currentHeight = (item.value / maxValue) * 100;
              const nextHeight = nextItem ? (nextItem.value / maxValue) * 100 : currentHeight;
              
              return (
                <View key={index} style={styles.lineChartPointContainer}>
                  <View 
                    style={[
                      styles.lineChartPoint,
                      { 
                        backgroundColor: habit.color,
                        bottom: `${currentHeight}%`
                      }
                    ]} 
                  />
                  {nextItem && (
                    <View 
                      style={[
                        styles.lineChartLine,
                        { 
                          backgroundColor: habit.color,
                          height: Math.abs(nextHeight - currentHeight),
                          bottom: `${Math.min(currentHeight, nextHeight)}%`,
                          transform: [{ rotate: `${Math.atan2(nextHeight - currentHeight, 100)}rad` }]
                        }
                      ]} 
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.lineChartLabels}>
          {data.map((item, index) => (
            <Text key={index} style={styles.lineChartDateLabel}>{item.date}</Text>
          ))}
        </View>
        <View style={styles.lineChartAxis}>
          <Text style={styles.axisLabel}>0</Text>
          <Text style={styles.axisLabel}>{maxValue}</Text>
        </View>
      </View>
    );
  };

  const renderNumericDayChart = (habit: Habit) => {
    const data = getNumericDayChartData(habit);
    const maxAverage = Math.max(...data.map(d => d.average), 1);
    
    return (
      <View style={styles.barChart}>
        {data.map((item, index) => (
          <View key={index} style={styles.barChartItem}>
            <View style={styles.barChartBar}>
              <View 
                style={[
                  styles.barChartFill, 
                  { 
                    height: `${(item.average / maxAverage) * 100}%`,
                    backgroundColor: habit.color
                  }
                ]} 
              />
            </View>
            <Text style={styles.barChartLabel}>{item.day}</Text>
            <Text style={styles.barChartValue}>{item.average.toFixed(1)}</Text>
          </View>
        ))}
      </View>
    );
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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

      {/* Habit Analytics Charts */}
      
      {/* Chart 1: Boolean Habit Completion by Day of Week */}
      {booleanHabits.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.chartHeader}>
              <Title style={styles.cardTitle}>Yes/No Habit Completion</Title>
              <Menu
                visible={showBooleanMenu}
                onDismiss={() => setShowBooleanMenu(false)}
                anchor={
                  <Button 
                    mode="outlined" 
                    onPress={() => {
                      console.log('Boolean menu button pressed');
                      setShowBooleanMenu(true);
                    }}
                    style={styles.chartSelector}
                  >
                    {selectedBooleanHabit ? selectedBooleanHabit.name : 'Select Habit'}
                  </Button>
                }
              >
                {booleanHabits.map(habit => (
                  <Menu.Item
                    key={habit.id}
                    onPress={() => {
                      console.log('Boolean habit selected:', habit.name);
                      setSelectedBooleanHabit(habit);
                      setShowBooleanMenu(false);
                    }}
                    title={habit.name}
                    titleStyle={{
                      color: selectedBooleanHabit?.id === habit.id ? '#3b82f6' : '#000'
                    }}
                  />
                ))}
              </Menu>
            </View>
            
            {selectedBooleanHabit && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.chartContainer}
              >
                {renderBooleanChart(selectedBooleanHabit)}
              </ScrollView>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Chart 2: Numeric Habit Values Over Time */}
      {numericHabits.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.chartHeader}>
              <Title style={styles.cardTitle}>Numeric Habit Over Time</Title>
              <View style={styles.chartControls}>
                <Menu
                  visible={showNumericMenu}
                  onDismiss={() => setShowNumericMenu(false)}
                  anchor={
                    <Button 
                      mode="outlined" 
                      onPress={() => {
                        console.log('Numeric menu button pressed');
                        setShowNumericMenu(true);
                      }}
                      style={styles.chartSelector}
                    >
                      {selectedNumericHabit ? selectedNumericHabit.name : 'Select Habit'}
                    </Button>
                  }
                >
                  {numericHabits.map(habit => (
                    <Menu.Item
                      key={habit.id}
                      onPress={() => {
                        console.log('Numeric habit selected:', habit.name);
                        setSelectedNumericHabit(habit);
                        setShowNumericMenu(false);
                      }}
                      title={habit.name}
                      titleStyle={{
                        color: selectedNumericHabit?.id === habit.id ? '#3b82f6' : '#000'
                      }}
                    />
                  ))}
                </Menu>
                
                <View style={styles.dateRangeSelector}>
                  <Button
                    mode={dateRange === 7 ? "contained" : "outlined"}
                    onPress={() => setDateRange(7)}
                    style={styles.dateRangeButton}
                  >
                    7d
                  </Button>
                  <Button
                    mode={dateRange === 30 ? "contained" : "outlined"}
                    onPress={() => setDateRange(30)}
                    style={styles.dateRangeButton}
                  >
                    30d
                  </Button>
                </View>
              </View>
            </View>
            
            {selectedNumericHabit && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.chartContainer}
              >
                {renderNumericTimeChart(selectedNumericHabit)}
              </ScrollView>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Chart 3: Numeric Habit Average by Day of Week */}
      {numericHabits.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.chartHeader}>
              <Title style={styles.cardTitle}>Numeric Habit by Day of Week</Title>
              <Menu
                visible={showNumericMenu2}
                onDismiss={() => setShowNumericMenu2(false)}
                anchor={
                  <Button 
                    mode="outlined" 
                    onPress={() => {
                      console.log('Numeric menu 2 button pressed');
                      setShowNumericMenu2(true);
                    }}
                    style={styles.chartSelector}
                  >
                    {selectedNumericHabit2 ? selectedNumericHabit2.name : 'Select Habit'}
                  </Button>
                }
              >
                {numericHabits.map(habit => (
                  <Menu.Item
                    key={habit.id}
                    onPress={() => {
                      console.log('Numeric habit 2 selected:', habit.name);
                      setSelectedNumericHabit2(habit);
                      setShowNumericMenu2(false);
                    }}
                    title={habit.name}
                    titleStyle={{
                      color: selectedNumericHabit2?.id === habit.id ? '#3b82f6' : '#000'
                    }}
                  />
                ))}
              </Menu>
            </View>
            
            {selectedNumericHabit2 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.chartContainer}
              >
                {renderNumericDayChart(selectedNumericHabit2)}
              </ScrollView>
            )}
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
  // Chart styles
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  chartControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  chartSelector: {
    minWidth: 100,
    maxWidth: 150,
  },
  dateRangeSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  dateRangeButton: {
    minWidth: 40,
  },
  chartContainer: {
    marginTop: 16,
    overflow: 'hidden',
  },
  // Bar chart styles
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingHorizontal: 8,
    minWidth: 280,
  },
  barChartItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 1,
    minWidth: 35,
  },
  barChartBar: {
    width: 25,
    height: 120,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barChartFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  barChartLabel: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  barChartValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  // Line chart styles
  lineChart: {
    height: 180,
  },
  lineChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
    paddingHorizontal: 8,
    marginBottom: 8,
    minWidth: 300,
  },
  lineChartItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 1,
    minWidth: 30,
  },
  lineChartBar: {
    width: 18,
    height: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  lineChartFill: {
    width: '100%',
    borderRadius: 2,
    minHeight: 2,
  },
  lineChartLabel: {
    fontSize: 7,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  lineChartValue: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  lineChartAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  axisLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  // True line chart styles
  trueLineChart: {
    height: 200,
    width: 400,
  },
  lineChartSvg: {
    flex: 1,
    position: 'relative',
  },
  lineChartPath: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  lineChartPointContainer: {
    flex: 1,
    height: 150,
    position: 'relative',
    alignItems: 'center',
  },
  lineChartPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
  },
  lineChartLine: {
    width: 2,
    position: 'absolute',
    left: '50%',
    transformOrigin: 'bottom center',
  },
  lineChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  lineChartDateLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default AnalyticsScreen;
