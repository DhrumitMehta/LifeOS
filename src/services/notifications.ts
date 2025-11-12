import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
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
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Expo push token:', token);
    } catch (e) {
      console.error('Error getting push token:', e);
      token = null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function sendTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Notification 📬",
      body: 'This is a test notification from LifeOS!',
      data: { test: 'notification data' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

export async function getNotificationPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
  return await Notifications.getPermissionsAsync();
}

export async function requestNotificationPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
  return await Notifications.requestPermissionsAsync();
}

export interface Habit {
  id: string;
  name: string;
  isActive: boolean;
}

// Schedule daily notifications
export async function scheduleDailyNotifications(habits: Habit[]): Promise<void> {
  try {
    // Cancel all existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule 8am journal reminder
    await scheduleJournalReminder();

    // Schedule 7:30pm family time reminder
    await scheduleFamilyTimeReminder();

    // Schedule habit reminders starting at 9am (one per hour)
    await scheduleHabitReminders(habits);

    console.log(`✅ Scheduled notifications: Journal (8am), Family Time (7:30pm), and ${habits.filter(h => h.isActive).length} habit reminders`);
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    throw error;
  }
}

async function scheduleJournalReminder(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Good Morning! ☀️",
        body: "It's time to fill your journal",
        sound: true,
        data: { type: 'journal_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
      },
    });
    console.log('✅ Journal reminder scheduled for 8:00 AM daily');
  } catch (error) {
    console.error('Error scheduling journal reminder:', error);
    throw error;
  }
}

async function scheduleFamilyTimeReminder(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Family Time 👨‍👩‍👧‍👦",
        body: "It's time to switch off your phone and spend some time with your family",
        sound: true,
        data: { type: 'family_time' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 30,
      },
    });
    console.log('✅ Family time reminder scheduled for 7:30 PM daily');
  } catch (error) {
    console.error('Error scheduling family time reminder:', error);
    throw error;
  }
}

async function scheduleHabitReminders(habits: Habit[]): Promise<void> {
  // Filter only active habits
  const activeHabits = habits.filter(habit => habit.isActive);
  
  // Schedule one habit per hour starting at 9am
  for (let index = 0; index < activeHabits.length; index++) {
    const habit = activeHabits[index];
    const hour = 9 + index; // Start at 9am, increment by 1 for each habit
    
    // Only schedule if hour is within valid range (9am to 11pm)
    if (hour < 24) {
      const habitName = habit.name.toLowerCase();
      const isActionHabit = habitName.includes('do') || habitName.includes('exercise') || 
                           habitName.includes('workout') || habitName.includes('practice') ||
                           habitName.includes('read') || habitName.includes('write');
      
      const body = isActionHabit 
        ? `Will I do ${habit.name} today?`
        : `Will I be involved in ${habit.name} today?`;

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Habit Reminder: ${habit.name}`,
            body: body,
            sound: true,
            data: { type: 'habit_reminder', habitId: habit.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hour,
            minute: 0,
          },
        });
        console.log(`✅ Scheduled habit reminder for "${habit.name}" at ${hour}:00`);
      } catch (error) {
        console.error(`Error scheduling reminder for habit "${habit.name}":`, error);
      }
    }
  }
}

// Get all scheduled notifications (for debugging)
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

