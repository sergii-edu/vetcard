import { VetRecordCard } from "@/components/VetRecordCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import type { Animal, VeterinaryRecord } from "@shared/schema";

export default function VetRecords() {
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

  const { data: records, isLoading: recordsLoading } = useQuery<VeterinaryRecord[]>({
    queryKey: ["/api/records/animal", selectedAnimalId],
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
          Спочатку додайте тварину, щоб переглядати її ветеринарні записи
        </p>
        <Button onClick={() => setLocation("/pets/add")} data-testid="button-add-pet-first">
          <Plus className="h-4 w-4 mr-2" />
          Додати тварину
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ветеринарні записи</h1>
          <p className="text-muted-foreground mt-1">Історія візитів та лікування</p>
        </div>
        <Button 
          onClick={() => setLocation("/records/add")} 
          data-testid="button-add-record"
          disabled={!selectedAnimalId}
        >
          <Plus className="h-4 w-4 mr-2" />
          Додати запис
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

      {recordsLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !records || records.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <p className="text-muted-foreground">
            Немає ветеринарних записів для цієї тварини
          </p>
          <Button 
            onClick={() => setLocation("/records/add")} 
            className="mt-4"
            variant="outline"
            data-testid="button-add-first-record"
          >
            <Plus className="h-4 w-4 mr-2" />
            Додати перший запис
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <VetRecordCard 
              key={record.id} 
              id={record.id}
              date={record.visitDate}
              type={record.type}
              clinicName={record.clinicName || undefined}
              diagnosis={record.diagnosis || ""}
              treatment={record.treatment || ""}
              notes={record.notes || ""}
            />
          ))}
        </div>
      )}
    </div>
  );
}
