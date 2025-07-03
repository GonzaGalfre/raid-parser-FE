import {
  AnalysisStorage,
  SavedRaidAnalysis,
  AnalysisMetadata,
  AnalysisExport,
  StorageStats,
  StorageError,
  StorageConfig
} from '../types/storage';

export class IndexedDbStorage implements AnalysisStorage {
  private dbName: string;
  private dbVersion: number;
  private db: IDBDatabase | null = null;

  constructor(config: StorageConfig = { name: 'RaidAnalysisDB', version: 1 }) {
    this.dbName = config.name;
    this.dbVersion = config.version;
  }

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new StorageError('Failed to open database', 'ACCESS_DENIED', request.error));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create the main analyses store
        if (!db.objectStoreNames.contains('analyses')) {
          const analysesStore = db.createObjectStore('analyses', { keyPath: 'id' });
          
          // Create indexes for efficient querying
          analysesStore.createIndex('createdAt', 'createdAt', { unique: false });
          analysesStore.createIndex('zone', 'metadata.zone', { unique: false });
          analysesStore.createIndex('name', 'name', { unique: false });
          analysesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Create metadata store for quick listing (lighter weight)
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', { keyPath: 'id' });
          metadataStore.createIndex('createdAt', 'createdAt', { unique: false });
          metadataStore.createIndex('zone', 'zone', { unique: false });
          metadataStore.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  private async getObjectStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.initDB();
    const transaction = db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  private generateId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createMetadata(analysis: SavedRaidAnalysis): AnalysisMetadata {
    return {
      id: analysis.id,
      name: analysis.name,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
      zone: analysis.metadata.zone,
      reportCount: analysis.metadata.reportCount,
      playerCount: analysis.metadata.playerCount,
      averagePerformance: analysis.metadata.raidInfo.averagePerformance,
      dateRange: analysis.metadata.dateRange
    };
  }

  async save(analysis: Omit<SavedRaidAnalysis, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const id = this.generateId();
      
      const fullAnalysis: SavedRaidAnalysis = {
        ...analysis,
        id,
        createdAt: now,
        updatedAt: now
      };

      // Save full analysis
      const analysesStore = await this.getObjectStore('analyses', 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = analysesStore.add(fullAnalysis);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new StorageError(
          'Failed to save analysis',
          'STORAGE_FULL',
          request.error
        ));
      });

      // Save metadata for quick listing
      const metadataStore = await this.getObjectStore('metadata', 'readwrite');
      const metadata = this.createMetadata(fullAnalysis);
      await new Promise<void>((resolve, reject) => {
        const request = metadataStore.add(metadata);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      return id;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError('Failed to save analysis', 'STORAGE_FULL', error as Error);
    }
  }

  async load(id: string): Promise<SavedRaidAnalysis | null> {
    try {
      const store = await this.getObjectStore('analyses');
      
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = () => {
          reject(new StorageError('Failed to load analysis', 'ACCESS_DENIED', request.error));
        };
      });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError('Failed to load analysis', 'ACCESS_DENIED', error as Error);
    }
  }

  async update(id: string, updates: Partial<SavedRaidAnalysis>): Promise<void> {
    try {
      const existing = await this.load(id);
      if (!existing) {
        throw new StorageError('Analysis not found', 'NOT_FOUND');
      }

      const updated: SavedRaidAnalysis = {
        ...existing,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date()
      };

      const analysesStore = await this.getObjectStore('analyses', 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = analysesStore.put(updated);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Update metadata
      const metadataStore = await this.getObjectStore('metadata', 'readwrite');
      const metadata = this.createMetadata(updated);
      await new Promise<void>((resolve, reject) => {
        const request = metadataStore.put(metadata);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError('Failed to update analysis', 'ACCESS_DENIED', error as Error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Delete from analyses store
      const analysesStore = await this.getObjectStore('analyses', 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = analysesStore.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Delete from metadata store
      const metadataStore = await this.getObjectStore('metadata', 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = metadataStore.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw new StorageError('Failed to delete analysis', 'ACCESS_DENIED', error as Error);
    }
  }

  async list(): Promise<AnalysisMetadata[]> {
    try {
      const store = await this.getObjectStore('metadata');
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          const results = request.result || [];
          // Sort by creation date, newest first
          results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          resolve(results);
        };
        
        request.onerror = () => {
          reject(new StorageError('Failed to list analyses', 'ACCESS_DENIED', request.error));
        };
      });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError('Failed to list analyses', 'ACCESS_DENIED', error as Error);
    }
  }

  async search(query: string): Promise<AnalysisMetadata[]> {
    const allAnalyses = await this.list();
    const lowercaseQuery = query.toLowerCase();
    
    return allAnalyses.filter(analysis => 
      analysis.name.toLowerCase().includes(lowercaseQuery) ||
      analysis.zone.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getByZone(zone: string): Promise<AnalysisMetadata[]> {
    try {
      const store = await this.getObjectStore('metadata');
      const index = store.index('zone');
      
      return new Promise((resolve, reject) => {
        const request = index.getAll(zone);
        
        request.onsuccess = () => {
          const results = request.result || [];
          results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          resolve(results);
        };
        
        request.onerror = () => {
          reject(new StorageError('Failed to get analyses by zone', 'ACCESS_DENIED', request.error));
        };
      });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError('Failed to get analyses by zone', 'ACCESS_DENIED', error as Error);
    }
  }

  async exportAll(): Promise<AnalysisExport> {
    try {
      const store = await this.getObjectStore('analyses');
      
      const analyses = await new Promise<SavedRaidAnalysis[]>((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          resolve(request.result || []);
        };
        
        request.onerror = () => {
          reject(new StorageError('Failed to export analyses', 'ACCESS_DENIED', request.error));
        };
      });

      return {
        version: '1.0.0',
        exportedAt: new Date(),
        analyses,
        totalCount: analyses.length
      };
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError('Failed to export analyses', 'ACCESS_DENIED', error as Error);
    }
  }

  async import(data: AnalysisExport): Promise<number> {
    try {
      let importedCount = 0;
      
      for (const analysis of data.analyses) {
        try {
          // Generate new ID to avoid conflicts
          const { id, createdAt, updatedAt, ...analysisData } = analysis;
          await this.save(analysisData);
          importedCount++;
        } catch (error) {
          console.warn(`Failed to import analysis ${analysis.name}:`, error);
          // Continue with other analyses
        }
      }
      
      return importedCount;
    } catch (error) {
      throw new StorageError('Failed to import analyses', 'ACCESS_DENIED', error as Error);
    }
  }

  async clear(): Promise<void> {
    try {
      // Clear analyses store
      const analysesStore = await this.getObjectStore('analyses', 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = analysesStore.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Clear metadata store
      const metadataStore = await this.getObjectStore('metadata', 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = metadataStore.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw new StorageError('Failed to clear storage', 'ACCESS_DENIED', error as Error);
    }
  }

  async getStorageStats(): Promise<StorageStats> {
    try {
      const analyses = await this.list();
      
      if (analyses.length === 0) {
        return {
          totalAnalyses: 0,
          totalSizeMB: 0
        };
      }

      // Estimate storage size (rough calculation)
      const sampleAnalysis = await this.load(analyses[0].id);
      const sampleSize = JSON.stringify(sampleAnalysis).length;
      const estimatedTotalSize = (sampleSize * analyses.length) / (1024 * 1024); // Convert to MB

      const dates = analyses.map(a => new Date(a.createdAt)).sort();
      
      return {
        totalAnalyses: analyses.length,
        totalSizeMB: Math.round(estimatedTotalSize * 100) / 100,
        oldestAnalysis: dates[0],
        newestAnalysis: dates[dates.length - 1]
      };
    } catch (error) {
      throw new StorageError('Failed to get storage stats', 'ACCESS_DENIED', error as Error);
    }
  }
}

// Export a default instance
export const defaultStorage = new IndexedDbStorage(); 