import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, FileText, Hospital } from "lucide-react";

interface VetRecordCardProps {
  id: string;
  date: string;
  type: string;
  vetName?: string;
  clinicName?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
}

export function VetRecordCard({
  id,
  date,
  type,
  vetName,
  clinicName,
  diagnosis,
  treatment,
  notes,
}: VetRecordCardProps) {
  const typeColors: Record<string, string> = {
    Consultation: "bg-chart-1/10 text-chart-1 border-chart-1/20",
    Vaccination: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    Surgery: "bg-destructive/10 text-destructive border-destructive/20",
    Checkup: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    Emergency: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    LabTest: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  };

  return (
    <Card className="p-4" data-testid={`card-record-${id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{date}</span>
        </div>
        <Badge variant="outline" className={typeColors[type] || ""}>{type}</Badge>
      </div>
      
      <div className="space-y-2">
        {vetName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{vetName}</span>
          </div>
        )}
        
        {clinicName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hospital className="h-4 w-4" />
            <span>{clinicName}</span>
          </div>
        )}
        
        {diagnosis && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Діагноз</h4>
            <p className="text-sm text-muted-foreground">{diagnosis}</p>
          </div>
        )}
        
        {treatment && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Лікування</h4>
            <p className="text-sm text-muted-foreground">{treatment}</p>
          </div>
        )}
        
        {notes && (
          <div className="flex items-start gap-2 pt-2 border-t">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">{notes}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
