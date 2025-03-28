// src/components/AveragePerformanceTable.tsx
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { type PlayerAverage } from '@/services/warcraftLogsApi';
import { ClassColoredText } from './DirectColorStyles';

type ClassType = 
  | 'death-knight' 
  | 'demon-hunter'
  | 'druid'
  | 'hunter'
  | 'mage'
  | 'monk'
  | 'paladin'
  | 'priest'
  | 'rogue'
  | 'shaman'
  | 'warlock'
  | 'warrior'
  | 'evoker';

interface AveragePerformanceTableProps {
  playerAverages: PlayerAverage[];
  mergedPlayerAverages: PlayerAverage[]; // New prop for merged data across all reports
  loading: boolean;
}

const normalizeClassName = (wowClass: string): ClassType => {
  // Map API class names to CSS class names
  const classMap: Record<string, ClassType> = {
    'DeathKnight': 'death-knight',
    'Death Knight': 'death-knight',
    'DemonHunter': 'demon-hunter',
    'Demon Hunter': 'demon-hunter',
    'Druid': 'druid', 
    'Hunter': 'hunter',
    'Mage': 'mage',
    'Monk': 'monk',
    'Paladin': 'paladin',
    'Priest': 'priest',
    'Rogue': 'rogue',
    'Shaman': 'shaman',
    'Warlock': 'warlock',
    'Warrior': 'warrior',
    'Evoker': 'evoker'
  };
  
  return classMap[wowClass] || 'warrior';
};

const AveragePerformanceTable: React.FC<AveragePerformanceTableProps> = ({ 
  playerAverages,
  mergedPlayerAverages,
  loading 
}) => {
  const [isRankMode, setIsRankMode] = useState(true);
  const [threshold, setThreshold] = useState('3');
  const [showMergedData, setShowMergedData] = useState(false);
  
  // Use merged data or single report data based on the toggle
  const displayData = showMergedData ? mergedPlayerAverages : playerAverages;
  
  // Calculate which players meet the criteria
  const getHighlightedPlayers = () => {
    if (isRankMode) {
      const rankThreshold = parseInt(threshold) || 0;
      return displayData.filter((player, index) => index < rankThreshold);
    } else {
      const parseThreshold = parseInt(threshold) || 0;
      return displayData.filter(player => player.totalAverage >= parseThreshold);
    }
  };
  
  const highlightedPlayers = getHighlightedPlayers();
  const highlightedPlayerIds = new Set(highlightedPlayers.map(p => p.playerName));

  if (loading) {
    return (
      <div className="w-full animate-fade-in">
        <div className="glass-morphism p-4 rounded-lg">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (displayData.length === 0) {
    return (
      <div className="w-full animate-fade-in">
        <div className="glass-morphism p-4 rounded-lg">
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">No player data available. Please check your configuration.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="glass-morphism p-4 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between mb-4 items-start gap-4">
          <h2 className="text-xl font-medium">Average Players Performance</h2>
          
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            {/* Toggle for Merged Data */}
            <div className="flex items-center space-x-2">
              <Switch 
                id="merged-data" 
                checked={showMergedData}
                onCheckedChange={setShowMergedData}
              />
              <Label htmlFor="merged-data" className="text-sm">
                {showMergedData ? 'All Reports' : 'Current Report'}
              </Label>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="selection-mode" 
                  checked={!isRankMode}
                  onCheckedChange={(checked) => setIsRankMode(!checked)}
                />
                <Label htmlFor="selection-mode" className="text-sm">
                  {isRankMode ? 'Top Rank' : 'Min Parse %'}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Input 
                  id="threshold"
                  type="number" 
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-20"
                  min={isRankMode ? "1" : "0"}
                  max={isRankMode ? String(displayData.length) : "100"}
                />
                <Label htmlFor="threshold" className="text-sm">
                  {isRankMode ? 'Rank' : '%'}
                </Label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rank</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Player</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Spec</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Log Parse</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Wipefest Parse</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Avg Score</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((player, index) => (
                <tr 
                  key={`${player.playerName}-${player.spec}`} 
                  className={cn(
                    "border-b border-white/5 last:border-0",
                    highlightedPlayerIds.has(player.playerName) && "bg-primary/10"
                  )}
                >
                  <td className="py-3 text-sm">{index + 1}</td>
                  <td className="py-3 text-sm">
                    <ClassColoredText wowClass={player.class}>
                      {player.playerName}
                    </ClassColoredText>
                  </td>
                  <td className="py-3 text-sm text-muted-foreground">
                    {player.spec || 'Unknown'} {player.class}
                  </td>
                  <td className="py-3 text-sm font-medium text-right">
                    <span 
                      className={cn(
                        "px-2 py-1 rounded-md",
                        player.averagePercentile >= 95 ? "bg-green-500/20 text-green-400" :
                        player.averagePercentile >= 75 ? "bg-blue-500/20 text-blue-400" :
                        player.averagePercentile >= 50 ? "bg-purple-500/20 text-purple-400" :
                        player.averagePercentile >= 25 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-gray-500/20 text-gray-400"
                      )}
                    >
                      {player.averagePercentile}%
                    </span>
                  </td>
                  <td className="py-3 text-sm font-medium text-right">
                    <span 
                      className={cn(
                        "px-2 py-1 rounded-md",
                        player.wipefestScore >= 95 ? "bg-green-500/20 text-green-400" :
                        player.wipefestScore >= 75 ? "bg-blue-500/20 text-blue-400" :
                        player.wipefestScore >= 50 ? "bg-purple-500/20 text-purple-400" :
                        player.wipefestScore >= 25 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-gray-500/20 text-gray-400"
                      )}
                    >
                      {player.wipefestScore}%
                    </span>
                  </td>
                  <td className="py-3 text-sm font-medium text-right">
                    <span 
                      className={cn(
                        "px-2 py-1 rounded-md font-semibold",
                        player.totalAverage >= 95 ? "bg-green-500/20 text-green-400" :
                        player.totalAverage >= 75 ? "bg-blue-500/20 text-blue-400" :
                        player.totalAverage >= 50 ? "bg-purple-500/20 text-purple-400" :
                        player.totalAverage >= 25 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-gray-500/20 text-gray-400"
                      )}
                    >
                      {player.totalAverage}%
                    </span>
                  </td>
                  <td className="py-3 text-sm font-medium text-right">
                    {player.attendance ? (
                      <span className="px-2 py-1 rounded-md">
                        {player.attendance.present}/{player.attendance.total}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AveragePerformanceTable;