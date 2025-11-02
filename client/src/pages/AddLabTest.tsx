import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";

const testTypes = [
  { value: "blood", label: "Аналіз крові" },
  { value: "urine", label: "Аналіз сечі" },
  { value: "xray", label: "Рентген" },
  { value: "ultrasound", label: "УЗД" },
  { value: "other", label: "Інше" },
] as const;

const metricSchema = z.object({
  name: z.string().min(1, "Введіть назву показника"),
  value: z.string().min(1, "Введіть значення"),
  unit: z.string().min(1, "Введіть одиниці"),
  referenceRange: z.string().optional(),
});

const formSchema = z.object({
  animalId: z.string().min(1, "Виберіть тварину"),
  testDate: z.string().min(1, "Виберіть дату"),
  testType: z.enum(["blood", "urine", "xray", "ultrasound", "other"]),
  clinicName: z.string().min(1, "Введіть назву клініки"),
  notes: z.string().optional(),
  metrics: z.array(metricSchema).min(1, "Додайте хоча б один показник"),
});

type FormData = z.infer<typeof formSchema>;

type Animal = {
  id: string;
  name: string;
  species: string;
};

export default function AddLabTest() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: animals = [], isLoading: animalsLoading } = useQuery<Animal[]>({
    queryKey: ["/api/animals/owner", user?.id],
    enabled: !!user?.id,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      animalId: "",
      testDate: new Date().toISOString().split("T")[0],
      testType: "blood",
      clinicName: "",
      notes: "",
      metrics: [{ name: "", value: "", unit: "", referenceRange: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "metrics",
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Create lab_test with metrics
      const response = await apiRequest("/api/lab-tests", "POST", {
        animalId: data.animalId,
        testDate: new Date(data.testDate).toISOString(),
        testType: data.testType,
        clinicName: data.clinicName,
        notes: data.notes || "",
        metrics: data.metrics.map(m => ({
          name: m.name,
          value: m.value,
          unit: m.unit,
          referenceRange: m.referenceRange || "",
        })),
      });

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      toast({
        title: "Аналіз збережено!",
        description: "Лабораторний аналіз успішно додано",
      });
      navigate("/lab-tests");
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося зберегти аналіз",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/lab-tests")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Новий лабораторний аналіз</h1>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Інформація про аналіз</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="animalId">Тварина *</Label>
                <Select
                  value={form.watch("animalId")}
                  onValueChange={(value) => form.setValue("animalId", value)}
                >
                  <SelectTrigger id="animalId" data-testid="select-animal">
                    <SelectValue placeholder="Виберіть тварину" />
                  </SelectTrigger>
                  <SelectContent>
                    {animalsLoading ? (
                      <SelectItem value="loading" disabled>Завантаження...</SelectItem>
                    ) : animals.length === 0 ? (
                      <SelectItem value="empty" disabled>Немає тварин</SelectItem>
                    ) : (
                      animals.map((animal) => (
                        <SelectItem key={animal.id} value={animal.id}>
                          {animal.name} ({animal.species})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.animalId && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.animalId.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testDate">Дата аналізу *</Label>
                  <Input
                    id="testDate"
                    type="date"
                    {...form.register("testDate")}
                    data-testid="input-test-date"
                  />
                  {form.formState.errors.testDate && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.testDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="testType">Тип аналізу *</Label>
                  <Select
                    value={form.watch("testType")}
                    onValueChange={(value: any) => form.setValue("testType", value)}
                  >
                    <SelectTrigger id="testType" data-testid="select-test-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {testTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.testType && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.testType.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="clinicName">Назва клініки *</Label>
                <Input
                  id="clinicName"
                  {...form.register("clinicName")}
                  placeholder="Наприклад: Ветклініка 'Друг'"
                  data-testid="input-clinic-name"
                />
                {form.formState.errors.clinicName && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.clinicName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Примітки</Label>
                <Input
                  id="notes"
                  {...form.register("notes")}
                  placeholder="Додаткова інформація про аналіз"
                  data-testid="input-notes"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Показники</CardTitle>
              <Button
                type="button"
                size="sm"
                onClick={() => append({ name: "", value: "", unit: "", referenceRange: "" })}
                data-testid="button-add-metric"
              >
                <Plus className="h-4 w-4 mr-2" />
                Додати показник
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-md p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">Показник {index + 1}</h3>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        data-testid={`button-remove-metric-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`metrics.${index}.name`}>Назва *</Label>
                      <Input
                        id={`metrics.${index}.name`}
                        {...form.register(`metrics.${index}.name`)}
                        placeholder="Наприклад: Гемоглобін"
                        data-testid={`input-metric-name-${index}`}
                      />
                      {form.formState.errors.metrics?.[index]?.name && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.metrics[index]?.name?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`metrics.${index}.value`}>Значення *</Label>
                      <Input
                        id={`metrics.${index}.value`}
                        {...form.register(`metrics.${index}.value`)}
                        placeholder="Наприклад: 145"
                        data-testid={`input-metric-value-${index}`}
                      />
                      {form.formState.errors.metrics?.[index]?.value && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.metrics[index]?.value?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`metrics.${index}.unit`}>Одиниці *</Label>
                      <Input
                        id={`metrics.${index}.unit`}
                        {...form.register(`metrics.${index}.unit`)}
                        placeholder="Наприклад: г/л"
                        data-testid={`input-metric-unit-${index}`}
                      />
                      {form.formState.errors.metrics?.[index]?.unit && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.metrics[index]?.unit?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`metrics.${index}.referenceRange`}>Норма</Label>
                      <Input
                        id={`metrics.${index}.referenceRange`}
                        {...form.register(`metrics.${index}.referenceRange`)}
                        placeholder="Наприклад: 120-180"
                        data-testid={`input-metric-range-${index}`}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {form.formState.errors.metrics && typeof form.formState.errors.metrics === 'object' && 'message' in form.formState.errors.metrics && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.metrics.message}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/lab-tests")}
              data-testid="button-cancel"
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              data-testid="button-save"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Збереження..." : "Зберегти"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
