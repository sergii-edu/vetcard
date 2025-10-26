import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Calendar, 
  Ruler, 
  Heart, 
  IdCard, 
  Palette,
  FileText,
  Activity,
  Syringe,
  PawPrint
} from "lucide-react";
import { useEffect } from "react";
import type { Animal, VeterinaryRecord, Vaccination, HealthMetric } from "@shared/schema";

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

export default function PetDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  const { data: animal, isLoading: animalLoading } = useQuery<Animal>({
    queryKey: ["/api/animals", id],
    enabled: !!id,
  });

  const { data: records = [] } = useQuery<VeterinaryRecord[]>({
    queryKey: ["/api/veterinary-records/animal", id],
    enabled: !!id,
  });

  const { data: vaccinations = [] } = useQuery<Vaccination[]>({
    queryKey: ["/api/vaccinations/animal", id],
    enabled: !!id,
  });

  const { data: metrics = [] } = useQuery<HealthMetric[]>({
    queryKey: ["/api/health-metrics/animal", id],
    enabled: !!id,
  });

  if (animalLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Тварину не знайдено</p>
      </div>
    );
  }

  const age = calculateAge(animal.dateOfBirth);
  const latestWeight = metrics
    .filter(m => m.metricName === "Вага")
    .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())[0];

  return (
    <div className="space-y-6" data-testid="page-pet-detail">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setLocation("/pets")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" data-testid="text-pet-name">{animal.name}</h1>
          <p className="text-muted-foreground mt-1">
            {animal.species} • {animal.breed}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={animal.imageUrl || undefined} alt={animal.name} />
                <AvatarFallback className="text-3xl">
                  <PawPrint className="h-16 w-16" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-semibold">{animal.name}</h2>
                <p className="text-muted-foreground">{animal.species}</p>
              </div>
              <div className="w-full space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Вік:</span>
                  <span>{age}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Стать:</span>
                  <span>{animal.sex === "Male" ? "Самець" : "Самка"}</span>
                </div>
                {latestWeight && (
                  <div className="flex items-center gap-2 text-sm">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Вага:</span>
                    <span>{latestWeight.value} {latestWeight.unit}</span>
                  </div>
                )}
                {animal.color && (
                  <div className="flex items-center gap-2 text-sm">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Колір:</span>
                    <span>{animal.color}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="h-5 w-5" />
                Ідентифікація
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Порода</p>
                  <p className="text-base" data-testid="text-breed">{animal.breed}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Дата народження</p>
                  <p className="text-base" data-testid="text-dob">{animal.dateOfBirth}</p>
                </div>
                {animal.microchipId && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Мікрочіп</p>
                    <p className="text-base font-mono" data-testid="text-microchip">{animal.microchipId}</p>
                  </div>
                )}
                {animal.passportNumber && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Паспорт</p>
                    <p className="text-base font-mono" data-testid="text-passport">{animal.passportNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/records")}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold" data-testid="count-records">{records.length}</p>
                    <p className="text-sm text-muted-foreground">Записів</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/vaccinations")}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold" data-testid="count-vaccinations">{vaccinations.length}</p>
                    <p className="text-sm text-muted-foreground">Вакцинацій</p>
                  </div>
                  <Syringe className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/health-metrics")}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold" data-testid="count-metrics">{metrics.length}</p>
                    <p className="text-sm text-muted-foreground">Метрик</p>
                  </div>
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {records.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Останні записи
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setLocation("/records")}
                    data-testid="button-view-all-records"
                  >
                    Всі записи
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {records.slice(0, 3).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium">{record.type}</p>
                        <p className="text-sm text-muted-foreground">{record.visitDate}</p>
                      </div>
                      {record.diagnosis && (
                        <Badge variant="outline">{record.diagnosis}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {vaccinations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Syringe className="h-5 w-5" />
                    Останні вакцинації
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setLocation("/vaccinations")}
                    data-testid="button-view-all-vaccinations"
                  >
                    Всі вакцинації
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vaccinations.slice(0, 3).map((vac) => (
                    <div key={vac.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium">{vac.vaccineName}</p>
                        <p className="text-sm text-muted-foreground">
                          {vac.dateAdministered}
                        </p>
                      </div>
                      {vac.nextDueDate && (
                        <Badge variant="outline" className="text-xs">
                          Наступна: {vac.nextDueDate}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
