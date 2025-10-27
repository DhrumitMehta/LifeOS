import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
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
  ProgressBar,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Budget, RootStackParamList } from '../types';

type BudgetDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BudgetDetail'>;
type BudgetDetailScreenRouteProp = RouteProp<RootStackParamList, 'BudgetDetail'>;

const BudgetDetailScreen = () => {
  const navigation = useNavigation<BudgetDetailScreenNavigationProp>();
  const route = useRoute<BudgetDetailScreenRouteProp>();
  const { state, addBudget, updateBudget, deleteBudget } = useApp();
  
  const [isEditing, setIsEditing] = useState(false);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    amount: 0,
    period: 'monthly' as 'monthly' | 'weekly' | 'yearly',
    startDate: new Date(),
    endDate: new Date(),
  });

  const categories = [
    'Food', 'Transportation', 'Entertainment', 'Healthcare', 
    'Shopping', 'Bills', 'Education', 'Travel', 'Other'
  ];

  useEffect(() => {
    if (route.params.budgetId) {
      const foundBudget = state.budgets.find(b => b.id === route.params.budgetId);
      if (foundBudget) {
        setBudget(foundBudget);
        setFormData({
          name: foundBudget.name,
          category: foundBudget.category,
          amount: foundBudget.amount,
          period: foundBudget.period,
          startDate: foundBudget.startDate,
          endDate: foundBudget.endDate,
        });
      }
    } else {
      setIsEditing(true);
    }
  }, [route.params.budgetId, state.budgets]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.category.trim() || formData.amount <= 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const budgetData = {
        ...formData,
        spent: budget?.spent || 0,
        isActive: budget?.isActive ?? true,
      };

      if (budget) {
        const updatedBudget: Budget = {
          ...budget,
          ...budgetData,
          updatedAt: new Date(),
        };
        await updateBudget(updatedBudget);
        setBudget(updatedBudget);
      } else {
        await addBudget(budgetData);
        navigation.goBack();
      }
      setIsEditing(false);
      Alert.alert('Success', 'Budget saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save budget');
    }
  };

  const handleDelete = () => {
    if (!budget) return;
    
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete "${budget.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudget(budget.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete budget');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
    }).format(amount);
  };

  const getBudgetProgress = () => {
    if (!budget) return 0;
    return Math.min(budget.spent / budget.amount, 1);
  };

  const getBudgetStatus = () => {
    if (!budget) return { status: 'good', color: '#10b981' };
    const progress = getBudgetProgress();
    if (progress >= 1) return { status: 'over', color: '#ef4444' };
    if (progress >= 0.8) return { status: 'warning', color: '#f59e0b' };
    return { status: 'good', color: '#10b981' };
  };

  const getRemainingAmount = () => {
    if (!budget) return 0;
    return Math.max(budget.amount - budget.spent, 0);
  };

  if (!budget && !isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading budget...</Text>
      </View>
    );
  }

  const progress = getBudgetProgress();
  const status = getBudgetStatus();
  const remaining = getRemainingAmount();

  return (
    <ScrollView style={styles.container}>
      {isEditing ? (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Budget Details</Title>
            
            <TextInput
              label="Budget Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
            />
            
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
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
              label="Amount *"
              value={formData.amount.toString()}
              onChangeText={(text) => setFormData({ ...formData, amount: parseFloat(text) || 0 })}
              keyboardType="numeric"
              style={styles.input}
            />
            
            <Text style={styles.label}>Period</Text>
            <SegmentedButtons
              value={formData.period}
              onValueChange={(value) => setFormData({ ...formData, period: value as any })}
              buttons={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
              style={styles.segmentedButtons}
            />
            
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
            <View style={styles.budgetHeader}>
              <View style={styles.budgetInfo}>
                <Title style={styles.budgetName}>{budget?.name}</Title>
                <Text style={styles.budgetCategory}>{budget?.category}</Text>
              </View>
              <View style={styles.budgetActions}>
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

            <View style={styles.budgetOverview}>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Budget Amount:</Text>
                <Text style={styles.amountValue}>{formatCurrency(budget?.amount || 0)}</Text>
              </View>
              
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Amount Spent:</Text>
                <Text style={[styles.amountValue, { color: status.color }]}>
                  {formatCurrency(budget?.spent || 0)}
                </Text>
              </View>
              
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Remaining:</Text>
                <Text style={[styles.amountValue, { color: remaining >= 0 ? '#10b981' : '#ef4444' }]}>
                  {formatCurrency(remaining)}
                </Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                  {Math.round(progress * 100)}% Used
                </Text>
                <Chip 
                  style={[styles.statusChip, { backgroundColor: status.color + '20' }]}
                  textStyle={{ color: status.color }}
                >
                  {status.status === 'good' ? 'On Track' : 
                   status.status === 'warning' ? 'Warning' : 'Over Budget'}
                </Chip>
              </View>
              <ProgressBar
                progress={progress}
                color={status.color}
                style={styles.progressBar}
              />
            </View>

            <View style={styles.budgetDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Period:</Text>
                <Text style={styles.detailValue}>
                  {budget?.period?.charAt(0).toUpperCase() + budget?.period?.slice(1)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Date:</Text>
                <Text style={styles.detailValue}>
                  {budget?.startDate.toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Date:</Text>
                <Text style={styles.detailValue}>
                  {budget?.endDate.toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Chip 
                  style={[
                    styles.statusChip,
                    { backgroundColor: budget?.isActive ? '#10b981' + '20' : '#6b7280' + '20' }
                  ]}
                  textStyle={{ 
                    color: budget?.isActive ? '#10b981' : '#6b7280' 
                  }}
                >
                  {budget?.isActive ? 'Active' : 'Inactive'}
                </Chip>
              </View>
            </View>

            <View style={styles.metadata}>
              <Text style={styles.metadataText}>
                Created: {budget?.createdAt.toLocaleString()}
              </Text>
              {budget?.updatedAt && budget.updatedAt.getTime() !== budget.createdAt.getTime() && (
                <Text style={styles.metadataText}>
                  Updated: {budget.updatedAt.toLocaleString()}
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
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  budgetCategory: {
    fontSize: 16,
    color: '#6b7280',
  },
  budgetActions: {
    flexDirection: 'row',
  },
  budgetOverview: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statusChip: {
    minWidth: 80,
  },
  budgetDetails: {
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

export default BudgetDetailScreen;
