import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  FAB,
  Chip,
  ProgressBar,
  Text,
  Button,
  IconButton,
  Dialog,
  Portal,
  TextInput,
  HelperText,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Habit, RootStackParamList } from '../types';

type HabitsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const HabitsScreen = () => {
  const navigation = useNavigation<HabitsScreenNavigationProp>();
  const { state, addHabit, deleteHabit, addHabitEntry } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleAddHabit = async () => {
    try {
      console.log('Adding sample habit...');
      // For now, we'll add a sample habit
      // In a real app, this would open a modal or navigate to a form
      const sampleHabit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Drink Water',
        description: 'Drink 8 glasses of water daily',
        category: 'Health',
        frequency: 'daily',
        targetValue: 8,
        unit: 'glasses',
        color: '#3b82f6',
        icon: 'water',
        isActive: true,
      };
      await addHabit(sampleHabit);
      console.log('Sample habit added successfully');
    } catch (error) {
      console.error('Error adding habit:', error);
      Alert.alert('Error', 'Failed to add habit');
    }
  };

  const handleHabitPress = (habit: Habit) => {
    navigation.navigate('HabitDetail', { habitId: habit.id });
  };

  const handleQuickComplete = async (habit: Habit) => {
    try {
      console.log('Attempting to complete habit:', habit.name);
      const today = new Date().toISOString().split('T')[0];
      const existingEntry = state.habitEntries.find(
        entry => entry.habitId === habit.id && entry.date.toISOString().split('T')[0] === today
      );

      if (existingEntry) {
        console.log('Habit already completed today');
        Alert.alert('Already Completed', 'This habit has already been completed today.');
        return;
      }

      console.log('Adding habit entry...');
      await addHabitEntry({
        habitId: habit.id,
        date: new Date(),
        value: habit.targetValue,
        completed: true,
      });

      console.log('Habit entry added successfully');
      Alert.alert('Success', `${habit.name} marked as completed!`);
    } catch (error) {
      console.error('Error completing habit:', error);
      Alert.alert('Error', 'Failed to complete habit');
    }
  };

  const handleDeleteHabit = (habit: Habit) => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteHabit(habit.id),
        },
      ]
    );
  };

  const getHabitProgress = (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = state.habitEntries.find(
      entry => entry.habitId === habit.id && entry.date.toISOString().split('T')[0] === today
    );
    
    if (!todayEntry) return 0;
    return Math.min(todayEntry.value / habit.targetValue, 1);
  };

  const getHabitStreak = (habit: Habit) => {
    const entries = state.habitEntries
      .filter(entry => entry.habitId === habit.id && entry.completed)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const entry of entries) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      
      if (entryDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (entryDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  };

  const renderHabit = ({ item: habit }: { item: Habit }) => {
    const progress = getHabitProgress(habit);
    const streak = getHabitStreak(habit);
    const isCompleted = progress >= 1;

    return (
      <Card style={styles.habitCard}>
        <Card.Content>
          <View style={styles.habitHeader}>
            <View style={styles.habitInfo}>
              <Title style={styles.habitName}>{habit.name}</Title>
              <Paragraph style={styles.habitDescription}>
                {habit.description}
              </Paragraph>
            </View>
            <View style={styles.habitActions}>
              <IconButton
                icon="delete"
                size={20}
                onPress={() => handleDeleteHabit(habit)}
                iconColor="#ef4444"
              />
            </View>
          </View>

          <View style={styles.habitDetails}>
            <Chip 
              icon="tag" 
              style={[styles.categoryChip, { backgroundColor: habit.color + '20' }]}
              textStyle={{ color: habit.color }}
            >
              {habit.category}
            </Chip>
            <Chip 
              icon="flame" 
              style={styles.streakChip}
            >
              {streak} day streak
            </Chip>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {Math.round(progress * 100)}% Complete
              </Text>
              <Text style={styles.targetText}>
                {habit.targetValue} {habit.unit} {habit.frequency}
              </Text>
            </View>
            <ProgressBar
              progress={progress}
              color={isCompleted ? '#10b981' : habit.color}
              style={styles.progressBar}
            />
          </View>

          <View style={styles.habitButtons}>
            <Button
              mode="outlined"
              onPress={() => handleHabitPress(habit)}
              style={styles.detailButton}
            >
              View Details
            </Button>
            {!isCompleted && (
              <Button
                mode="contained"
                onPress={() => handleQuickComplete(habit)}
                style={[styles.completeButton, { backgroundColor: habit.color }]}
              >
                Complete
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (state.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading habits...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={state.habits.filter(habit => habit.isActive)}
        renderItem={renderHabit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#9ca3af" />
            <Title style={styles.emptyTitle}>No Habits Yet</Title>
            <Paragraph style={styles.emptyDescription}>
              Start building better habits by adding your first one!
            </Paragraph>
            <Button
              mode="contained"
              onPress={handleAddHabit}
              style={styles.addFirstHabitButton}
            >
              Add Your First Habit
            </Button>
          </View>
        }
      />
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddHabit}
        label="Add Habit"
      />
    </View>
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
  listContainer: {
    padding: 16,
  },
  habitCard: {
    marginBottom: 16,
    elevation: 2,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  habitActions: {
    flexDirection: 'row',
  },
  habitDetails: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  streakChip: {
    backgroundColor: '#fef3c7',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  targetText: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  habitButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  detailButton: {
    flex: 1,
  },
  completeButton: {
    flex: 1,
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
  addFirstHabitButton: {
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366f1',
  },
});

export default HabitsScreen;
