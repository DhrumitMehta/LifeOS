# LifeOS - Personal Life Management App

A comprehensive React Native app built with Expo for managing your daily life, including habit tracking, journaling, finance management, and analytics. LifeOS serves as your all-in-one personal operating system for organizing and improving your life.

## 📱 Features

### 🎯 Habit Tracking
- **Boolean Habits**: Yes/No habits (e.g., "Exercise today", "Read for 30 minutes")
- **Numeric Habits**: Value-based habits (e.g., "Sleep 8 hours", "Walk 10,000 steps")
- **Smart Time Input**: Specialized time input for hour-based habits with hours/minutes selection
- **Today + Yesterday Editing**: Edit habits for current and previous day with visual date indicators
- **Week/Month Views**: Toggle between weekly and monthly calendar views
- **Visual Indicators**: Clear marking of today and yesterday dates on calendar
- **Habit Reminders**: Automatic daily notifications for active habits (scheduled hourly starting at 9am)

### 📊 Analytics Dashboard
- **Yes/No Habit Charts**: Bar charts showing completion rates by day of week
- **Numeric Trend Charts**: Line charts showing values over time with trend analysis
- **Numeric Day Charts**: Bar charts showing average values by day of week
- **Interactive Selection**: Choose specific habits and date ranges for detailed analysis
- **Horizontal Scrolling**: View all data points with smooth scrolling
- **Data Aggregation**: Automatic calculation of averages, totals, and trends

### 📝 Journal
- **Daily Entries**: Record thoughts, experiences, and reflections
- **Mood Tracking**: Track your emotional state with visual mood indicators
- **Tag System**: Organize entries with custom tags for easy filtering
- **Rich Text**: Full text editing capabilities
- **Journal Reminders**: Daily notification at 8:00 AM to fill your journal
- **Notion Integration**: Sync journal entries with your Notion workspace

### 💰 Finance Management
- **Transaction Tracking**: Comprehensive income and expense management
- **Investment Portfolio**: Track stocks, bonds, crypto, mutual funds, and other investments
- **Mutual Fund Support**: 
  - Real-time price fetching from UTT AMIS (Tanzanian mutual funds)
  - Support for Umoja Fund, Wekeza Maisha Fund, Watoto Fund, Jikimu Fund, Liquid Fund, and Bond Fund
  - Automatic buy/sell price updates
  - Gain/loss calculations with percentage
- **Budget Planning**: Set and monitor spending limits by category
- **Account Management**: Multiple account support (checking, savings, investment accounts)
- **Category System**: Organized financial categorization with custom categories
- **Transaction Details**: Detailed view with date, amount, category, account, and notes
- **Investment Details**: Track quantity, average price, current value, and performance

### 🔔 Notifications & Reminders
- **Daily Journal Reminder**: 8:00 AM notification to fill your journal
- **Family Time Reminder**: 7:30 PM notification to switch off and spend time with family
- **Habit Reminders**: Automatic hourly reminders for active habits (starting at 9am)
- **Smart Scheduling**: Notifications automatically reschedule when app comes to foreground
- **Background Sync**: Notifications persist after device restart

### 🔄 Data Management
- **Supabase Integration**: Cloud-based data persistence with real-time sync
- **AsyncStorage Fallback**: Local storage when cloud is unavailable
- **Offline Sync**: Queue operations when offline and sync when connection is restored
- **Pull-to-Refresh**: Manual data synchronization on all screens
- **Real-time Updates**: Instant UI updates on data changes
- **Data Persistence**: All data saved locally and synced to cloud

### 🔗 Notion Integration
- **Workspace Connection**: Connect to your Notion workspace via integration token
- **Database Sync**: Sync journal entries and other data with Notion databases
- **Random Highlights**: Display random highlights and ideas from your Notion workspace on home screen
- **Content Extraction**: Automatically extract and format Notion page content
- **Connection Testing**: Verify Notion connection before syncing

### 🏠 Home Dashboard
- **Daily Checklist**: Quick view of today's tasks and habits
- **Weekly Overview**: Summary of weekly progress
- **Quick Stats**: At-a-glance statistics for habits, journal entries, and finances
- **Notion Content**: Random highlights and ideas from connected Notion workspace
- **Navigation Hub**: Quick access to all major features

### ⚙️ Settings & Customization
- **Category Management**: Add, edit, and delete income/expense categories
- **Notion Configuration**: Set up and manage Notion integration
- **Data Export/Import**: (Coming soon) Export and import your data
- **App Configuration**: Manage app preferences and settings

## 🛠 Technology Stack

