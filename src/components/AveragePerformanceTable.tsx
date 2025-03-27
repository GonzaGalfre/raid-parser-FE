
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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

interface PlayerAveragePerformance {
  rank: number;
  player: string;
  playerClass: ClassType;
  spec: string;
  logParse: number;
  wipefestParse: number;
  avgScore: number;
}

const PLAYER_AVERAGES: PlayerAveragePerformance[] = [
  { 
    rank: 1, 
    player: "Sneakyboi", 
    playerClass: "rogue", 
    spec: "Subtlety Rogue", 
    logParse: 94, 
    wipefestParse: 91, 
    avgScore: 92.5 
  },
  { 
    rank: 2, 
    player: "Morhion", 
    playerClass: "mage", 
    spec: "Frost Mage", 
    logParse: 93, 
    wipefestParse: 89, 
    avgScore: 91 
  },
  { 
    rank: 3, 
    player: "DarkSlayer", 
    playerClass: "death-knight", 
    spec: "Unholy Death Knight", 
    logParse: 91, 
    wipefestParse: 90, 
    avgScore: 90.5 
  },
  { 
    rank: 4, 
    player: "ElementMaster", 
    playerClass: "shaman", 
    spec: "Elemental Shaman", 
    logParse: 89, 
    wipefestParse: 87, 
    avgScore: 88 
  },
  { 
    rank: 5, 
    player: "NatureFriend", 
    playerClass: "druid", 
    spec: "Balance Druid", 
    logParse: 88, 
    wipefestParse: 85, 
    avgScore: 86.5 
  },
  { 
    rank: 6, 
    player: "LightBringer", 
    playerClass: "paladin", 
    spec: "Retribution Paladin", 
    logParse: 85, 
    wipefestParse: 88, 
    avgScore: 86.5 
  },
  { 
    rank: 7, 
    player: "Healinator", 
    playerClass: "priest", 
    spec: "Holy Priest", 
    logParse: 86, 
    wipefestParse: 84, 
    avgScore: 85 
  },
  { 
    rank: 8, 
    player: "DoomCaller", 
    playerClass: "warlock", 
    spec: "Affliction Warlock", 
    logParse: 84, 
    wipefestParse: 82, 
    avgScore: 83 
  },
  { 
    rank: 9, 
    player: "ArrowStorm", 
    playerClass: "hunter", 
    spec: "Marksmanship Hunter", 
    logParse: 82, 
    wipefestParse: 83, 
    avgScore: 82.5 
  },
  { 
    rank: 10, 
    player: "BattleMaster", 
    playerClass: "warrior", 
    spec: "Fury Warrior", 
    logParse: 80, 
    wipefestParse: 81, 
    avgScore: 80.5 
  }
];

const AveragePerformanceTable: React.FC = () => {
  const [isRankMode, setIsRankMode] = useState(true);
  const [threshold, setThreshold] = useState('3');
  
  // Calculate which players meet the criteria
  const getHighlightedPlayers = () => {
    if (isRankMode) {
      const rankThreshold = parseInt(threshold) || 0;
      return PLAYER_AVERAGES.filter(player => player.rank <= rankThreshold);
    } else {
      const parseThreshold = parseInt(threshold) || 0;
      return PLAYER_AVERAGES.filter(player => player.avgScore >= parseThreshold);
    }
  };
  
  const highlightedPlayers = getHighlightedPlayers();
  const highlightedPlayerIds = new Set(highlightedPlayers.map(p => p.player));

  return (
    <div className="w-full animate-fade-in">
      <div className="glass-morphism p-4 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between mb-4 items-start gap-4">
          <h2 className="text-xl font-medium">Average Players Performance</h2>
          
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
                max={isRankMode ? "10" : "100"}
              />
              <Label htmlFor="threshold" className="text-sm">
                {isRankMode ? 'Rank' : '%'}
              </Label>
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
              </tr>
            </thead>
            <tbody>
              {PLAYER_AVERAGES.map((player) => (
                <tr 
                  key={player.rank} 
                  className={cn(
                    "border-b border-white/5 last:border-0",
                    highlightedPlayerIds.has(player.player) && "bg-primary/10"
                  )}
                >
                  <td className="py-3 text-sm">{player.rank}</td>
                  <td className={`py-3 text-sm text-wow-${player.playerClass}`}>
                    {player.player}
                  </td>
                  <td className="py-3 text-sm text-muted-foreground">{player.spec}</td>
                  <td className="py-3 text-sm font-medium text-right">
                    <span 
                      className={cn(
                        "px-2 py-1 rounded-md",
                        player.logParse >= 95 ? "bg-green-500/20 text-green-400" :
                        player.logParse >= 75 ? "bg-blue-500/20 text-blue-400" :
                        player.logParse >= 50 ? "bg-purple-500/20 text-purple-400" :
                        player.logParse >= 25 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-gray-500/20 text-gray-400"
                      )}
                    >
                      {player.logParse}%
                    </span>
                  </td>
                  <td className="py-3 text-sm font-medium text-right">
                    <span 
                      className={cn(
                        "px-2 py-1 rounded-md",
                        player.wipefestParse >= 95 ? "bg-green-500/20 text-green-400" :
                        player.wipefestParse >= 75 ? "bg-blue-500/20 text-blue-400" :
                        player.wipefestParse >= 50 ? "bg-purple-500/20 text-purple-400" :
                        player.wipefestParse >= 25 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-gray-500/20 text-gray-400"
                      )}
                    >
                      {player.wipefestParse}%
                    </span>
                  </td>
                  <td className="py-3 text-sm font-medium text-right">
                    <span 
                      className={cn(
                        "px-2 py-1 rounded-md font-semibold",
                        player.avgScore >= 95 ? "bg-green-500/20 text-green-400" :
                        player.avgScore >= 75 ? "bg-blue-500/20 text-blue-400" :
                        player.avgScore >= 50 ? "bg-purple-500/20 text-purple-400" :
                        player.avgScore >= 25 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-gray-500/20 text-gray-400"
                      )}
                    >
                      {player.avgScore}%
                    </span>
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
