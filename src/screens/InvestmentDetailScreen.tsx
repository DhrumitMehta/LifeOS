import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
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
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Investment, Transaction, RootStackParamList } from '../types';
import { getUTTFundPrice } from '../services/mutualFundService';
import { formatDate } from '../utils/dateFormat';

type InvestmentDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InvestmentDetail'>;
type InvestmentDetailScreenRouteProp = RouteProp<RootStackParamList, 'InvestmentDetail'>;

const InvestmentDetailScreen = () => {
  const navigation = useNavigation<InvestmentDetailScreenNavigationProp>();
  const route = useRoute<InvestmentDetailScreenRouteProp>();
  const { state, addInvestment, updateInvestment, deleteInvestment, addTransaction } = useApp();
  
  const [isEditing, setIsEditing] = useState(false);
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [loading, setLoading] = useState(false);
  const [unitsCalculated, setUnitsCalculated] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  
  // Get investment transactions to calculate first and latest dates
  const getInvestmentTransactions = (inv: Investment | null) => {
    if (!inv) return [];
    return state.transactions
      .filter(t => {
        if (t.category !== 'Investment') return false;
        if (t.description.includes(inv.name) || t.subcategory === inv.name) return true;
        if (inv.type === 'mutual-fund' && inv.fundName) {
          if (t.description.includes(inv.fundName) || t.subcategory === inv.fundName) return true;
        }
        return false;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };
  
  const investmentTransactions = getInvestmentTransactions(investment);
  const firstInvestmentDate = investmentTransactions.length > 0 ? investmentTransactions[0].date : investment?.purchaseDate;
  const latestInvestmentDate = investmentTransactions.length > 0 ? investmentTransactions[investmentTransactions.length - 1].date : investment?.purchaseDate;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'mutual-fund' as 'stock' | 'bond' | 'crypto' | 'mutual-fund' | 'real-estate',
    quantity: 0,
    averagePrice: 0,
    currentPrice: 0,
    purchaseDate: new Date(),
    buyingPrice: 0,
    sellingPrice: 0,
    fundName: '',
    amountPurchased: 0,
    account: 'Cash', // Account to deduct from
  });

  // Only show mutual-fund for now, but keep others commented for easy re-enabling
  const investmentTypes = [
    { value: 'mutual-fund', label: 'Mutual Fund' },
    // { value: 'stock', label: 'Individual Stock' },
    // { value: 'bond', label: 'Bond' },
    // { value: 'crypto', label: 'Crypto' },
    // { value: 'real-estate', label: 'Real Estate' },
  ];

  const accounts = ['Cash', 'NMB Main A/C', 'Selcom', 'NMB Virtual Card', 'Airtel Money', 'Inv'];
  
  // The 3 mutual funds available
  const mutualFunds = [
    { name: 'UTT Umoja Fund', fundName: 'Health Fund' },
    { name: 'iTrust iGrowth Fund', fundName: 'Emergency Fund' },
    { name: 'Quiver 15% Fund', fundName: 'Beach House Fund' },
  ];

  useEffect(() => {
    if (route.params.investmentId) {
      const foundInvestment = state.investments.find(i => i.id === route.params.investmentId);
      if (foundInvestment) {
        setInvestment(foundInvestment);
        setFormData({
          name: foundInvestment.name,
          type: foundInvestment.type,
          quantity: foundInvestment.quantity,
          averagePrice: foundInvestment.averagePrice,
          currentPrice: foundInvestment.currentPrice || 0,
          purchaseDate: foundInvestment.purchaseDate,
          buyingPrice: foundInvestment.buyingPrice || 0,
          sellingPrice: foundInvestment.sellingPrice || 0,
          fundName: foundInvestment.fundName || '',
          amountPurchased: foundInvestment.amountPurchased || 0,
          account: 'Cash', // Default, will be extracted from transaction history if available
        });
        setUnitsCalculated(foundInvestment.fundName !== undefined);
      }
    } else {
      setIsEditing(true);
    }
  }, [route.params.investmentId, state.investments]);

  const handleSave = async () => {
    if (!formData.name.trim() || formData.quantity <= 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // For mutual funds, require amount purchased
    if (formData.type === 'mutual-fund' && formData.amountPurchased <= 0) {
      Alert.alert('Error', 'Please enter the amount purchased');
      return;
    }

    if (!formData.account) {
      Alert.alert('Error', 'Please select an account to deduct from');
      return;
    }

    try {
      // For mutual funds with provider, calculate based on selling price
      const priceToUse = formData.type === 'mutual-fund' && formData.sellingPrice > 0
        ? formData.sellingPrice
        : formData.currentPrice > 0 
          ? formData.currentPrice 
          : formData.averagePrice;
      
      const amountInvested = formData.type === 'mutual-fund' 
        ? formData.amountPurchased 
        : formData.quantity * formData.averagePrice;

      if (investment) {
        // Update existing investment
        const updatedInvestment: Investment = {
          ...investment,
          ...formData,
          updatedAt: new Date(),
        };
        await updateInvestment(updatedInvestment);
        setInvestment(updatedInvestment);
      } else {
        // Check if investment already exists for this fund
        const existingInvestment = state.investments.find(
          inv => inv.name === formData.name && inv.type === 'mutual-fund'
        );

        if (existingInvestment && formData.type === 'mutual-fund') {
          // Add to existing investment
          const newUnits = formData.amountPurchased / formData.buyingPrice;
          const totalAmount = (existingInvestment.amountPurchased || 0) + formData.amountPurchased;
          const totalUnits = existingInvestment.quantity + newUnits;
          const newAveragePrice = totalAmount / totalUnits;
          
          const updatedInvestment: Investment = {
            ...existingInvestment,
            quantity: totalUnits,
            averagePrice: newAveragePrice,
            amountPurchased: totalAmount,
            sellingPrice: formData.sellingPrice || existingInvestment.sellingPrice,
            updatedAt: new Date(),
          };
          
          await updateInvestment(updatedInvestment);
        } else {
          // Create new investment
          const totalValue = formData.quantity * priceToUse;
          const investmentData = {
            ...formData,
            totalValue: totalValue,
          };
          await addInvestment(investmentData);
        }
        
        // Create expense transaction from the selected account
        const expenseTransaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'expense',
          category: 'Investment',
          subcategory: formData.type === 'mutual-fund' ? formData.fundName || formData.name : formData.name,
          amount: amountInvested,
          description: `Investment: ${formData.name}${formData.type === 'mutual-fund' && formData.fundName ? ` (${formData.fundName})` : ''}`,
          date: formData.purchaseDate,
          account: formData.account,
          tags: ['investment', formData.type],
        };
        
        // Create income transaction to the investment account
        const incomeTransaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'income',
          category: 'Investment',
          subcategory: formData.type === 'mutual-fund' ? formData.fundName || formData.name : formData.name,
          amount: amountInvested,
          description: `Investment: ${formData.name}${formData.type === 'mutual-fund' && formData.fundName ? ` (${formData.fundName})` : ''}`,
          date: formData.purchaseDate,
          account: 'Inv',
          tags: ['investment', formData.type],
        };
        
        await addTransaction(expenseTransaction);
        await addTransaction(incomeTransaction);
        navigation.goBack();
      }
      setIsEditing(false);
      Alert.alert('Success', 'Investment saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save investment');
    }
  };

  const calculateUnits = () => {
    if (formData.amountPurchased > 0 && formData.buyingPrice > 0) {
      const units = formData.amountPurchased / formData.buyingPrice;
      setFormData({ ...formData, quantity: units, averagePrice: formData.buyingPrice });
      setUnitsCalculated(true);
    }
  };

  const handleFetchCurrentPrice = async () => {
    if (!investment || investment.type !== 'mutual-fund') {
      Alert.alert('Error', 'This feature is only available for mutual funds');
      return;
    }

    setFetchingPrice(true);
    try {
      const currentPrice = await getUTTFundPrice(investment.name);
      if (currentPrice !== null && !isNaN(currentPrice) && currentPrice > 0) {
        // Update the investment with the new selling price and recalculate total value
        const updatedInvestment: Investment = {
          ...investment,
          sellingPrice: currentPrice,
          totalValue: investment.quantity * currentPrice,
          updatedAt: new Date(),
        };
        await updateInvestment(updatedInvestment);
        setInvestment(updatedInvestment);
        Alert.alert('Success', `Current unit selling price updated: ${currentPrice.toFixed(4)} TZS\nTotal value updated: ${formatCurrency(updatedInvestment.totalValue || 0)}`);
      } else {
        console.error('Invalid price returned:', currentPrice);
        Alert.alert('Error', 'Could not fetch current price for this fund. Please check the fund name or try again later.');
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      Alert.alert('Error', 'Failed to fetch current price. Please try again.');
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleDelete = () => {
    if (!investment) return;
    
    Alert.alert(
      'Delete Investment',
      `Are you sure you want to delete "${investment.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInvestment(investment.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete investment');
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

  const calculateGainLoss = () => {
    if (!investment) return null;
    
    // For mutual funds, use selling price; otherwise use current price
    const price = investment.type === 'mutual-fund' && investment.sellingPrice
      ? investment.sellingPrice
      : investment.currentPrice;
    
    if (!price) return null;
    
    const currentValue = investment.quantity * price;
    const costBasis = investment.quantity * investment.averagePrice;
    const gainLoss = currentValue - costBasis;
    const gainLossPercentage = (gainLoss / costBasis) * 100;
    return { gainLoss, gainLossPercentage };
  };

  if (!investment && !isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading investment...</Text>
      </View>
    );
  }

  const gainLoss = calculateGainLoss();

  return (
    <ScrollView style={styles.container}>
      {isEditing ? (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Investment Details</Title>
            
            <TextInput
              label="Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
            />
            
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeButtonsContainer}>
              {investmentTypes.map((type) => (
                <Button
                  key={type.value}
                  mode={formData.type === type.value ? 'contained' : 'outlined'}
                  onPress={() => setFormData({ ...formData, type: type.value as any })}
                  style={styles.typeButton}
                >
                  {type.label}
                </Button>
              ))}
            </View>
            
            <Text style={styles.label}>Account *</Text>
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
            
            {formData.type === 'mutual-fund' ? (
              <>
                <Text style={styles.label}>Select Fund *</Text>
                <View style={styles.pickerContainer}>
                  {mutualFunds.map((fund) => (
                    <Button
                      key={fund.name}
                      mode={formData.name === fund.name ? 'contained' : 'outlined'}
                      onPress={() => setFormData({ 
                        ...formData, 
                        name: fund.name,
                        fundName: fund.fundName 
                      })}
                      style={styles.fundButton}
                    >
                      {fund.name}
                    </Button>
                  ))}
                </View>
                
                {formData.name && (
                  <Paragraph style={styles.selectedFund}>
                    Selected: <Text style={styles.selectedFundName}>{formData.name} ({formData.fundName})</Text>
                  </Paragraph>
                )}
                
                <TextInput
                  label="Amount Purchased (TZS) *"
                  value={formData.amountPurchased.toString()}
                  onChangeText={(text) => setFormData({ ...formData, amountPurchased: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  style={styles.input}
                />
                
                <TextInput
                  label="Buying Price (Unit Price) *"
                  value={formData.buyingPrice.toString()}
                  onChangeText={(text) => setFormData({ ...formData, buyingPrice: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  style={styles.input}
                />
                
                <TextInput
                  label="Current Unit Selling Price"
                  value={formData.sellingPrice.toString()}
                  onChangeText={(text) => setFormData({ ...formData, sellingPrice: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  style={styles.input}
                />
                
                {formData.amountPurchased > 0 && formData.buyingPrice > 0 && (
                  <Button
                    mode="outlined"
                    onPress={calculateUnits}
                    style={styles.calculateButton}
                  >
                    Calculate Units
                  </Button>
                )}
                
                {unitsCalculated && (
                  <View style={styles.unitsContainer}>
                    <Text style={styles.unitsLabel}>Calculated Units:</Text>
                    <Text style={styles.unitsValue}>{formData.quantity.toFixed(4)}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.row}>
                <TextInput
                  label="Quantity *"
                  value={formData.quantity.toString()}
                  onChangeText={(text) => setFormData({ ...formData, quantity: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                />
                <TextInput
                  label="Avg Price *"
                  value={formData.averagePrice.toString()}
                  onChangeText={(text) => setFormData({ ...formData, averagePrice: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                />
              </View>
            )}
            
            {formData.type !== 'mutual-fund' && (
              <TextInput
                label="Current Price"
                value={formData.currentPrice.toString()}
                onChangeText={(text) => setFormData({ ...formData, currentPrice: parseFloat(text) || 0 })}
                keyboardType="numeric"
                style={styles.input}
              />
            )}
            
            <Text style={styles.label}>Purchase Date</Text>
            <View style={styles.dateContainer}>
              <TextInput
                label="Date"
                value={formData.purchaseDate.toISOString().split('T')[0]}
                editable={false}
                style={[styles.input, { flex: 1 }]}
              />
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
              >
                Change
              </Button>
            </View>
            
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
            <View style={styles.investmentHeader}>
              <View style={styles.investmentInfo}>
                <Title style={styles.investmentName}>{investment?.name}</Title>
              </View>
              <View style={styles.investmentActions}>
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

            <View style={styles.investmentDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Chip 
                  style={styles.typeChip}
                  textStyle={styles.typeChipText}
                >
                  {investment?.type?.charAt(0).toUpperCase() + investment?.type?.slice(1).replace('-', ' ')}
                </Chip>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity:</Text>
                <Text style={styles.detailValue}>
                  {investment?.type === 'mutual-fund' 
                    ? `${investment?.quantity.toFixed(4)} units` 
                    : `${investment?.quantity} shares`}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Average Price:</Text>
                <Text style={styles.detailValue}>{formatCurrency(investment?.averagePrice || 0)}</Text>
              </View>
              
              {investment?.type === 'mutual-fund' ? (
                <>
                  {investment?.buyingPrice && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Buying Price:</Text>
                      <Text style={styles.detailValue}>{formatCurrency(investment.buyingPrice)}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Selling Price:</Text>
                    <View style={styles.detailValueContainer}>
                      <Text style={styles.detailValue}>
                        {investment?.sellingPrice ? formatCurrency(investment.sellingPrice) : 'Not set'}
                      </Text>
                      <Button
                        mode="outlined"
                        compact
                        onPress={handleFetchCurrentPrice}
                        loading={fetchingPrice}
                        disabled={fetchingPrice}
                        style={styles.fetchPriceButton}
                        icon="refresh"
                      >
                        {investment?.sellingPrice ? 'Update' : 'Fetch'}
                      </Button>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Current Value:</Text>
                    <Text style={[styles.detailValue, styles.totalValue]}>
                      {formatCurrency(investment.sellingPrice ? investment.quantity * investment.sellingPrice : investment?.totalValue || 0)}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  {investment?.currentPrice && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Current Price:</Text>
                      <Text style={styles.detailValue}>{formatCurrency(investment.currentPrice)}</Text>
                    </View>
                  )}
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Value:</Text>
                    <Text style={[styles.detailValue, styles.totalValue]}>
                      {formatCurrency(investment?.totalValue || 0)}
                    </Text>
                  </View>
                </>
              )}
              
              {gainLoss && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gain/Loss:</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: gainLoss.gainLoss >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }
                  ]}>
                    {gainLoss.gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss.gainLoss)} 
                    ({gainLoss.gainLossPercentage >= 0 ? '+' : ''}{gainLoss.gainLossPercentage.toFixed(2)}%)
                  </Text>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount Invested:</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(investment?.quantity * investment?.averagePrice || 0)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>First Investment:</Text>
                <Text style={styles.detailValue}>
                  {firstInvestmentDate ? formatDate(firstInvestmentDate) : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Latest Investment:</Text>
                <Text style={styles.detailValue}>
                  {latestInvestmentDate ? formatDate(latestInvestmentDate) : 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.metadata}>
              <Text style={styles.metadataText}>
                Created: {investment?.createdAt.toLocaleString()}
              </Text>
              {investment?.updatedAt && investment.updatedAt.getTime() !== investment.createdAt.getTime() && (
                <Text style={styles.metadataText}>
                  Updated: {investment.updatedAt.toLocaleString()}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>
      )}

      {showDatePicker && (
        <View style={styles.datePickerContainer}>
          <Card style={styles.datePickerCard}>
            <Card.Content>
              <Calendar
                current={formData.purchaseDate.toISOString().split('T')[0]}
                onDayPress={(day) => {
                  const selectedDate = new Date(day.dateString);
                  setFormData({ ...formData, purchaseDate: selectedDate });
                  setShowDatePicker(false);
                }}
                markedDates={{
                  [formData.purchaseDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#6366f1' }
                }}
                theme={{
                  selectedDayBackgroundColor: '#6366f1',
                  todayTextColor: '#6366f1',
                  arrowColor: '#6366f1',
                }}
              />
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(false)}
                style={styles.closeDatePickerButton}
              >
                Close
              </Button>
            </Card.Content>
          </Card>
        </View>
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  investmentInfo: {
    flex: 1,
  },
  investmentName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  investmentSymbol: {
    fontSize: 16,
    color: '#6b7280',
  },
  investmentActions: {
    flexDirection: 'row',
  },
  investmentDetails: {
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
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  fetchButton: {
    marginBottom: 16,
    marginTop: 8,
  },
  pricesContainer: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#374151',
  },
  priceBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  calculatedInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
  },
  calculatedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  calculatedValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    marginRight: 8,
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  fundButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFund: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    fontSize: 14,
  },
  selectedFundName: {
    fontWeight: 'bold',
    color: '#0369a1',
  },
  typeChip: {
    backgroundColor: '#e5e7eb',
  },
  typeChipText: {
    fontSize: 12,
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
  dateContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  dateButton: {
    marginBottom: 16,
  },
  datePickerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerCard: {
    margin: 16,
    maxWidth: '90%',
  },
  closeDatePickerButton: {
    marginTop: 16,
  },
  calculateButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  fetchPriceButton: {
    marginLeft: 8,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  unitsLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  unitsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0369a1',
  },
});

export default InvestmentDetailScreen;
