import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, AppState, DeviceEventEmitter, Platform, View, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import {
  TabBarPreferencesProvider,
  TabBarVisibility,
  useTabBarPreferences,
} from './src/context/TabBarPreferencesContext';
import LoginScreen from './src/screens/LoginScreen';
import { RootStackParamList, TabParamList } from './src/types';
import { registerForPushNotificationsAsync } from './src/services/notifications';
import { NotificationScheduler } from './src/components/NotificationScheduler';
import { NotionConnectionModal } from './src/components/NotionConnectionModal';
import { OnboardingTutorial, REPLAY_TUTORIAL_EVENT } from './src/components/OnboardingTutorial';
import MenuDrawer from './src/components/MenuDrawer';
import { scopedStorageKey } from './src/services/userSession';
import { testNotionConnection } from './src/services/notion';
import { appTheme } from './src/theme';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import HabitsScreen from './src/screens/HabitsScreen';
import JournalScreen from './src/screens/JournalScreen';
import FinanceScreen from './src/screens/FinanceScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ReviewsScreen from './src/screens/ReviewsScreen';
import VisualizationScreen from './src/screens/VisualizationScreen';
import HabitDetailScreen from './src/screens/HabitDetailScreen';
import JournalDetailScreen from './src/screens/JournalDetailScreen';
import TransactionDetailScreen from './src/screens/TransactionDetailScreen';
import InvestmentDetailScreen from './src/screens/InvestmentDetailScreen';
import BudgetDetailScreen from './src/screens/BudgetDetailScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const TUTORIAL_DONE_KEY = 'tutorial_v1_done';

const TabNavigator = ({
  onMenuPress,
  tabVisibility,
}: {
  onMenuPress: () => void;
  tabVisibility: TabBarVisibility;
}) => {
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
          } else if (route.name === 'Visualization') {
            iconName = focused ? 'videocam' : 'videocam-outline';
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
        headerLeft: () => (
          <IconButton
            icon="menu"
            iconColor="#fff"
            size={24}
            onPress={onMenuPress}
            style={{ marginLeft: 8 }}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen
        name="Habits"
        component={HabitsScreen}
        options={{
          title: 'Habits',
          tabBarButton: tabVisibility.Habits ? undefined : () => null,
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          title: 'Journal',
          tabBarButton: tabVisibility.Journal ? undefined : () => null,
        }}
      />
      <Tab.Screen
        name="Finance"
        component={FinanceScreen}
        options={{
          title: 'Finance',
          tabBarButton: tabVisibility.Finance ? undefined : () => null,
        }}
      />
      <Tab.Screen
        name="Visualization"
        component={VisualizationScreen}
        options={{
          title: 'Visualization',
          tabBarButton: tabVisibility.Visualization ? undefined : () => null,
        }}
      />
    </Tab.Navigator>
  );
};

const AppContent = () => {
  const { visibility: tabVisibility } = useTabBarPreferences();
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const [showNotionModal, setShowNotionModal] = useState(false);
  const [notionChecked, setNotionChecked] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    if (!notionChecked || showNotionModal) return;
    let cancelled = false;
    (async () => {
      try {
        const key = scopedStorageKey(TUTORIAL_DONE_KEY);
        const done = await AsyncStorage.getItem(key);
        if (!cancelled && !done) {
          setShowTutorial(true);
        }
      } catch (e) {
        console.warn('Tutorial storage check failed:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [notionChecked, showNotionModal]);

  const completeTutorial = useCallback(async () => {
    try {
      await AsyncStorage.setItem(scopedStorageKey(TUTORIAL_DONE_KEY), '1');
    } catch (e) {
      console.warn('Tutorial save failed:', e);
    }
    setShowTutorial(false);
  }, []);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(REPLAY_TUTORIAL_EVENT, () => {
      if (notionChecked && !showNotionModal) {
        setShowTutorial(true);
      }
    });
    return () => sub.remove();
  }, [notionChecked, showNotionModal]);

  useEffect(() => {
    // Notifications only on native (not on web)
    if (Platform.OS !== 'web') {
      registerForPushNotificationsAsync();
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data as { type?: string };
        const nav = navigationRef.current;
        if (nav?.isReady() && data?.type) {
          if (data.type === 'journal_reminder') {
            nav.navigate('Main', { screen: 'Journal' });
          } else if (data.type === 'finance_reminder') {
            nav.navigate('Main', { screen: 'Finance' });
          } else if (data.type === 'habit_reminder') {
            nav.navigate('Main', { screen: 'Habits' });
          }
        }
      });
    }

    checkNotionConnection();

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
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
      {Platform.OS !== 'web' && <NotificationScheduler />}
      {notionChecked && (
        <NotionConnectionModal
          visible={showNotionModal}
          onConnected={handleNotionConnected}
          onSkip={handleNotionSkip}
        />
      )}
      <NavigationContainer ref={navigationRef}>
        <View style={[styles.appContainer, Platform.OS === 'web' && styles.appContainerWeb]}>
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
            options={{ headerShown: false }}
          >
            {() => (
              <TabNavigator
                onMenuPress={() => setShowMenuDrawer(true)}
                tabVisibility={tabVisibility}
              />
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ title: 'My Profile' }}
          />
          <Stack.Screen 
            name="Reviews" 
            component={ReviewsScreen}
            options={{ title: 'Reviews' }}
          />
          <Stack.Screen 
            name="Analytics" 
            component={AnalyticsScreen}
            options={{ title: 'Analytics' }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ title: 'Settings' }}
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
        </View>
      </NavigationContainer>
      <MenuDrawer 
        visible={showMenuDrawer} 
        onClose={() => setShowMenuDrawer(false)}
        navigationRef={navigationRef as React.RefObject<NavigationContainerRef<RootStackParamList>>}
      />
      <OnboardingTutorial visible={showTutorial} onComplete={completeTutorial} />
      <StatusBar style="light" />
    </>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  appContainerWeb: {
    maxWidth: 1024,
    width: '100%',
    alignSelf: 'center',
  },
  authLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
});

function AppGate() {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return (
      <View style={styles.authLoading}>
        <ActivityIndicator size="large" color="#818cf8" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <AppProvider key={user.id}>
      <TabBarPreferencesProvider>
        <PaperProvider theme={appTheme}>
          <AppContent />
        </PaperProvider>
      </TabBarPreferencesProvider>
    </AppProvider>
  );
}

const App = () => (
  <SafeAreaProvider>
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  </SafeAreaProvider>
);

export default App;
