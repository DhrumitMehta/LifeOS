import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
  TouchableOpacity,
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
  TextInput,
  Chip,
  SegmentedButtons,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const SettingsScreen = () => {
  const { state, refreshData, addCategory, updateCategory, deleteCategory } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('income');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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

      {/* Transaction Categories */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Transaction Categories</Title>
          <Text style={styles.descriptionText}>
            Manage your income and expense categories
          </Text>
          <Divider style={styles.divider} />
          <List.Item
            title="Manage Categories"
            description="Add, edit, or remove transaction categories"
            left={(props) => <List.Icon {...props} icon="folder" />}
            right={() => (
              <IconButton
                icon="chevron-right"
                size={20}
                onPress={() => setShowCategoryModal(true)}
              />
            )}
            onPress={() => setShowCategoryModal(true)}
          />
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

      {/* Category Management Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
          setCategoryName('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Title style={styles.modalTitle}>Manage Categories</Title>
            <IconButton
              icon="close"
              size={24}
              onPress={() => {
                setShowCategoryModal(false);
                setEditingCategory(null);
                setCategoryName('');
              }}
            />
          </View>

          <SegmentedButtons
            value={categoryType}
            onValueChange={(value) => {
              setCategoryType(value as 'income' | 'expense');
              setEditingCategory(null);
              setCategoryName('');
            }}
            buttons={[
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' },
            ]}
            style={styles.segmentedButtons}
          />

          <ScrollView style={styles.modalContent}>
            {/* Add/Edit Category Form */}
            <Card style={styles.formCard}>
              <Card.Content>
                <Text style={styles.formTitle}>
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </Text>
                <TextInput
                  label="Category Name"
                  value={categoryName}
                  onChangeText={setCategoryName}
                  mode="outlined"
                  style={styles.categoryInput}
                  placeholder={editingCategory ? editingCategory : 'Enter category name'}
                />
                <View style={styles.formButtons}>
                  {editingCategory && (
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setEditingCategory(null);
                        setCategoryName('');
                      }}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    mode="contained"
                    onPress={async () => {
                      try {
                        if (editingCategory) {
                          await updateCategory(categoryType, editingCategory, categoryName);
                          Alert.alert('Success', 'Category updated successfully');
                        } else {
                          await addCategory(categoryType, categoryName);
                          Alert.alert('Success', 'Category added successfully');
                        }
                        setCategoryName('');
                        setEditingCategory(null);
                      } catch (error) {
                        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save category');
                      }
                    }}
                    disabled={!categoryName.trim()}
                    style={styles.saveButton}
                  >
                    {editingCategory ? 'Update' : 'Add'}
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {/* Categories List */}
            <Card style={styles.categoriesCard}>
              <Card.Content>
                <Title style={styles.categoriesTitle}>
                  {categoryType === 'income' ? 'Income' : 'Expense'} Categories
                </Title>
                {state.categories[categoryType].map((category) => (
                  <View key={category} style={styles.categoryItem}>
                    <Text style={styles.categoryText}>{category}</Text>
                    <View style={styles.categoryActions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => {
                          setEditingCategory(category);
                          setCategoryName(category);
                        }}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#ef4444"
                        onPress={async () => {
                          Alert.alert(
                            'Delete Category',
                            `Are you sure you want to delete "${category}"?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                  try {
                                    await deleteCategory(categoryType, category);
                                    Alert.alert('Success', 'Category deleted successfully');
                                  } catch (error) {
                                    Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete category');
                                  }
                                },
                              },
                            ]
                          );
                        }}
                      />
                    </View>
                  </View>
                ))}
                {state.categories[categoryType].length === 0 && (
                  <Text style={styles.emptyText}>No categories yet. Add one above!</Text>
                )}
              </Card.Content>
            </Card>
          </ScrollView>
        </View>
      </Modal>
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
  divider: {
    marginVertical: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#6366f1',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  segmentedButtons: {
    margin: 16,
    marginBottom: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  categoryInput: {
    marginBottom: 12,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#6366f1',
  },
  categoriesCard: {
    marginBottom: 16,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  categoryActions: {
    flexDirection: 'row',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontStyle: 'italic',
    paddingVertical: 24,
  },
});

export default SettingsScreen;