- **React Native**: Cross-platform mobile development
- **Expo SDK 54**: Development platform and tools
- **TypeScript**: Type-safe development
- **React Navigation**: Screen navigation (Stack & Bottom Tabs)
- **React Native Paper**: Material Design components
- **Supabase**: Backend-as-a-Service for data persistence
- **React Context API**: State management
- **React Native Chart Kit**: Data visualization
- **Expo Notifications**: Push notifications and scheduling
- **AsyncStorage**: Local data persistence
- **Notion API**: Integration with Notion workspace

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for development)
- EAS CLI (for building production apps)

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

3. **Set up Supabase** (Optional but recommended)
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - The app includes default Supabase credentials, but you can update `src/config/supabase.ts` with your own

4. **Start the development server**
   ```bash
   npx expo start
   ```

### Database Setup

If you want to use Supabase for cloud data persistence:

1. Create a new Supabase project
2. Run the SQL commands from `supabase-schema.sql` in your Supabase SQL editor
3. The app will use default credentials, or update `src/config/supabase.ts` with your project credentials

The app will work with local storage (AsyncStorage) even without Supabase configuration.

### Building for Production

See [BUILD_INSTRUCTIONS.md](./BUILD_INSTRUCTIONS.md) for detailed build instructions.

**Quick Build (Windows):**
```powershell
.\quick-build.ps1
```

**Quick Build (WSL/Linux):**
```bash
bash build-wsl.sh
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── NotificationScheduler.tsx
│   └── NotionConnectionModal.tsx
├── config/             # Configuration files
│   ├── supabase.ts     # Supabase client configuration
│   └── balances.json    # Account balance data
├── context/            # React Context for state management
│   └── AppContext.tsx   # Main app state and actions
├── database/           # Data persistence layer
│   ├── database.ts      # SQLite local database
│   ├── supabaseDatabase.ts  # Supabase cloud database
│   ├── schema.sql       # SQLite schema
│   └── migrations/      # Database migration files
├── screens/            # Main app screens
│   ├── HomeScreen.tsx
│   ├── HabitsScreen.tsx
│   ├── HabitDetailScreen.tsx
│   ├── JournalScreen.tsx
│   ├── JournalDetailScreen.tsx
│   ├── FinanceScreen.tsx
│   ├── TransactionDetailScreen.tsx
│   ├── InvestmentDetailScreen.tsx
│   ├── BudgetDetailScreen.tsx
│   ├── AnalyticsScreen.tsx
│   └── SettingsScreen.tsx
├── services/           # External service integrations
│   ├── notifications.ts      # Notification scheduling
│   ├── notion.ts              # Notion API integration
│   ├── mutualFundService.ts  # Mutual fund price fetching
│   └── offlineSync.ts         # Offline operation queuing
├── theme/              # App theming
│   ├── colors.ts
│   └── index.ts
├── types/              # TypeScript type definitions
│   └── index.ts
└── utils/              # Utility functions
    └── dateFormat.ts
```

## 🐛 Build Issues & Fixes

### How We Fixed EAS Build Permission Errors

During the build process, we encountered several critical issues that prevented successful builds. Here's how we resolved them:

#### Issue 1: Windows File Permission Errors

**Problem:**
```
tar: assets/icon.png: Cannot open: Permission denied
tar: src/components: Cannot mkdir: Permission denied
```

**Solution:**
1. **Added EAS Configuration**: Updated `eas.json` with:
   ```json
   "cli": {
     "version": ">= 15.0.6",
     "appVersionSource": "remote",
     "requireCommit": "true"
   }
   ```
   This ensures EAS requires a git commit before building, which helps with file tracking.

2. **Ran as Administrator**: Executed build commands from PowerShell/Command Prompt running as Administrator to avoid Windows permission restrictions.

3. **Fixed File Permissions**: Created and ran `fix-permissions.ps1` script to remove read-only attributes from all project files and directories.

4. **WSL Alternative**: Set up Windows Subsystem for Linux (WSL) as an alternative build environment to completely avoid Windows permission issues. Created `build-wsl.sh` script for seamless WSL builds.

