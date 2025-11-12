import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useApp } from '../context/AppContext';
import { scheduleDailyNotifications } from '../services/notifications';

/**
 * Component that ensures notifications are scheduled when app comes to foreground
 * This handles cases where:
 * - App hasn't been opened yet (first time)
 * - Device was restarted (notifications might be cleared)
 * - App data was cleared
 */
export const NotificationScheduler = () => {
  const { state } = useApp();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // When app comes to foreground, reschedule notifications to ensure they're set
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground, rescheduling notifications...');
        scheduleDailyNotifications(state.habits).catch(error => {
          console.error('Error rescheduling notifications:', error);
        });
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [state.habits]);

  return null;
};

