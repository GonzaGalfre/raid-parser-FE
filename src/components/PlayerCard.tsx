// src/components/PlayerCard.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { type Player } from '@/services/warcraftLogsApi';

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

interface PlayerCardProps {
  player: Player;
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

const PlayerCard: React.FC<PlayerCardProps> = ({
  player
}) => {
  // Map each class to its color for direct CSS use
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

  // Format class name for display (capitalize and replace hyphens with spaces)
  const formatClassName = (className: string): string => {
    if (!className) return 'Unknown';
    
    const normalizedClass = normalizeClassName(className);
    return normalizedClass
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const classColor = getClassColor(player.class);
  const formattedClassName = formatClassName(player.class);

  return (
    <div 
      className="glass-morphism w-full p-4 mb-3 rounded-md transition-all relative overflow-hidden"
      style={{ borderLeft: `4px solid ${classColor}` }}
    >
      {/* Color accent */}
      <div 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: classColor,
          opacity: 0.1
        }}
      />
      
      <div className="flex flex-col relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 
            className="text-lg font-medium tracking-tight"
            style={{ color: classColor }}
          >
            {player.name}
          </h3>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">
            {player.server}
          </span>
          <span 
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ 
              backgroundColor: `${classColor}20`, 
              color: classColor,
              border: `1px solid ${classColor}40`
            }}
          >
            {formattedClassName}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PlayerCard);