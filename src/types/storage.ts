import { RaidProgressAnalysis, ReportSnapshot, TimelinePlayerProgress } from './comparison';

// Core data structure for saved raid analysis
export interface SavedRaidAnalysis {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: RaidAnalysisMetadata;
  reportData: any[]; // Raw report data from WarcraftLogs API
  players: any[]; // Processed player performance data
  settings: AnalysisSettings;
  // Timeline analysis data (when multiple reports)
  timelineAnalysis?: RaidProgressAnalysis;
}

// Metadata about the raid analysis
export interface RaidAnalysisMetadata {
  zone: string;
  reportCodes: string[];
  reportCount: number;
  playerCount: number;
  dateRange: {
    earliest: Date;
    latest: Date;
  };
  raidInfo: {
    averagePerformance: number;
    topPerformer?: string;
    attendanceRate?: number;
  };
}

// Settings used for the analysis
export interface AnalysisSettings {
  targetZone: string;
  wipefestEnabled: boolean;
  authMethod: 'client' | 'token';
}

// Lightweight version for listing/previewing saved analyses
export interface AnalysisMetadata {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  zone: string;
  reportCount: number;
  playerCount: number;
  averagePerformance: number;
  dateRange: {
    earliest: Date;
    latest: Date;
  };
}

// Export data structure for backup/migration
export interface AnalysisExport {
  version: string;
  exportedAt: Date;
  analyses: SavedRaidAnalysis[];
  totalCount: number;
}

// Storage interface - this is what makes migration easy
export interface AnalysisStorage {
  // Core CRUD operations
  save(analysis: Omit<SavedRaidAnalysis, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  load(id: string): Promise<SavedRaidAnalysis | null>;
  update(id: string, updates: Partial<SavedRaidAnalysis>): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Listing and querying
  list(): Promise<AnalysisMetadata[]>;
  search(query: string): Promise<AnalysisMetadata[]>;
  getByZone(zone: string): Promise<AnalysisMetadata[]>;
  
  // Bulk operations
  exportAll(): Promise<AnalysisExport>;
  import(data: AnalysisExport): Promise<number>; // Returns number imported
  
  // Storage management
  clear(): Promise<void>;
  getStorageStats(): Promise<StorageStats>;
}

export interface StorageStats {
  totalAnalyses: number;
  totalSizeMB: number;
  oldestAnalysis?: Date;
  newestAnalysis?: Date;
  availableSpaceMB?: number; // May not be available in all storage types
}

// Error types for storage operations
export class StorageError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'STORAGE_FULL' | 'CORRUPTION' | 'ACCESS_DENIED' | 'NETWORK_ERROR',
    public originalError?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

// Configuration for different storage implementations
export interface StorageConfig {
  name: string;
  version: number;
  maxSizeMB?: number;
  autoCleanup?: boolean;
  encryptionKey?: string; // For future cloud storage
} 