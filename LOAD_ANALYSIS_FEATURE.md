# Load Saved Analysis Feature

## Overview

The Load Saved Analysis feature allows users to restore previously saved raid analyses, bringing back all the report data, player performance information, and settings exactly as they were when saved.

## How It Works

### 1. **Storage & Retrieval**
- Saved analyses are stored in IndexedDB with complete report data
- The `loadSavedAnalysis` function in `useWarcraftLogsApi` restores data to app state
- All original functionality (timeline analysis, player stats, etc.) works with loaded data

### 2. **User Interface**
- **Hub Page**: Recent analyses show "Load" buttons
- **Saved Reports Page**: All analyses have "Load" buttons in their action menus
- Loading navigates automatically to the "Add Report" page with restored data

### 3. **Data Restoration**
- **Report Data**: All WarcraftLogs report information
- **Player Performance**: Calculated averages, percentiles, and stats
- **Wipefest Scores**: Player scores from imported CSV data
- **Timeline Analysis**: Multi-report progression data (if applicable)
- **Fight Selection**: Preserved boss fight selections

## Technical Implementation

### `useWarcraftLogsApi.loadSavedAnalysis()`
```typescript
const result = await loadSavedAnalysis(analysisId);
// Returns: { success: boolean, analysisName?: string, reportCount?: number, playerCount?: number, error?: string }
```

### Data Flow
1. **Load Analysis**: `analysisService.loadAnalysis(id)` retrieves saved data
2. **Convert Format**: Transforms saved data back to `ReportData` format
3. **Update State**: Sets `reportsData`, `reportCodes`, and `wipefestScores`
4. **Navigate**: Automatically switches to "Add Report" view

### Error Handling
- **Not Found**: Graceful error if analysis doesn't exist
- **Corruption**: Handles malformed data with fallbacks
- **User Feedback**: Console logs and alert messages for debugging

## Usage Examples

### From Hub Page
```typescript
// Recent analyses section
<Button onClick={() => handleLoadAnalysis(analysis.id)}>
  Load
</Button>
```

### From Saved Reports Page
```typescript
// Analysis management
<Button onClick={() => handleLoadAnalysis(analysis.id)}>
  Load Analysis
</Button>
```

## Features Preserved After Loading

✅ **All Original Functionality**:
- Boss fight tabs and selection
- Player performance tables
- Timeline analysis (for multi-report saves)
- Save Analysis button (can re-save with new name)
- Export capabilities

✅ **Data Integrity**:
- Original percentiles and rankings
- Player class/spec information
- Fight durations and timestamps
- Wipefest integration scores

## Next Steps

The load functionality is now complete and ready for testing. Users can:

1. **Save analyses** from any loaded report data
2. **Browse saved analyses** in the Hub or Saved Reports page
3. **Load any analysis** to restore it completely
4. **Continue working** with the loaded data as if freshly imported

This creates a complete workflow for raid performance tracking over time! 