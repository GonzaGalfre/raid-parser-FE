// src/pages/Index.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useWarcraftLogsApi, type FightParse } from '@/services/warcraftLogsApi';
import PlayerCard from '@/components/PlayerCard';
import BossfightTabs from '@/components/BossfightTabs';
import AveragePerformanceTable from '@/components/AveragePerformanceTable';
import TimelineComparisonView from '@/components/TimelineComparisonView';
import ConfigPanel from '@/components/ConfigPanel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, BarChart3 } from 'lucide-react';
import { type RaidProgressAnalysis } from '@/types/comparison';

const Index = () => {
  // Configuration state
  const [reportCodes, setReportCodes] = useState<string[]>(['']);
  const [apiKey, setApiKey] = useState('');
  const [targetZone, setTargetZone] = useState('Liberation of Undermine');
  const [forceRefresh, setForceRefresh] = useState(0);
  const [selectedReport, setSelectedReport] = useState<string>('');
  
  // Timeline analysis state
  const [timelineAnalysis, setTimelineAnalysis] = useState<RaidProgressAnalysis | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  // Try to load config from local storage
  useEffect(() => {
    const savedReportCode = localStorage.getItem('reportCode');
    const savedApiToken = localStorage.getItem('wclApiToken');
    
    if (savedReportCode) setReportCodes([savedReportCode]);
    if (savedApiToken) setApiKey(savedApiToken);
    
    // Always use the same zone for now
    setTargetZone('Liberation of Undermine');
  }, []);

  // Save config to local storage when changed
  useEffect(() => {
    if (reportCodes.length > 0 && reportCodes[0]) 
      localStorage.setItem('reportCode', reportCodes[0]);
    // API token is saved in the ConfigPanel component
  }, [reportCodes]);

  // Initialize the API service with multiple report codes
  const {
    loading,
    error,
    reportsData,
    wipefestScores,
    importWipefestScores,
    calculatePlayerAverages,
    calculateMergedPlayerAverages,
    calculateTimelineAnalysis,
    setSelectedFight,
    updateReportCodes,
    fetchReports,
  } = useWarcraftLogsApi(reportCodes, apiKey, targetZone, forceRefresh);

  // Force a refresh of the data
  const handleRefresh = useCallback(() => {
    setForceRefresh(prev => prev + 1);
  }, []);

  // Handle timeline analysis request
  const handleShowTimeline = useCallback(() => {
    const analysis = calculateTimelineAnalysis();
    setTimelineAnalysis(analysis);
    setShowTimeline(true);
  }, [calculateTimelineAnalysis]);

  // Toggle back to normal view
  const handleBackToNormal = useCallback(() => {
    setShowTimeline(false);
  }, []);

  // When report data changes, set the first report as selected if none is selected
  useEffect(() => {
    const availableReports = Object.keys(reportsData);
    if (availableReports.length > 0 && (!selectedReport || !reportsData[selectedReport])) {
      setSelectedReport(availableReports[0]);
    }
  }, [reportsData, selectedReport]);

  // Create a formatted fight parses object for BossfightTabs
  const formatFightParses = () => {
    return Object.entries(reportsData).reduce((acc, [reportId, data]) => {
      acc[reportId] = data.fightParses;
      return acc;
    }, {} as Record<string, Record<string, FightParse>>);
  };

  // Create a report titles object for BossfightTabs
  const getReportTitles = () => {
    const reportIds = Object.keys(reportsData);
    return reportIds.reduce((acc, reportId, index) => {
      acc[reportId] = reportsData[reportId].reportTitle;
      return acc;
    }, {} as Record<string, string>);
  };

  // Get the current report data
  const currentReportData = selectedReport && reportsData[selectedReport];

  // Calculate merged player averages
  const mergedAverages = calculateMergedPlayerAverages();

  // Determine configuration status
  const isConfigured = reportCodes.some(code => code.trim() !== '') && apiKey;
  const needsConfiguration = !isConfigured && !loading;

  // Check if timeline analysis is available
  const hasMultipleReports = Object.keys(reportsData).length >= 2;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8 relative">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            {showTimeline && timelineAnalysis ? 
              `Raid Progression Analysis` :
              currentReportData ? 
                `#${Object.keys(reportsData).indexOf(selectedReport) + 1}: ${currentReportData.reportTitle}` : 
                'Raid Performance'}
          </h1>
          <p className="text-muted-foreground">
            {showTimeline ? 
              `Analyzing performance trends across ${timelineAnalysis?.summary.totalReports || 0} reports` :
              isConfigured 
                ? 'Displaying current raid statistics and player performance' 
                : 'Configure your Warcraft Logs API settings to view raid data'}
          </p>
          
          {/* Action buttons */}
          {showTimeline && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackToNormal}
              className="absolute top-6 right-6"
            >
              Back to Reports
            </Button>
          )}
          
          {!showTimeline && (
            <>
              {hasMultipleReports && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleShowTimeline}
                  className="absolute top-6 right-40"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Timeline Analysis
                </Button>
              )}
              <ConfigPanel
                reportCodes={reportCodes}
                updateReportCodes={updateReportCodes}
                setApiKey={setApiKey}
                targetZone={targetZone}
                setTargetZone={setTargetZone}
                importWipefestScores={importWipefestScores}
                fetchReports={fetchReports}
              />
            </>
          )}
        </header>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {needsConfiguration && (
          <div className="glass-morphism p-8 rounded-lg text-center mb-6">
            <h2 className="text-2xl font-bold mb-4">Welcome to Raid Performance</h2>
            <p className="mb-6">Click the settings icon in the top right to configure your Warcraft Logs API v2 credentials and report code.</p>
            <p className="text-sm text-muted-foreground">
              To use the new API v2, you'll need to create API client credentials at{" "}
              <a 
                href="https://www.warcraftlogs.com/api/clients/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                https://www.warcraftlogs.com/api/clients/
              </a>
            </p>
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center my-8">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading raid data...</span>
            </div>
          </div>
        )}
        
        {/* Show timeline analysis view */}
        {showTimeline && (
          <TimelineComparisonView 
            analysis={timelineAnalysis}
            loading={loading}
          />
        )}
        
        {/* Show normal report view */}
        {!showTimeline && isConfigured && !loading && Object.keys(reportsData).length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Player cards column */}
            <div className="lg:col-span-3 space-y-6">
              <div className="glass-morphism p-4 rounded-lg mb-4">
                <h2 className="text-xl font-medium mb-3">Raid Roster</h2>
                <div className="space-y-3">
                  {currentReportData?.players?.length > 0 ? (
                    currentReportData.players.map((player) => (
                      <PlayerCard 
                        key={`${player.name}-${player.server}`}
                        player={player}
                      />
                    ))
                  ) : (
                    <p className="text-muted-foreground py-4 text-center">No players found</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Main content column */}
            <div className="lg:col-span-9 space-y-8">
              <BossfightTabs 
                fightParses={formatFightParses()}
                reportTitles={getReportTitles()}
                selectedReport={selectedReport}
                setSelectedReport={setSelectedReport}
                selectedFight={currentReportData?.selectedFight || ''}
                setSelectedFight={(fightName) => {
                  if (selectedReport) {
                    setSelectedFight(selectedReport, fightName);
                  }
                }}
                loading={loading}
              />
              <AveragePerformanceTable 
                playerAverages={currentReportData ? calculatePlayerAverages(selectedReport) : []}
                mergedPlayerAverages={mergedAverages}
                loading={loading} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;