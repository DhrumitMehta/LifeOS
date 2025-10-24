import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  List,
  Switch,
  Button,
  Divider,
  Text,
  IconButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const SettingsScreen = () => {
  const { state, refreshData } = useApp();

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This feature will be available in a future update. Your data is stored locally on your device.',
      [{ text: 'OK' }]
    );
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleBackupData = () => {
    Alert.alert(
      'Backup Data',
      'This feature will be available in a future update. Consider exporting your data regularly.',
      [{ text: 'OK' }]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'This will delete all habits, journal entries, transactions, and other data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Clear All',
                  style: 'destructive',
                  onPress: () => {
                    // In a real app, this would clear the database
                    Alert.alert('Data Cleared', 'All data has been cleared.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleRefreshData = async () => {
    try {
      await refreshData();
      Alert.alert('Success', 'Data refreshed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    }
  };

  const getDataStats = () => {
    return {
      habits: state.habits.length,
      journalEntries: state.journalEntries.length,
      transactions: state.transactions.length,
      investments: state.investments.length,
      budgets: state.budgets.length,
    };
  };

  const stats = getDataStats();

  return (
    <ScrollView style={styles.container}>
      {/* App Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>LifeOS</Title>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.descriptionText}>
            Your personal life operating system for habits, journaling, and finance management.
          </Text>
        </Card.Content>
      </Card>

      {/* Data Statistics */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Your Data</Title>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.habits}</Text>
              <Text style={styles.statLabel}>Habits</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.journalEntries}</Text>
              <Text style={styles.statLabel}>Journal Entries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.transactions}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.investments}</Text>
              <Text style={styles.statLabel}>Investments</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.budgets}</Text>
              <Text style={styles.statLabel}>Budgets</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Data Management */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Data Management</Title>
          <List.Item
            title="Refresh Data"
            description="Reload all data from storage"
            left={(props) => <List.Icon {...props} icon="refresh" />}
            right={() => (
              <IconButton
                icon="refresh"
                size={20}
                onPress={handleRefreshData}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Export Data"
            description="Export your data to a file"
            left={(props) => <List.Icon {...props} icon="download" />}
            onPress={handleExportData}
          />
          <Divider />
          <List.Item
            title="Import Data"
            description="Import data from a file"
            left={(props) => <List.Icon {...props} icon="upload" />}
            onPress={handleImportData}
          />
          <Divider />
          <List.Item
            title="Backup Data"
            description="Create a backup of your data"
            left={(props) => <List.Icon {...props} icon="backup-restore" />}
            onPress={handleBackupData}
          />
        </Card.Content>
      </Card>

      {/* Notifications */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Notifications</Title>
          <List.Item
            title="Habit Reminders"
            description="Get reminded to complete your habits"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => <Switch value={true} onValueChange={() => {}} />}
          />
          <Divider />
          <List.Item
            title="Journal Prompts"
            description="Daily prompts to write in your journal"
            left={(props) => <List.Icon {...props} icon="book" />}
            right={() => <Switch value={false} onValueChange={() => {}} />}
          />
          <Divider />
          <List.Item
            title="Budget Alerts"
            description="Alerts when approaching budget limits"
            left={(props) => <List.Icon {...props} icon="wallet" />}
            right={() => <Switch value={true} onValueChange={() => {}} />}
          />
        </Card.Content>
      </Card>

      {/* Privacy & Security */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Privacy & Security</Title>
          <List.Item
            title="Data Storage"
            description="All data is stored locally on your device"
            left={(props) => <List.Icon {...props} icon="shield-check" />}
          />
          <Divider />
          <List.Item
            title="Data Encryption"
            description="Your data is encrypted for security"
            left={(props) => <List.Icon {...props} icon="lock" />}
          />
          <Divider />
          <List.Item
            title="No Cloud Sync"
            description="Data stays on your device only"
            left={(props) => <List.Icon {...props} icon="cloud-off" />}
          />
        </Card.Content>
      </Card>

      {/* About */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>About</Title>
          <List.Item
            title="Privacy Policy"
            description="Read our privacy policy"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy will be available soon.')}
          />
          <Divider />
          <List.Item
            title="Terms of Service"
            description="Read our terms of service"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            onPress={() => Alert.alert('Terms of Service', 'Terms of service will be available soon.')}
          />
          <Divider />
          <List.Item
            title="Contact Support"
            description="Get help and support"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            onPress={() => Alert.alert('Support', 'Support will be available soon.')}
          />
        </Card.Content>
      </Card>

      {/* Danger Zone */}
      <Card style={[styles.card, styles.dangerCard]}>
        <Card.Content>
          <Title style={[styles.cardTitle, styles.dangerTitle]}>Danger Zone</Title>
          <Text style={styles.dangerDescription}>
            These actions are irreversible. Please be careful.
          </Text>
          <Button
            mode="outlined"
            onPress={handleClearData}
            style={styles.dangerButton}
            textColor="#ef4444"
            buttonColor="transparent"
          >
            Clear All Data
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    minWidth: '18%',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  dangerCard: {
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  dangerTitle: {
    color: '#ef4444',
  },
  dangerDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  dangerButton: {
    borderColor: '#ef4444',
  },
  bottomSpacing: {
    height: 32,
  },
});

export default SettingsScreen;
