// src/types/comparison.ts

export interface PlayerComparison {
  playerName: string;
  class: string;
  spec: string | null;
  previousReport: {
    averagePercentile: number;
    wipefestScore: number;
    totalAverage: number;
  } | null;
  currentReport: {
    averagePercentile: number;
    wipefestScore: number;
    totalAverage: number;
  } | null;
  changes: {
    averagePercentileChange: number;
    wipefestScoreChange: number;
    totalAverageChange: number;
  };
  status: 'improved' | 'decreased' | 'stable' | 'new' | 'missing';
}

export interface ComparisonData {
  baselineReportId: string;
  compareReportId: string;
  baselineTitle: string;
  compareTitle: string;
  playerComparisons: PlayerComparison[];
}

// New interfaces for timeline comparison
export interface ReportSnapshot {
  reportId: string;
  reportTitle: string;
  startTime: number;
  formattedDate: string;
  raidAverages: {
    averagePercentile: number;
    wipefestScore: number;
    totalAverage: number;
    playerCount: number;
  };
  playerAverages: Record<string, {
    averagePercentile: number;
    wipefestScore: number;
    totalAverage: number;
    class: string;
    spec: string | null;
  }>;
}

export interface TimelinePlayerProgress {
  playerName: string;
  class: string;
  spec: string | null;
  dataPoints: Array<{
    reportId: string;
    reportTitle: string;
    date: string;
    averagePercentile: number;
    wipefestScore: number;
    totalAverage: number;
  }>;
  overallTrend: 'improving' | 'declining' | 'stable' | 'inconsistent';
  totalChange: number;
  firstReportAverage: number;
  lastReportAverage: number;
}

export interface RaidProgressAnalysis {
  raidTrend: 'improving' | 'declining' | 'stable';
  overallChange: number;
  reportSnapshots: ReportSnapshot[];
  playerProgressions: TimelinePlayerProgress[];
  summary: {
    totalReports: number;
    dateRange: {
      start: string;
      end: string;
    };
    playersImproving: number;
    playersStable: number;
    playersDeclining: number;
    averageRaidImprovement: number;
  };
}