**Reference:** [Reddit Solution](https://www.reddit.com/r/reactnative/comments/1ijnog3/comment/mbln6a1/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button)

#### Issue 2: Supabase Config Missing from Build

**Problem:**
```
Error: Unable to resolve module ../config/supabase from /home/expo/workingdir/build/src/services/offlineSync.ts
```

**Solution:**
1. **Removed from .gitignore**: The `src/config/supabase.ts` file was in `.gitignore` because it contained Supabase credentials. We removed it from `.gitignore` since the anon key is public and safe to commit.

2. **Environment Variable Support**: Updated `supabase.ts` to support environment variables with fallback to hardcoded values:
   ```typescript
   const supabaseUrl = 
     Constants.expoConfig?.extra?.supabaseUrl || 
     process.env.EXPO_PUBLIC_SUPABASE_URL || 
     'https://dskmeqmjsrxknqcnwjhx.supabase.co';
   ```

3. **Committed the File**: Added `supabase.ts` to git and committed it so it's included in EAS builds.

#### Issue 3: Git Repository Not Initialized

**Problem:**
EAS build requires git commits when `requireCommit: true` is set, but no git repository existed.

**Solution:**
1. Initialized git repository: `git init`
2. Added all files: `git add .`
3. Created initial commit: `git commit -m "Initial commit"`
4. This satisfied EAS's commit requirement and improved build reliability.

#### Additional Fixes

- **Created Build Scripts**: 
  - `fix-permissions.ps1` - Removes read-only attributes on Windows
  - `pre-build-check.ps1` - Verifies all required files are accessible
  - `quick-build.ps1` - Automated build script for Windows
  - `build-wsl.sh` - Build script for WSL/Linux
  - `install-wsl.ps1` - WSL installation helper

- **Updated Build Documentation**: Enhanced `BUILD_INSTRUCTIONS.md` with Windows-specific troubleshooting and WSL setup instructions.

- **Line Ending Fixes**: Updated `.gitattributes` to ensure consistent line endings (LF) across platforms.

## 🔮 Future Features

### Planned Enhancements

1. **Search in Transactions** 🔍
   - Full-text search across all transaction fields (description, category, amount, date)
   - Filter by date range, category, account, or amount
   - Quick search bar in Finance screen
   - Search history and saved filters

2. **Data Export/Import**
   - Export all data to JSON/CSV format
   - Import data from backup files
   - Selective export (habits only, finances only, etc.)
   - Cloud backup integration

3. **Advanced Analytics**
   - Spending trends and predictions
   - Habit streak tracking and statistics
   - Monthly/yearly reports
   - Custom date range analysis
   - Export charts as images

4. **Enhanced Notifications**
   - Customizable notification times
   - Habit-specific reminder schedules
   - Budget alerts when approaching limits
   - Investment price change notifications

5. **Multi-Currency Support**
   - Support for multiple currencies
   - Automatic currency conversion
   - Exchange rate tracking

6. **Recurring Transactions**
   - Set up recurring income/expenses
   - Automatic transaction creation
   - Subscription tracking and management

7. **Investment Enhancements**
   - Price history charts
   - Portfolio performance over time
   - Automatic price updates for all investments
   - Support for more investment types

8. **Social Features**
   - Share habit progress with friends
   - Group challenges
   - Leaderboards (optional)

9. **Dark Mode**
   - System theme detection
   - Manual theme toggle
   - Custom color schemes

10. **Widgets**
    - Home screen widgets for quick stats
    - Habit completion widget
    - Finance summary widget

11. **Voice Input**
    - Voice-to-text for journal entries
    - Voice commands for quick actions

12. **Biometric Authentication**
    - Face ID / Touch ID / Fingerprint
    - Secure app access

## 📝 Key Features Implementation

### Habit Tracking System
- **Dual Habit Types**: Boolean (yes/no) and Numeric (value-based) habits
- **Smart Time Input**: Specialized input for hour-based habits with hours/minutes
- **Flexible Editing**: Edit habits for today and yesterday
- **Visual Calendar**: Week and month views with clear date indicators
- **Automatic Reminders**: Hourly notifications for active habits

### Analytics Engine
- **Multiple Chart Types**: Bar charts, line charts, and trend analysis
- **Interactive Selection**: Choose habits and date ranges for analysis
- **Data Aggregation**: Automatic calculation of averages, totals, and trends
- **Responsive Design**: Charts adapt to different screen sizes

### Data Architecture
- **Hybrid Storage**: Supabase for cloud sync, AsyncStorage for offline
- **Offline Queue**: Operations queued when offline, synced when online
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Graceful fallbacks and error recovery
- **Performance**: Optimized data loading and caching

### Notification System
- **Smart Scheduling**: Automatic rescheduling when app comes to foreground
- **Persistent Notifications**: Survive device restarts
- **Context-Aware**: Different notification types for different features
- **User-Friendly**: Clear, actionable notification messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React Native and Expo
- UI components from React Native Paper
- Charts powered by React Native Chart Kit
- Backend services by Supabase
- Notion API for workspace integration
- UTT AMIS for mutual fund price data

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub or contact the development team.

---

**LifeOS** - Your Personal Operating System for a Better Life 🚀
