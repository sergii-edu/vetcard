import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Activity, FileText, Calendar, Building2, Pencil } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import type { LabTest, HealthMetric } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLabTestSchema, insertHealthMetricSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const editLabTestSchema = insertLabTestSchema.pick({
  testDate: true,
  clinicName: true,
  testType: true,
  notes: true,
});

type EditLabTestForm = z.infer<typeof editLabTestSchema>;

const editMetricSchema = insertHealthMetricSchema.pick({
  value: true,
  referenceMin: true,
  referenceMax: true,
  notes: true,
});

type EditMetricForm = z.infer<typeof editMetricSchema>;

export default function LabTestDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMetricDialogOpen, setEditMetricDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric | null>(null);

  const { data: labTest, isLoading: testLoading } = useQuery<LabTest>({
    queryKey: ["/api/lab-tests", id],
    enabled: !!id,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<HealthMetric[]>({
    queryKey: ["/api/health-metrics/animal", labTest?.animalId],
    enabled: !!labTest?.animalId,
  });

  const form = useForm<EditLabTestForm>({
    resolver: zodResolver(editLabTestSchema),
    defaultValues: {
      testDate: labTest?.testDate || "",
      clinicName: labTest?.clinicName || null,
      testType: labTest?.testType || null,
      notes: labTest?.notes || null,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EditLabTestForm) => {
      const res = await apiRequest(`/api/lab-tests/${id}`, "PATCH", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      // Invalidate filtered list by animalId (match LabTests.tsx queryKey structure)
      if (labTest?.animalId) {
        queryClient.invalidateQueries({ queryKey: ["/api/lab-tests/animal", labTest.animalId] });
      }
      toast({
        title: "Успішно оновлено!",
        description: "Зміни збережено та синхронізовано з векторною базою",
      });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка оновлення",
        description: error.message || "Не вдалося оновити аналіз",
        variant: "destructive",
      });
    },
  });

  const metricForm = useForm<EditMetricForm>({
    resolver: zodResolver(editMetricSchema),
    defaultValues: {
      value: 0,
      referenceMin: null,
      referenceMax: null,
      notes: null,
    },
  });

  const updateMetricMutation = useMutation({
    mutationFn: async ({ metricId, data }: { metricId: string; data: EditMetricForm }) => {
      const res = await apiRequest(`/api/health-metrics/${metricId}`, "PATCH", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics/animal", labTest?.animalId] });
      toast({
        title: "Успішно оновлено!",
        description: "Метрика оновлена та синхронізована з векторною базою",
      });
      setEditMetricDialogOpen(false);
      setSelectedMetric(null);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка оновлення",
        description: error.message || "Не вдалося оновити метрику",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  if (testLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!labTest) {
    return (
      <div className="text-center space-y-4 py-12">
        <h2 className="text-2xl font-semibold">Аналіз не знайдено</h2>
        <Button onClick={() => setLocation("/lab-tests")} data-testid="button-back-to-list">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Повернутися до списку
        </Button>
      </div>
    );
  }

  const testMetrics = metrics?.filter(m => m.labTestId === labTest.id) || [];
  const sortedMetrics = testMetrics.sort((a, b) => a.metricName.localeCompare(b.metricName));

  const handleSubmit = (data: EditLabTestForm) => {
    updateMutation.mutate(data);
  };

  const handleMetricEdit = (metric: HealthMetric) => {
    setSelectedMetric(metric);
    metricForm.reset({
      value: metric.value,
      referenceMin: metric.referenceMin,
      referenceMax: metric.referenceMax,
      notes: metric.notes,
    });
    setEditMetricDialogOpen(true);
  };

  const handleMetricSubmit = (data: EditMetricForm) => {
    if (selectedMetric) {
      updateMetricMutation.mutate({ metricId: selectedMetric.id, data });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setLocation("/lab-tests")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {labTest.testType ? (
              <span className="capitalize">{labTest.testType}</span>
            ) : (
              "Лабораторний аналіз"
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Детальна інформація про аналіз</p>
        </div>
        <Button 
          onClick={() => setEditDialogOpen(true)}
          data-testid="button-edit-lab-test"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Редагувати
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Дата проведення</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{labTest.testDate}</p>
          </CardContent>
        </Card>

        {labTest.clinicName && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Клініка</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{labTest.clinicName}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Кількість показників</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{testMetrics.length}</p>
          </CardContent>
        </Card>

        {labTest.createdAt && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Створено</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {new Date(labTest.createdAt).toLocaleString('uk-UA')}
              </p>
              {labTest.updatedAt && new Date(labTest.updatedAt).getTime() !== new Date(labTest.createdAt).getTime() && (
                <p className="text-xs text-muted-foreground mt-1">
                  Оновлено: {new Date(labTest.updatedAt).toLocaleString('uk-UA')}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {labTest.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Примітки</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{labTest.notes}</p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">Показники аналізу</h2>
        
        {metricsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : testMetrics.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                Немає показників для цього аналізу
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedMetrics.map((metric) => {
              const hasMin = metric.referenceMin !== null && metric.referenceMin !== undefined;
              const hasMax = metric.referenceMax !== null && metric.referenceMax !== undefined;
              const isInRange = 
                (!hasMin || metric.value >= metric.referenceMin!) &&
                (!hasMax || metric.value <= metric.referenceMax!);

              return (
                <Card key={metric.id} className="p-4 relative" data-testid={`card-metric-${metric.metricName.replace(/\s+/g, '-')}`}>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => handleMetricEdit(metric)}
                    data-testid={`button-edit-metric-${metric.id}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <CardHeader className="p-0 mb-3 pr-8">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">{metric.metricName}</CardTitle>
                      </div>
                      {!isInRange && (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                          Поза нормою
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 space-y-2">
                    <div>
                      <p className="text-2xl font-mono font-bold">
                        {metric.value} {metric.unit}
                      </p>
                      {(metric.referenceMin !== null || metric.referenceMax !== null) && (
                        <p className="text-xs text-muted-foreground">
                          Норма: {metric.referenceMin ?? '—'} – {metric.referenceMax ?? '—'} {metric.unit}
                        </p>
                      )}
                    </div>
                    {metric.notes && (
                      <p className="text-xs text-muted-foreground">
                        Примітки: {metric.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-edit-lab-test">
          <DialogHeader>
            <DialogTitle>Редагувати лабораторний аналіз</DialogTitle>
            <DialogDescription>
              Внесіть зміни до інформації про аналіз. Дані автоматично синхронізуються з векторною базою.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="testDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата аналізу</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        data-testid="input-test-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clinicName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Назва клініки</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Введіть назву клініки" 
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
                name="testType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип аналізу</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Введіть тип аналізу"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-test-type"
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
                    <FormLabel>Примітки</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Додаткова інформація" 
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Скасувати
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-save-edit"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Збереження...
                    </>
                  ) : (
                    "Зберегти зміни"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={editMetricDialogOpen} onOpenChange={setEditMetricDialogOpen}>
        <DialogContent data-testid="dialog-edit-metric">
          <DialogHeader>
            <DialogTitle>Редагувати метрику</DialogTitle>
            <DialogDescription>
              {selectedMetric && `Редагування: ${selectedMetric.metricName}`}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...metricForm}>
            <form onSubmit={metricForm.handleSubmit(handleMetricSubmit)} className="space-y-4">
              <FormField
                control={metricForm.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Значення</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-metric-value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={metricForm.control}
                  name="referenceMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Мін. норма</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          data-testid="input-reference-min"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={metricForm.control}
                  name="referenceMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Макс. норма</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          data-testid="input-reference-max"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={metricForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Примітки</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Додаткова інформація" 
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-metric-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditMetricDialogOpen(false)}
                  data-testid="button-cancel-metric-edit"
                >
                  Скасувати
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMetricMutation.isPending}
                  data-testid="button-save-metric-edit"
                >
                  {updateMetricMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Збереження...
                    </>
                  ) : (
                    "Зберегти зміни"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
