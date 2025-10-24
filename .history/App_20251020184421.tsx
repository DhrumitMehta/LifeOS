import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider } from './src/context/AppContext';
import { RootStackParamList, TabParamList } from './src/types';

// Import screens
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

          if (route.name === 'Habits') {
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

const App = () => {
  return (
    <AppProvider>
      <PaperProvider>
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
      </PaperProvider>
    </AppProvider>
  );
};

export default App;
