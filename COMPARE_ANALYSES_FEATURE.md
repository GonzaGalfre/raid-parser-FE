# Compare Analyses Feature

## Overview

The Compare Analyses feature allows users to select multiple saved raid analyses to see progression over time. Analyses are automatically sorted by **actual raid dates** (when the raids occurred), not upload dates, providing accurate chronological insights into raid team development, player improvement trends, and performance patterns across different raid sessions.

## How It Works

### 1. **Navigation**
- **Hub Page**: "Compare Analyses" card in the quick actions section
- **Vertical Navbar**: Dedicated "Compare" navigation option with GitCompare icon
- **Disabled State**: Compare button is disabled when fewer than 2 analyses are saved

### 2. **Multi-Selection Interface**
- **Grid Layout**: Visual selection of analyses with checkboxes
- **Chronological Ordering**: Analyses are displayed and processed by **actual raid dates**
- **Date Clarity**: Shows raid dates with "(raid date)" label to distinguish from upload dates
- **Bulk Actions**: Select All / Clear All buttons for convenience
- **Selection Counter**: Shows how many analyses are selected
- **Analysis Cards**: Each card shows name, zone, raid date, report count, and player count
- **Visual Selection**: Selected analyses are highlighted with primary color border

### 3. **Comparison Results**

#### **Raid Progression Timeline**
- **Chronological View**: Shows all selected analyses in time order
- **Step-by-Step Changes**: Each analysis shows change from the previous one
- **Progress Indicators**: Visual up/down arrows and percentage changes
- **Overview Summary**: Overall progression from first to last analysis
- **Trend Analysis**: Automatic categorization as improving, declining, or stable

#### **Individual Player Progression**
- **Trend Categories**:
  - 🟢 **Improving**: Consistent performance improvement (>70% of changes positive)
  - 🔴 **Declining**: Consistent performance decline (>70% of changes negative)
  - ⚪ **Stable**: Performance stays within 3% range
  - 🔵 **New**: Player only appeared in one analysis
  - 🟠 **Inconsistent**: Mixed performance changes

- **Progression Tracking**: Shows first vs latest performance
- **Analysis Count**: Number of analyses where player was present
- **Smart Sorting**: Players sorted by total improvement (best first)

## Technical Implementation

### **Data Flow**
1. **Multi-Selection**: Users select any number of analyses (minimum 2)
2. **Chronological Sorting**: System automatically sorts by **actual raid dates** from `dateRange.earliest`
3. **Progress Calculation**: Calculates progression between consecutive raid sessions
4. **Trend Analysis**: Determines overall trends using consistency thresholds
5. **Visual Display**: Presents timeline view with clear progression indicators

### **Raid Date vs Upload Date**
**Critical Design Decision**: The system uses actual raid dates (`dateRange.earliest`) instead of upload dates (`createdAt`) for chronological sorting. This ensures:
- **Accurate Timeline**: Progression reflects when raids actually happened
- **Correct Analysis**: A raid from last week analyzed today appears in its proper chronological position
- **Meaningful Progression**: Changes reflect actual time-based improvement, not analysis workflow
- **User Clarity**: Interface clearly labels dates as "(raid date)" to avoid confusion

### **Progression Logic**
```typescript
// Player trend determination
if (presentDataPoints.length === 1) {
  overallTrend = 'new';
} else if (Math.abs(totalChange) <= 3) {
  overallTrend = 'stable';
} else if (totalChange > 0) {
  // Check consistency: 70% of changes must be positive for "improving"
  overallTrend = improvementCount >= presentDataPoints.length * 0.7 ? 'improving' : 'inconsistent';
}
```

### **Key Features**
- **Automatic Date Sorting**: No manual baseline selection needed
- **Flexible Selection**: Compare any combination of analyses
- **Trend Consistency**: Uses 70% threshold for consistent improvement/decline
- **Missing Data Handling**: Gracefully handles players not present in all analyses
- **Performance Optimized**: Only loads selected analyses, not all data

