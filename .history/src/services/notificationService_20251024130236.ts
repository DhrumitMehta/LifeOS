import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit } from '../types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('habits', {
        name: 'Habit Reminders',
        description: 'Notifications for habit tracking',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  }

  static async scheduleHabitReminder(habit: Habit, time: string): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permission not granted');
        return null;
      }

      // Parse time (format: "HH:MM")
      const [hours, minutes] = time.split(':').map(Number);
      
      // Cancel existing notifications for this habit
      await this.cancelHabitReminders(habit.id);

      // Create notification content
      const notificationContent = {
        title: `Time for ${habit.name}!`,
        body: habit.description || `Don't forget to complete your ${habit.name} habit`,
        data: { habitId: habit.id, habitName: habit.name },
        sound: true,
      };

      // Schedule daily notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });

      console.log(`Scheduled notification for habit: ${habit.name} at ${time}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  static async cancelHabitReminders(habitId: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.habitId === habitId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      
      console.log(`Cancelled notifications for habit: ${habitId}`);
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  static async cancelAllHabitReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all habit notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  static async updateHabitReminder(habit: Habit, time: string): Promise<string | null> {
    // Cancel existing and schedule new
    await this.cancelHabitReminders(habit.id);
    return await this.scheduleHabitReminder(habit, time);
  }
}
