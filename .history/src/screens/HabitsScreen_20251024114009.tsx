import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  RefreshControl,
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
  Checkbox,
  Surface,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Habit, RootStackParamList } from '../types';

type HabitsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const HabitsScreen = () => {
  const navigation = useNavigation<HabitsScreenNavigationProp>();
  const { state, addHabit, deleteHabit, addHabitEntry, deleteHabitEntry, refreshData } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showHabitDetail, setShowHabitDetail] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: 'Health',
    habitType: 'boolean' as 'boolean' | 'numeric',
    targetValue: 1,
    unit: 'times',
  });

  // Generate current week (Monday to Sunday)
  const getCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Monday start
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const currentWeek = getCurrentWeek();

  // Check if a habit is completed on a specific date
  const isHabitCompletedOnDate = (habitId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return state.habitEntries.some(entry => 
      entry.habitId === habitId && 
      entry.date.toISOString().split('T')[0] === dateStr && 
      entry.completed
    );
  };

  // Handle checkbox toggle
  const handleHabitToggle = async (habit: Habit, date: Date) => {
    const isCompleted = isHabitCompletedOnDate(habit.id, date);
    const isToday = date.toDateString() === new Date().toDateString();
    
    if (isCompleted && isToday) {
      // Allow unchecking only for today
      try {
        await handleUncompleteHabit(habit, date);
      } catch (error) {
        console.error('Error uncompleting habit:', error);
        Alert.alert('Error', 'Failed to uncomplete habit');
      }
    } else if (isCompleted && !isToday) {
      // Cannot uncheck past days
      Alert.alert('Cannot Modify', 'You can only uncheck habits for today.');
      return;
    } else if (!isCompleted && !isToday) {
      // Cannot check habits for past or future days
      Alert.alert('Cannot Modify', 'You can only check habits for today.');
      return;
    } else {
      // Complete the habit (only for today)
      try {
        await addHabitEntry({
          habitId: habit.id,
          date: date,
          value: habit.targetValue,
          completed: true,
        });
      } catch (error) {
        console.error('Error completing habit:', error);
        Alert.alert('Error', 'Failed to complete habit');
      }
    }
  };

  // Handle uncompleting a habit (delete the habit entry)
  const handleUncompleteHabit = async (habit: Habit, date: Date) => {
    try {
      console.log('Uncompleting habit:', habit.name, 'for date:', date);
      
      // Find the habit entry for this date
      const dateStr = date.toISOString().split('T')[0];
      const entryToDelete = state.habitEntries.find(entry => 
        entry.habitId === habit.id && 
        entry.date.toISOString().split('T')[0] === dateStr
      );

      if (entryToDelete) {
        // Delete the habit entry from database and local state
        await deleteHabitEntry(entryToDelete.id);
        console.log('Habit uncompleted successfully');
      }
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      throw error;
    }
  };

  const handleHabitClick = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowHabitDetail(true);
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

  const handleAddHabit = () => {
    setShowAddDialog(true);
  };

  const handleSaveHabit = async () => {
    if (!newHabit.name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    try {
      const habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'> = {
        name: newHabit.name.trim(),
        description: newHabit.description.trim(),
        category: newHabit.category,
        frequency: 'daily',
        targetValue: newHabit.targetValue,
        unit: newHabit.unit,
        color: '#3b82f6',
        icon: 'check',
        isActive: true,
      };
      
      await addHabit(habitData);
      setShowAddDialog(false);
      setNewHabit({ name: '', description: '', category: 'Health', targetValue: 1, unit: 'times' });
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

  // Render the checkbox grid header
  const renderGridHeader = () => (
    <View style={styles.gridHeader}>
      <View style={styles.dateColumn}>
        <Text style={styles.headerText}>Date</Text>
      </View>
      {state.habits.filter(habit => habit.isActive).map(habit => (
        <TouchableOpacity 
          key={habit.id} 
          style={styles.habitColumn}
          onPress={() => handleHabitClick(habit)}
        >
          <Text style={[styles.headerText, { textDecorationLine: 'underline' }]} numberOfLines={2}>
            {habit.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render a row for each day
  const renderDayRow = (date: Date) => {
    const isToday = date.toDateString() === new Date().toDateString();
    
    return (
      <View key={date.toISOString()} style={[styles.dayRow, isToday && styles.todayRow]}>
        <View style={[styles.dateColumn, isToday && styles.todayDateColumn]}>
          <Text style={[styles.dateText, isToday && styles.todayDateText]}>
            {date.toLocaleDateString('en-US', { weekday: 'short' })}
          </Text>
          <Text style={[styles.dateNumber, isToday && styles.todayDateNumber]}>
            {date.getDate()}
          </Text>
        </View>
        {state.habits.filter(habit => habit.isActive).map(habit => (
          <View key={habit.id} style={[styles.habitColumn, isToday && styles.todayHabitColumn]}>
            <Checkbox
              status={isHabitCompletedOnDate(habit.id, date) ? 'checked' : 'unchecked'}
              onPress={() => handleHabitToggle(habit, date)}
              color={habit.color}
            />
          </View>
        ))}
      </View>
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
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.gridContainer}>
          {renderGridHeader()}
          {currentWeek.map(renderDayRow)}
        </View>
      </ScrollView>

      {state.habits.filter(habit => habit.isActive).length === 0 && (
        <ScrollView 
          style={styles.emptyScrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
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
        </ScrollView>
      )}
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddHabit}
        label="Add Habit"
      />

      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add New Habit</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Habit Name"
              value={newHabit.name}
              onChangeText={(text) => setNewHabit({ ...newHabit, name: text })}
              style={styles.input}
            />
            <TextInput
              label="Description (optional)"
              value={newHabit.description}
              onChangeText={(text) => setNewHabit({ ...newHabit, description: text })}
              style={styles.input}
              multiline
            />
            <TextInput
              label="Category"
              value={newHabit.category}
              onChangeText={(text) => setNewHabit({ ...newHabit, category: text })}
              style={styles.input}
            />
            <View style={styles.rowInput}>
              <TextInput
                label="Target Value"
                value={newHabit.targetValue.toString()}
                onChangeText={(text) => setNewHabit({ ...newHabit, targetValue: parseInt(text) || 1 })}
                keyboardType="numeric"
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Unit"
                value={newHabit.unit}
                onChangeText={(text) => setNewHabit({ ...newHabit, unit: text })}
                style={[styles.input, styles.halfInput]}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onPress={handleSaveHabit} mode="contained">Add Habit</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showHabitDetail} onDismiss={() => setShowHabitDetail(false)}>
          <Dialog.Title>Habit Details</Dialog.Title>
          <Dialog.Content>
            {selectedHabit && (
              <>
                <View style={styles.habitDetailHeader}>
                  <Title style={[styles.habitDetailName, { color: selectedHabit.color }]}>
                    {selectedHabit.name}
                  </Title>
                  <Chip 
                    icon="fire" 
                    style={styles.streakChip}
                  >
                    {getHabitStreak(selectedHabit)} day streak
                  </Chip>
                </View>
                
                <Paragraph style={styles.habitDetailDescription}>
                  {selectedHabit.description}
                </Paragraph>
                
                <View style={styles.habitDetailInfo}>
                  <Text style={styles.habitDetailLabel}>Category:</Text>
                  <Text style={styles.habitDetailValue}>{selectedHabit.category}</Text>
                </View>
                
                <View style={styles.habitDetailInfo}>
                  <Text style={styles.habitDetailLabel}>Target:</Text>
                  <Text style={styles.habitDetailValue}>
                    {selectedHabit.targetValue} {selectedHabit.unit} {selectedHabit.frequency}
                  </Text>
                </View>
                
                <View style={styles.progressSection}>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressText}>
                      {Math.round(getHabitProgress(selectedHabit) * 100)}% Complete
                    </Text>
                  </View>
                  <ProgressBar
                    progress={getHabitProgress(selectedHabit)}
                    color={getHabitProgress(selectedHabit) >= 1 ? '#10b981' : selectedHabit.color}
                    style={styles.progressBar}
                  />
                </View>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowHabitDetail(false)}>Close</Button>
            {selectedHabit && (
              <Button 
                onPress={() => {
                  handleDeleteHabit(selectedHabit);
                  setShowHabitDetail(false);
                }} 
                mode="contained" 
                buttonColor="#ef4444"
              >
                Delete Habit
              </Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const { width: screenWidth } = Dimensions.get('window');

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
  
  // Grid styles
  gridContainer: {
    padding: 16,
    minWidth: screenWidth,
  },
  gridHeader: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    borderRadius: 8,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  dayRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    elevation: 1,
  },
  todayRow: {
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    elevation: 3,
  },
  dateColumn: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDateColumn: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  habitColumn: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  todayHabitColumn: {
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    paddingVertical: 2,
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  dateText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  todayDateText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  todayDateNumber: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Habit detail dialog styles
  habitDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  habitDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  habitDetailDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  habitDetailInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  habitDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  habitDetailValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  streakChip: {
    backgroundColor: '#fef3c7',
  },
  progressSection: {
    marginTop: 16,
    marginBottom: 8,
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
  progressBar: {
    height: 8,
    borderRadius: 4,
  },

  // Empty state
  emptyScrollView: {
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
  
  // Dialog styles
  input: {
    marginBottom: 16,
  },
  rowInput: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
});

export default HabitsScreen;
