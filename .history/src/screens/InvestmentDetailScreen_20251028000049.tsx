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
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Investment, RootStackParamList } from '../types';
import { getFundPricesByName, FundProvider, getAvailableFunds } from '../services/mutualFundService';

type InvestmentDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InvestmentDetail'>;
type InvestmentDetailScreenRouteProp = RouteProp<RootStackParamList, 'InvestmentDetail'>;

const InvestmentDetailScreen = () => {
  const navigation = useNavigation<InvestmentDetailScreenNavigationProp>();
  const route = useRoute<InvestmentDetailScreenRouteProp>();
  const { state, addInvestment, updateInvestment, deleteInvestment } = useApp();
  
  const [isEditing, setIsEditing] = useState(false);
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [loading, setLoading] = useState(false);
  const [unitsCalculated, setUnitsCalculated] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'stock' as 'stock' | 'bond' | 'crypto' | 'mutual-fund' | 'real-estate',
    symbol: '',
    quantity: 0,
    averagePrice: 0,
    currentPrice: 0,
    purchaseDate: new Date(),
    buyingPrice: 0,
    sellingPrice: 0,
    provider: 'UTT' as FundProvider,
    fundName: '',
    amountPurchased: 0,
  });

  const investmentTypes = [
    { value: 'stock', label: 'Individual Stock' },
    { value: 'mutual-fund', label: 'Mutual Fund' },
    { value: 'bond', label: 'Bond' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'real-estate', label: 'Real Estate' },
  ];

  useEffect(() => {
    if (route.params.investmentId) {
      const foundInvestment = state.investments.find(i => i.id === route.params.investmentId);
      if (foundInvestment) {
        setInvestment(foundInvestment);
        setFormData({
          name: foundInvestment.name,
          type: foundInvestment.type,
          symbol: foundInvestment.symbol || '',
          quantity: foundInvestment.quantity,
          averagePrice: foundInvestment.averagePrice,
          currentPrice: foundInvestment.currentPrice || 0,
          purchaseDate: foundInvestment.purchaseDate,
          buyingPrice: foundInvestment.buyingPrice || 0,
          sellingPrice: foundInvestment.sellingPrice || 0,
          provider: (foundInvestment.provider as FundProvider) || 'UTT',
          fundName: foundInvestment.fundName || '',
          amountPurchased: foundInvestment.amountPurchased || 0,
        });
        setUnitsCalculated(foundInvestment.provider !== undefined);
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

    try {
      // For mutual funds with provider, calculate based on selling price
      const priceToUse = formData.type === 'mutual-fund' && formData.sellingPrice > 0
        ? formData.sellingPrice
        : formData.currentPrice > 0 
          ? formData.currentPrice 
          : formData.averagePrice;
      
      const totalValue = formData.quantity * priceToUse;

      const investmentData = {
        ...formData,
        totalValue: totalValue,
      };

      if (investment) {
        const updatedInvestment: Investment = {
          ...investment,
          ...investmentData,
          updatedAt: new Date(),
        };
        await updateInvestment(updatedInvestment);
        setInvestment(updatedInvestment);
      } else {
        await addInvestment(investmentData);
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

  const handleFetchPrices = async () => {
    if (!formData.fundName || formData.type !== 'mutual-fund') {
      Alert.alert('Error', 'Please select a fund first');
      return;
    }

    setLoading(true);
    try {
      const prices = await getFundPricesByName(formData.fundName, formData.provider);
      if (prices) {
        const updatedFormData = {
          ...formData,
          buyingPrice: prices.buyingPrice,
          sellingPrice: prices.sellingPrice,
          // Set the investment name to the fund name
          name: formData.fundName,
        };
        setFormData(updatedFormData);
        
        // Auto-calculate units if amount purchased is set
        if (formData.amountPurchased > 0 && prices.buyingPrice > 0) {
          const units = formData.amountPurchased / prices.buyingPrice;
          updatedFormData.quantity = units;
          updatedFormData.averagePrice = prices.buyingPrice;
          setFormData(updatedFormData);
          setUnitsCalculated(true);
        }
        Alert.alert('Success', 'Prices fetched and units calculated!');
      } else {
        Alert.alert('Error', 'Could not fetch prices for this fund. Please check the fund name or provider.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch prices. Please try again.');
    } finally {
      setLoading(false);
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
            <SegmentedButtons
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              buttons={investmentTypes}
              style={styles.segmentedButtons}
            />
            
            <TextInput
              label="Symbol"
              value={formData.symbol}
              onChangeText={(text) => setFormData({ ...formData, symbol: text })}
              style={styles.input}
            />
            
            {formData.type === 'mutual-fund' ? (
              <>
                <Text style={styles.label}>Provider *</Text>
                <SegmentedButtons
                  value={formData.provider}
                  onValueChange={(value) => setFormData({ ...formData, provider: value as FundProvider, fundName: '' })}
                  buttons={[
                    { value: 'UTT', label: 'UTT' },
                    { value: 'Itrust', label: 'Itrust' },
                    { value: 'Quiver', label: 'Quiver' },
                  ]}
                  style={styles.segmentedButtons}
                />
                
                <Text style={styles.label}>Select Fund *</Text>
                <View style={styles.pickerContainer}>
                  {getAvailableFunds(formData.provider).map((fund) => (
                    <Button
                      key={fund.value}
                      mode={formData.fundName === fund.value ? 'contained' : 'outlined'}
                      onPress={() => setFormData({ ...formData, fundName: fund.value })}
                      style={styles.fundButton}
                    >
                      {fund.label}
                    </Button>
                  ))}
                </View>
                
                {formData.fundName && (
                  <Paragraph style={styles.selectedFund}>
                    Selected: <Text style={styles.selectedFundName}>{formData.fundName}</Text>
                  </Paragraph>
                )}
                
                <TextInput
                  label="Amount Purchased (TZS) *"
                  value={formData.amountPurchased.toString()}
                  onChangeText={(text) => setFormData({ ...formData, amountPurchased: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  style={styles.input}
                />
                
                <Button
                  mode="contained"
                  onPress={handleFetchPrices}
                  loading={loading}
                  disabled={loading}
                  style={styles.fetchButton}
                  icon="download"
                >
                  {loading ? 'Fetching Prices...' : 'Fetch Current Prices'}
                </Button>
                
                {formData.buyingPrice > 0 && (
                  <View style={styles.pricesContainer}>
                    <Text style={styles.sectionTitle}>Current Prices</Text>
                    <View style={styles.row}>
                      <View style={styles.priceBox}>
                        <Text style={styles.priceLabel}>Buying Price</Text>
                        <Text style={styles.priceValue}>{formatCurrency(formData.buyingPrice)}</Text>
                      </View>
                      <View style={styles.priceBox}>
                        <Text style={styles.priceLabel}>Selling Price</Text>
                        <Text style={styles.priceValue}>{formatCurrency(formData.sellingPrice)}</Text>
                      </View>
                    </View>
                    
                    {formData.amountPurchased > 0 && formData.buyingPrice > 0 && (
                      <View style={styles.calculatedInfo}>
                        <Text style={styles.calculatedLabel}>Units Purchased:</Text>
                        <Text style={styles.calculatedValue}>
                          {(formData.amountPurchased / formData.buyingPrice).toFixed(4)}
                        </Text>
                      </View>
                    )}
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
                <Text style={styles.investmentSymbol}>
                  {investment?.symbol && `(${investment.symbol})`}
                </Text>
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
                <Text style={styles.detailValue}>{investment?.quantity} shares</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Average Price:</Text>
                <Text style={styles.detailValue}>{formatCurrency(investment?.averagePrice || 0)}</Text>
              </View>
              
              {investment?.type === 'mutual-fund' && (investment?.buyingPrice || investment?.sellingPrice) ? (
                <>
                  {investment?.buyingPrice && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Buying Price:</Text>
                      <Text style={styles.detailValue}>{formatCurrency(investment.buyingPrice)}</Text>
                    </View>
                  )}
                  {investment?.sellingPrice && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Selling Price:</Text>
                      <Text style={styles.detailValue}>{formatCurrency(investment.sellingPrice)}</Text>
                    </View>
                  )}
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
                <Text style={styles.detailLabel}>Purchase Date:</Text>
                <Text style={styles.detailValue}>
                  {investment?.purchaseDate.toLocaleDateString()}
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

export default InvestmentDetailScreen;
