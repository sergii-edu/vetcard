import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVeterinaryRecordSchema, type InsertVeterinaryRecord, type Animal, type Vet } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";

export default function AddVetRecord() {
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
    enabled: !!user?.id,
  });

  const { data: vets } = useQuery<Vet[]>({
    queryKey: ["/api/vets"],
  });

  const form = useForm<InsertVeterinaryRecord>({
    resolver: zodResolver(insertVeterinaryRecordSchema),
    defaultValues: {
      animalId: "",
      vetId: undefined,
      clinicId: undefined,
      clinicName: undefined,
      visitDate: "",
      type: "Checkup",
      diagnosis: undefined,
      symptoms: undefined,
      treatment: undefined,
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
    mutationFn: async (data: InsertVeterinaryRecord) => {
      const res = await apiRequest("/api/records", "POST", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/records/animal", selectedAnimalId] });
      toast({
        title: "Успіх",
        description: "Ветеринарний запис додано",
      });
      setLocation("/records");
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertVeterinaryRecord) => {
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
          Спочатку додайте тварину, щоб створювати записи
        </p>
        <Button onClick={() => setLocation("/pets/add")} data-testid="button-add-pet-first">
          Додати тварину
        </Button>
      </div>
    );
  }

  const recordTypes = [
    { value: "Checkup", label: "Огляд" },
    { value: "Consultation", label: "Консультація" },
    { value: "Surgery", label: "Хірургія" },
    { value: "Emergency", label: "Невідкладна допомога" },
    { value: "Other", label: "Інше" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/records")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Додати ветеринарний запис</h1>
          <p className="text-muted-foreground mt-1">Новий медичний запис для тварини</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Інформація про візит</CardTitle>
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
                name="visitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата візиту</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-visit-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип запису</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-record-type">
                          <SelectValue placeholder="Виберіть тип" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {recordTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                    <FormDescription>
                      Якщо ветеринара немає в списку, залиште порожнім
                    </FormDescription>
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
                    <FormDescription>
                      Введіть назву клініки, якщо потрібно
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Діагноз (опціонально)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Опис діагнозу..."
                        {...field}
                        value={field.value || ""}
                        data-testid="input-diagnosis"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="symptoms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Симптоми (опціонально)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Опис симптомів..."
                        {...field}
                        value={field.value || ""}
                        data-testid="input-symptoms"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="treatment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Лікування (опціонально)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Опис лікування..."
                        {...field}
                        value={field.value || ""}
                        data-testid="input-treatment"
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
                        placeholder="Додаткові нотатки..."
                        {...field}
                        value={field.value || ""}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={mutation.isPending} data-testid="button-save-record">
                  {mutation.isPending ? "Збереження..." : "Зберегти"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/records")}
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
