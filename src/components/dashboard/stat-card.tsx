'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon;
  description?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  description,
}: StatCardProps) {
  return (
    <div className="bg-card border border-border/20 rounded-lg p-6 transition-all hover:border-border/40">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            {change && (
              <span
                className={cn(
                  'text-xs font-medium',
                  changeType === 'increase' && 'text-green-500',
                  changeType === 'decrease' && 'text-red-500',
                  changeType === 'neutral' && 'text-muted-foreground'
                )}
              >
                {change}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}
