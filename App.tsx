import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppProvider } from './src/context/AppContext';
import { RootStackParamList, TabParamList } from './src/types';
import { registerForPushNotificationsAsync } from './src/services/notifications';
import { NotificationScheduler } from './src/components/NotificationScheduler';
import { NotionConnectionModal } from './src/components/NotionConnectionModal';
import { testNotionConnection } from './src/services/notion';
import { appTheme } from './src/theme';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import HabitsScreen from './src/screens/HabitsScreen';
import JournalScreen from './src/screens/JournalScreen';
import FinanceScreen from './src/screens/FinanceScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HabitDetailScreen from './src/screens/HabitDetailScreen';
import JournalDetailScreen from './src/screens/JournalDetailScreen';
import TransactionDetailScreen from './src/screens/TransactionDetailScreen';
import InvestmentDetailScreen from './src/screens/InvestmentDetailScreen';
import BudgetDetailScreen from './src/screens/BudgetDetailScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Habits') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'Journal') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Finance') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Habits" 
        component={HabitsScreen}
        options={{ title: 'Habits' }}
      />
      <Tab.Screen 
        name="Journal" 
        component={JournalScreen}
        options={{ title: 'Journal' }}
      />
      <Tab.Screen 
        name="Finance" 
        component={FinanceScreen}
        options={{ title: 'Finance' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

const AppContent = () => {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const [showNotionModal, setShowNotionModal] = useState(false);
  const [notionChecked, setNotionChecked] = useState(false);

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync();

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    // Check Notion connection on app start
    checkNotionConnection();

    // Set up app state listener to sync when app comes to foreground
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        // App has come to the foreground, try to sync pending operations
        const { offlineSync } = await import('./src/services/offlineSync');
        await offlineSync.syncPendingOperations();
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      subscription.remove();
    };
  }, []);

  const checkNotionConnection = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('notion_integration_token');
      
      if (!storedToken) {
        // No token found, show modal
        setShowNotionModal(true);
        setNotionChecked(true);
        return;
      }

      // Test if token still works
      const isConnected = await testNotionConnection(storedToken);
      
      if (!isConnected) {
        // Token exists but doesn't work, show modal
        setShowNotionModal(true);
      }
      
      setNotionChecked(true);
    } catch (error) {
      console.error('Error checking Notion connection:', error);
      setNotionChecked(true);
    }
  };

  const handleNotionConnected = () => {
    setShowNotionModal(false);
    // Reload home screen to show Notion content
    // The HomeScreen will automatically reload when it mounts
  };

  const handleNotionSkip = () => {
    setShowNotionModal(false);
  };

  return (
    <>
      <NotificationScheduler />
      {notionChecked && (
        <NotionConnectionModal
          visible={showNotionModal}
          onConnected={handleNotionConnected}
          onSkip={handleNotionSkip}
        />
      )}
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#6366f1',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Main" 
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="HabitDetail" 
            component={HabitDetailScreen}
            options={{ title: 'Habit Details' }}
          />
          <Stack.Screen 
            name="JournalDetail" 
            component={JournalDetailScreen}
            options={{ title: 'Journal Entry' }}
          />
          <Stack.Screen 
            name="TransactionDetail" 
            component={TransactionDetailScreen}
            options={{ title: 'Transaction' }}
          />
          <Stack.Screen 
            name="InvestmentDetail" 
            component={InvestmentDetailScreen}
            options={{ title: 'Investment' }}
          />
          <Stack.Screen 
            name="BudgetDetail" 
            component={BudgetDetailScreen}
            options={{ title: 'Budget' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </>
  );
};

const App = () => {
  return (
    <AppProvider>
      <PaperProvider theme={appTheme}>
        <AppContent />
      </PaperProvider>
    </AppProvider>
  );
};

export default App;
