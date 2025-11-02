import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, FileText, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import type { Animal, LabTest, HealthMetric } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function LabTests() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>("");

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // Read animalId from URL query params whenever location changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const animalIdFromUrl = urlParams.get('animalId');
    if (animalIdFromUrl) {
      setSelectedAnimalId(animalIdFromUrl);
    }
  }, [location]);

  const { data: animals, isLoading: animalsLoading } = useQuery<Animal[]>({
    queryKey: ["/api/animals/owner", user?.id],
    enabled: !!user && !!user.id,
  });

  const { data: labTests, isLoading: testsLoading } = useQuery<LabTest[]>({
    queryKey: ["/api/lab-tests/animal", selectedAnimalId],
    enabled: !!selectedAnimalId,
  });

  const { data: allMetrics } = useQuery<HealthMetric[]>({
    queryKey: ["/api/health-metrics/animal", selectedAnimalId],
    enabled: !!selectedAnimalId,
  });

  useEffect(() => {
    if (animals && animals.length > 0 && !selectedAnimalId) {
      // Auto-select first animal only if no animal selected
      setSelectedAnimalId(animals[0].id);
    } else if (animals && selectedAnimalId) {
      // Verify that animalId from URL exists in the list
      const animalExists = animals.some(a => a.id === selectedAnimalId);
      if (!animalExists && animals.length > 0) {
        setSelectedAnimalId(animals[0].id);
      }
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
          Спочатку додайте тварину, щоб відстежувати аналізи
        </p>
        <Button onClick={() => setLocation("/pets/add")} data-testid="button-add-pet-first">
          <Plus className="h-4 w-4 mr-2" />
          Додати тварину
        </Button>
      </div>
    );
  }

  const getMetricsForTest = (testId: string): number => {
    if (!allMetrics) return 0;
    return allMetrics.filter(m => m.labTestId === testId).length;
  };

  const sortedTests = labTests?.sort((a, b) => 
    new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Лабораторні аналізи</h1>
          <p className="text-muted-foreground mt-1">Історія медичних досліджень</p>
        </div>
        <Button 
          onClick={() => setLocation("/lab-tests/add")} 
          data-testid="button-add-lab-test"
          disabled={!selectedAnimalId}
        >
          <Plus className="h-4 w-4 mr-2" />
          Додати аналіз
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

      {testsLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !labTests || labTests.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <p className="text-muted-foreground">
            Немає лабораторних аналізів для цієї тварини
          </p>
          <Button 
            onClick={() => setLocation("/lab-tests/add")} 
            className="mt-4"
            variant="outline"
            data-testid="button-add-first-test"
          >
            <Plus className="h-4 w-4 mr-2" />
            Додати перший аналіз
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTests.map((test) => (
            <Card 
              key={test.id} 
              className="hover-elevate cursor-pointer transition-all"
              onClick={() => setLocation(`/lab-tests/${test.id}`)}
              data-testid={`card-lab-test-${test.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {test.testType ? (
                            <span className="capitalize">{test.testType}</span>
                          ) : (
                            "Лабораторний аналіз"
                          )}
                        </h3>
                        <Badge variant="secondary" data-testid={`badge-metrics-count-${test.id}`}>
                          {getMetricsForTest(test.id)} показників
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>Дата: {test.testDate}</span>
                        {test.clinicName && (
                          <span>Клініка: {test.clinicName}</span>
                        )}
                      </div>
                      {test.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {test.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
