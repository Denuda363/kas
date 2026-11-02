import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className = 'w-4 h-4',
  size = 18,
}) => {
  // Find matching Lucide icon or fallback to DollarSign / Tag
  const LucideIcon = (Icons as Record<string, any>)[name] || Icons.Tag;
  return <LucideIcon className={className} size={size} />;
};
