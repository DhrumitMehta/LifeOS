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
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { JournalEntry, RootStackParamList } from '../types';

type JournalDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'JournalDetail'>;
type JournalDetailScreenRouteProp = RouteProp<RootStackParamList, 'JournalDetail'>;

const JournalDetailScreen = () => {
  const navigation = useNavigation<JournalDetailScreenNavigationProp>();
  const route = useRoute<JournalDetailScreenRouteProp>();
  const { state, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useApp();
  
  const [isEditing, setIsEditing] = useState(false);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: 'neutral' as 'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad',
    tags: [] as string[],
    date: new Date(),
    // New structured format fields
    memorableMoment: '',
    madeYesterdayBetter: '',
    improveToday: '',
    makeTodayGreat: '',
    yesterdayMood: 'positive' as 'positive' | 'negative',
    affirmations: '',
    openThoughts: '',
  });
  const [newTag, setNewTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (route.params.entryId) {
      const foundEntry = state.journalEntries.find(e => e.id === route.params.entryId);
      if (foundEntry) {
        setEntry(foundEntry);
        setFormData({
          title: foundEntry.title,
          content: foundEntry.content,
          mood: foundEntry.mood,
          tags: foundEntry.tags,
          date: foundEntry.date,
          memorableMoment: foundEntry.memorableMoment || '',
          madeYesterdayBetter: foundEntry.madeYesterdayBetter || '',
          improveToday: foundEntry.improveToday || '',
          makeTodayGreat: foundEntry.makeTodayGreat || '',
          yesterdayMood: foundEntry.yesterdayMood || 'positive',
          affirmations: foundEntry.affirmations || '',
          openThoughts: foundEntry.openThoughts || '',
        });
      }
    } else {
      setIsEditing(true);
    }
  }, [route.params.entryId, state.journalEntries]);

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }

    try {
      if (entry) {
        const updatedEntry: JournalEntry = {
          ...entry,
          ...formData,
          updatedAt: new Date(),
        };
        await updateJournalEntry(updatedEntry);
        setEntry(updatedEntry);
      } else {
        await addJournalEntry(formData);
        navigation.goBack();
      }
      setIsEditing(false);
      Alert.alert('Success', 'Journal entry saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save journal entry');
    }
  };

  const handleDelete = () => {
    if (!entry) return;
    
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete "${entry.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJournalEntry(entry.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete journal entry');
            }
          },
        },
      ]
    );
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
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

  if (!entry && !isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading journal entry...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {isEditing ? (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Journal Entry</Title>
            
            <TextInput
              label="Title *"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              style={styles.input}
            />
            
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
            
            <Text style={styles.label}>Mood</Text>
            <SegmentedButtons
              value={formData.mood}
              onValueChange={(value) => setFormData({ ...formData, mood: value as any })}
              buttons={[
                { value: 'very-happy', label: '😄' },
                { value: 'happy', label: '😊' },
                { value: 'neutral', label: '😐' },
                { value: 'sad', label: '😔' },
                { value: 'very-sad', label: '😢' },
              ]}
              style={styles.segmentedButtons}
            />
            
            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                label="Add tag"
                value={newTag}
                onChangeText={setNewTag}
                style={styles.tagInput}
                onSubmitEditing={handleAddTag}
              />
              <Button
                mode="outlined"
                onPress={handleAddTag}
                style={styles.addTagButton}
              >
                Add
              </Button>
            </View>
            
            {formData.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    onClose={() => handleRemoveTag(tag)}
                    style={styles.tag}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            )}
            
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
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.entryHeader}>
              <View style={styles.entryInfo}>
                <Title style={styles.entryTitle}>{entry?.title}</Title>
                <Text style={styles.entryDate}>
                  {entry?.date.toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.entryActions}>
                <View style={[styles.moodIndicator, { backgroundColor: getMoodColor(entry?.mood || 'neutral') + '20' }]}>
                  <Text style={styles.moodIcon}>{getMoodIcon(entry?.mood || 'neutral')}</Text>
                </View>
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

            {/* Questions/Prompts Display */}
            {(entry?.memorableMoment || entry?.madeYesterdayBetter || entry?.improveToday || entry?.makeTodayGreat || entry?.yesterdayMood) && (
              <View style={styles.section}>
                <Title style={styles.subsectionTitle}>Questions/Prompts to Answer</Title>
                
                {entry?.memorableMoment && (
                  <View style={styles.questionItem}>
                    <Text style={styles.questionLabel}>Memorable moment of yesterday?</Text>
                    <Text style={styles.questionAnswer}>{entry.memorableMoment}</Text>
                  </View>
                )}
                
                {entry?.madeYesterdayBetter && (
                  <View style={styles.questionItem}>
                    <Text style={styles.questionLabel}>Who or what made yesterday better?</Text>
                    <Text style={styles.questionAnswer}>{entry.madeYesterdayBetter}</Text>
                  </View>
                )}
                
                {entry?.improveToday && (
                  <View style={styles.questionItem}>
                    <Text style={styles.questionLabel}>What would I like to improve on today?</Text>
                    <Text style={styles.questionAnswer}>{entry.improveToday}</Text>
                  </View>
                )}
                
                {entry?.makeTodayGreat && (
                  <View style={styles.questionItem}>
                    <Text style={styles.questionLabel}>What could make today great?</Text>
                    <Text style={styles.questionAnswer}>{entry.makeTodayGreat}</Text>
                  </View>
                )}
                
                {entry?.yesterdayMood && (
                  <View style={styles.questionItem}>
                    <Text style={styles.questionLabel}>Was I more positive or negative yesterday?</Text>
                    <Text style={styles.questionAnswer}>{entry.yesterdayMood === 'positive' ? 'Positive' : 'Negative'}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Open Writing Display */}
            {(entry?.affirmations || entry?.openThoughts) && (
              <View style={styles.section}>
                <Title style={styles.subsectionTitle}>Open Writing</Title>
                
                {entry?.affirmations && (
                  <View style={styles.questionItem}>
                    <Text style={styles.questionLabel}>Affirmations for the day</Text>
                    <Text style={styles.questionAnswer}>{entry.affirmations}</Text>
                  </View>
                )}
                
                {entry?.openThoughts && (
                  <View style={styles.questionItem}>
                    <Text style={styles.questionLabel}>Any and all thoughts</Text>
                    <Text style={styles.questionAnswer}>{entry.openThoughts}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Fallback to content if structured data is not available */}
            {!entry?.memorableMoment && !entry?.madeYesterdayBetter && !entry?.improveToday && 
             !entry?.makeTodayGreat && !entry?.yesterdayMood && !entry?.affirmations && 
             !entry?.openThoughts && entry?.content && (
              <Paragraph style={styles.entryContent}>
                {entry.content}
              </Paragraph>
            )}

            {entry?.tags && entry.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                <Text style={styles.tagsLabel}>Tags:</Text>
                <View style={styles.tagsRow}>
                  {entry.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      style={styles.tag}
                      textStyle={styles.tagText}
                    >
                      {tag}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.metadata}>
              <Text style={styles.metadataText}>
                Created: {entry?.createdAt.toLocaleString()}
              </Text>
              {entry?.updatedAt && entry.updatedAt.getTime() !== entry.createdAt.getTime() && (
                <Text style={styles.metadataText}>
                  Updated: {entry.updatedAt.toLocaleString()}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>
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
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    alignSelf: 'flex-end',
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#e5e7eb',
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  moodIcon: {
    fontSize: 20,
  },
  entryContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 16,
  },
  metadata: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  metadataText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  section: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#374151',
  },
  questionItem: {
    marginBottom: 16,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  questionAnswer: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
});

export default JournalDetailScreen;
