import { PetCard } from "@/components/PetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Animal } from "@shared/schema";

function calculateAge(dateOfBirth: string): string {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const ageInMilliseconds = today.getTime() - birthDate.getTime();
  const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
  
  if (ageInYears < 1) {
    const ageInMonths = Math.floor(ageInYears * 12);
    return `${ageInMonths} міс.`;
  } else {
    const years = Math.floor(ageInYears);
    return `${years} ${years === 1 ? 'рік' : years < 5 ? 'роки' : 'років'}`;
  }
}

export default function PetsList() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  const { data: animals, isLoading } = useQuery<Animal[]>({
    queryKey: ["/api/animals/owner", user?.id],
    enabled: !!user && !!user.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pets = animals || [];
  const filteredPets = pets.filter((pet) =>
    pet.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Мої тварини</h1>
          <p className="text-muted-foreground mt-1">Управління профілями тварин</p>
        </div>
        <Button onClick={() => setLocation("/pets/add")} data-testid="button-add-pet">
          <Plus className="h-4 w-4 mr-2" />
          Додати тварину
        </Button>
      </div>

      {pets.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Пошук тварин..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-pets"
          />
        </div>
      )}

      {filteredPets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPets.map((pet) => (
            <PetCard
              key={pet.id}
              id={pet.id}
              name={pet.name}
              species={pet.species}
              breed={pet.breed || "Не вказано"}
              age={calculateAge(pet.dateOfBirth)}
              weight={pet.weightKg || undefined}
              imageUrl={pet.imageUrl || undefined}
              onClick={() => setLocation(`/pets/${pet.id}`)}
            />
          ))}
        </div>
      ) : searchQuery ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <p className="text-muted-foreground">Тварин не знайдено за запитом "{searchQuery}"</p>
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border">
          <p className="text-muted-foreground mb-4">У вас ще немає тварин</p>
          <Button onClick={() => setLocation("/pets/add")} variant="outline" data-testid="button-add-first-pet">
            <Plus className="h-4 w-4 mr-2" />
            Додати першу тварину
          </Button>
        </div>
      )}
    </div>
  );
}
