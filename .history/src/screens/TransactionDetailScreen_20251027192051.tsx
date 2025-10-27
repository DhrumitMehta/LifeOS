import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  TextInput,
  Button,
  SegmentedButtons,
  Chip,
  IconButton,
  Text,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Transaction, RootStackParamList } from '../types';

type TransactionDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TransactionDetail'>;
type TransactionDetailScreenRouteProp = RouteProp<RootStackParamList, 'TransactionDetail'>;

const TransactionDetailScreen = () => {
  const navigation = useNavigation<TransactionDetailScreenNavigationProp>();
  const route = useRoute<TransactionDetailScreenRouteProp>();
  const { state, addTransaction, updateTransaction, deleteTransaction } = useApp();
  
  const [isEditing, setIsEditing] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    subcategory: '',
    amount: 0,
    description: '',
    date: new Date(),
    account: '',
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState('');

  const categories = {
    income: ['TCA Analyst Salary', 'Training Allowance', 'Match fees', 'Umpiring', 'Trip Allowance', 'OtherInc', 'Investment', 'Loan', 'Money Transfer', 'Other'],
    expense: ['Food&Drink', 'Transport', 'Entertainment', 'Health', 'Technology', 'Education', 'Subscriptions', 'Utility', 'Sport', 'Family', 'Charity', 'Misc', 'Loan', 'Money Transfer', 'Investment', 'Other'],
  };

  const accounts = ['Cash', 'Bank', 'Mobile', 'Inv'];

  useEffect(() => {
    if (route.params.transactionId) {
      const foundTransaction = state.transactions.find(t => t.id === route.params.transactionId);
      if (foundTransaction) {
        setTransaction(foundTransaction);
        setFormData({
          type: foundTransaction.type,
          category: foundTransaction.category,
          subcategory: foundTransaction.subcategory || '',
          amount: foundTransaction.amount,
          description: foundTransaction.description,
          date: foundTransaction.date,
          account: foundTransaction.account || '',
          tags: foundTransaction.tags,
        });
      }
    } else {
      setIsEditing(true);
    }
  }, [route.params.transactionId, state.transactions]);

  const handleSave = async () => {
    if (!formData.category.trim() || !formData.description.trim() || formData.amount <= 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (transaction) {
        const updatedTransaction: Transaction = {
          ...transaction,
          ...formData,
          updatedAt: new Date(),
        };
        await updateTransaction(updatedTransaction);
        setTransaction(updatedTransaction);
      } else {
        await addTransaction(formData);
        navigation.goBack();
      }
      setIsEditing(false);
      Alert.alert('Success', 'Transaction saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save transaction');
    }
  };

  const handleDelete = () => {
    if (!transaction) return;
    
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${transaction.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
    }).format(amount);
  };

  if (!transaction && !isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading transaction...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {isEditing ? (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Transaction Details</Title>
            
            <Text style={styles.label}>Type</Text>
            <SegmentedButtons
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              buttons={[
                { value: 'income', label: 'Income' },
                { value: 'expense', label: 'Expense' },
              ]}
              style={styles.segmentedButtons}
            />
            
            <TextInput
              label="Description *"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              style={styles.input}
            />
            
            <TextInput
              label="Amount *"
              value={formData.amount.toString()}
              onChangeText={(text) => setFormData({ ...formData, amount: parseFloat(text) || 0 })}
              keyboardType="numeric"
              style={styles.input}
            />
            
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoriesContainer}>
              {categories[formData.type].map((category) => (
                <Chip
                  key={category}
                  selected={formData.category === category}
                  onPress={() => setFormData({ ...formData, category })}
                  style={styles.categoryChip}
                >
                  {category}
                </Chip>
              ))}
            </View>
            
            <TextInput
              label="Subcategory"
              value={formData.subcategory}
              onChangeText={(text) => setFormData({ ...formData, subcategory: text })}
              style={styles.input}
            />
            
            <Text style={styles.label}>Date</Text>
            <View style={styles.dateContainer}>
              <TextInput
                label="Date"
                value={formData.date.toISOString().split('T')[0]}
                onFocus={() => {
                  // On web/mobile, you would show a date picker here
                  // For now, it's a read-only display showing the formatted date
                }}
                editable={false}
                style={[styles.input, { flex: 1 }]}
              />
              <Button
                mode="outlined"
                onPress={() => {
                  // Open date picker
                  Alert.alert('Date Picker', 'Date picker will be implemented');
                }}
                style={styles.dateButton}
              >
                Change
              </Button>
            </View>
            
            <Text style={styles.label}>Account</Text>
            <View style={styles.categoriesContainer}>
              {accounts.map((account) => (
                <Chip
                  key={account}
                  selected={formData.account === account}
                  onPress={() => setFormData({ ...formData, account })}
                  style={styles.categoryChip}
                >
                  {account}
                </Chip>
              ))}
            </View>
            
            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                label="Add tag"
                value={newTag}
                onChangeText={setNewTag}
                style={styles.tagInput}
                onSubmitEditing={handleAddTag}
              />
              <Button
                mode="outlined"
                onPress={handleAddTag}
                style={styles.addTagButton}
              >
                Add
              </Button>
            </View>
            
            {formData.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    onClose={() => handleRemoveTag(tag)}
                    style={styles.tag}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            )}
            
            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={() => setIsEditing(false)}
                style={styles.button}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.button}
              >
                Save
              </Button>
            </View>
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.transactionHeader}>
              <View style={styles.transactionInfo}>
                <Title style={styles.transactionTitle}>{transaction?.description}</Title>
                <Text style={styles.transactionDate}>
                  {transaction?.date.toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.transactionActions}>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction?.type === 'income' ? '#10b981' : '#ef4444' }
                ]}>
                  {transaction?.type === 'income' ? '+' : '-'}{formatCurrency(transaction?.amount || 0)}
                </Text>
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => setIsEditing(true)}
                />
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={handleDelete}
                  iconColor="#ef4444"
                />
              </View>
            </View>

            <View style={styles.transactionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Chip 
                  style={[
                    styles.typeChip,
                    { backgroundColor: transaction?.type === 'income' ? '#10b981' : '#ef4444' }
                  ]}
                  textStyle={{ color: '#fff' }}
                >
                  {transaction?.type?.charAt(0).toUpperCase() + transaction?.type?.slice(1)}
                </Chip>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{transaction?.category}</Text>
              </View>
              
              {transaction?.subcategory && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Subcategory:</Text>
                  <Text style={styles.detailValue}>{transaction.subcategory}</Text>
                </View>
              )}
              
              {transaction?.account && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account:</Text>
                  <Text style={styles.detailValue}>{transaction.account}</Text>
                </View>
              )}
            </View>

            {transaction?.tags && transaction.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                <Text style={styles.tagsLabel}>Tags:</Text>
                <View style={styles.tagsRow}>
                  {transaction.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      style={styles.tag}
                      textStyle={styles.tagText}
                    >
                      {tag}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.metadata}>
              <Text style={styles.metadataText}>
                Created: {transaction?.createdAt.toLocaleString()}
              </Text>
              {transaction?.updatedAt && transaction.updatedAt.getTime() !== transaction.createdAt.getTime() && (
                <Text style={styles.metadataText}>
                  Updated: {transaction.updatedAt.toLocaleString()}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dateButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    alignSelf: 'flex-end',
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#e5e7eb',
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  transactionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  transactionDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  detailValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  typeChip: {
    minWidth: 80,
  },
  metadata: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  metadataText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
});

export default TransactionDetailScreen;
