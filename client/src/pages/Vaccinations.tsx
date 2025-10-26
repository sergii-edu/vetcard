import { VaccinationCard } from "@/components/VaccinationCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import type { Animal, Vaccination } from "@shared/schema";

export default function Vaccinations() {
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

  const { data: vaccinations, isLoading: vaccinationsLoading } = useQuery<Vaccination[]>({
    queryKey: ["/api/vaccinations/animal", selectedAnimalId],
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
          Спочатку додайте тварину, щоб переглядати її вакцинації
        </p>
        <Button onClick={() => setLocation("/pets/add")} data-testid="button-add-pet-first">
          <Plus className="h-4 w-4 mr-2" />
          Додати тварину
        </Button>
      </div>
    );
  }

  const getVaccinationStatus = (vaccination: Vaccination): "completed" | "upcoming" | "overdue" => {
    if (!vaccination.nextDueDate) return "completed";
    
    const today = new Date();
    const nextDue = new Date(vaccination.nextDueDate);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    if (nextDue < today) return "overdue";
    if (nextDue <= thirtyDaysFromNow) return "upcoming";
    return "completed";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Вакцинації</h1>
          <p className="text-muted-foreground mt-1">Облік щеплень та нагадування</p>
        </div>
        <Button 
          onClick={() => setLocation("/vaccinations/add")} 
          data-testid="button-add-vaccination"
          disabled={!selectedAnimalId}
        >
          <Plus className="h-4 w-4 mr-2" />
          Додати вакцинацію
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

      {vaccinationsLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !vaccinations || vaccinations.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <p className="text-muted-foreground">
            Немає вакцинацій для цієї тварини
          </p>
          <Button 
            onClick={() => setLocation("/vaccinations/add")} 
            className="mt-4"
            variant="outline"
            data-testid="button-add-first-vaccination"
          >
            <Plus className="h-4 w-4 mr-2" />
            Додати першу вакцинацію
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vaccinations.map((vaccination) => (
            <VaccinationCard 
              key={vaccination.id} 
              id={vaccination.id}
              vaccineName={vaccination.vaccineName}
              dateAdministered={vaccination.dateAdministered}
              nextDueDate={vaccination.nextDueDate || undefined}
              manufacturer={vaccination.manufacturer || undefined}
              status={getVaccinationStatus(vaccination)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
