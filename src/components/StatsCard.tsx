import React from 'react';
import { Card, CardContent } from './ui/card';

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
  bgColor = 'bg-white',
}) => {
  return (
    <Card className={`${bgColor} shadow-sm`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
