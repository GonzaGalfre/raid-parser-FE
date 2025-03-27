// src/pages/Index.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useWarcraftLogsApi } from '@/services/warcraftLogsApi';
import PlayerCard from '@/components/PlayerCard';
import BossfightTabs from '@/components/BossfightTabs';
import AveragePerformanceTable from '@/components/AveragePerformanceTable';
import ConfigPanel from '@/components/ConfigPanel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw } from 'lucide-react';

const Index = () => {
  // Configuration state
  const [reportCode, setReportCode] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [targetZone, setTargetZone] = useState('Amirdrassil');
  const [forceRefresh, setForceRefresh] = useState(0);

  // Try to load config from local storage
  useEffect(() => {
    const savedReportCode = localStorage.getItem('reportCode');
    const savedApiKey = localStorage.getItem('apiKey');
    const savedTargetZone = localStorage.getItem('targetZone');
    
    if (savedReportCode) setReportCode(savedReportCode);
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedTargetZone) setTargetZone(savedTargetZone);
  }, []);

  // Save config to local storage when changed
  useEffect(() => {
    if (reportCode) localStorage.setItem('reportCode', reportCode);
    if (apiKey) localStorage.setItem('apiKey', apiKey);
    if (targetZone) localStorage.setItem('targetZone', targetZone);
  }, [reportCode, apiKey, targetZone]);

  // WarcraftLogs API hook
  const {
    loading,
    error,
    reportTitle,
    players,
    fightParses,
    selectedFight,
    setSelectedFight,
    wipefestScores,
    importWipefestScores,
    calculatePlayerAverages
  } = useWarcraftLogsApi(reportCode, apiKey, targetZone, forceRefresh);

  // Force a refresh of the data
  const fetchReport = useCallback(() => {
    setForceRefresh(prev => prev + 1);
  }, []);

  // Calculate player averages
  const playerAverages = calculatePlayerAverages();

  // Determine configuration status
  const isConfigured = reportCode && apiKey && targetZone;
  const needsConfiguration = !isConfigured && !loading;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8 relative">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            {reportTitle || 'Raid Performance'}
          </h1>
          <p className="text-muted-foreground">
            {isConfigured 
              ? 'Displaying current raid statistics and player performance' 
              : 'Configure your Warcraft Logs API settings to view raid data'}
          </p>
          
          {/* Config panel button */}
          <ConfigPanel
            reportCode={reportCode}
            setReportCode={setReportCode}
            apiKey={apiKey}
            setApiKey={setApiKey}
            targetZone={targetZone}
            setTargetZone={setTargetZone}
            importWipefestScores={importWipefestScores}
            fetchReport={fetchReport}
          />
        </header>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {needsConfiguration && (
          <div className="glass-morphism p-8 rounded-lg text-center mb-6">
            <h2 className="text-2xl font-bold mb-4">Welcome to Raid Performance</h2>
            <p className="mb-6">Click the settings icon in the top right to configure your Warcraft Logs API credentials and report.</p>
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
        
        {isConfigured && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Player cards column */}
            <div className="lg:col-span-3 space-y-6">
              <div className="glass-morphism p-4 rounded-lg mb-4">
                <h2 className="text-xl font-medium mb-3">Raid Roster</h2>
                <div className="space-y-3">
                  {players.length > 0 ? (
                    players.map((player) => (
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
                fightParses={fightParses}
                selectedFight={selectedFight}
                setSelectedFight={setSelectedFight} 
                loading={loading}
              />
              <AveragePerformanceTable 
                playerAverages={playerAverages}
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