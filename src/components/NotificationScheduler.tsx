import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useApp } from '../context/AppContext';
import { scheduleLifeOSNotifications } from '../services/notifications';

/**
 * Reschedules local reminders when the app returns to foreground so triggers stay fresh.
 */
export const NotificationScheduler = () => {
  const { state } = useApp();
  const appState = useRef(AppState.currentState);

  const financeTxnCountWeek = state.transactions.filter(
    (t) => new Date(t.date).getTime() >= Date.now() - 7 * 86400000
  ).length;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        scheduleLifeOSNotifications({
          habits: state.habits,
          financeTxnCountWeek,
        }).catch((error) => {
          console.error('Error rescheduling notifications:', error);
        });
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [state.habits, financeTxnCountWeek]);

  return null;
};
