import { useEffect } from "react";
import { Heart, AlertTriangle, Bot, Plus } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { PetCard } from "@/components/PetCard";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import type { Animal } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  const { data: animals = [], isLoading } = useQuery<Animal[]>({
    queryKey: ["/api/animals/owner", user?.id],
    enabled: !!user && user.userType === "owner",
  });

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Завантаження...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Дашборд</h1>
          <p className="text-muted-foreground mt-1">Вітаємо, {user.firstName}!</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setLocation("/pets")} data-testid="button-add-pet">
            <Plus className="h-4 w-4 mr-2" />
            Додати тварину
          </Button>
          <Button variant="outline" onClick={logout} data-testid="button-logout">
            Вийти
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Всього тварин"
          value={animals.length}
          icon={Heart}
        />
        <StatCard
          title="Активні алерти"
          value={0}
          icon={AlertTriangle}
        />
        <StatCard
          title="AI Асистент"
          value="Активний"
          icon={Bot}
          description="RAG-система готова"
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Мої тварини</h2>
        {animals.length === 0 ? (
          <div className="text-center p-12 border rounded-lg">
            <p className="text-muted-foreground mb-4">У вас ще немає доданих тварин</p>
            <Button onClick={() => setLocation("/pets")} data-testid="button-add-first-pet">
              <Plus className="h-4 w-4 mr-2" />
              Додати першу тварину
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {animals.map((animal) => (
              <PetCard
                key={animal.id}
                id={animal.id}
                name={animal.name}
                species={animal.species}
                breed={animal.breed}
                age={animal.dateOfBirth 
                  ? `${new Date().getFullYear() - new Date(animal.dateOfBirth).getFullYear()} років`
                  : "Немає даних"
                }
                weight={animal.weightKg || 0}
                lastCheckup="Немає даних"
                onClick={() => setLocation(`/pets/${animal.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
