import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Activity } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import type { Animal, HealthMetric } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function HealthMetrics() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>("");

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  const { data: animals, isLoading: animalsLoading } = useQuery<Animal[]>({
    queryKey: ["/api/animals/owner", user?.id],
    enabled: !!user && !!user.id,
  });

  const { data: healthMetrics, isLoading: metricsLoading } = useQuery<HealthMetric[]>({
    queryKey: ["/api/health-metrics/animal", selectedAnimalId],
    enabled: !!selectedAnimalId,
  });

  useEffect(() => {
    if (animals && animals.length > 0 && !selectedAnimalId) {
      setSelectedAnimalId(animals[0].id);
    }
  }, [animals, selectedAnimalId]);

  if (animalsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!animals || animals.length === 0) {
    return (
      <div className="text-center space-y-4 py-12">
        <h2 className="text-2xl font-semibold">Немає тварин</h2>
        <p className="text-muted-foreground">
          Спочатку додайте тварину, щоб відстежувати метрики здоров'я
        </p>
        <Button onClick={() => setLocation("/pets/add")} data-testid="button-add-pet-first">
          <Plus className="h-4 w-4 mr-2" />
          Додати тварину
        </Button>
      </div>
    );
  }

  const groupedMetrics: Record<string, HealthMetric[]> = {};
  if (healthMetrics) {
    healthMetrics.forEach((metric) => {
      if (!groupedMetrics[metric.metricName]) {
        groupedMetrics[metric.metricName] = [];
      }
      groupedMetrics[metric.metricName].push(metric);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Метрики здоров'я</h1>
          <p className="text-muted-foreground mt-1">Відстеження показників здоров'я</p>
        </div>
        <Button 
          onClick={() => setLocation("/health-metrics/add")} 
          data-testid="button-add-metric"
          disabled={!selectedAnimalId}
        >
          <Plus className="h-4 w-4 mr-2" />
          Додати метрику
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Тварина:</label>
        <Select value={selectedAnimalId} onValueChange={setSelectedAnimalId}>
          <SelectTrigger className="w-64" data-testid="select-animal">
            <SelectValue placeholder="Виберіть тварину" />
          </SelectTrigger>
          <SelectContent>
            {animals.map((animal) => (
              <SelectItem key={animal.id} value={animal.id}>
                {animal.name} ({animal.species})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {metricsLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !healthMetrics || healthMetrics.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <p className="text-muted-foreground">
            Немає метрик здоров'я для цієї тварини
          </p>
          <Button 
            onClick={() => setLocation("/health-metrics/add")} 
            className="mt-4"
            variant="outline"
            data-testid="button-add-first-metric"
          >
            <Plus className="h-4 w-4 mr-2" />
            Додати першу метрику
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedMetrics).map(([metricName, metrics]) => {
            const latestMetric = metrics.sort((a, b) => 
              new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
            )[0];
            
            const hasMin = latestMetric.referenceMin !== null && latestMetric.referenceMin !== undefined;
            const hasMax = latestMetric.referenceMax !== null && latestMetric.referenceMax !== undefined;
            const isInRange = 
              (!hasMin || latestMetric.value >= latestMetric.referenceMin!) &&
              (!hasMax || latestMetric.value <= latestMetric.referenceMax!);

            return (
              <Card key={metricName} className="p-4" data-testid={`card-metric-${metricName.replace(/\s+/g, '-')}`}>
                <CardHeader className="p-0 mb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{metricName}</CardTitle>
                    </div>
                    {!isInRange && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                        Поза нормою
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  <div>
                    <p className="text-2xl font-mono font-bold">
                      {latestMetric.value} {latestMetric.unit}
                    </p>
                    {(latestMetric.referenceMin !== null || latestMetric.referenceMax !== null) && (
                      <p className="text-xs text-muted-foreground">
                        Норма: {latestMetric.referenceMin ?? '—'} – {latestMetric.referenceMax ?? '—'} {latestMetric.unit}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Дата: {latestMetric.recordDate}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Записів: {metrics.length}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
