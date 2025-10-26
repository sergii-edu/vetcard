import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Syringe } from "lucide-react";

interface VaccinationCardProps {
  id: string;
  vaccineName: string;
  dateAdministered: string;
  nextDueDate?: string;
  manufacturer?: string;
  vetName?: string;
  status: "completed" | "upcoming" | "overdue";
}

export function VaccinationCard({
  id,
  vaccineName,
  dateAdministered,
  nextDueDate,
  manufacturer,
  vetName,
  status,
}: VaccinationCardProps) {
  const statusStyles = {
    completed: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    upcoming: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    overdue: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const statusLabels = {
    completed: "Виконано",
    upcoming: "Очікується",
    overdue: "Прострочено",
  };

  return (
    <Card className="p-4" data-testid={`card-vaccination-${id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <Syringe className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-semibold text-sm">{vaccineName}</h4>
        </div>
        <Badge variant="outline" className={statusStyles[status]}>
          {statusLabels[status]}
        </Badge>
      </div>
      
      <div className="space-y-2 text-sm">
        {manufacturer && (
          <p className="text-muted-foreground">{manufacturer}</p>
        )}
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Дата: {dateAdministered}</span>
        </div>
        
        {nextDueDate && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Наступна: {nextDueDate}</span>
          </div>
        )}
        
        {vetName && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Ветеринар: {vetName}
          </p>
        )}
      </div>
    </Card>
  );
}
