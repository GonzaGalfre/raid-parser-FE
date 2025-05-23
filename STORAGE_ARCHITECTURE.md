# Storage Architecture

## Overview

The raid analysis app now includes a complete storage abstraction layer designed for IndexedDB with seamless MongoDB migration capability.

## Architecture Components

### 1. Storage Interface (`src/types/storage.ts`)
- **`AnalysisStorage`**: Core interface defining all storage operations
- **`SavedRaidAnalysis`**: Complete data structure for saved analyses  
- **`AnalysisMetadata`**: Lightweight structure for listing/previewing
- **`StorageError`**: Typed error handling
- **Future-proof**: Designed to work with both IndexedDB and MongoDB

### 2. IndexedDB Implementation (`src/services/indexedDbStorage.ts`)
- **`IndexedDbStorage`**: Full implementation of AnalysisStorage interface
- **Dual store design**: 
  - `analyses` store: Full data with indexes
  - `metadata` store: Lightweight data for fast listing
- **Error handling**: Comprehensive error handling with typed errors
- **Performance**: Optimized for large datasets with proper indexing

### 3. Service Layer (`src/services/analysisService.ts`)
- **`AnalysisService`**: High-level API for components
- **Smart metadata generation**: Automatically extracts raid info
- **Helper functions**: Name generation, search, export/import
- **Business logic**: Handles data transformation and validation

### 4. UI Component (`src/components/SaveAnalysisButton.tsx`)
- **Save dialog**: User-friendly save interface
- **Auto-naming**: Smart default names based on raid data
- **Progress feedback**: Loading states and success confirmations
- **Error handling**: User-friendly error messages

## Data Structure

```typescript
SavedRaidAnalysis {
  id: string                    // Unique identifier
  name: string                  // User-defined name
  createdAt: Date              // Creation timestamp
  updatedAt: Date              // Last modification
  metadata: {                  // Quick access metadata
    zone: string
    reportCodes: string[]
    reportCount: number
    playerCount: number
    dateRange: { earliest, latest }
    raidInfo: { averagePerformance, topPerformer }
  }
  reportData: any[]            // Raw WarcraftLogs data
  players: any[]               // Processed player data
  settings: AnalysisSettings   // Analysis configuration
  timelineAnalysis?: RaidProgressAnalysis  // Multi-report analysis
}
```

## MongoDB Migration Path

### Easy Migration Because:
1. **Same data structure**: JSON-compatible types
2. **Interface abstraction**: Just swap implementation
3. **Export/Import**: Built-in backup/restore

### Migration Steps:
1. Create `MongoDBStorage` class implementing `AnalysisStorage`
2. Add backend API endpoints
3. Export existing data from IndexedDB
4. Import data to MongoDB
5. Update service to use new storage implementation

### Example MongoDB Implementation:
```typescript
class MongoDBStorage implements AnalysisStorage {
  async save(analysis) {
    return await fetch('/api/analyses', {
      method: 'POST',
      body: JSON.stringify(analysis)
    });
  }
  // ... other methods hit API endpoints
}
```

## Usage

### Saving Analysis (in components):
```typescript
import SaveAnalysisButton from '@/components/SaveAnalysisButton';

<SaveAnalysisButton
  reportData={reports}
  players={playerData}
  targetZone="Liberation of Undermine"
  timelineAnalysis={timelineData}
  onSaved={(id, name) => console.log('Saved:', name)}
/>
```

### Loading/Managing (service layer):
```typescript
import { analysisService } from '@/services/analysisService';

// List all analyses
const analyses = await analysisService.getAllAnalyses();

// Load specific analysis
const analysis = await analysisService.loadAnalysis(id);

// Search
const results = await analysisService.searchAnalyses('undermine');

// Export all data
const backup = await analysisService.exportAllData();
```

## Benefits

1. **Data Persistence**: Save raid analyses across browser sessions
2. **Quick Access**: Fast listing with metadata-only queries
3. **Search & Filter**: Find analyses by name, zone, date
4. **Backup/Restore**: Export/import for data safety
5. **Future-Proof**: Easy migration to cloud storage
6. **Performance**: Optimized IndexedDB with proper indexes

## Storage Stats

The system tracks:
- Total analyses count
- Storage size (estimated)
- Date ranges
- Available space (when supported)

## Error Handling

Typed errors with specific codes:
- `NOT_FOUND`: Analysis doesn't exist
- `STORAGE_FULL`: Out of storage space
- `CORRUPTION`: Data integrity issues
- `ACCESS_DENIED`: Permission problems
- `NETWORK_ERROR`: For future cloud storage

## Next Steps

1. **Integration**: Add SaveAnalysisButton to Index.tsx
2. **Landing Page**: Create hub showing saved analyses
3. **Analytics**: Cross-analysis statistics and trends
4. **Cloud Migration**: When ready, implement MongoDB storage 