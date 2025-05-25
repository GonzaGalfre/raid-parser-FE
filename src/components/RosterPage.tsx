import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, Filter, Activity, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { analysisService } from '../services/analysisService';
import { AnalysisMetadata } from '../types/storage';

interface RosterCharacter {
  playerName: string;
  class: string;
  spec: string | null;
  server?: string;
  region?: string;
  analysesParticipated: number;
  totalAnalyses: number;
  participationRate: number;
  averagePerformance: number;
  bestPerformance: number;
  totalParses: number;
  lastSeen: string;
  analysisNames: string[];
}

interface RosterPageProps {
  reportsData?: Record<string, any>; // Keep for compatibility but won't use
}

const RosterPage: React.FC<RosterPageProps> = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [rosterCharacters, setRosterCharacters] = useState<RosterCharacter[]>([]);

  // Get class color for styling
  const getClassColor = (playerClass: string): string => {
    const classColors = {
      'DeathKnight': '#C41E3A',
      'DemonHunter': '#A330C9',
      'Death Knight': '#C41E3A',
      'Demon Hunter': '#A330C9',
      'Druid': '#FF7C0A',
      'Hunter': '#AAD372',
      'Mage': '#3FC7EB',
      'Monk': '#00FF98',
      'Paladin': '#F48CBA',
      'Priest': '#FFFFFF',
      'Rogue': '#FFF468',
      'Shaman': '#0070DD',
      'Warlock': '#8788EE',
      'Warrior': '#C69B6D',
      'Evoker': '#33937F',
    };
    return classColors[playerClass] || '#888888';
  };

  // Format class name for display
  const formatClassName = (className: string): string => {
    if (!className) return 'Unknown';
    return className
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Load roster data from saved analyses
  useEffect(() => {
    const loadRosterData = async () => {
      try {
        setLoading(true);
        
        // Get all saved analyses
        const analyses = await analysisService.getAllAnalyses();
        console.log('Roster - Found analyses:', analyses.length);
        
        if (analyses.length === 0) {
          setRosterCharacters([]);
          return;
        }

        // Load all analyses to get player data
        const allAnalyses = await Promise.all(
          analyses.map(analysis => analysisService.loadAnalysis(analysis.id))
        );

        // Aggregate all unique characters from all analyses
        const characterMap = new Map<string, {
          playerName: string;
          class: string;
          spec: string | null;
          server?: string;
          region?: string;
          totalPerformance: number;
          parseCount: number;
          bestPerformance: number;
          analysesParticipated: Set<string>;
          analysisNames: Set<string>;
          lastSeen: Date;
        }>();

        allAnalyses.forEach((analysis, index) => {
          if (analysis && analysis.players) {
            const analysisDate = new Date(analysis.createdAt);
            
            analysis.players.forEach((player: any) => {
              // Use player name as the key (since server info might not be available in saved analyses)
              const characterKey = player.playerName;
              const existing = characterMap.get(characterKey);
              
              if (existing) {
                existing.totalPerformance += player.totalAverage || player.averagePercentile || 0;
                existing.parseCount += player.totalParses || 1;
                existing.analysesParticipated.add(analysis.id);
                existing.analysisNames.add(analysis.name);
                if ((player.totalAverage || player.averagePercentile || 0) > existing.bestPerformance) {
                  existing.bestPerformance = player.totalAverage || player.averagePercentile || 0;
                }
                if (analysisDate > existing.lastSeen) {
                  existing.lastSeen = analysisDate;
                  // Update spec to most recent
                  existing.spec = player.spec || existing.spec;
                }
              } else {
                characterMap.set(characterKey, {
                  playerName: player.playerName,
                  class: player.class,
                  spec: player.spec,
                  server: player.server || 'Unknown',
                  region: player.region || 'Unknown',
                  totalPerformance: player.totalAverage || player.averagePercentile || 0,
                  parseCount: player.totalParses || 1,
                  bestPerformance: player.totalAverage || player.averagePercentile || 0,
                  analysesParticipated: new Set([analysis.id]),
                  analysisNames: new Set([analysis.name]),
                  lastSeen: analysisDate
                });
              }
            });
          }
        });

        // Convert to final roster format
        const characters = Array.from(characterMap.values()).map(character => ({
          playerName: character.playerName,
          class: character.class,
          spec: character.spec,
          server: character.server,
          region: character.region,
          analysesParticipated: character.analysesParticipated.size,
          totalAnalyses: analyses.length,
          participationRate: Math.round((character.analysesParticipated.size / analyses.length) * 100),
          averagePerformance: Math.round(character.totalPerformance / character.parseCount),
          bestPerformance: character.bestPerformance,
          totalParses: character.parseCount,
          lastSeen: character.lastSeen.toLocaleDateString(),
          analysisNames: Array.from(character.analysisNames)
        }));

        // Sort by participation rate (highest first), then by average performance
        const sortedCharacters = characters.sort((a, b) => {
          if (b.participationRate !== a.participationRate) {
            return b.participationRate - a.participationRate;
          }
          return b.averagePerformance - a.averagePerformance;
        });

        console.log('Roster - Loaded characters:', sortedCharacters.length);
        setRosterCharacters(sortedCharacters);
        
      } catch (error) {
        console.error('Error loading roster data:', error);
        setRosterCharacters([]);
      } finally {
        setLoading(false);
      }
    };

    loadRosterData();
  }, []);

  // Get unique classes for filter
  const uniqueClasses = useMemo(() => {
    const classes = new Set(rosterCharacters.map(char => char.class));
    return Array.from(classes).sort();
  }, [rosterCharacters]);

  // Filter characters based on search and class filter
  const filteredCharacters = useMemo(() => {
    return rosterCharacters.filter(character => {
      const matchesSearch = character.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (character.server && character.server.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (character.spec && character.spec.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesClass = selectedClass === 'all' || character.class === selectedClass;
      
      return matchesSearch && matchesClass;
    });
  }, [rosterCharacters, searchTerm, selectedClass]);

  if (loading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gradient mb-2">Guild Roster</h1>
          <p className="text-muted-foreground">
            Loading character data from saved analyses...
          </p>
        </header>
        
        <div className="flex justify-center items-center h-96">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading roster data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (rosterCharacters.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gradient mb-2">Guild Roster</h1>
          <p className="text-muted-foreground">
            View all characters from your saved raid analyses
          </p>
        </header>
        
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Saved Analyses Found</h3>
            <p className="text-muted-foreground mb-4">
              Import and save some raid reports to see your guild roster here.
            </p>
            <p className="text-sm text-muted-foreground">
              Go to "Add Report" → Configure API → Import reports → Save analysis
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gradient mb-2">Guild Roster</h1>
        <p className="text-muted-foreground">
          {rosterCharacters.length} unique characters across {rosterCharacters[0]?.totalAnalyses || 0} saved analyses
        </p>
      </header>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search Characters</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, server, or spec..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Class Filter */}
            <div className="space-y-2">
              <Label htmlFor="class-filter">Filter by Class</Label>
              <select
                id="class-filter"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Classes</option>
                {uniqueClasses.map(className => (
                  <option key={className} value={className}>
                    {formatClassName(className)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Character Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCharacters.map(character => {
          const classColor = getClassColor(character.class);
          
          return (
            <Card 
              key={`${character.playerName}-${character.class}`}
              className="relative overflow-hidden transition-all hover:shadow-lg"
              style={{ borderLeft: `4px solid ${classColor}` }}
            >
              {/* Color accent background */}
              <div 
                className="absolute inset-0 opacity-5"
                style={{ backgroundColor: classColor }}
              />
              
              <CardContent className="p-4 relative z-10">
                <div className="space-y-3">
                  {/* Character Name and Server */}
                  <div>
                    <h3 
                      className="font-semibold text-lg"
                      style={{ color: classColor }}
                    >
                      {character.playerName}
                    </h3>
                    {character.server && character.server !== 'Unknown' && (
                      <p className="text-sm text-muted-foreground">
                        {character.server}
                      </p>
                    )}
                  </div>

                  {/* Class and Spec */}
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: classColor,
                        color: classColor,
                        backgroundColor: `${classColor}10`
                      }}
                    >
                      {formatClassName(character.class)}
                    </Badge>
                    {character.spec && (
                      <Badge variant="secondary">
                        {character.spec}
                      </Badge>
                    )}
                  </div>

                  {/* Performance Stats */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Performance:</span>
                      <span 
                        className="font-medium"
                        style={{ 
                          color: character.averagePerformance >= 75 ? '#22c55e' : 
                                 character.averagePerformance >= 50 ? '#3b82f6' : 
                                 character.averagePerformance >= 25 ? '#f59e0b' : '#ef4444'
                        }}
                      >
                        {character.averagePerformance}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Best Parse:</span>
                      <span className="font-medium">{character.bestPerformance}%</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Participation:</span>
                      <span className="font-medium">
                        {character.analysesParticipated}/{character.totalAnalyses} ({character.participationRate}%)
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Seen:</span>
                      <span>{character.lastSeen}</span>
                    </div>

                    {/* Participation Bar */}
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          width: `${character.participationRate}%`,
                          backgroundColor: classColor
                        }}
                      />
                    </div>
                  </div>

                  {/* Analysis Names (truncated) */}
                  {character.analysisNames.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Analyses: </span>
                      {character.analysisNames.length > 2 
                        ? `${character.analysisNames.slice(0, 2).join(', ')} +${character.analysisNames.length - 2} more`
                        : character.analysisNames.join(', ')
                      }
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {filteredCharacters.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Characters Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {filteredCharacters.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{filteredCharacters.length}</div>
                <div className="text-sm text-muted-foreground">Characters</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{uniqueClasses.length}</div>
                <div className="text-sm text-muted-foreground">Classes</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(filteredCharacters.reduce((sum, char) => sum + char.averagePerformance, 0) / filteredCharacters.length)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Performance</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(filteredCharacters.reduce((sum, char) => sum + char.participationRate, 0) / filteredCharacters.length)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Participation</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RosterPage; 