import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertBannerProps {
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  onDismiss?: () => void;
}

export function AlertBanner({ type, title, message, onDismiss }: AlertBannerProps) {
  const styles = {
    error: "bg-destructive/10 border-destructive/20 text-destructive",
    warning: "bg-chart-4/10 border-chart-4/20 text-chart-4",
    info: "bg-chart-1/10 border-chart-1/20 text-chart-1",
  };

  const icons = {
    error: AlertTriangle,
    warning: AlertCircle,
    info: Info,
  };

  const Icon = icons[type];

  return (
    <div
      className={`flex items-start gap-3 p-4 border rounded-md ${styles[type]}`}
      data-testid={`alert-${type}`}
    >
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm mb-1">{title}</h4>
        <p className="text-sm opacity-90">{message}</p>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={onDismiss}
          data-testid="button-dismiss-alert"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
