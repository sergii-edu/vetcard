import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Animal = {
  id: string;
  name: string;
  species: string;
};

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>("");
  const [selectedAnimalIdForDelete, setSelectedAnimalIdForDelete] = useState<string>("");
  const [showClearAnimalDialog, setShowClearAnimalDialog] = useState(false);
  const [showDeleteAnimalDialog, setShowDeleteAnimalDialog] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  const { data: animals = [], isLoading: animalsLoading } = useQuery<Animal[]>({
    queryKey: ["/api/animals/owner", user?.id],
    enabled: !!user?.id,
  });

  const clearAnimalDataMutation = useMutation({
    mutationFn: async (animalId: string) => {
      const res = await apiRequest(`/api/animals/${animalId}/data`, "DELETE");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals/owner", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      toast({
        title: "Дані очищено",
        description: "Всі дані тварини (аналізи, метрики, векторна база) успішно видалені",
      });
      setSelectedAnimalId("");
      setShowClearAnimalDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося очистити дані",
        variant: "destructive",
      });
    },
  });

  const deleteAnimalMutation = useMutation({
    mutationFn: async (animalId: string) => {
      const res = await apiRequest(`/api/animals/${animalId}`, "DELETE");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals/owner", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      toast({
        title: "Тварину видалено",
        description: "Тварину та всі пов'язані дані успішно видалено з системи",
      });
      setSelectedAnimalIdForDelete("");
      setShowDeleteAnimalDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити тварину",
        variant: "destructive",
      });
    },
  });

  const clearAllDataMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/data/clear-all", "DELETE");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals/owner", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      toast({
        title: "Всі дані видалено",
        description: `Видалено ${data.deletedAnimals} тварин та всі пов'язані дані`,
      });
      setShowClearAllDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити дані",
        variant: "destructive",
      });
    },
  });

  const handleClearAnimalData = () => {
    if (!selectedAnimalId) {
      toast({
        title: "Виберіть тварину",
        description: "Спочатку виберіть тварину для очищення даних",
        variant: "destructive",
      });
      return;
    }
    setShowClearAnimalDialog(true);
  };

  const confirmClearAnimalData = () => {
    clearAnimalDataMutation.mutate(selectedAnimalId);
  };

  const handleDeleteAnimal = () => {
    if (!selectedAnimalIdForDelete) {
      toast({
        title: "Виберіть тварину",
        description: "Спочатку виберіть тварину для видалення",
        variant: "destructive",
      });
      return;
    }
    setShowDeleteAnimalDialog(true);
  };

  const confirmDeleteAnimal = () => {
    deleteAnimalMutation.mutate(selectedAnimalIdForDelete);
  };

  const confirmClearAllData = () => {
    clearAllDataMutation.mutate();
  };

  const selectedAnimal = animals.find(a => a.id === selectedAnimalId);
  const selectedAnimalForDelete = animals.find(a => a.id === selectedAnimalIdForDelete);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Налаштування</h1>
          <p className="text-muted-foreground mt-2">
            Керування даними та налаштування системи
          </p>
        </div>

        {/* Data Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Управління даними
            </CardTitle>
            <CardDescription>
              Очищення локальних даних та векторної бази. Ці дії незворотні!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Clear Single Animal Data */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Очистити дані окремої тварини</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Видаляє всі лабораторні аналізи, метрики здоров'я та дані з векторної бази для вибраної тварини. 
                  Сама тварина залишається в системі.
                </p>
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label htmlFor="animal-select" className="text-sm font-medium mb-2 block">
                    Виберіть тварину
                  </label>
                  <Select
                    value={selectedAnimalId}
                    onValueChange={setSelectedAnimalId}
                    disabled={animalsLoading || animals.length === 0}
                  >
                    <SelectTrigger id="animal-select" data-testid="select-animal-clear">
                      <SelectValue placeholder={
                        animalsLoading 
                          ? "Завантаження..." 
                          : animals.length === 0
                          ? "Немає тварин"
                          : "Виберіть тварину"
                      } />
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

                <Button
                  variant="destructive"
                  onClick={handleClearAnimalData}
                  disabled={!selectedAnimalId || clearAnimalDataMutation.isPending}
                  data-testid="button-clear-animal-data"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {clearAnimalDataMutation.isPending ? "Видалення..." : "Очистити дані"}
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t pt-6" />

            {/* Delete Animal */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-destructive">Видалити тварину повністю</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Повністю видаляє тварину з системи разом з УСІМА даними: лабораторні аналізи, 
                  метрики здоров'я, історія чатів та векторна база. Ця дія незворотна!
                </p>
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label htmlFor="animal-select-delete" className="text-sm font-medium mb-2 block">
                    Виберіть тварину для видалення
                  </label>
                  <Select
                    value={selectedAnimalIdForDelete}
                    onValueChange={setSelectedAnimalIdForDelete}
                    disabled={animalsLoading || animals.length === 0}
                  >
                    <SelectTrigger id="animal-select-delete" data-testid="select-animal-delete">
                      <SelectValue placeholder={
                        animalsLoading 
                          ? "Завантаження..." 
                          : animals.length === 0
                          ? "Немає тварин"
                          : "Виберіть тварину"
                      } />
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

                <Button
                  variant="destructive"
                  onClick={handleDeleteAnimal}
                  disabled={!selectedAnimalIdForDelete || deleteAnimalMutation.isPending}
                  data-testid="button-delete-animal"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteAnimalMutation.isPending ? "Видалення..." : "Видалити тварину"}
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t pt-6" />

            {/* Clear All Data */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Видалити всі дані
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  НЕБЕЗПЕЧНА ОПЕРАЦІЯ: Видаляє абсолютно ВСІ дані - всіх тварин, аналізи, метрики та векторну базу. 
                  Ця дія незворотна і не може бути скасована!
                </p>
              </div>

              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                <p className="text-sm font-medium text-destructive mb-3">
                  ⚠️ Увага! Після підтвердження буде видалено:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Всі тварини ({animals.length})</li>
                  <li>Всі лабораторні аналізи</li>
                  <li>Всі метрики здоров'я</li>
                  <li>Всі дані з векторної бази (OpenAI)</li>
                  <li>Історія чатів з AI асистентом</li>
                </ul>
              </div>

              <Button
                variant="destructive"
                onClick={() => setShowClearAllDialog(true)}
                disabled={clearAllDataMutation.isPending || animals.length === 0}
                className="w-full"
                data-testid="button-clear-all-data"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {clearAllDataMutation.isPending ? "Видалення..." : "Видалити всі дані назавжди"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clear Animal Dialog */}
        <AlertDialog open={showClearAnimalDialog} onOpenChange={setShowClearAnimalDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Очистити дані тварини?</AlertDialogTitle>
              <AlertDialogDescription>
                Ви впевнені, що хочете видалити всі дані для <strong>{selectedAnimal?.name}</strong>?
                <br /><br />
                Буде видалено:
                <ul className="list-disc ml-5 mt-2">
                  <li>Всі лабораторні аналізи</li>
                  <li>Всі метрики здоров'я</li>
                  <li>Дані з векторної бази (OpenAI)</li>
                </ul>
                <br />
                Сама тварина залишиться в системі, але без даних. Цю дію неможливо скасувати.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-clear-animal">
                Скасувати
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmClearAnimalData}
                className="bg-destructive hover:bg-destructive/90"
                data-testid="button-confirm-clear-animal"
              >
                Так, видалити дані
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Animal Dialog */}
        <AlertDialog open={showDeleteAnimalDialog} onOpenChange={setShowDeleteAnimalDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Видалити тварину назавжди?
              </AlertDialogTitle>
              <AlertDialogDescription>
                <strong className="text-destructive">УВАГА! Це повністю видалить тварину з системи!</strong>
                <br /><br />
                Ви впевнені, що хочете ПОВНІСТЮ видалити <strong>{selectedAnimalForDelete?.name}</strong>?
                <br /><br />
                Буде назавжди видалено:
                <ul className="list-disc ml-5 mt-2">
                  <li>Саму тварину з системи</li>
                  <li>Всі лабораторні аналізи</li>
                  <li>Всі метрики здоров'я</li>
                  <li>Історію чатів з AI асистентом</li>
                  <li>Дані з векторної бази (OpenAI)</li>
                </ul>
                <br />
                <strong>Цю дію неможливо скасувати! Тварина зникне з системи назавжди.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-animal">
                Ні, скасувати
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteAnimal}
                className="bg-destructive hover:bg-destructive/90"
                data-testid="button-confirm-delete-animal"
              >
                Так, видалити тварину назавжди
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clear All Data Dialog */}
        <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Видалити ВСІ дані?
              </AlertDialogTitle>
              <AlertDialogDescription>
                <strong className="text-destructive">УВАГА! Це незворотна операція!</strong>
                <br /><br />
                Буде ПОВНІСТЮ видалено:
                <ul className="list-disc ml-5 mt-2">
                  <li>Всі {animals.length} тварин</li>
                  <li>Всі лабораторні аналізи</li>
                  <li>Всі метрики здоров'я</li>
                  <li>Вся векторна база даних</li>
                  <li>Вся історія чатів</li>
                </ul>
                <br />
                Ваш обліковий запис залишиться активним, але ВСІ дані будуть втрачені назавжди.
                <br /><br />
                <strong>Ви дійсно впевнені?</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-clear-all">
                Ні, скасувати
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmClearAllData}
                className="bg-destructive hover:bg-destructive/90"
                data-testid="button-confirm-clear-all"
              >
                Так, видалити ВСЕ назавжди
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
