import { useState, useEffect } from 'react';
import { RaidProgressAnalysis } from '../types/comparison';
import { AnalysisMetadata } from '../types/storage';
import { analysisService } from '../services/analysisService';

export const useTimelineAnalysis = () => {
  const [timelineAnalysis, setTimelineAnalysis] = useState<RaidProgressAnalysis | null>(null);
  const [analysisMetadata, setAnalysisMetadata] = useState<AnalysisMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTimelineAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get all analyses
      const allAnalyses = await analysisService.getAllAnalyses();
      setAnalysisMetadata(allAnalyses);

      if (allAnalyses.length < 2) {
        setTimelineAnalysis(null);
        return;
      }

      // Load the analyses with timeline data
      const analysesWithTimeline = await Promise.all(
        allAnalyses.map(async (metadata) => {
          const analysis = await analysisService.loadAnalysis(metadata.id);
          return analysis;
        })
      );

      // Find the most recent analysis with timeline data
      const timelineAnalysisData = analysesWithTimeline
        .filter(analysis => analysis?.timelineAnalysis)
        .sort((a, b) => new Date(b!.metadata.dateRange.latest).getTime() - new Date(a!.metadata.dateRange.latest).getTime())[0];

      if (timelineAnalysisData?.timelineAnalysis) {
        setTimelineAnalysis(timelineAnalysisData.timelineAnalysis);
      } else {
        setTimelineAnalysis(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline analysis');
      setTimelineAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimelineAnalysis();
  }, []);

  return {
    timelineAnalysis,
    analysisMetadata,
    loading,
    error,
    refresh: loadTimelineAnalysis
  };
}; 