import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVaccinationSchema, type InsertVaccination, type Animal, type Vet } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";

export default function AddVaccination() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
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

  const { data: vets, isLoading: vetsLoading } = useQuery<Vet[]>({
    queryKey: ["/api/vets"],
  });

  const form = useForm<InsertVaccination>({
    resolver: zodResolver(insertVaccinationSchema),
    defaultValues: {
      animalId: "",
      vaccineName: "",
      manufacturer: undefined,
      batchNumber: undefined,
      dateAdministered: "",
      nextDueDate: undefined,
      vetId: undefined,
      clinicId: undefined,
      clinicName: undefined,
      notes: undefined,
    },
  });

  useEffect(() => {
    if (animals && animals.length > 0 && !selectedAnimalId) {
      const firstAnimalId = animals[0].id;
      setSelectedAnimalId(firstAnimalId);
      form.setValue("animalId", firstAnimalId);
    }
  }, [animals, selectedAnimalId, form]);

  const mutation = useMutation({
    mutationFn: async (data: InsertVaccination) => {
      const res = await apiRequest("/api/vaccinations", "POST", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vaccinations/animal", selectedAnimalId] });
      toast({
        title: "Успіх",
        description: "Вакцинацію додано",
      });
      setLocation("/vaccinations");
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertVaccination) => {
    mutation.mutate(data);
  };

  if (animalsLoading || vetsLoading) {
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
          Спочатку додайте тварину, щоб створювати вакцинації
        </p>
        <Button onClick={() => setLocation("/pets/add")} data-testid="button-add-pet-first">
          Додати тварину
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/vaccinations")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Додати вакцинацію</h1>
          <p className="text-muted-foreground mt-1">Нова вакцинація для тварини</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Інформація про вакцинацію</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="animalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тварина</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedAnimalId(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-animal">
                          <SelectValue placeholder="Виберіть тварину" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {animals.map((animal) => (
                          <SelectItem key={animal.id} value={animal.id}>
                            {animal.name} ({animal.species})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vaccineName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Назва вакцини</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Наприклад: Сказ, Комплексна вакцина" 
                        {...field} 
                        data-testid="input-vaccine-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Виробник (опціонально)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Наприклад: Nobivac, Eurican" 
                        {...field}
                        value={field.value ?? ""}
                        data-testid="input-manufacturer"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="batchNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Номер партії (опціонально)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Номер партії вакцини" 
                        {...field}
                        value={field.value ?? ""}
                        data-testid="input-batch-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateAdministered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата введення</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-date-administered" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextDueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Наступна дата (опціонально)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value ?? ""}
                        data-testid="input-next-due-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ветеринар (опціонально)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} 
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-vet">
                          <SelectValue placeholder="Виберіть ветеринара або залиште порожнім" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Не вибрано</SelectItem>
                        {vets && vets.map((vet) => (
                          <SelectItem key={vet.id} value={vet.id}>
                            {vet.firstName} {vet.lastName} {vet.specialization ? `(${vet.specialization})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clinicName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Назва клініки (опціонально)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Наприклад: Ветклініка Здоров'я" 
                        {...field}
                        value={field.value || ""}
                        data-testid="input-clinic-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Нотатки (опціонально)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Додаткова інформація..."
                        {...field}
                        value={field.value ?? ""}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={mutation.isPending} data-testid="button-save-vaccination">
                  {mutation.isPending ? "Збереження..." : "Зберегти"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/vaccinations")}
                  data-testid="button-cancel"
                >
                  Скасувати
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
