# LifeOS - Personal Life Management App

A comprehensive React Native app built with Expo for managing your daily life, including habit tracking, journaling, finance management, and analytics.

## Features

### 🎯 Habit Tracking
- **Boolean Habits**: Yes/No habits (e.g., "Exercise today", "Read for 30 minutes")
- **Numeric Habits**: Value-based habits (e.g., "Sleep 8 hours", "Walk 10,000 steps")
- **Smart Input**: Specialized time input for hour-based habits
- **Today + Yesterday Editing**: Edit habits for current and previous day
- **Visual Indicators**: Clear marking of today and yesterday dates
- **Week/Month Views**: Toggle between weekly and monthly calendar views

### 📊 Analytics Dashboard
- **Yes/No Habit Charts**: Bar charts showing completion by day of week
- **Numeric Trend Charts**: Line charts showing values over time
- **Numeric Day Charts**: Bar charts showing average values by day of week
- **Interactive Selection**: Choose specific habits and date ranges
- **Horizontal Scrolling**: View all data points with smooth scrolling

### 📝 Journal
- **Daily Entries**: Record thoughts, experiences, and reflections
- **Mood Tracking**: Track your emotional state with visual indicators
- **Tag System**: Organize entries with custom tags
- **Rich Text**: Full text editing capabilities

### 💰 Finance Management
- **Transaction Tracking**: Income and expense management
- **Investment Portfolio**: Track stocks, bonds, crypto, and other investments
- **Budget Planning**: Set and monitor spending limits
- **Account Management**: Multiple account support
- **Category System**: Organized financial categorization

### 🔄 Data Management
- **Supabase Integration**: Cloud-based data persistence
- **AsyncStorage Fallback**: Local storage when cloud is unavailable
- **Pull-to-Refresh**: Manual data synchronization
- **Real-time Updates**: Instant UI updates on data changes

## Technology Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe development
- **React Navigation**: Screen navigation
- **React Native Paper**: Material Design components
- **Supabase**: Backend-as-a-Service for data persistence
- **React Context**: State management
- **React Native Charts**: Data visualization

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/LifeOS.git
   cd LifeOS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase** (Optional)
   - Create a Supabase project
   - Run the SQL schema from `supabase-schema.sql`
   - Update `src/config/supabase.ts` with your credentials

4. **Start the development server**
   ```bash
   npx expo start
   ```

### Database Setup

If you want to use Supabase for cloud data persistence:

1. Create a new Supabase project
2. Run the SQL commands from `supabase-schema.sql` in your Supabase SQL editor
3. Update the Supabase configuration in `src/config/supabase.ts`

The app will work with local storage (AsyncStorage) even without Supabase configuration.

## Project Structure

```
src/
├── components/          # Reusable UI components
├── config/             # Configuration files
├── context/            # React Context for state management
├── database/           # Data persistence layer
├── screens/            # Main app screens
├── services/           # External service integrations
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Key Features Implementation

### Habit Tracking System
- **Dual Habit Types**: Boolean (yes/no) and Numeric (value-based) habits
- **Smart Time Input**: Specialized input for hour-based habits with hours/minutes
- **Flexible Editing**: Edit habits for today and yesterday
- **Visual Calendar**: Week and month views with clear date indicators

### Analytics Engine
- **Multiple Chart Types**: Bar charts, line charts, and trend analysis
- **Interactive Selection**: Choose habits and date ranges for analysis
- **Data Aggregation**: Automatic calculation of averages, totals, and trends
- **Responsive Design**: Charts adapt to different screen sizes

### Data Architecture
- **Hybrid Storage**: Supabase for cloud sync, AsyncStorage for offline
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Graceful fallbacks and error recovery
- **Performance**: Optimized data loading and caching

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with React Native and Expo
- UI components from React Native Paper
- Charts powered by React Native Chart Kit
- Backend services by Supabase