## User Experience

### **Simplified Workflow**
1. **Select Analyses**: Click/checkbox any analyses you want to compare
2. **Auto-Processing**: System sorts them chronologically automatically
3. **View Timeline**: See step-by-step progression over time
4. **Individual Trends**: Review each player's journey

### **Visual Design**
- **Timeline View**: Clear progression with numbered steps
- **Color Coding**: Green for improvement, red for decline, etc.
- **Change Indicators**: Up/down arrows with exact percentage changes
- **Card Layout**: Consistent with other pages for familiarity
- **Responsive Grid**: Works on desktop and mobile devices

### **Improved UX vs Previous Version**
- **No Baseline Selection**: Eliminates confusing "baseline vs comparison" choice
- **Flexible Comparison**: Can compare 2, 3, 5, or any number of analyses
- **Chronological Logic**: Natural progression view instead of arbitrary comparison
- **Bulk Selection**: Easy to select all or multiple analyses at once

## Integration with Existing Features

### **Reused Components**
- **Badge System**: Same trend indicators as timeline analysis
- **Checkbox Component**: Native UI component for selection
- **Storage Service**: Uses existing analysis loading system
- **Card Layouts**: Consistent design patterns

### **Data Compatibility**
- **PlayerAverage Interface**: Uses same data structures
- **Analysis Service**: Leverages existing storage abstraction
- **Type Safety**: Full TypeScript support with proper interfaces

## Use Cases

### **Guild Management**
- **Progression Tracking**: See raid team improvement over weeks/months
- **Roster Impact**: Understand how player changes affect performance
- **Training Effectiveness**: Measure improvement after strategy changes
- **Recruitment Success**: Track new player integration

### **Player Development**
- **Individual Progression**: See each player's improvement journey
- **Consistency Analysis**: Identify consistently improving vs inconsistent players
- **Role Comparison**: Compare tank, healer, DPS progression patterns
- **Long-term Trends**: Understand player development over time

### **Raid Analysis**
- **Seasonal Progression**: Track performance across raid tiers
- **Patch Impact**: See how game changes affect raid performance
- **Strategy Evolution**: Measure impact of tactical changes
- **Performance Cycles**: Identify patterns in raid team performance

## Advanced Features

### **Smart Trend Analysis**
- **Consistency Thresholds**: 70% consistency required for "improving/declining" vs "inconsistent"
- **Stability Range**: ±3% considered stable performance
- **Missing Data Handling**: Players tracked only for analyses where they were present
- **Trend Confidence**: Clear differentiation between consistent and inconsistent patterns

### **Timeline Visualization**
- **Step-by-Step View**: Each analysis shows change from previous
- **Overall Summary**: First to last comparison for long-term view
- **Visual Progression**: Clear indicators of performance direction
- **Date Context**: Always shows when each analysis was created

## Future Enhancements

### **Potential Additions**
- **Graph Visualization**: Line charts showing progression over time
- **Export Timeline**: Save progression reports as PDFs
- **Filter by Role**: Show only tank, healer, or DPS progressions
- **Performance Predictions**: AI-based trend forecasting

### **Advanced Analytics**
- **Statistical Confidence**: Confidence intervals for trend analysis
- **Regression Analysis**: Mathematical trend fitting
- **Performance Volatility**: Measure consistency vs improvement
- **Correlation Analysis**: Link performance to roster changes

## Testing the Feature

1. **Save Multiple Analyses**: Create 3+ analyses from different time periods
2. **Navigate to Compare**: Use Hub card or vertical navbar
3. **Select Analyses**: Check multiple analyses (try different combinations)
4. **View Timeline**: Review chronological progression
5. **Analyze Trends**: Look at individual player progression patterns
6. **Test Edge Cases**: Try with players who joined/left mid-timeline

The improved Compare Analyses feature provides an intuitive, powerful way to understand raid team development and progression over time! 🚀 