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
  Dropdown,
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
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    dateFrom: '',
    dateTo: '',
    mood: '' as '' | 'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad',
    searchInContent: true,
    searchInStructured: true,
    searchInTitle: true,
  });

  // Grid view states
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showGridSettings, setShowGridSettings] = useState(true);
  const [dateRange, setDateRange] = useState(7);
  const [selectedPrompts, setSelectedPrompts] = useState({
    memorableMoment: true,
    madeYesterdayBetter: true,
    improveToday: true,
    makeTodayGreat: true,
    yesterdayMood: true,
    affirmations: true,
    openThoughts: true,
  });
  
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

  // Search and filter logic
  const filteredEntries = useMemo(() => {
    let filtered = state.journalEntries;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => {
        const matchesTitle = searchFilters.searchInTitle && 
          entry.title.toLowerCase().includes(query);
        
        const matchesContent = searchFilters.searchInContent && 
          entry.content.toLowerCase().includes(query);
        
        const matchesStructured = searchFilters.searchInStructured && (
          (entry.memorableMoment && entry.memorableMoment.toLowerCase().includes(query)) ||
          (entry.madeYesterdayBetter && entry.madeYesterdayBetter.toLowerCase().includes(query)) ||
          (entry.improveToday && entry.improveToday.toLowerCase().includes(query)) ||
          (entry.makeTodayGreat && entry.makeTodayGreat.toLowerCase().includes(query)) ||
          (entry.affirmations && entry.affirmations.toLowerCase().includes(query)) ||
          (entry.openThoughts && entry.openThoughts.toLowerCase().includes(query))
        );

        return matchesTitle || matchesContent || matchesStructured;
      });
    }

    // Filter by mood
    if (searchFilters.mood) {
      filtered = filtered.filter(entry => entry.mood === searchFilters.mood);
    }

    // Filter by date range
    if (searchFilters.dateFrom) {
      const fromDate = new Date(searchFilters.dateFrom);
      filtered = filtered.filter(entry => entry.date >= fromDate);
    }

    if (searchFilters.dateTo) {
      const toDate = new Date(searchFilters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      filtered = filtered.filter(entry => entry.date <= toDate);
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [state.journalEntries, searchQuery, searchFilters]);

  const recentEntries = filteredEntries.slice(0, 5);

  // Grid view data processing
  const gridData = useMemo(() => {
    if (viewMode !== 'grid') return null;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - dateRange);

    const entriesInRange = state.journalEntries
      .filter(entry => entry.date >= startDate && entry.date <= endDate)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const selectedPromptKeys = Object.entries(selectedPrompts)
      .filter(([_, selected]) => selected)
      .map(([key, _]) => key);

    return {
      entries: entriesInRange,
      prompts: selectedPromptKeys,
      dateRange: { start: startDate, end: endDate }
    };
  }, [state.journalEntries, viewMode, dateRange, selectedPrompts]);

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) {
      return <Text>{text}</Text>;
    }
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <Text key={index} style={styles.highlightedText}>{part}</Text>
      ) : (
        <Text key={index}>{part}</Text>
      )
    );
  };

  // Get highlighted preview text based on search query
  const getHighlightedPreview = (entry: JournalEntry) => {
    if (!searchQuery.trim()) {
      return (
        <Text style={styles.entryPreview}>
          {entry.content.length > 100 
      ? entry.content.substring(0, 100) + '...' 
            : entry.content}
        </Text>
      );
    }

    // Find the best matching section for highlighting
    const query = searchQuery.toLowerCase();
    const content = entry.content.toLowerCase();
    const title = entry.title.toLowerCase();
    
    // Check if title matches
    if (title.includes(query)) {
    return (
        <View>
          <Text style={styles.highlightedTitle}>
            {highlightText(entry.title, searchQuery)}
          </Text>
          <Text style={styles.entryPreview}>
            {entry.content.length > 100 
              ? entry.content.substring(0, 100) + '...' 
              : entry.content}
              </Text>
            </View>
      );
    }
    
    // Check if content matches
    if (content.includes(query)) {
      const index = content.indexOf(query);
      const start = Math.max(0, index - 30);
      const end = Math.min(content.length, index + query.length + 70);
      const preview = entry.content.substring(start, end);
      const prefix = start > 0 ? '...' : '';
      const suffix = end < content.length ? '...' : '';
      
      return (
        <Text style={styles.entryPreview}>
          {prefix}{highlightText(preview, searchQuery)}{suffix}
        </Text>
      );
    }
    
    // Check structured fields
    const structuredFields = [
      { field: entry.memorableMoment, label: '💭 Memorable Moment', icon: '💭' },
      { field: entry.madeYesterdayBetter, label: '✨ Made Yesterday Better', icon: '✨' },
      { field: entry.improveToday, label: '🎯 Improve Today', icon: '🎯' },
      { field: entry.makeTodayGreat, label: '🌟 Make Today Great', icon: '🌟' },
      { field: entry.affirmations, label: '💪 Affirmations', icon: '💪' },
      { field: entry.openThoughts, label: '💭 Open Thoughts', icon: '💭' }
    ].filter(item => item.field && item.field.toLowerCase().includes(query));
    
    if (structuredFields.length > 0) {
      const matchedField = structuredFields[0];
      const fieldPreview = matchedField.field.length > 100 
        ? matchedField.field.substring(0, 100) + '...' 
        : matchedField.field;
      
      return (
        <View>
          <Text style={styles.entryPreview}>
            {entry.content.length > 100 
              ? entry.content.substring(0, 100) + '...' 
              : entry.content}
          </Text>
          <Text style={styles.structuredMatch}>
            {matchedField.icon} {highlightText(fieldPreview, searchQuery)}
          </Text>
            </View>
      );
    }
    
    // Fallback to regular content
    return (
      <Text style={styles.entryPreview}>
        {entry.content.length > 100 
          ? entry.content.substring(0, 100) + '...' 
          : entry.content}
      </Text>
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with View Toggle */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.headerSpacer} />
          <Menu
            visible={showViewMenu}
            onDismiss={() => setShowViewMenu(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setShowViewMenu(true)}
                style={styles.viewToggleButton}
                icon={viewMode === 'list' ? 'view-list' : 'view-grid'}
              >
                {viewMode === 'list' ? 'List View' : 'Grid View'}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setViewMode('list');
                setShowViewMenu(false);
              }}
              title="List View"
              leadingIcon="view-list"
            />
            <Menu.Item
              onPress={() => {
                setViewMode('grid');
                setShowViewMenu(false);
              }}
              title="Grid View"
              leadingIcon="view-grid"
            />
          </Menu>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search journal entries..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          right={() => (
            <IconButton
              icon="filter"
              size={20}
              onPress={() => setShowSearchFilters(!showSearchFilters)}
              iconColor={showSearchFilters ? '#6366f1' : '#6b7280'}
            />
          )}
        />
        
        {/* Search Filters */}
        {showSearchFilters && (
          <Card style={styles.filtersCard}>
            <Card.Content>
              <Title style={styles.filtersTitle}>Search Filters</Title>
              
              {/* Date Range Filters */}
              <View style={styles.filterRow}>
                <TextInput
                  label="From Date"
                  value={searchFilters.dateFrom}
                  onChangeText={(text) => setSearchFilters({...searchFilters, dateFrom: text})}
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                />
                <TextInput
                  label="To Date"
                  value={searchFilters.dateTo}
                  onChangeText={(text) => setSearchFilters({...searchFilters, dateTo: text})}
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              
              {/* Mood Filter */}
              <Text style={styles.filterLabel}>Mood Filter</Text>
              <SegmentedButtons
                value={searchFilters.mood}
                onValueChange={(value) => setSearchFilters({...searchFilters, mood: value as any})}
                buttons={[
                  { value: '', label: 'All' },
                  { value: 'very-happy', label: '😄' },
                  { value: 'happy', label: '😊' },
                  { value: 'neutral', label: '😐' },
                  { value: 'sad', label: '😔' },
                  { value: 'very-sad', label: '😢' },
                ]}
                style={styles.moodFilter}
              />
              
              {/* Search Scope */}
              <Text style={styles.filterLabel}>Search In</Text>
              <View style={styles.checkboxContainer}>
                <View style={styles.checkboxRow}>
                  <Checkbox
                    status={searchFilters.searchInTitle ? 'checked' : 'unchecked'}
                    onPress={() => setSearchFilters({...searchFilters, searchInTitle: !searchFilters.searchInTitle})}
                  />
                  <Text>Title</Text>
                </View>
                <View style={styles.checkboxRow}>
                  <Checkbox
                    status={searchFilters.searchInContent ? 'checked' : 'unchecked'}
                    onPress={() => setSearchFilters({...searchFilters, searchInContent: !searchFilters.searchInContent})}
                  />
                  <Text>Content</Text>
                </View>
                <View style={styles.checkboxRow}>
                  <Checkbox
                    status={searchFilters.searchInStructured ? 'checked' : 'unchecked'}
                    onPress={() => setSearchFilters({...searchFilters, searchInStructured: !searchFilters.searchInStructured})}
                  />
                  <Text>Structured Fields</Text>
                </View>
              </View>
              
              {/* Clear Filters */}
              <Button
                mode="outlined"
                onPress={() => {
                  setSearchQuery('');
                  setSearchFilters({
                    dateFrom: '',
                    dateTo: '',
                    mood: '',
                    searchInContent: true,
                    searchInStructured: true,
                    searchInTitle: true,
                  });
                }}
                style={styles.clearFiltersButton}
              >
                Clear All Filters
              </Button>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Grid View Controls */}
      {viewMode === 'grid' && (
        <Card style={styles.gridControlsCard}>
          <Card.Content>
            <View style={styles.gridControlsHeader}>
              <Title style={styles.gridControlsTitle}>Grid View Settings</Title>
              <IconButton
                icon={showGridSettings ? 'chevron-up' : 'chevron-down'}
                size={20}
                onPress={() => setShowGridSettings(!showGridSettings)}
                iconColor="#6b7280"
              />
            </View>
            
            {showGridSettings && (
              <View>
            
            {/* Date Range Selector */}
            <Text style={styles.controlLabel}>Date Range</Text>
            <SegmentedButtons
              value={dateRange.toString()}
              onValueChange={(value) => setDateRange(parseInt(value))}
              buttons={[
                { value: '7', label: '7 Days' },
                { value: '15', label: '15 Days' },
                { value: '30', label: '30 Days' },
              ]}
              style={styles.dateRangeSelector}
            />
            
            {/* Prompt Selector */}
            <Text style={styles.controlLabel}>Select Prompts to Display</Text>
            <View style={styles.promptSelector}>
              <View style={styles.promptRow}>
                <View style={styles.promptItem}>
                  <Checkbox
                    status={selectedPrompts.memorableMoment ? 'checked' : 'unchecked'}
                    onPress={() => setSelectedPrompts({...selectedPrompts, memorableMoment: !selectedPrompts.memorableMoment})}
                  />
                  <Text style={styles.promptLabel}>💭 Memorable Moment</Text>
                </View>
                <View style={styles.promptItem}>
                  <Checkbox
                    status={selectedPrompts.madeYesterdayBetter ? 'checked' : 'unchecked'}
                    onPress={() => setSelectedPrompts({...selectedPrompts, madeYesterdayBetter: !selectedPrompts.madeYesterdayBetter})}
                  />
                  <Text style={styles.promptLabel}>✨ Made Yesterday Better</Text>
                </View>
              </View>
              <View style={styles.promptRow}>
                <View style={styles.promptItem}>
                  <Checkbox
                    status={selectedPrompts.improveToday ? 'checked' : 'unchecked'}
                    onPress={() => setSelectedPrompts({...selectedPrompts, improveToday: !selectedPrompts.improveToday})}
                  />
                  <Text style={styles.promptLabel}>🎯 Improve Today</Text>
                </View>
                <View style={styles.promptItem}>
                  <Checkbox
                    status={selectedPrompts.makeTodayGreat ? 'checked' : 'unchecked'}
                    onPress={() => setSelectedPrompts({...selectedPrompts, makeTodayGreat: !selectedPrompts.makeTodayGreat})}
                  />
                  <Text style={styles.promptLabel}>🌟 Make Today Great</Text>
                </View>
              </View>
              <View style={styles.promptRow}>
                <View style={styles.promptItem}>
                  <Checkbox
                    status={selectedPrompts.yesterdayMood ? 'checked' : 'unchecked'}
                    onPress={() => setSelectedPrompts({...selectedPrompts, yesterdayMood: !selectedPrompts.yesterdayMood})}
                  />
                  <Text style={styles.promptLabel}>😊 Yesterday's Mood</Text>
                </View>
                <View style={styles.promptItem}>
                  <Checkbox
                    status={selectedPrompts.affirmations ? 'checked' : 'unchecked'}
                    onPress={() => setSelectedPrompts({...selectedPrompts, affirmations: !selectedPrompts.affirmations})}
                  />
                  <Text style={styles.promptLabel}>💪 Affirmations</Text>
                </View>
              </View>
              <View style={styles.promptRow}>
                <View style={styles.promptItem}>
                  <Checkbox
                    status={selectedPrompts.openThoughts ? 'checked' : 'unchecked'}
                    onPress={() => setSelectedPrompts({...selectedPrompts, openThoughts: !selectedPrompts.openThoughts})}
                  />
                  <Text style={styles.promptLabel}>💭 Open Thoughts</Text>
                </View>
              </View>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

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
          {viewMode === 'list' && (
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
          )}

          {filteredEntries.length > 0 && viewMode === 'list' && (
            <View style={styles.recentSection}>
              <View style={styles.sectionHeader}>
                <Title style={styles.sectionTitle}>
                  {searchQuery || searchFilters.mood || searchFilters.dateFrom || searchFilters.dateTo 
                    ? `Search Results (${filteredEntries.length})` 
                    : 'Recent Entries'
                  }
                </Title>
                {(searchQuery || searchFilters.mood || searchFilters.dateFrom || searchFilters.dateTo) && (
                  <Button
                    mode="text"
                    onPress={() => {
                      setSearchQuery('');
                      setSearchFilters({
                        dateFrom: '',
                        dateTo: '',
                        mood: '',
                        searchInContent: true,
                        searchInStructured: true,
                        searchInTitle: true,
                      });
                    }}
                    style={styles.clearSearchButton}
                  >
                    Clear Search
                  </Button>
                )}
              </View>
              {filteredEntries.map((entry) => (
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
                      <View style={styles.entryPreviewContainer}>
                        {getHighlightedPreview(entry)}
                      </View>
                      
                      {/* Show structured fields preview if they exist and no search highlighting is shown */}
                      {(entry.memorableMoment || entry.affirmations || entry.openThoughts) && !searchQuery.trim() && (
                        <View style={styles.structuredPreview}>
                          {entry.memorableMoment && (
                            <Text style={styles.structuredText}>
                              💭 {entry.memorableMoment.length > 50 
                                ? entry.memorableMoment.substring(0, 50) + '...' 
                                : entry.memorableMoment}
                            </Text>
                          )}
                          {entry.affirmations && (
                            <Text style={styles.structuredText}>
                              ✨ {entry.affirmations.length > 50 
                                ? entry.affirmations.substring(0, 50) + '...' 
                                : entry.affirmations}
                            </Text>
                          )}
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* No results message */}
          {filteredEntries.length === 0 && (searchQuery || searchFilters.mood || searchFilters.dateFrom || searchFilters.dateTo) && viewMode === 'list' && (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={64} color="#9ca3af" />
              <Title style={styles.noResultsTitle}>No Results Found</Title>
              <Paragraph style={styles.noResultsDescription}>
                Try adjusting your search criteria or filters.
              </Paragraph>
              <Button
                mode="outlined"
                onPress={() => {
                  setSearchQuery('');
                  setSearchFilters({
                    dateFrom: '',
                    dateTo: '',
                    mood: '',
                    searchInContent: true,
                    searchInStructured: true,
                    searchInTitle: true,
                  });
                }}
                style={styles.clearSearchButton}
              >
                Clear Search
              </Button>
            </View>
          )}
        </>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && gridData && (
        <View style={styles.gridContainer}>
          <Title style={styles.gridTitle}>
            Journal Grid - Last {dateRange} Days
          </Title>
          
          {gridData.entries.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.gridTable}>
                {/* Header Row */}
                <View style={styles.gridHeaderRow}>
                  <View style={styles.gridDateHeader}>
                    <Text style={styles.gridHeaderText}>Date</Text>
                  </View>
                  {gridData.prompts.map((promptKey) => {
                    const promptLabels = {
                      memorableMoment: '💭 Memorable',
                      madeYesterdayBetter: '✨ Made Better',
                      improveToday: '🎯 Improve',
                      makeTodayGreat: '🌟 Make Great',
                      yesterdayMood: '😊 Mood',
                      affirmations: '💪 Affirmations',
                      openThoughts: '💭 Thoughts'
                    };
                    return (
                      <View key={promptKey} style={styles.gridPromptHeader}>
                        <Text style={styles.gridHeaderText}>
                          {promptLabels[promptKey as keyof typeof promptLabels]}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Data Rows */}
                {gridData.entries.map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    onPress={() => handleEditEntry(entry)}
                    style={styles.gridDataRow}
                  >
                    <View style={styles.gridDateCell}>
                      <Text style={styles.gridDateText}>
                        {entry.date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Text>
                      <Text style={styles.gridWeekdayText}>
                        {entry.date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                    </View>
                    {gridData.prompts.map((promptKey) => {
                      const value = entry[promptKey as keyof JournalEntry];
                      const displayValue = promptKey === 'yesterdayMood' 
                        ? (value === 'positive' ? '😊' : '😔')
                        : value || '';
                      
                      return (
                        <View key={promptKey} style={styles.gridPromptCell}>
                          <Text style={styles.gridCellText} numberOfLines={3}>
                            {displayValue}
                          </Text>
                        </View>
                      );
                    })}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.gridEmptyContainer}>
              <Ionicons name="grid-outline" size={64} color="#9ca3af" />
              <Title style={styles.gridEmptyTitle}>No Entries Found</Title>
              <Paragraph style={styles.gridEmptyDescription}>
                No journal entries found for the selected date range.
              </Paragraph>
            </View>
          )}
        </View>
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
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
    marginBottom: 8,
  },
  filtersCard: {
    marginTop: 8,
    elevation: 1,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#374151',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  moodFilter: {
    marginBottom: 16,
  },
  checkboxContainer: {
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearFiltersButton: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearSearchButton: {
    alignSelf: 'flex-start',
  },
  structuredPreview: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  structuredText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  noResultsTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
  noResultsDescription: {
    textAlign: 'center',
    color: '#9ca3af',
    marginBottom: 24,
    lineHeight: 20,
  },
  entryPreviewContainer: {
    marginBottom: 8,
  },
  highlightedText: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontWeight: '600',
  },
  highlightedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1f2937',
  },
  structuredMatch: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 6,
  },
  // Header styles
  headerContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  headerSpacer: {
    flex: 1,
  },
  viewToggleButton: {
    borderRadius: 8,
  },
  // Grid view styles
  gridControlsCard: {
    margin: 16,
    marginTop: 8,
    elevation: 1,
  },
  gridControlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridControlsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  dateRangeSelector: {
    marginBottom: 16,
  },
  promptSelector: {
    marginTop: 8,
  },
  promptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  promptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  promptLabel: {
    fontSize: 12,
    marginLeft: 4,
    color: '#374151',
  },
  gridContainer: {
    margin: 16,
    marginTop: 8,
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1f2937',
  },
  gridTable: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 1,
    overflow: 'hidden',
  },
  gridHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  gridDateHeader: {
    width: 80,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridPromptHeader: {
    width: 120,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  gridDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  gridDateCell: {
    width: 80,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  gridWeekdayText: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
  },
  gridPromptCell: {
    width: 120,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  gridCellText: {
    fontSize: 11,
    color: '#4b5563',
    lineHeight: 16,
  },
  gridEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  gridEmptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
  gridEmptyDescription: {
    textAlign: 'center',
    color: '#9ca3af',
    lineHeight: 20,
  },
});

export default JournalScreen;
