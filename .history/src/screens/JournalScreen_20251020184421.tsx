import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { JournalEntry, RootStackParamList } from '../types';

type JournalScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const JournalScreen = () => {
  const navigation = useNavigation<JournalScreenNavigationProp>();
  const { state, deleteJournalEntry } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddEntry = () => {
    navigation.navigate('JournalDetail', {});
  };

  const handleEditEntry = (entry: JournalEntry) => {
    navigation.navigate('JournalDetail', { entryId: entry.id });
  };

  const handleDeleteEntry = (entry: JournalEntry) => {
    deleteJournalEntry(entry.id);
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

  const filteredEntries = state.journalEntries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderEntry = ({ item: entry }: { item: JournalEntry }) => {
    const moodColor = getMoodColor(entry.mood);
    const moodIcon = getMoodIcon(entry.mood);
    const preview = entry.content.length > 100 
      ? entry.content.substring(0, 100) + '...' 
      : entry.content;

    return (
      <Card style={styles.entryCard}>
        <Card.Content>
          <View style={styles.entryHeader}>
            <View style={styles.entryInfo}>
              <Title style={styles.entryTitle}>{entry.title}</Title>
              <Text style={styles.entryDate}>
                {entry.date.toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.entryActions}>
              <View style={[styles.moodIndicator, { backgroundColor: moodColor }]}>
                <Text style={styles.moodIcon}>{moodIcon}</Text>
              </View>
              <IconButton
                icon="delete"
                size={20}
                onPress={() => handleDeleteEntry(entry)}
                iconColor="#ef4444"
              />
            </View>
          </View>

          <Paragraph style={styles.entryPreview}>
            {preview}
          </Paragraph>

          {entry.tags.length > 0 && (
            <View style={styles.tagsContainer}>
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
          )}
        </Card.Content>
        <Card.Actions>
          <TouchableOpacity
            style={styles.readMoreButton}
            onPress={() => handleEditEntry(entry)}
          >
            <Text style={styles.readMoreText}>Read More</Text>
            <Ionicons name="chevron-forward" size={16} color="#6366f1" />
          </TouchableOpacity>
        </Card.Actions>
      </Card>
    );
  };

  if (state.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading journal entries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search entries..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <FlatList
        data={filteredEntries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#9ca3af" />
            <Title style={styles.emptyTitle}>No Journal Entries</Title>
            <Paragraph style={styles.emptyDescription}>
              Start documenting your thoughts and experiences!
            </Paragraph>
          </View>
        }
      />
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddEntry}
        label="New Entry"
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
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  entryCard: {
    marginBottom: 16,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  moodIcon: {
    fontSize: 16,
  },
  entryPreview: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
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
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  readMoreText: {
    color: '#6366f1',
    fontWeight: '600',
    marginRight: 4,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366f1',
  },
});

export default JournalScreen;
