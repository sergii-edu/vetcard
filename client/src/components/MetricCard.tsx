import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MetricCardProps {
  name: string;
  value: number;
  unit: string;
  referenceRange?: string;
  status: "normal" | "warning" | "critical";
  trend?: "up" | "down" | "stable";
  date?: string;
}

export function MetricCard({
  name,
  value,
  unit,
  referenceRange,
  status,
  trend,
  date,
}: MetricCardProps) {
  const statusColors = {
    normal: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    warning: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    critical: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const statusLabels = {
    normal: "Норма",
    warning: "Увага",
    critical: "Критично",
  };

  return (
    <Card className="p-4" data-testid={`card-metric-${name.toLowerCase()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-foreground mb-1">{name}</h4>
          {referenceRange && (
            <p className="text-xs text-muted-foreground">
              Норма: {referenceRange}
            </p>
          )}
        </div>
        {status !== "normal" && (
          <Badge className={statusColors[status]} variant="outline">
            {status === "critical" && <AlertTriangle className="h-3 w-3 mr-1" />}
            {statusLabels[status]}
          </Badge>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold font-mono" data-testid={`text-metric-value-${name.toLowerCase()}`}>
            {value} <span className="text-base text-muted-foreground">{unit}</span>
          </p>
          {date && (
            <p className="text-xs text-muted-foreground mt-1">{date}</p>
          )}
        </div>
        {trend && (
          <div className="flex items-center gap-1">
            {trend === "up" && <TrendingUp className="h-4 w-4 text-chart-3" />}
            {trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
          </div>
        )}
      </div>
    </Card>
  );
}
