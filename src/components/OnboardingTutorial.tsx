import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, Text, useWindowDimensions } from 'react-native';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Emitted from Settings to show the tour again without restarting the app. */
export const REPLAY_TUTORIAL_EVENT = 'lifeos:replay_tutorial';

type Step = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    icon: 'hand-left-outline',
    title: 'Welcome to LifeOS',
    body: 'Track habits, journal your days, and watch your money — in one place. Take a 30-second tour, or skip anytime.',
  },
  {
    icon: 'apps-outline',
    title: 'Bottom tabs',
    body: 'Home is always there as your dashboard. The other tabs are for habits, journal, finance, and visualization.',
  },
  {
    icon: 'options-outline',
    title: 'Choose your tabs',
    body: 'You do not need every area. Open Settings → Bottom tabs to turn Habits, Journal, Finance, or Visualization on or off. Hidden screens still work for reminders and deep links.',
  },
  {
    icon: 'wallet-outline',
    title: 'Finance accounts',
    body: 'Set up your cash and bank accounts under Settings → Finance accounts: add or remove accounts, choose currency per account, and see each one with its own color on the Finance tab.',
  },
  {
    icon: 'menu-outline',
    title: 'Menu',
    body: 'Tap the menu (top-left) for Profile, Analytics, Reviews, and Settings — including data refresh and account.',
  },
  {
    icon: 'add-circle-outline',
    title: 'Add things fast',
    body: 'The + button adds a transaction, habit entry, journal note, or subscription depending on which tab you are on.',
  },
  {
    icon: 'notifications-outline',
    title: 'Gentle nudges',
    body: 'Allow notifications if you want reminders for habits, journal prompts, and a quick finance pulse. You can test them in Settings.',
  },
];

type Props = {
  visible: boolean;
  onComplete: () => void;
};

export const OnboardingTutorial = ({ visible, onComplete }: Props) => {
  const [index, setIndex] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 40, 400);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  const goNext = () => {
    if (isLast) {
      setIndex(0);
      onComplete();
    } else {
      setIndex((i) => i + 1);
    }
  };

  const goSkip = () => {
    setIndex(0);
    onComplete();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={[styles.backdrop, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
        <View style={[styles.card, { width: cardWidth }]} accessibilityViewIsModal>
          <View style={styles.iconWrap}>
            <Ionicons name={step.icon} size={44} color="#6366f1" />
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === index && styles.dotActive]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Button mode="text" onPress={goSkip} textColor="#94a3b8" compact>
              Skip
            </Button>
            <Button mode="contained" onPress={goNext} buttonColor="#6366f1">
              {isLast ? 'Get started' : 'Next'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#475569',
  },
  dotActive: {
    backgroundColor: '#818cf8',
    width: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
