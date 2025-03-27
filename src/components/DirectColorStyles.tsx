// src/components/DirectColorStyles.tsx
import React from 'react';

// Map of direct colors for each class
export const CLASS_COLORS: Record<string, string> = {
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
  'Evoker': '#33937F'
};

export const getClassColor = (className: string): string => {
  return CLASS_COLORS[className] || '#FFFFFF';
};

// Component that provides class colors as a style
export const ClassColoredText: React.FC<{
  className?: string;
  wowClass: string;
  children: React.ReactNode;
}> = ({ className, wowClass, children }) => {
  const color = getClassColor(wowClass);
  
  return (
    <span className={className} style={{ color }}>
      {children}
    </span>
  );
};

export default ClassColoredText;