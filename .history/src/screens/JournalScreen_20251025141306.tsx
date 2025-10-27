import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  FAB,
  Chip,
  Text,
  Searchbar,
  IconButton,
  TextInput,
  SegmentedButtons,
  Button,
  Menu,
  Divider,
  Checkbox,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { JournalEntry, RootStackParamList } from '../types';

type JournalScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const JournalScreen = () => {
  const navigation = useNavigation<JournalScreenNavigationProp>();
  const { state, addJournalEntry, refreshData } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form data for the structured journal entry
  const [formData, setFormData] = useState({
    title: `Journal Entry - ${new Date().toLocaleDateString()}`,
    memorableMoment: '',
    madeYesterdayBetter: '',
    improveToday: '',
    makeTodayGreat: '',
    yesterdayMood: 'positive' as 'positive' | 'negative',
    affirmations: '',
    openThoughts: '',
    mood: 'neutral' as 'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad',
    tags: [] as string[],
    date: new Date(),
  });

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

  const handleSave = async () => {
    if (!formData.memorableMoment.trim() && !formData.madeYesterdayBetter.trim() && 
        !formData.improveToday.trim() && !formData.makeTodayGreat.trim() && 
        !formData.affirmations.trim() && !formData.openThoughts.trim()) {
      return;
    }

    try {
      const journalEntry = {
        ...formData,
        content: `Memorable Moment: ${formData.memorableMoment}\n\nMade Yesterday Better: ${formData.madeYesterdayBetter}\n\nImprove Today: ${formData.improveToday}\n\nMake Today Great: ${formData.makeTodayGreat}\n\nYesterday's Mood: ${formData.yesterdayMood}\n\nAffirmations: ${formData.affirmations}\n\nOpen Thoughts: ${formData.openThoughts}`,
      };
      
      await addJournalEntry(journalEntry);
      
      // Reset form
      setFormData({
        title: `Journal Entry - ${new Date().toLocaleDateString()}`,
        memorableMoment: '',
        madeYesterdayBetter: '',
        improveToday: '',
        makeTodayGreat: '',
        yesterdayMood: 'positive',
        affirmations: '',
        openThoughts: '',
        mood: 'neutral',
        tags: [],
        date: new Date(),
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    navigation.navigate('JournalDetail', { entryId: entry.id });
  };

  const getMoodIcon = (mood: JournalEntry['mood']) => {
    switch (mood) {
      case 'very-happy':
        return '😄';
      case 'happy':
        return '😊';
      case 'neutral':
        return '😐';
      case 'sad':
        return '😔';
      case 'very-sad':
        return '😢';
      default:
        return '😐';
    }
  };

  const getMoodColor = (mood: JournalEntry['mood']) => {
    switch (mood) {
      case 'very-happy':
        return '#10b981';
      case 'happy':
        return '#34d399';
      case 'neutral':
        return '#6b7280';
      case 'sad':
        return '#f59e0b';
      case 'very-sad':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const recentEntries = state.journalEntries
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  if (state.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading journal entries...</Text>
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
      {isEditing ? (
        <Card style={styles.editingCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Daily Journal</Title>
            <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
            
            {/* Questions/Prompts Section */}
            <View style={styles.section}>
              <Title style={styles.subsectionTitle}>Questions/Prompts to Answer</Title>
              
              <TextInput
                label="Memorable moment of yesterday?"
                value={formData.memorableMoment}
                onChangeText={(text) => setFormData({ ...formData, memorableMoment: text })}
                multiline
                numberOfLines={3}
                style={styles.input}
                placeholder="What was the most memorable moment from yesterday?"
              />
              
              <TextInput
                label="Who or what made yesterday better?"
                value={formData.madeYesterdayBetter}
                onChangeText={(text) => setFormData({ ...formData, madeYesterdayBetter: text })}
                multiline
                numberOfLines={3}
                style={styles.input}
                placeholder="What or who brought joy or positivity to your day?"
              />
              
              <TextInput
                label="What would I like to improve on today?"
                value={formData.improveToday}
                onChangeText={(text) => setFormData({ ...formData, improveToday: text })}
                multiline
                numberOfLines={3}
                style={styles.input}
                placeholder="What areas would you like to focus on improving today?"
              />
              
              <TextInput
                label="What could make today great?"
                value={formData.makeTodayGreat}
                onChangeText={(text) => setFormData({ ...formData, makeTodayGreat: text })}
                multiline
                numberOfLines={3}
                style={styles.input}
                placeholder="What would make today a great day for you?"
              />
              
              <Text style={styles.label}>Was I more positive or negative yesterday?</Text>
              <SegmentedButtons
                value={formData.yesterdayMood}
                onValueChange={(value) => setFormData({ ...formData, yesterdayMood: value as 'positive' | 'negative' })}
                buttons={[
                  { value: 'positive', label: 'Positive' },
                  { value: 'negative', label: 'Negative' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Open Writing Section */}
            <View style={styles.section}>
              <Title style={styles.subsectionTitle}>Open Writing</Title>
              
              <TextInput
                label="Affirmations for the day"
                value={formData.affirmations}
                onChangeText={(text) => setFormData({ ...formData, affirmations: text })}
                multiline
                numberOfLines={4}
                style={styles.input}
                placeholder="Write positive affirmations to start your day..."
              />
              
              <TextInput
                label="Any and all thoughts"
                value={formData.openThoughts}
                onChangeText={(text) => setFormData({ ...formData, openThoughts: text })}
                multiline
                numberOfLines={6}
                style={styles.input}
                placeholder="Write freely about anything on your mind..."
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
                Save Entry
              </Button>
            </View>
          </Card.Content>
        </Card>
      ) : (
        <>
          <Card style={styles.welcomeCard}>
            <Card.Content>
              <Title style={styles.welcomeTitle}>Daily Journal</Title>
              <Paragraph style={styles.welcomeText}>
                Take a moment to reflect on yesterday and set intentions for today.
              </Paragraph>
              <Button
                mode="contained"
                onPress={() => setIsEditing(true)}
                style={styles.startButton}
                icon="plus"
              >
                Start Today's Entry
              </Button>
            </Card.Content>
          </Card>

          {recentEntries.length > 0 && (
            <View style={styles.recentSection}>
              <Title style={styles.sectionTitle}>Recent Entries</Title>
              {recentEntries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  onPress={() => handleEditEntry(entry)}
                >
                  <Card style={styles.entryCard}>
                    <Card.Content>
                      <View style={styles.entryHeader}>
                        <View style={styles.entryInfo}>
                          <Title style={styles.entryTitle}>{entry.title}</Title>
                          <Text style={styles.entryDate}>
                            {entry.date.toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={[styles.moodIndicator, { backgroundColor: getMoodColor(entry.mood) + '20' }]}>
                          <Text style={styles.moodIcon}>{getMoodIcon(entry.mood)}</Text>
                        </View>
                      </View>
                      <Paragraph style={styles.entryPreview}>
                        {entry.content.length > 100 
                          ? entry.content.substring(0, 100) + '...' 
                          : entry.content}
                      </Paragraph>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  welcomeCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#6366f1',
  },
  editingCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#374151',
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
  recentSection: {
    margin: 16,
    marginTop: 8,
  },
  entryCard: {
    marginBottom: 12,
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1f2937',
  },
  entryDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  moodIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodIcon: {
    fontSize: 16,
  },
  entryPreview: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
});

export default JournalScreen;
