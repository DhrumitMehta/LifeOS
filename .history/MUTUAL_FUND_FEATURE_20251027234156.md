# Mutual Fund Investment Feature

## Overview
This feature adds comprehensive support for tracking mutual fund investments in the LifeOS app, specifically for UTT AMIS funds (Umoja Fund, Wekeza Maisha Fund, etc.).

## What's New

### 1. Investment Type Enhancements
- Added `buyingPrice` and `sellingPrice` fields to the Investment interface
- These fields track the current buy and sell prices for mutual funds
- For mutual funds:
  - **Buying Price** = What you pay to buy a unit (Sale Price)
  - **Selling Price** = What you receive when selling a unit (Repurchase Price)

### 2. Real-Time Price Fetching
- Created a new service (`src/services/mutualFundService.ts`) that fetches live prices from the UTT AMIS website
- Supports all UTT AMIS funds:
  - Umoja Fund
  - Wekeza Maisha Fund
  - Watoto Fund
  - Jikimu Fund
  - Liquid Fund
  - Bond Fund
- Automatically parses fund prices from: https://uttamis.co.tz/fund-performance

### 3. Enhanced Investment Display
The Investment Detail Screen now shows:
- **Amount Invested**: Total money invested (Quantity × Average Price)
- **Current Quantity of Units**: Number of units owned
- **Buying Price**: Current price to buy a unit
- **Selling Price**: Current price when selling a unit
- **Current Value**: Calculated using the selling price
- **Gain/Loss**: Profit or loss with percentage

### 4. Database Schema Updates
- Updated both SQLite and Supabase schemas to include `buying_price` and `selling_price` fields
- Created migration files:
  - `002_add_investment_price_fields.sql` (SQLite)
  - `002_add_investment_price_fields_supabase.sql` (Supabase)

## How to Use

### Adding a Mutual Fund Investment

1. Navigate to the investment section
2. Click "Add Investment"
3. Select "Mutual Fund" as the investment type
4. Enter the fund name (e.g., "Umoja Fund")
5. Enter the quantity of units you own
6. Enter the average price you paid per unit
7. Click **"Fetch Latest Prices"** to get current buy/sell prices from UTT AMIS
8. Review the updated buying and selling prices
9. Save the investment

### Viewing Your Investment

When viewing a mutual fund investment, you'll see:
- Total amount invested
- Current quantity of units
- Current buying and selling prices
- Current investment value
- Gain/Loss percentage

### Manual Price Updates

If you prefer to enter prices manually:
1. Open the investment
2. Click the edit button
3. Enter the buying price and selling price
4. Save changes

## Technical Details

### Files Modified
1. `src/types/index.ts` - Added buyingPrice and sellingPrice fields
2. `src/services/mutualFundService.ts` - New service for fetching prices
3. `src/screens/InvestmentDetailScreen.tsx` - Enhanced UI for mutual funds
4. `src/database/schema.sql` - Updated SQLite schema
5. `supabase-schema.sql` - Updated Supabase schema
6. `src/database/migrations/002_add_investment_price_fields.sql` - SQLite migration
7. `src/database/migrations/002_add_investment_price_fields_supabase.sql` - Supabase migration

### Service Functions

#### `fetchMutualFundPrices()`
Fetches all available fund prices from UTT AMIS website and returns an object with prices for all funds.

#### `getFundPricesByName(fundName: string)`
Fetches prices for a specific fund by name. Returns `{ buyingPrice, sellingPrice }` or `null` if not found.

### Price Calculation

For mutual funds:
```typescript
Current Value = Quantity × Selling Price
Amount Invested = Quantity × Average Price
Gain/Loss = Current Value - Amount Invested
Gain/Loss % = (Gain/Loss / Amount Invested) × 100
```

## Notes

- The price fetching service relies on the UTT AMIS website structure. If their website changes, the parsing logic may need to be updated.
- Prices are fetched in real-time when you click "Fetch Latest Prices"
- The service gracefully handles errors and will fall back to manual price entry if fetching fails
- All prices are stored in TZS (Tanzanian Shilling)

## Future Enhancements

Potential improvements:
- Scheduled automatic price updates
- Price history tracking
- Support for other mutual fund providers
- Bulk price updates for all mutual funds

