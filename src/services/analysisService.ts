import { defaultStorage } from './indexedDbStorage';
import { AnalysisStorage, SavedRaidAnalysis, AnalysisMetadata, RaidAnalysisMetadata, AnalysisSettings } from '../types/storage';
import { RaidProgressAnalysis } from '../types/comparison';

export class AnalysisService {
  constructor(private storage: AnalysisStorage = defaultStorage) {}

  // Create a raid analysis from current app state
  async saveCurrentAnalysis(
    name: string,
    reportData: any[],
    players: any[],
    targetZone: string,
    timelineAnalysis?: RaidProgressAnalysis,
    settings?: Partial<AnalysisSettings>
  ): Promise<string> {
    const metadata = this.createMetadata(reportData, players, targetZone, timelineAnalysis);
    
    const analysisSettings: AnalysisSettings = {
      targetZone,
      wipefestEnabled: !!settings?.wipefestEnabled,
      authMethod: settings?.authMethod || 'client'
    };

    const analysis = {
      name,
      metadata,
      reportData,
      players,
      settings: analysisSettings,
      timelineAnalysis
    };

    return await this.storage.save(analysis);
  }

  private createMetadata(
    reportData: any[],
    players: any[],
    targetZone: string,
    timelineAnalysis?: RaidProgressAnalysis
  ): RaidAnalysisMetadata {
    // Extract report codes from report data
    const reportCodes = reportData.map(report => report.code || report.id || 'unknown');
    
    // Calculate date range
    const dates = reportData
      .map(report => {
        // Try different possible date fields
        return new Date(report.startTime || report.date || report.createdAt || Date.now());
      })
      .filter(date => !isNaN(date.getTime()));
    
    const earliest = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
    const latest = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();

    // Calculate average performance from players
    let averagePerformance = 0;
    let topPerformer: string | undefined;
    let maxPerformance = 0;

    if (players.length > 0) {
      const totalPerformance = players.reduce((sum, player) => {
        const performance = player.averagePercentile || player.totalAverage || 0;
        if (performance > maxPerformance) {
          maxPerformance = performance;
          topPerformer = player.name || player.playerName;
        }
        return sum + performance;
      }, 0);
      
      averagePerformance = totalPerformance / players.length;
    }

    // Use timeline analysis data if available
    if (timelineAnalysis) {
      averagePerformance = timelineAnalysis.reportSnapshots.reduce((sum, snapshot) => 
        sum + snapshot.raidAverages.totalAverage, 0
      ) / timelineAnalysis.reportSnapshots.length;
      
      // Find best performing player across all reports
      const playerTotals = new Map<string, number>();
      timelineAnalysis.playerProgressions.forEach(progression => {
        const avgPerformance = progression.dataPoints.reduce((sum, point) => 
          sum + point.totalAverage, 0
        ) / progression.dataPoints.length;
        playerTotals.set(progression.playerName, avgPerformance);
      });
      
      if (playerTotals.size > 0) {
        const [bestPlayer, bestScore] = [...playerTotals.entries()]
          .reduce((max, current) => current[1] > max[1] ? current : max);
        topPerformer = bestPlayer;
      }
    }

    return {
      zone: targetZone,
      reportCodes,
      reportCount: reportData.length,
      playerCount: players.length,
      dateRange: { earliest, latest },
      raidInfo: {
        averagePerformance: Math.round(averagePerformance * 100) / 100,
        topPerformer,
        attendanceRate: this.calculateAttendanceRate(reportData, players)
      }
    };
  }

  private calculateAttendanceRate(reportData: any[], players: any[]): number {
    if (reportData.length === 0 || players.length === 0) return 0;
    
    // This is a simplified calculation - in reality you'd want to track
    // player attendance across all reports
    return Math.round((players.length / Math.max(...reportData.map(r => r.playerCount || players.length))) * 100);
  }

  // Generate a smart name for the analysis
  generateAnalysisName(reportData: any[], targetZone: string): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    if (reportData.length === 1) {
      return `${targetZone} - ${dateStr}`;
    } else {
      return `${targetZone} Timeline (${reportData.length} reports) - ${dateStr}`;
    }
  }

  // Load an analysis by ID
  async loadAnalysis(id: string): Promise<SavedRaidAnalysis | null> {
    return await this.storage.load(id);
  }

  // Get all saved analyses
  async getAllAnalyses(): Promise<AnalysisMetadata[]> {
    return await this.storage.list();
  }

  // Search analyses
  async searchAnalyses(query: string): Promise<AnalysisMetadata[]> {
    return await this.storage.search(query);
  }

  // Get analyses by zone
  async getAnalysesByZone(zone: string): Promise<AnalysisMetadata[]> {
    return await this.storage.getByZone(zone);
  }

  // Delete an analysis
  async deleteAnalysis(id: string): Promise<void> {
    await this.storage.delete(id);
  }

  // Update analysis name
  async updateAnalysisName(id: string, newName: string): Promise<void> {
    await this.storage.update(id, { name: newName });
  }

  // Export all data
  async exportAllData(): Promise<string> {
    const exportData = await this.storage.exportAll();
    return JSON.stringify(exportData, null, 2);
  }

  // Import data from file
  async importData(jsonString: string): Promise<number> {
    try {
      const importData = JSON.parse(jsonString);
      return await this.storage.import(importData);
    } catch (error) {
      throw new Error('Invalid import file format');
    }
  }

  // Get storage statistics
  async getStorageStats() {
    return await this.storage.getStorageStats();
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    await this.storage.clear();
  }
}

// Export default instance
export const analysisService = new AnalysisService(); 