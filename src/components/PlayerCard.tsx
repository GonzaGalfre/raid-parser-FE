
import React from 'react';
import { cn } from '@/lib/utils';

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
  name: string;
  realm: string;
  itemLevel: string;
  playerClass: ClassType;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  realm,
  itemLevel,
  playerClass,
}) => {
  // Map each class to its color for direct CSS use
  const getClassColor = (playerClass: ClassType): string => {
    const classColors = {
      'death-knight': '#C41E3A',
      'demon-hunter': '#A330C9',
      'druid': '#FF7C0A',
      'hunter': '#AAD372',
      'mage': '#3FC7EB',
      'monk': '#00FF98',
      'paladin': '#F48CBA',
      'priest': '#FFFFFF',
      'rogue': '#FFF468',
      'shaman': '#0070DD',
      'warlock': '#8788EE',
      'warrior': '#C69B6D',
      'evoker': '#33937F',
    };
    return classColors[playerClass];
  };

  // Format class name for display (capitalize and replace hyphens with spaces)
  const formatClassName = (className: string): string => {
    return className
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const classColor = getClassColor(playerClass);
  const formattedClassName = formatClassName(playerClass);

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
            {name}
          </h3>
          <span className="text-sm font-semibold bg-secondary px-2 py-0.5 rounded-md">
            {itemLevel}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">
            {realm}
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

export default PlayerCard;
