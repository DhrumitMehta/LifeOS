import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  TextInput,
  SegmentedButtons,
  FAB,
  IconButton,
  Chip,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { Review, JournalEntry, HabitEntry, Transaction } from '../types';
import { supabaseDatabase } from '../database/supabaseDatabase';

const ReviewsScreen = () => {
  const { state } = useApp();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewType, setReviewType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for creating/editing review
  const [reflections, setReflections] = useState('');
  const [achievements, setAchievements] = useState('');
  const [challenges, setChallenges] = useState('');
  const [goalsForNextPeriod, setGoalsForNextPeriod] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setRefreshing(true);
      const reviewsData = await supabaseDatabase.getReviews();
      
      // Deserialize dates in complex objects
      const parsedReviews: Review[] = reviewsData.map((review: Review) => {
        // Deserialize dates in journalStats.yesterdayMood if they exist
        if (review.journalStats?.yesterdayMood) {
          review.journalStats.yesterdayMood = review.journalStats.yesterdayMood.map(item => ({
            ...item,
            date: item.date instanceof Date ? item.date : new Date(item.date),
          }));
        }
        // Deserialize dates in financeStats.highestTransaction if it exists
        if (review.financeStats?.highestTransaction) {
          review.financeStats.highestTransaction.date = 
            review.financeStats.highestTransaction.date instanceof Date 
              ? review.financeStats.highestTransaction.date 
              : new Date(review.financeStats.highestTransaction.date);
        }
        return review;
      });
      setReviews(parsedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const saveReview = async (review: Review) => {
    setSaving(true);
    try {
      console.log('Saving review:', review.id, review.type, review.period);
      
      if (selectedReview && reviews.some(r => r.id === selectedReview.id)) {
        // Update existing review
        console.log('Updating existing review');
        await supabaseDatabase.updateReview(review);
      } else {
        // Add new review
        console.log('Adding new review');
        await supabaseDatabase.addReview(review);
      }
      
      // Reload reviews to get the latest data
      await loadReviews();
      setIsCreating(false);
      setSelectedReview(null);
      resetForm();
      Alert.alert('Success', 'Review saved successfully!');
    } catch (error) {
      console.error('Error saving review:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to save review: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setReflections('');
    setAchievements('');
    setChallenges('');
    setGoalsForNextPeriod('');
    setSelectedPeriod('');
  };

  const generateReviewData = (startDate: Date, endDate: Date) => {
    // Filter data for the period
    const journalEntries = state.journalEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    const habitEntries = state.habitEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    const transactions = state.transactions.filter(transaction => {
      const txDate = new Date(transaction.date);
      return txDate >= startDate && txDate <= endDate;
    });

    // Calculate journal statistics with separate sections for each prompt
    const journalStats = {
      totalEntries: journalEntries.length,
      averageMood: calculateAverageMood(journalEntries),
      mostCommonTags: getMostCommonTags(journalEntries),
      memorableMoments: journalEntries
        .filter(e => e.memorableMoment)
        .map(e => e.memorableMoment!),
      madeYesterdayBetter: journalEntries
        .filter(e => e.madeYesterdayBetter)
        .map(e => e.madeYesterdayBetter!),
      improveToday: journalEntries
        .filter(e => e.improveToday)
        .map(e => e.improveToday!),
      yesterdayMood: journalEntries
        .filter(e => e.yesterdayMood)
        .map(e => ({ mood: e.yesterdayMood!, date: new Date(e.date) })),
      openThoughts: journalEntries
        .filter(e => e.openThoughts)
        .map(e => e.openThoughts!),
    };

    // Calculate habit statistics with detailed insights
    const activeHabits = state.habits.filter(h => h.isActive);
    const habitStats = {
      totalHabits: activeHabits.length,
      completedHabits: calculateCompletedHabits(activeHabits, habitEntries),
      averageCompletionRate: calculateAverageCompletionRate(activeHabits, habitEntries),
      longestStreak: calculateLongestStreak(activeHabits, habitEntries),
      topPerformingHabits: calculateTopPerformingHabits(activeHabits, habitEntries),
      habitCounts: calculateHabitCounts(activeHabits, habitEntries),
      mostPerformedHabit: calculateMostPerformedHabit(activeHabits, habitEntries),
      numericHabitAverages: calculateNumericHabitAverages(activeHabits, habitEntries),
    };

    // Calculate finance statistics with enhanced insights
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    // Get investments for the period
    const periodInvestments = state.investments.filter(inv => {
      const purchaseDate = new Date(inv.purchaseDate);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    });

    const financeStats = {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      topExpenseCategories: getTopCategories(expenses, 5),
      topIncomeCategories: getTopCategories(income, 5),
      highestSpendingCategory: getHighestSpendingCategory(expenses),
      highestTransaction: getHighestTransaction(transactions),
      investmentProgress: calculateInvestmentProgress(periodInvestments, state.investments),
    };

    return { journalStats, habitStats, financeStats };
  };

  const calculateAverageMood = (entries: JournalEntry[]): string => {
    if (entries.length === 0) return 'neutral';
    const moodValues = { 'very-sad': 1, 'sad': 2, 'neutral': 3, 'happy': 4, 'very-happy': 5 };
    const sum = entries.reduce((acc, e) => acc + moodValues[e.mood], 0);
    const avg = sum / entries.length;
    if (avg < 2) return 'very-sad';
    if (avg < 3) return 'sad';
    if (avg < 4) return 'neutral';
    if (avg < 4.5) return 'happy';
    return 'very-happy';
  };

  const getMostCommonTags = (entries: JournalEntry[]): string[] => {
    const tagCounts: Record<string, number> = {};
    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  };

  const calculateCompletedHabits = (habits: any[], entries: HabitEntry[]): number => {
    return habits.filter(habit => {
      const habitEntriesForPeriod = entries.filter(e => e.habitId === habit.id && e.completed);
      return habitEntriesForPeriod.length > 0;
    }).length;
  };

  const calculateAverageCompletionRate = (habits: any[], entries: HabitEntry[]): number => {
    if (habits.length === 0) return 0;
    const rates = habits.map(habit => {
      const habitEntriesForPeriod = entries.filter(e => e.habitId === habit.id);
      const completed = habitEntriesForPeriod.filter(e => e.completed).length;
      return habitEntriesForPeriod.length > 0 ? (completed / habitEntriesForPeriod.length) * 100 : 0;
    });
    return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  };

  const calculateLongestStreak = (habits: any[], entries: HabitEntry[]) => {
    let maxStreak = { habitName: 'None', days: 0 };
    habits.forEach(habit => {
      const habitEntriesForPeriod = entries
        .filter(e => e.habitId === habit.id && e.completed)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      let currentStreak = 1;
      let maxCurrentStreak = 1;
      
      for (let i = 1; i < habitEntriesForPeriod.length; i++) {
        const prevDate = new Date(habitEntriesForPeriod[i - 1].date);
        const currDate = new Date(habitEntriesForPeriod[i].date);
        const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          currentStreak++;
          maxCurrentStreak = Math.max(maxCurrentStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
      
      if (maxCurrentStreak > maxStreak.days) {
        maxStreak = { habitName: habit.name, days: maxCurrentStreak };
      }
    });
    return maxStreak;
  };

  const calculateTopPerformingHabits = (habits: any[], entries: HabitEntry[]) => {
    return habits.map(habit => {
      const habitEntriesForPeriod = entries.filter(e => e.habitId === habit.id);
      const completed = habitEntriesForPeriod.filter(e => e.completed).length;
      const completionRate = habitEntriesForPeriod.length > 0 
        ? (completed / habitEntriesForPeriod.length) * 100 
        : 0;
      return { habitName: habit.name, completionRate };
    })
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 5);
  };

  const calculateHabitCounts = (habits: any[], entries: HabitEntry[]) => {
    return habits.map(habit => {
      const habitEntriesForPeriod = entries.filter(e => e.habitId === habit.id && e.completed);
      return {
        habitName: habit.name,
        count: habitEntriesForPeriod.length,
      };
    }).sort((a, b) => b.count - a.count);
  };

  const calculateMostPerformedHabit = (habits: any[], entries: HabitEntry[]) => {
    const counts = calculateHabitCounts(habits, entries);
    return counts.length > 0 ? counts[0] : { habitName: 'None', count: 0 };
  };

  const calculateNumericHabitAverages = (habits: any[], entries: HabitEntry[]) => {
    return habits
      .filter(habit => habit.habitType === 'numeric')
      .map(habit => {
        const habitEntriesForPeriod = entries.filter(e => e.habitId === habit.id);
        if (habitEntriesForPeriod.length === 0) return null;
        
        const total = habitEntriesForPeriod.reduce((sum, e) => sum + e.value, 0);
        const average = total / habitEntriesForPeriod.length;
        
        return {
          habitName: habit.name,
          unit: habit.unit,
          average: average,
          totalEntries: habitEntriesForPeriod.length,
        };
      })
      .filter(item => item !== null);
  };

  const getHighestSpendingCategory = (expenses: Transaction[]) => {
    if (expenses.length === 0) return null;
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    const entries = Object.entries(categoryTotals);
    if (entries.length === 0) return null;
    const [category, amount] = entries.sort((a, b) => b[1] - a[1])[0];
    return { category, amount };
  };

  const getHighestTransaction = (transactions: Transaction[]) => {
    if (transactions.length === 0) return null;
    const highest = transactions.reduce((max, t) => 
      Math.abs(t.amount) > Math.abs(max.amount) ? t : max
    );
    return {
      description: highest.description,
      amount: highest.amount,
      type: highest.type,
      date: highest.date,
    };
  };

  const calculateInvestmentProgress = (periodInvestments: any[], allInvestments: any[]) => {
    const periodTotal = periodInvestments.reduce((sum, inv) => sum + (inv.totalValue || 0), 0);
    const allTimeTotal = allInvestments.reduce((sum, inv) => sum + (inv.totalValue || 0), 0);
    const periodCount = periodInvestments.length;
    const allTimeCount = allInvestments.length;
    
    return {
      periodInvestments: periodTotal,
      allTimeInvestments: allTimeTotal,
      periodCount,
      allTimeCount,
      newInvestmentsThisPeriod: periodCount,
    };
  };

  const formatCurrency = (amount: number) => {
    // Format with commas for thousands
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTopCategories = (transactions: Transaction[], limit: number) => {
    const categoryTotals: Record<string, number> = {};
    transactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  };

  const getAvailablePeriods = () => {
    const periods: string[] = [];
    const now = new Date();
    
    if (reviewType === 'monthly') {
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        periods.push(period);
      }
    } else {
      for (let i = 0; i < 5; i++) {
        const year = now.getFullYear() - i;
        periods.push(year.toString());
      }
    }
    
    return periods;
  };

  const handleCreateReview = () => {
    if (!selectedPeriod) {
      Alert.alert('Error', 'Please select a period');
      return;
    }

    let startDate: Date;
    let endDate: Date;

    if (reviewType === 'monthly') {
      const [year, month] = selectedPeriod.split('-').map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      const year = parseInt(selectedPeriod);
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    }

    // Check if review already exists
    const existingReview = reviews.find(
      r => r.type === reviewType && r.period === selectedPeriod
    );

    if (existingReview) {
      setSelectedReview(existingReview);
      setReflections(existingReview.reflections || '');
      setAchievements(existingReview.achievements || '');
      setChallenges(existingReview.challenges || '');
      setGoalsForNextPeriod(existingReview.goalsForNextPeriod || '');
    } else {
      const reviewData = generateReviewData(startDate, endDate);
      const newReview: Review = {
        id: Date.now().toString(),
        type: reviewType,
        period: selectedPeriod,
        startDate,
        endDate,
        ...reviewData,
        reflections: '',
        achievements: '',
        challenges: '',
        goalsForNextPeriod: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSelectedReview(newReview);
    }

    setIsCreating(true);
  };

  const handleSaveReview = async () => {
    if (!selectedReview) {
      Alert.alert('Error', 'No review selected');
      return;
    }

    try {
      const updatedReview: Review = {
        ...selectedReview,
        reflections,
        achievements,
        challenges,
        goalsForNextPeriod,
        updatedAt: new Date(),
      };

      await saveReview(updatedReview);
    } catch (error) {
      console.error('Error in handleSaveReview:', error);
      Alert.alert('Error', 'Failed to save review. Please try again.');
    }
  };

  const formatPeriod = (period: string, type: 'monthly' | 'yearly'): string => {
    if (type === 'monthly') {
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return period;
  };

  const availablePeriods = getAvailablePeriods();
  const filteredReviews = reviews.filter(r => r.type === reviewType);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadReviews} />
        }
      >
        {/* Review Type Selector */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Review Type</Title>
            <SegmentedButtons
              value={reviewType}
              onValueChange={(value) => {
                setReviewType(value as 'monthly' | 'yearly');
                setSelectedPeriod('');
                setIsCreating(false);
                setSelectedReview(null);
              }}
              buttons={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          </Card.Content>
        </Card>

        {/* Create New Review */}
        {!isCreating && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Create New Review</Title>
              <Text style={styles.description}>
                Select a {reviewType === 'monthly' ? 'month' : 'year'} to generate a review
              </Text>
              <View style={styles.periodSelector}>
                {availablePeriods.map(period => (
                  <Chip
                    key={period}
                    selected={selectedPeriod === period}
                    onPress={() => setSelectedPeriod(period)}
                    style={styles.periodChip}
                  >
                    {formatPeriod(period, reviewType)}
                  </Chip>
                ))}
              </View>
              <Button
                mode="contained"
                onPress={handleCreateReview}
                style={styles.createButton}
                disabled={!selectedPeriod}
                icon="add-circle"
              >
                Generate Review
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Review Form */}
        {isCreating && selectedReview && (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.reviewHeader}>
                  <Title style={styles.reviewTitle}>
                    {formatPeriod(selectedReview.period, selectedReview.type)} Review
                  </Title>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={() => {
                      setIsCreating(false);
                      setSelectedReview(null);
                      resetForm();
                    }}
                  />
                </View>

                {/* Journal Statistics */}
                {selectedReview.journalStats && (
                  <Card style={styles.statsCard}>
                    <Card.Content>
                      <Title style={styles.statsTitle}>Journal Insights</Title>
                      <View style={styles.statSection}>
                        <Text style={styles.statText}>
                          Total Entries: {selectedReview.journalStats.totalEntries}
                        </Text>
                        <Text style={styles.statText}>
                          Average Mood: {selectedReview.journalStats.averageMood}
                        </Text>
                        {selectedReview.journalStats.mostCommonTags.length > 0 && (
                          <View style={styles.tagContainer}>
                            <Text style={styles.statLabel}>Most Common Tags:</Text>
                            {selectedReview.journalStats.mostCommonTags.map((tag, idx) => (
                              <Chip key={idx} style={styles.tagChip}>{tag}</Chip>
                            ))}
                          </View>
                        )}
                      </View>

                      {selectedReview.journalStats.memorableMoments.length > 0 && (
                        <View style={styles.statSection}>
                          <Text style={styles.statLabel}>Memorable Moments</Text>
                          {selectedReview.journalStats.memorableMoments.map((moment, idx) => (
                            <Text key={idx} style={styles.statText}>• {moment}</Text>
                          ))}
                        </View>
                      )}

                      {selectedReview.journalStats.madeYesterdayBetter.length > 0 && (
                        <View style={styles.statSection}>
                          <Text style={styles.statLabel}>What Made Yesterday Better</Text>
                          {selectedReview.journalStats.madeYesterdayBetter.map((item, idx) => (
                            <Text key={idx} style={styles.statText}>• {item}</Text>
                          ))}
                        </View>
                      )}

                      {selectedReview.journalStats.improveToday.length > 0 && (
                        <View style={styles.statSection}>
                          <Text style={styles.statLabel}>How to Improve Today</Text>
                          {selectedReview.journalStats.improveToday.map((item, idx) => (
                            <Text key={idx} style={styles.statText}>• {item}</Text>
                          ))}
                        </View>
                      )}

                      {selectedReview.journalStats.openThoughts.length > 0 && (
                        <View style={styles.statSection}>
                          <Text style={styles.statLabel}>Open Thoughts</Text>
                          {selectedReview.journalStats.openThoughts.map((item, idx) => (
                            <Text key={idx} style={styles.statText}>• {item}</Text>
                          ))}
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                )}

                {/* Habit Statistics */}
                {selectedReview.habitStats && (
                  <Card style={styles.statsCard}>
                    <Card.Content>
                      <Title style={styles.statsTitle}>Habit Insights</Title>
                      <View style={styles.statSection}>
                        <Text style={styles.statText}>
                          {selectedReview.habitStats.completedHabits}/{selectedReview.habitStats.totalHabits} habits tracked
                        </Text>
                        <Text style={styles.statText}>
                          {selectedReview.habitStats.averageCompletionRate.toFixed(1)}% average completion
                        </Text>
                        {selectedReview.habitStats.longestStreak.days > 0 && (
                          <Text style={styles.statText}>
                            Longest Streak: {selectedReview.habitStats.longestStreak.habitName} ({selectedReview.habitStats.longestStreak.days} days)
                          </Text>
                        )}
                      </View>

                      {selectedReview.habitStats.mostPerformedHabit && selectedReview.habitStats.mostPerformedHabit.count > 0 && (
                        <View style={styles.statSection}>
                          <Text style={styles.statLabel}>Most Performed Habit</Text>
                          <Text style={styles.statText}>
                            {selectedReview.habitStats.mostPerformedHabit.habitName}: {selectedReview.habitStats.mostPerformedHabit.count} times
                          </Text>
                        </View>
                      )}

                      {selectedReview.habitStats.habitCounts && selectedReview.habitStats.habitCounts.length > 0 && (
                        <View style={styles.statSection}>
                          <Text style={styles.statLabel}>Habit Performance Counts</Text>
                          {selectedReview.habitStats.habitCounts.slice(0, 10).map((item, idx) => (
                            <Text key={idx} style={styles.statText}>
                              {item.habitName}: {item.count} times
                            </Text>
                          ))}
                        </View>
                      )}

                      {selectedReview.habitStats.numericHabitAverages && selectedReview.habitStats.numericHabitAverages.length > 0 && (
                        <View style={styles.statSection}>
                          <Text style={styles.statLabel}>Numeric Habit Averages</Text>
                          {selectedReview.habitStats.numericHabitAverages.map((item, idx) => (
                            <Text key={idx} style={styles.statText}>
                              {item.habitName}: {item.average.toFixed(2)} {item.unit} (avg from {item.totalEntries} entries)
                            </Text>
                          ))}
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                )}

                {/* Finance Statistics */}
                {selectedReview.financeStats && (
                  <Card style={styles.statsCard}>
                    <Card.Content>
                      <Title style={styles.statsTitle}>Finance Insights</Title>
                      <View style={styles.statSection}>
                        <Text style={styles.statText}>
                          Income: TSh {formatCurrency(selectedReview.financeStats.totalIncome)}
                        </Text>
                        <Text style={styles.statText}>
                          Expenses: TSh {formatCurrency(selectedReview.financeStats.totalExpenses)}
                        </Text>
                        <Text style={[
                          styles.statText, 
                          styles.savingsText,
                          { color: selectedReview.financeStats.netSavings >= 0 ? '#10b981' : '#ef4444' }
                        ]}>
                          Net Savings: TSh {formatCurrency(selectedReview.financeStats.netSavings)}
                        </Text>
                      </View>

                      {selectedReview.financeStats.highestSpendingCategory && (
                        <View style={styles.statSection}>
                          <Text style={styles.statLabel}>Highest Spending Category</Text>
                          <Text style={styles.statText}>
                            {selectedReview.financeStats.highestSpendingCategory.category}: TSh {formatCurrency(selectedReview.financeStats.highestSpendingCategory.amount)}
                          </Text>
                        </View>
                      )}

                      {selectedReview.financeStats.highestTransaction && (
                        <View style={styles.statSection}>
                          <Text style={styles.statLabel}>Highest Transaction</Text>
                          <Text style={styles.statText}>
                            {selectedReview.financeStats.highestTransaction.description}
                          </Text>
                          <Text style={styles.statText}>
                            Amount: TSh {formatCurrency(Math.abs(selectedReview.financeStats.highestTransaction.amount))} ({selectedReview.financeStats.highestTransaction.type})
                          </Text>
                        </View>
                      )}

                      {selectedReview.financeStats.investmentProgress && (
                        <View style={styles.statSection}>
                          <Text style={styles.statLabel}>Investment Progress</Text>
                          <Text style={styles.statText}>
                            Period Investments: TSh {formatCurrency(selectedReview.financeStats.investmentProgress.periodInvestments)}
                          </Text>
                          <Text style={styles.statText}>
                            All-Time Investments: TSh {formatCurrency(selectedReview.financeStats.investmentProgress.allTimeInvestments)}
                          </Text>
                          <Text style={styles.statText}>
                            New Investments This Period: {selectedReview.financeStats.investmentProgress.newInvestmentsThisPeriod}
                          </Text>
                        </View>
                      )}

                      {selectedReview.financeStats.topExpenseCategories.length > 0 && (
                        <View style={styles.statSection}>
                          <Text style={styles.statLabel}>Top Expense Categories</Text>
                          {selectedReview.financeStats.topExpenseCategories.map((cat, idx) => (
                            <Text key={idx} style={styles.statText}>
                              {cat.category}: TSh {formatCurrency(cat.amount)}
                            </Text>
                          ))}
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                )}

                {/* Open Writing Sections */}
                <TextInput
                  label="Reflections"
                  value={reflections}
                  onChangeText={setReflections}
                  mode="outlined"
                  multiline
                  numberOfLines={6}
                  style={styles.textInput}
                  placeholder="What are your thoughts about this period?"
                />

                <TextInput
                  label="Achievements"
                  value={achievements}
                  onChangeText={setAchievements}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.textInput}
                  placeholder="What did you accomplish?"
                />

                <TextInput
                  label="Challenges"
                  value={challenges}
                  onChangeText={setChallenges}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.textInput}
                  placeholder="What challenges did you face?"
                />

                <TextInput
                  label="Goals for Next Period"
                  value={goalsForNextPeriod}
                  onChangeText={setGoalsForNextPeriod}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.textInput}
                  placeholder="What are your goals moving forward?"
                />

                <Button
                  mode="contained"
                  onPress={handleSaveReview}
                  style={styles.saveButton}
                  icon="check"
                  loading={saving}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Review'}
                </Button>
              </Card.Content>
            </Card>
          </>
        )}

        {/* Existing Reviews */}
        {!isCreating && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Past Reviews</Title>
              {filteredReviews.length === 0 ? (
                <Text style={styles.emptyText}>No reviews yet. Create one above!</Text>
              ) : (
                filteredReviews.map(review => (
                  <TouchableOpacity
                    key={review.id}
                    onPress={() => {
                      setSelectedReview(review);
                      setReflections(review.reflections || '');
                      setAchievements(review.achievements || '');
                      setChallenges(review.challenges || '');
                      setGoalsForNextPeriod(review.goalsForNextPeriod || '');
                      setIsCreating(true);
                    }}
                  >
                    <Card style={styles.reviewCard}>
                      <Card.Content>
                        <View style={styles.reviewCardHeader}>
                          <Text style={styles.reviewCardTitle}>
                            {formatPeriod(review.period, review.type)}
                          </Text>
                          <Ionicons name="chevron-forward" size={20} color="#6366f1" />
                        </View>
                        {review.reflections && (
                          <Text style={styles.reviewCardPreview} numberOfLines={2}>
                            {review.reflections}
                          </Text>
                        )}
                      </Card.Content>
                    </Card>
                  </TouchableOpacity>
                ))
              )}
            </Card.Content>
          </Card>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  periodChip: {
    marginBottom: 8,
  },
  createButton: {
    marginTop: 8,
    backgroundColor: '#6366f1',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statsCard: {
    backgroundColor: '#f1f5f9',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937',
  },
  statSection: {
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 4,
  },
  statText: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 2,
  },
  textInput: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: '#6366f1',
  },
  reviewCard: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  reviewCardPreview: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 24,
  },
  bottomSpacing: {
    height: 32,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  tagChip: {
    marginBottom: 4,
    backgroundColor: '#e0e7ff',
  },
  savingsText: {
    fontWeight: '600',
  },
});

export default ReviewsScreen;

