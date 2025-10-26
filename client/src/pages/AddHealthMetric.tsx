import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertHealthMetricSchema, type InsertHealthMetric, type Animal } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";

export default function AddHealthMetric() {
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

  const form = useForm<InsertHealthMetric>({
    resolver: zodResolver(insertHealthMetricSchema),
    defaultValues: {
      animalId: "",
      metricName: "",
      value: 0,
      unit: "",
      referenceMin: undefined,
      referenceMax: undefined,
      recordDate: "",
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
    mutationFn: async (data: InsertHealthMetric) => {
      const res = await apiRequest("/api/health-metrics", "POST", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics/animal", selectedAnimalId] });
      toast({
        title: "Успіх",
        description: "Метрику додано",
      });
      setLocation("/health-metrics");
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertHealthMetric) => {
    mutation.mutate(data);
  };

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
          Спочатку додайте тварину, щоб відстежувати метрики
        </p>
        <Button onClick={() => setLocation("/pets/add")} data-testid="button-add-pet-first">
          Додати тварину
        </Button>
      </div>
    );
  }

  const commonMetrics = [
    { name: "Вага", unit: "кг" },
    { name: "Температура", unit: "°C" },
    { name: "Частота серцевих скорочень", unit: "уд/хв" },
    { name: "Частота дихання", unit: "дих/хв" },
    { name: "Глюкоза крові", unit: "ммоль/л" },
    { name: "Гемоглобін", unit: "г/л" },
    { name: "Лейкоцити", unit: "×10⁹/л" },
    { name: "Еритроцити", unit: "×10¹²/л" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/health-metrics")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Додати метрику</h1>
          <p className="text-muted-foreground mt-1">Новий показник здоров'я</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Інформація про метрику</CardTitle>
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
                name="metricName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Назва метрики</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-metric-name">
                          <SelectValue placeholder="Виберіть або введіть метрику" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {commonMetrics.map((metric) => (
                          <SelectItem key={metric.name} value={metric.name}>
                            {metric.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormControl>
                      <Input 
                        placeholder="Або введіть власну назву метрики" 
                        value={field.value}
                        onChange={field.onChange}
                        data-testid="input-metric-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Значення</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.0" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-value"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Одиниці</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="кг, °C, мл" 
                          {...field} 
                          data-testid="input-unit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="referenceMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Мін. норма (опціонально)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          data-testid="input-reference-min"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referenceMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Макс. норма (опціонально)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          data-testid="input-reference-max"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="recordDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата запису</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-record-date" />
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
                <Button type="submit" disabled={mutation.isPending} data-testid="button-save-metric">
                  {mutation.isPending ? "Збереження..." : "Зберегти"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/health-metrics")}
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
