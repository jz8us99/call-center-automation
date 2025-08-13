import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  bgColor = 'bg-white dark:bg-gray-800',
}) => {
  return (
    <Card
      className={`${bgColor} border-gray-200 dark:border-gray-700 shadow-sm`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </p>
          </div>
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
