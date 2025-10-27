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
            
            <TextInput
              label="Content *"
              value={formData.content}
              onChangeText={(text) => setFormData({ ...formData, content: text })}
              multiline
              numberOfLines={10}
              style={styles.input}
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

            <Paragraph style={styles.entryContent}>
              {entry?.content}
            </Paragraph>

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
});

export default JournalDetailScreen;
