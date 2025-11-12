import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  Checkbox,
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { TabParamList } from '../types';
import { 
  getRandomEntryFromDatabase, 
  extractPageTitle, 
  extractRichText,
  testNotionConnection,
} from '../services/notion';

type HomeScreenNavigationProp = BottomTabNavigationProp<TabParamList, 'Home'>;

interface DailyChecklist {
  transactionsAdded: boolean;
  journalEntryAdded: boolean;
  habitsLogged: boolean;
  date: string; // ISO date string
}

interface NotionContent {
  highlight: { title: string; content: string } | null;
  idea: { title: string; content: string } | null;
}

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { state } = useApp();
  const [checklist, setChecklist] = useState<DailyChecklist>({
    transactionsAdded: false,
    journalEntryAdded: false,
    habitsLogged: false,
    date: new Date().toISOString().split('T')[0],
  });
  const [notionContent, setNotionContent] = useState<NotionContent>({
    highlight: null,
    idea: null,
  });
  const [loadingNotion, setLoadingNotion] = useState(false);

  // Load checklist for today
  useEffect(() => {
    loadTodayChecklist();
    loadNotionContent();
  }, []);

  // Reload Notion content when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadNotionContent();
    }, [])
  );

  // Load Notion content (highlights and ideas)
  const loadNotionContent = async () => {
    try {
      // Get token from AsyncStorage directly
      const token = await AsyncStorage.getItem('notion_integration_token');
      if (!token) {
        return; // Not connected to Notion
      }

      // Test connection first
      const isConnected = await testNotionConnection(token);
      if (!isConnected) {
        return; // Connection failed
      }

      setLoadingNotion(true);

      // Load random highlight and idea in parallel
      const [highlightPage, ideaPage] = await Promise.all([
        getRandomEntryFromDatabase('Highlights', token),
        getRandomEntryFromDatabase('Ideas', token),
      ]);

      const content: NotionContent = {
        highlight: null,
        idea: null,
      };

      if (highlightPage) {
        // Extract title and content from highlight
        const title = extractPageTitle(highlightPage);
        // Try to find a content property (could be rich_text, paragraph, etc.)
        let contentText = '';
        for (const [key, value] of Object.entries(highlightPage.properties || {})) {
          if (value.type === 'rich_text') {
            contentText = extractRichText(value);
            if (contentText) break;
          }
        }
        // If no rich_text property, try to get blocks
        if (!contentText) {
          try {
            const { getAllPageBlocks, formatBlocksAsText } = await import('../services/notion');
            const blocks = await getAllPageBlocks(highlightPage.id, token);
            contentText = formatBlocksAsText(blocks).substring(0, 200); // Limit to 200 chars
          } catch (error) {
            console.error('Error getting highlight blocks:', error);
          }
        }
        content.highlight = { title, content: contentText || 'No content available' };
      }

      if (ideaPage) {
        // Extract title and content from idea
        const title = extractPageTitle(ideaPage);
        let contentText = '';
        for (const [key, value] of Object.entries(ideaPage.properties || {})) {
          if (value.type === 'rich_text') {
            contentText = extractRichText(value);
            if (contentText) break;
          }
        }
        // If no rich_text property, try to get blocks
        if (!contentText) {
          try {
            const { getAllPageBlocks, formatBlocksAsText } = await import('../services/notion');
            const blocks = await getAllPageBlocks(ideaPage.id, token);
            contentText = formatBlocksAsText(blocks).substring(0, 200); // Limit to 200 chars
          } catch (error) {
            console.error('Error getting idea blocks:', error);
          }
        }
        content.idea = { title, content: contentText || 'No content available' };
      }

      setNotionContent(content);
    } catch (error) {
      console.error('Error loading Notion content:', error);
    } finally {
      setLoadingNotion(false);
    }
  };

  // Load a new random highlight
  const loadNewHighlight = async () => {
    try {
      const token = await AsyncStorage.getItem('notion_integration_token');
      if (!token) {
        return;
      }

      setLoadingNotion(true);
      const highlightPage = await getRandomEntryFromDatabase('Highlights', token);

      if (highlightPage) {
        const title = extractPageTitle(highlightPage);
        let contentText = '';
        for (const [key, value] of Object.entries(highlightPage.properties || {})) {
          if (value.type === 'rich_text') {
            contentText = extractRichText(value);
            if (contentText) break;
          }
        }
        if (!contentText) {
          try {
            const { getAllPageBlocks, formatBlocksAsText } = await import('../services/notion');
            const blocks = await getAllPageBlocks(highlightPage.id, token);
            contentText = formatBlocksAsText(blocks).substring(0, 200);
          } catch (error) {
            console.error('Error getting highlight blocks:', error);
          }
        }
        setNotionContent(prev => ({
          ...prev,
          highlight: { title, content: contentText || 'No content available' },
        }));
      }
    } catch (error) {
      console.error('Error loading new highlight:', error);
    } finally {
      setLoadingNotion(false);
    }
  };

  // Load a new random idea
  const loadNewIdea = async () => {
    try {
      const token = await AsyncStorage.getItem('notion_integration_token');
      if (!token) {
        return;
      }

      setLoadingNotion(true);
      const ideaPage = await getRandomEntryFromDatabase('Ideas', token);

      if (ideaPage) {
        const title = extractPageTitle(ideaPage);
        let contentText = '';
        for (const [key, value] of Object.entries(ideaPage.properties || {})) {
          if (value.type === 'rich_text') {
            contentText = extractRichText(value);
            if (contentText) break;
          }
        }
        if (!contentText) {
          try {
            const { getAllPageBlocks, formatBlocksAsText } = await import('../services/notion');
            const blocks = await getAllPageBlocks(ideaPage.id, token);
            contentText = formatBlocksAsText(blocks).substring(0, 200);
          } catch (error) {
            console.error('Error getting idea blocks:', error);
          }
        }
        setNotionContent(prev => ({
          ...prev,
          idea: { title, content: contentText || 'No content available' },
        }));
      }
    } catch (error) {
      console.error('Error loading new idea:', error);
    } finally {
      setLoadingNotion(false);
    }
  };

  // Check if checklist needs to be reset for new day
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (checklist.date !== today) {
      // New day, reset checklist
      const newChecklist: DailyChecklist = {
        transactionsAdded: false,
        journalEntryAdded: false,
        habitsLogged: false,
        date: today,
      };
      setChecklist(newChecklist);
      saveChecklist(newChecklist);
    }
  }, []);

  const loadTodayChecklist = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = await AsyncStorage.getItem('dailyChecklist');
      
      if (stored) {
        const saved: DailyChecklist = JSON.parse(stored);
        // If it's from today, use it; otherwise create new one
        if (saved.date === today) {
          setChecklist(saved);
        } else {
          const newChecklist: DailyChecklist = {
            transactionsAdded: false,
            journalEntryAdded: false,
            habitsLogged: false,
            date: today,
          };
          setChecklist(newChecklist);
          await saveChecklist(newChecklist);
        }
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
    }
  };

  const saveChecklist = async (checklist: DailyChecklist) => {
    try {
      await AsyncStorage.setItem('dailyChecklist', JSON.stringify(checklist));
    } catch (error) {
      console.error('Error saving checklist:', error);
    }
  };

  const markAsDone = async (key: keyof DailyChecklist) => {
    if (key === 'date') return; // Don't allow changing date
    
    const updated = { ...checklist, [key]: true };
    setChecklist(updated);
    await saveChecklist(updated);
  };

  // Check if there were transactions yesterday
  const hasYesterdayTransactions = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    return state.transactions.some(t => {
      const txDate = new Date(t.date);
      return txDate >= yesterday && txDate <= yesterdayEnd;
    });
  };

  // Check if there's a journal entry today
  const hasTodayJournalEntry = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    return state.journalEntries.some(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= today && entryDate <= todayEnd;
    });
  };

  // Check if habits were logged yesterday
  const hasYesterdayHabitEntries = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    return state.habitEntries.some(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= yesterday && entryDate <= yesterdayEnd;
    });
  };

  // Auto-update checklist based on actual data
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (checklist.date === today) {
      const updated: DailyChecklist = {
        ...checklist,
        transactionsAdded: checklist.transactionsAdded || hasYesterdayTransactions(),
        journalEntryAdded: checklist.journalEntryAdded || hasTodayJournalEntry(),
        habitsLogged: checklist.habitsLogged || hasYesterdayHabitEntries(),
      };
      
      // Only update if something changed
      if (JSON.stringify(updated) !== JSON.stringify(checklist)) {
        setChecklist(updated);
        saveChecklist(updated);
      }
    }
  }, [state.transactions, state.journalEntries, state.habitEntries]);

  const handleNavigateToFinance = async () => {
    await markAsDone('transactionsAdded');
    // Navigate to Finance tab
    navigation.navigate('Finance');
  };

  const handleNavigateToJournal = async () => {
    await markAsDone('journalEntryAdded');
    // Navigate to Journal tab
    navigation.navigate('Journal');
  };

  const handleNavigateToHabits = async () => {
    await markAsDone('habitsLogged');
    // Navigate to Habits tab
    navigation.navigate('Habits');
  };

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.welcomeCard}>
        <Card.Content style={styles.welcomeContent}>
          <Title style={styles.welcomeTitle}>Good Morning! ☀️</Title>
          <Text style={styles.dateText}>{today}</Text>
          <Text style={styles.subtitle}>
            Let's start your day with a quick check-in
          </Text>
        </Card.Content>
      </Card>

      {/* Notion Highlights & Ideas */}
      {(notionContent.highlight || notionContent.idea) && (
        <>
          {notionContent.highlight && (
            <Card style={styles.notionCard}>
              <Card.Content style={styles.notionCardContent}>
                <View style={styles.notionHeader}>
                  <Ionicons name="star" size={18} color="#f59e0b" />
                  <Title style={styles.notionCardTitle}>Today's Highlight</Title>
                </View>
                <Text style={styles.notionTitle}>{notionContent.highlight.title}</Text>
                <Text style={styles.notionContent} numberOfLines={2}>
                  {notionContent.highlight.content}
                </Text>
                <Button
                  mode="text"
                  onPress={loadNewHighlight}
                  style={styles.refreshButton}
                  labelStyle={styles.refreshButtonLabel}
                  icon="refresh"
                  disabled={loadingNotion}
                  compact
                >
                  Get Another
                </Button>
              </Card.Content>
            </Card>
          )}

          {notionContent.idea && (
            <Card style={styles.notionCard}>
              <Card.Content style={styles.notionCardContent}>
                <View style={styles.notionHeader}>
                  <Ionicons name="bulb" size={18} color="#6366f1" />
                  <Title style={styles.notionCardTitle}>Today's Idea</Title>
                </View>
                <Text style={styles.notionTitle}>{notionContent.idea.title}</Text>
                <Text style={styles.notionContent} numberOfLines={2}>
                  {notionContent.idea.content}
                </Text>
                <Button
                  mode="text"
                  onPress={loadNewIdea}
                  style={styles.refreshButton}
                  labelStyle={styles.refreshButtonLabel}
                  icon="refresh"
                  disabled={loadingNotion}
                  compact
                >
                  Get Another
                </Button>
              </Card.Content>
            </Card>
          )}
        </>
      )}

      <Card style={styles.checklistCard}>
        <Card.Content style={styles.checklistContent}>
          <Title style={styles.checklistTitle}>Daily Checklist</Title>
          
          {/* Question 1: Transactions */}
          <View style={styles.questionContainer}>
            <View style={styles.questionHeader}>
              <Checkbox
                status={checklist.transactionsAdded ? 'checked' : 'unchecked'}
                onPress={() => markAsDone('transactionsAdded')}
                color="#6366f1"
              />
              <Text
                style={[
                  styles.questionText,
                  checklist.transactionsAdded && styles.questionTextStrikethrough,
                ]}
              >
                1. Did you have any transactions yesterday? If so, please add them here.
              </Text>
            </View>
            {!checklist.transactionsAdded && (
              <Button
                mode="contained"
                onPress={handleNavigateToFinance}
                style={styles.actionButton}
                icon="wallet"
              >
                Go to Finance
              </Button>
            )}
          </View>

          {/* Question 2: Journal */}
          <View style={styles.questionContainer}>
            <View style={styles.questionHeader}>
              <Checkbox
                status={checklist.journalEntryAdded ? 'checked' : 'unchecked'}
                onPress={() => markAsDone('journalEntryAdded')}
                color="#6366f1"
              />
              <Text
                style={[
                  styles.questionText,
                  checklist.journalEntryAdded && styles.questionTextStrikethrough,
                ]}
              >
                2. Let's start the day with a journal entry.
              </Text>
            </View>
            {!checklist.journalEntryAdded && (
              <Button
                mode="contained"
                onPress={handleNavigateToJournal}
                style={styles.actionButton}
                icon="book"
              >
                Go to Journal
              </Button>
            )}
          </View>

          {/* Question 3: Habits */}
          <View style={styles.questionContainer}>
            <View style={styles.questionHeader}>
              <Checkbox
                status={checklist.habitsLogged ? 'checked' : 'unchecked'}
                onPress={() => markAsDone('habitsLogged')}
                color="#6366f1"
              />
              <Text
                style={[
                  styles.questionText,
                  checklist.habitsLogged && styles.questionTextStrikethrough,
                ]}
              >
                3. Did you log your habits yesterday? If not, log them in today.
              </Text>
            </View>
            {!checklist.habitsLogged && (
              <Button
                mode="contained"
                onPress={handleNavigateToHabits}
                style={styles.actionButton}
                icon="checkmark-circle"
              >
                Go to Habits
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Completion Message */}
      {checklist.transactionsAdded && checklist.journalEntryAdded && checklist.habitsLogged && (
        <Card style={styles.completionCard}>
          <Card.Content>
            <View style={styles.completionContent}>
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
              <Title style={styles.completionTitle}>All Done! 🎉</Title>
              <Text style={styles.completionText}>
                You've completed your daily checklist. Have a great day!
              </Text>
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
  welcomeCard: {
    margin: 10,
    marginBottom: 6,
    elevation: 2,
    backgroundColor: '#6366f1',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#e0e7ff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#c7d2fe',
  },
  checklistCard: {
    margin: 10,
    marginTop: 6,
    elevation: 2,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  questionContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  questionText: {
    flex: 1,
    fontSize: 13,
    color: '#1f2937',
    marginLeft: 6,
    lineHeight: 18,
  },
  questionTextStrikethrough: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#6366f1',
    height: 32,
  },
  completionCard: {
    margin: 10,
    marginTop: 6,
    elevation: 2,
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  completionContent: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 6,
    marginBottom: 4,
  },
  completionText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  notionCard: {
    margin: 10,
    marginTop: 6,
    elevation: 2,
  },
  notionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  notionCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
    color: '#1f2937',
  },
  notionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  notionContent: {
    fontSize: 11,
    color: '#4b5563',
    lineHeight: 16,
    marginBottom: 6,
  },
  refreshButton: {
    alignSelf: 'flex-start',
    height: 24,
    marginTop: 0,
    marginBottom: 0,
  },
  refreshButtonLabel: {
    fontSize: 11,
    marginVertical: 0,
    paddingVertical: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  welcomeContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  checklistContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  notionCardContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});

export default HomeScreen;

