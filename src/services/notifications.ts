import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const ANDROID_CHANNELS = [
  { id: 'lifeos_habits', name: 'Habits' },
  { id: 'lifeos_journal', name: 'Journal' },
  { id: 'lifeos_finance', name: 'Finance' },
];

async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  for (const ch of ANDROID_CHANNELS) {
    await Notifications.setNotificationChannelAsync(ch.id, {
      name: ch.name,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      sound: 'default',
    });
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  await ensureAndroidChannels();

  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

      if (projectId) {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('Expo push token:', token);
      }
    } catch (e) {
      console.error('Error getting push token:', e);
      token = null;
    }
  } else {
    console.log('Push notifications require a physical device');
  }

  return token;
}

export async function sendTestNotification(): Promise<void> {
  await ensureAndroidChannels();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'LifeOS is listening ✦',
      body: 'When you allow reminders, we nudge your habits, journal, and money story — never spam, always skippable.',
      sound: true,
      data: { type: 'test' },
      ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

export async function getNotificationPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
  return Notifications.getPermissionsAsync();
}

export async function requestNotificationPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
  return Notifications.requestPermissionsAsync();
}

export interface ScheduleLifeOSParams {
  habits: { id: string; name: string; isActive: boolean }[];
  financeTxnCountWeek: number;
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const JOURNAL_PROMPTS: { title: string; body: string }[] = [
  {
    title: 'Your brain wants a download',
    body: 'Before the day runs away — one journal line about what actually mattered.',
  },
  {
    title: 'Micro-journal challenge',
    body: 'Three bullets: mood, one win, one thing to let go. That counts.',
  },
  {
    title: 'Plot twist: you document it',
    body: 'Future-you is nosy. Leave them a paragraph in the journal.',
  },
  {
    title: 'Silence is expensive',
    body: 'Untangle a thought in your journal — cheaper than carrying it all week.',
  },
];

const HABIT_TITLE_STYLES = [
  (name: string) => `${name} — today’s cameo`,
  (name: string) => `Spotlight: ${name}`,
  (name: string) => `Tiny contract: ${name}`,
  (name: string) => `Streak fuel: ${name}`,
];

const HABIT_BODY_STYLES = [
  (name: string) => `No guilt trips — just check in: did ${name} happen (even 1% counts)?`,
  (name: string) => `Imagine closing today proud of ${name}. What’s the smallest step?`,
  (name: string) => `${name} doesn’t need a perfect hour; it needs an honest tap in LifeOS.`,
  (name: string) => `Your habits are votes. Cast one for ${name} when you open the app.`,
];

function journalPromptForToday(): { title: string; body: string } {
  const i = new Date().getDate() % JOURNAL_PROMPTS.length;
  return JOURNAL_PROMPTS[i];
}

function habitCopy(habit: { id: string; name: string }, slot: number): { title: string; body: string } {
  const h = hashSeed(`${habit.id}_${slot}`);
  const titleFn = HABIT_TITLE_STYLES[h % HABIT_TITLE_STYLES.length];
  const bodyFn = HABIT_BODY_STYLES[(h >> 3) % HABIT_BODY_STYLES.length];
  return { title: titleFn(habit.name), body: bodyFn(habit.name) };
}

function financeCopy(txnWeek: number): { title: string; body: string } {
  if (txnWeek >= 8) {
    return {
      title: 'Finance mode: unlocked',
      body: `You’ve logged ${txnWeek} moves in 7 days — you’re building a real money story. Peek at Finance for the vibe check.`,
    };
  }
  if (txnWeek >= 3) {
    return {
      title: 'Money map in motion',
      body: `${txnWeek} entries this week. Add today’s flow so your dashboard stays honest.`,
    };
  }
  if (txnWeek > 0) {
    return {
      title: 'Gentle ledger nudge',
      body: `Only ${txnWeek} finance tap${txnWeek === 1 ? '' : 's'} this week — 20 seconds in Finance keeps the picture clear.`,
    };
  }
  return {
    title: 'Finance misses you (lightly)',
    body: 'No budget lecture — just log one coffee, one transfer, or one win. Silence is the heaviest line item.',
  };
}

async function scheduleJournalReminders(): Promise<void> {
  const morning = journalPromptForToday();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: morning.title,
      body: morning.body,
      sound: true,
      data: { type: 'journal_reminder' },
      ...(Platform.OS === 'android' ? { channelId: 'lifeos_journal' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 7,
      minute: 30,
    },
  });

  const evening = JOURNAL_PROMPTS[(new Date().getDate() + 2) % JOURNAL_PROMPTS.length];
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Evening debrief window',
      body: evening.body,
      sound: true,
      data: { type: 'journal_reminder' },
      ...(Platform.OS === 'android' ? { channelId: 'lifeos_journal' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 45,
    },
  });
}

async function scheduleFinanceReminder(txnWeek: number): Promise<void> {
  const { title, body } = financeCopy(txnWeek);
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: { type: 'finance_reminder' },
      ...(Platform.OS === 'android' ? { channelId: 'lifeos_finance' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 17,
      minute: 45,
    },
  });
}

async function scheduleHabitReminders(
  habits: { id: string; name: string; isActive: boolean }[]
): Promise<void> {
  const active = habits.filter((h) => h.isActive);
  for (let index = 0; index < active.length; index++) {
    const habit = active[index];
    const hour = 9 + index;
    if (hour >= 24) break;

    const { title, body } = habitCopy(habit, index);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data: { type: 'habit_reminder', habitId: habit.id },
          ...(Platform.OS === 'android' ? { channelId: 'lifeos_habits' } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: 5,
        },
      });
    } catch (error) {
      console.error(`Habit notification schedule failed for ${habit.name}`, error);
    }
  }
}

/** Replaces legacy daily notifications: journal (2), finance (1), habits (staggered). No family-time blast. */
export async function scheduleLifeOSNotifications(params: ScheduleLifeOSParams): Promise<void> {
  try {
    await ensureAndroidChannels();
    await Notifications.cancelAllScheduledNotificationsAsync();
    await scheduleJournalReminders();
    await scheduleFinanceReminder(params.financeTxnCountWeek);
    await scheduleHabitReminders(params.habits);
    console.log(
      `✅ LifeOS reminders: journal ×2, finance ×1, habits ×${params.habits.filter((h) => h.isActive).length}`
    );
  } catch (error) {
    console.error('Error scheduling LifeOS notifications:', error);
    throw error;
  }
}

export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}
