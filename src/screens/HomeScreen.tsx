import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {
  Title,
  Text,
  Button,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { 
  getRandomEntryFromDatabase, 
  extractPageTitle, 
  extractRichText,
  testNotionConnection,
} from '../services/notion';
import { calculateWellbeingScore } from '../services/wellbeingScore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_PADDING = 24;
const AUTO_SLIDE_INTERVAL_MS = 3500;
const SLIDE_COUNT = 4;

interface NotionContent {
  highlight: { title: string; content: string } | null;
  idea: { title: string; content: string } | null;
}

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
  if (hour >= 17 && hour < 21) return { text: 'Good Evening', emoji: '🌅' };
  return { text: 'Good Night', emoji: '🌙' };
}

const HomeScreen = () => {
  const { state } = useApp();
  const [notionContent, setNotionContent] = useState<NotionContent>({
    highlight: null,
    idea: null,
  });
  const [loadingNotion, setLoadingNotion] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  );
  const scrollRef = useRef<ScrollView>(null);
  const slideIndexRef = useRef(0);
  const autoSlideIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAutoSlide = () => {
    if (autoSlideIntervalRef.current != null) {
      clearInterval(autoSlideIntervalRef.current);
      autoSlideIntervalRef.current = null;
    }
  };

  const startAutoSlide = () => {
    stopAutoSlide();
    autoSlideIntervalRef.current = setInterval(() => {
      const next = (slideIndexRef.current + 1) % SLIDE_COUNT;
      slideIndexRef.current = next;
      setSlideIndex(next);
      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    }, AUTO_SLIDE_INTERVAL_MS);
  };

  useEffect(() => {
    loadNotionContent();
  }, []);

  // Update time every minute
  useEffect(() => {
    const tick = () =>
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      );
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-advance slides every 3.5s (paused while user is touching)
  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, []);

  const handleTouchStart = () => stopAutoSlide();
  const handleTouchEnd = () => startAutoSlide();

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

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    slideIndexRef.current = index;
    setSlideIndex(index);
  };

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const wellbeing = useMemo(
    () =>
      calculateWellbeingScore(
        state.habits,
        state.habitEntries,
        state.journalEntries,
        state.transactions,
        state.accounts
      ),
    [
      state.habits,
      state.habitEntries,
      state.journalEntries,
      state.transactions,
      state.accounts,
    ]
  );

  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slidesContainer}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Slide 1: Greeting */}
        <View style={styles.slide}>
          <View style={styles.slideInner}>
            <Text style={styles.greetingEmoji}>{greeting.emoji}</Text>
            <Title style={styles.greetingTitle}>{greeting.text}!</Title>
            <Text style={styles.greetingTime}>{currentTime}</Text>
            <Text style={styles.greetingDate}>{today}</Text>
          </View>
        </View>

        {/* Slide 2: Wellbeing */}
        <View style={styles.slide}>
          <View style={styles.slideInner}>
            <Ionicons name="heart" size={48} color="#ec4899" style={styles.slideIcon} />
            <Title style={styles.slideTitle}>Wellbeing</Title>
            <Text style={styles.wellbeingScoreBig}>{wellbeing.score}%</Text>
            <Text style={styles.wellbeingBreakdownBig}>
              Habits {wellbeing.breakdown.habits}% · Journal {wellbeing.breakdown.journal}% · Finance {wellbeing.breakdown.finance}%
            </Text>
          </View>
        </View>

        {/* Slide 3: Notion Idea */}
        <View style={styles.slide}>
          <View style={styles.slideInner}>
            <Ionicons name="bulb" size={48} color="#6366f1" style={styles.slideIcon} />
            <Title style={styles.slideLabel}>Today&apos;s Idea</Title>
            {notionContent.idea ? (
              <>
                <Text style={styles.slideCardTitle}>{notionContent.idea.title}</Text>
                <Text style={styles.slideCardContent} numberOfLines={6}>
                  {notionContent.idea.content}
                </Text>
                <Button
                  mode="text"
                  onPress={loadNewIdea}
                  icon="refresh"
                  disabled={loadingNotion}
                  compact
                  style={styles.slideButton}
                  labelStyle={styles.slideButtonLabel}
                >
                  Get Another
                </Button>
              </>
            ) : (
              <Text style={styles.slidePlaceholder}>Connect Notion in Settings to see ideas</Text>
            )}
          </View>
        </View>

        {/* Slide 4: Notion Highlight */}
        <View style={styles.slide}>
          <View style={styles.slideInner}>
            <Ionicons name="star" size={48} color="#f59e0b" style={styles.slideIcon} />
            <Title style={styles.slideLabel}>Today&apos;s Highlight</Title>
            {notionContent.highlight ? (
              <>
                <Text style={styles.slideCardTitle}>{notionContent.highlight.title}</Text>
                <Text style={styles.slideCardContent} numberOfLines={6}>
                  {notionContent.highlight.content}
                </Text>
                <Button
                  mode="text"
                  onPress={loadNewHighlight}
                  icon="refresh"
                  disabled={loadingNotion}
                  compact
                  style={styles.slideButton}
                  labelStyle={styles.slideButtonLabel}
                >
                  Get Another
                </Button>
              </>
            ) : (
              <Text style={styles.slidePlaceholder}>Connect Notion in Settings to see highlights</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === slideIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  slidesContainer: {
    paddingBottom: 16,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SLIDE_PADDING,
  },
  slideInner: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: SCREEN_WIDTH - SLIDE_PADDING * 2,
  },
  greetingEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  greetingTime: {
    fontSize: 28,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  greetingDate: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
  },
  slideIcon: {
    marginBottom: 12,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9d174d',
    marginBottom: 8,
  },
  slideLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  wellbeingScoreBig: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#be185d',
    marginBottom: 12,
  },
  wellbeingBreakdownBig: {
    fontSize: 16,
    color: '#831843',
    textAlign: 'center',
    lineHeight: 24,
  },
  slideCardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  slideCardContent: {
    fontSize: 17,
    color: '#4b5563',
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 16,
  },
  slideButton: {
    marginTop: 4,
  },
  slideButtonLabel: {
    fontSize: 14,
  },
  slidePlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  dotActive: {
    backgroundColor: '#6366f1',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default HomeScreen;

