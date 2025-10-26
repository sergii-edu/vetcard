import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-semibold font-mono" data-testid={`text-stat-${title.toLowerCase()}`}>
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="p-2 rounded-md bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t">
          <span
            className={`text-xs ${
              trend.isPositive ? "text-chart-3" : "text-destructive"
            }`}
          >
            {trend.isPositive ? "+" : ""}{trend.value}
          </span>
          <span className="text-xs text-muted-foreground ml-1">від минулого місяця</span>
        </div>
      )}
    </Card>
  );
}
