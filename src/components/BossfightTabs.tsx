// src/components/BossfightTabs.tsx
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { type FightParse, Pull } from '@/services/warcraftLogsApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface BossfightTabsProps {
  fightParses: Record<string, FightParse>;
  selectedFight: string;
  setSelectedFight: (fightName: string) => void;
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

const BossfightTabs: React.FC<BossfightTabsProps> = ({
  fightParses,
  selectedFight,
  setSelectedFight,
  loading
}) => {
  const fightNames = Object.keys(fightParses);
  const [selectedPullTab, setSelectedPullTab] = useState<string>("overview");
  const [selectedPull, setSelectedPull] = useState<number | null>(null);
  
  // Get pull data from the fight parses
  const bossPulls = fightParses[selectedFight]?.pulls || [];
  
  // Find the first kill pull (if any) for default selection
  useEffect(() => {
    const firstKillPull = bossPulls.find(pull => pull.isKill);
    if (firstKillPull) {
      setSelectedPull(firstKillPull.id);
    } else {
      setSelectedPull(null);
    }
  }, [selectedFight, bossPulls]);

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

  if (fightNames.length === 0) {
    return (
      <div className="w-full animate-fade-in">
        <div className="glass-morphism p-4 rounded-lg">
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">No fight data available. Please check your configuration.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="glass-morphism rounded-t-lg">
        <div className="flex border-b border-white/10 overflow-x-auto">
          {fightNames.map((bossName) => (
            <button
              key={bossName}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-colors focus:outline-none whitespace-nowrap",
                selectedFight === bossName
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
              onClick={() => {
                setSelectedFight(bossName);
                setSelectedPullTab("overview");
                setSelectedPull(null);
              }}
            >
              {bossName}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-8 animate-fade-in">
        {selectedFight && (
          <div className="glass-morphism p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                {selectedFight}
              </h3>
              <span
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-full",
                  fightParses[selectedFight]?.fightDetails?.kill
                    ? "bg-kill/20 text-kill"
                    : "bg-wipe/20 text-wipe"
                )}
              >
                {fightParses[selectedFight]?.fightDetails?.kill 
                  ? "Kill" 
                  : `${(fightParses[selectedFight]?.fightDetails?.bossPercentage / 100).toFixed(1)}% left`}
              </span>
            </div>
            
            <Tabs defaultValue="overview" value={selectedPullTab} onValueChange={setSelectedPullTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="pulls">Pulls</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 text-left">
                        <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rank</th>
                        <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Player</th>
                        <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Spec</th>
                        <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Parse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fightParses[selectedFight]?.parses.map((parse, index) => (
                        <tr key={`${parse.playerName}-${index}`} className="border-b border-white/5 last:border-0">
                          <td className="py-3 text-sm">{index + 1}</td>
                          <td className={`py-3 text-sm text-wow-${normalizeClassName(parse.class)}`}>
                            {parse.playerName}
                          </td>
                          <td className="py-3 text-sm text-muted-foreground">{parse.spec}</td>
                          <td className="py-3 text-sm font-medium text-right">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-md",
                                parse.percentile >= 95 ? "bg-green-500/20 text-green-400" :
                                parse.percentile >= 75 ? "bg-blue-500/20 text-blue-400" :
                                parse.percentile >= 50 ? "bg-purple-500/20 text-purple-400" :
                                parse.percentile >= 25 ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-gray-500/20 text-gray-400"
                              )}
                            >
                              {parse.percentile}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="pulls" className="space-y-4">
                {bossPulls.length > 0 ? (
                  <>
                    {/* Pulls List */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {bossPulls.map(pull => {
                        // Calculate boss progress for wipes
                        const progress = pull.isKill ? 100 : Math.round(100 - ((pull.fightDetails?.bossPercentage || 0) / 100));
                        
                        return (
                          <div 
                            key={pull.id} 
                            className={cn(
                              "glass-morphism p-3 rounded-md transition-all",
                              !pull.isKill && "opacity-80",
                              selectedPull === pull.id ? "ring-2 ring-primary" : "",
                              pull.isKill ? "cursor-pointer hover:bg-white/10" : ""
                            )}
                            onClick={() => pull.isKill ? setSelectedPull(pull.id) : null}
                            style={{ cursor: pull.isKill ? 'pointer' : 'default' }}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">Attempt #{pull.attempt}</span>
                              <span 
                                className={cn(
                                  "px-2 py-0.5 text-xs font-semibold rounded-full",
                                  pull.isKill ? "bg-kill/20 text-kill" : "bg-wipe/20 text-wipe"
                                )}
                              >
                                {pull.isKill ? "Kill" : `${(pull.fightDetails?.bossPercentage / 100).toFixed(1)}% left`}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Duration: {pull.duration}</span>
                              <span>{pull.date.split(' ')[0]}</span>
                            </div>
                            {!pull.isKill && (
                              <div className="mt-2 text-xs text-muted-foreground italic">
                                Wipe data - no parses available
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex justify-center items-center h-40">
                    <p className="text-muted-foreground">No pull data available for this boss.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default BossfightTabs;