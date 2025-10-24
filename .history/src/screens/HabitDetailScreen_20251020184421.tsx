import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  TextInput,
  Button,
  SegmentedButtons,
  Chip,
  IconButton,
  Text,
  ProgressBar,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Habit, RootStackParamList } from '../types';

type HabitDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HabitDetail'>;
type HabitDetailScreenRouteProp = RouteProp<RootStackParamList, 'HabitDetail'>;

const HabitDetailScreen = () => {
  const navigation = useNavigation<HabitDetailScreenNavigationProp>();
  const route = useRoute<HabitDetailScreenRouteProp>();
  const { state, addHabit, updateHabit, deleteHabit, addHabitEntry } = useApp();
  
  const [isEditing, setIsEditing] = useState(false);
  const [habit, setHabit] = useState<Habit | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    targetValue: 1,
    unit: '',
    color: '#3b82f6',
    icon: 'checkmark-circle',
  });

  useEffect(() => {
    if (route.params.habitId) {
      const foundHabit = state.habits.find(h => h.id === route.params.habitId);
      if (foundHabit) {
        setHabit(foundHabit);
        setFormData({
          name: foundHabit.name,
          description: foundHabit.description || '',
          category: foundHabit.category,
          frequency: foundHabit.frequency,
          targetValue: foundHabit.targetValue,
          unit: foundHabit.unit,
          color: foundHabit.color,
          icon: foundHabit.icon,
        });
      }
    } else {
      setIsEditing(true);
    }
  }, [route.params.habitId, state.habits]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.category.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (habit) {
        const updatedHabit: Habit = {
          ...habit,
          ...formData,
          updatedAt: new Date(),
        };
        await updateHabit(updatedHabit);
        setHabit(updatedHabit);
      } else {
        await addHabit(formData);
        navigation.goBack();
      }
      setIsEditing(false);
      Alert.alert('Success', 'Habit saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save habit');
    }
  };

  const handleDelete = () => {
    if (!habit) return;
    
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHabit(habit.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete habit');
            }
          },
        },
      ]
    );
  };

  const handleQuickComplete = async () => {
    if (!habit) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const existingEntry = state.habitEntries.find(
        entry => entry.habitId === habit.id && entry.date.toISOString().split('T')[0] === today
      );

      if (existingEntry) {
        Alert.alert('Already Completed', 'This habit has already been completed today.');
        return;
      }

      await addHabitEntry({
        habitId: habit.id,
        date: new Date(),
        value: habit.targetValue,
        completed: true,
      });

      Alert.alert('Success', `${habit.name} marked as completed!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete habit');
    }
  };

  const getHabitProgress = () => {
    if (!habit) return 0;
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = state.habitEntries.find(
      entry => entry.habitId === habit.id && entry.date.toISOString().split('T')[0] === today
    );
    
    if (!todayEntry) return 0;
    return Math.min(todayEntry.value / habit.targetValue, 1);
  };

  const getHabitStreak = () => {
    if (!habit) return 0;
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

  const getRecentEntries = () => {
    if (!habit) return [];
    return state.habitEntries
      .filter(entry => entry.habitId === habit.id)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 7);
  };

  if (!habit && !isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading habit...</Text>
      </View>
    );
  }

  const progress = getHabitProgress();
  const streak = getHabitStreak();
  const recentEntries = getRecentEntries();

  return (
    <ScrollView style={styles.container}>
      {isEditing ? (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Habit Details</Title>
            
            <TextInput
              label="Habit Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
            />
            
            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              style={styles.input}
            />
            
            <TextInput
              label="Category *"
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
              style={styles.input}
            />
            
            <Text style={styles.label}>Frequency</Text>
            <SegmentedButtons
              value={formData.frequency}
              onValueChange={(value) => setFormData({ ...formData, frequency: value as any })}
              buttons={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
              style={styles.segmentedButtons}
            />
            
            <View style={styles.row}>
              <TextInput
                label="Target Value"
                value={formData.targetValue.toString()}
                onChangeText={(text) => setFormData({ ...formData, targetValue: parseInt(text) || 1 })}
                keyboardType="numeric"
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Unit"
                value={formData.unit}
                onChangeText={(text) => setFormData({ ...formData, unit: text })}
                style={[styles.input, styles.halfInput]}
              />
            </View>
            
            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={() => setIsEditing(false)}
                style={styles.button}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.button}
              >
                Save
              </Button>
            </View>
          </Card.Content>
        </Card>
      ) : (
        <>
          {/* Habit Overview */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.habitHeader}>
                <View style={styles.habitInfo}>
                  <Title style={styles.habitName}>{habit?.name}</Title>
                  <Paragraph style={styles.habitDescription}>
                    {habit?.description}
                  </Paragraph>
                </View>
                <View style={styles.habitActions}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => setIsEditing(true)}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={handleDelete}
                    iconColor="#ef4444"
                  />
                </View>
              </View>

              <View style={styles.habitDetails}>
                <Chip 
                  icon="tag" 
                  style={[styles.categoryChip, { backgroundColor: habit?.color + '20' }]}
                  textStyle={{ color: habit?.color }}
                >
                  {habit?.category}
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
                    {Math.round(progress * 100)}% Complete Today
                  </Text>
                  <Text style={styles.targetText}>
                    {habit?.targetValue} {habit?.unit} {habit?.frequency}
                  </Text>
                </View>
                <ProgressBar
                  progress={progress}
                  color={progress >= 1 ? '#10b981' : habit?.color}
                  style={styles.progressBar}
                />
              </View>

              {progress < 1 && (
                <Button
                  mode="contained"
                  onPress={handleQuickComplete}
                  style={[styles.completeButton, { backgroundColor: habit?.color }]}
                >
                  Mark as Complete
                </Button>
              )}
            </Card.Content>
          </Card>

          {/* Recent Entries */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>Recent Entries</Title>
              {recentEntries.length > 0 ? (
                recentEntries.map((entry, index) => (
                  <View key={index} style={styles.entryItem}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryDate}>
                        {entry.date.toLocaleDateString()}
                      </Text>
                      <Text style={styles.entryValue}>
                        {entry.value} {habit?.unit}
                      </Text>
                    </View>
                    <View style={styles.entryStatus}>
                      {entry.completed ? (
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      ) : (
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No entries yet</Text>
              )}
            </Card.Content>
          </Card>
        </>
      )}
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
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '600',
  },
  targetText: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  completeButton: {
    marginTop: 8,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  entryInfo: {
    flex: 1,
  },
  entryDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  entryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  entryStatus: {
    marginLeft: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontStyle: 'italic',
    paddingVertical: 16,
  },
});

export default HabitDetailScreen;
