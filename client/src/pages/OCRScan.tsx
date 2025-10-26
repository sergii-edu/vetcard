import { useState, useEffect } from "react";
import { OCRUploadZone } from "@/components/OCRUploadZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Animal } from "@shared/schema";

interface ExtractedMetric {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
}

async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Extract MIME type and base64 data
      const [mimeTypePart, base64] = result.split(',');
      const mimeType = mimeTypePart.match(/:(.*?);/)?.[1] || 'image/jpeg';
      resolve({ base64, mimeType });
    };
    reader.onerror = error => reject(error);
  });
}

export default function OCRScan() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedMetric[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>("");
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    } else if (user.userType === "vet") {
      toast({
        title: "Доступ обмежено",
        description: "OCR сканування доступне тільки для власників тварин",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [user, setLocation, toast]);

  const { data: animals, isLoading: animalsLoading, isError: animalsError } = useQuery<Animal[]>({
    queryKey: ["/api/animals/owner", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");
      const response = await fetch(`/api/animals/owner/${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch animals");
      return response.json();
    },
    enabled: !!user && !!user.id && user.userType === "owner",
  });

  useEffect(() => {
    if (animalsError) {
      toast({
        title: "Помилка завантаження",
        description: "Не вдалося завантажити список тварин",
        variant: "destructive",
      });
    }
  }, [animalsError, toast]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAnimalId) {
        throw new Error("Виберіть тварину");
      }

      const promises = extractedData.map(metric => {
        const [referenceMin, referenceMax] = metric.referenceRange
          ? metric.referenceRange.split('-').map(v => parseFloat(v.trim()))
          : [null, null];

        return apiRequest("/api/health-metrics", "POST", {
          animalId: selectedAnimalId,
          metricName: metric.name,
          value: parseFloat(metric.value),
          unit: metric.unit,
          referenceMin: isNaN(referenceMin!) ? null : referenceMin,
          referenceMax: isNaN(referenceMax!) ? null : referenceMax,
          recordDate: recordDate,
          notes: "Додано через OCR сканування",
        });
      });

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      toast({
        title: "Успішно збережено!",
        description: `Додано ${extractedData.length} показників здоров'я`,
      });
      setLocation("/health-metrics");
    },
    onError: (error: any) => {
      toast({
        title: "Помилка збереження",
        description: error.message || "Не вдалося зберегти показники",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const { base64, mimeType } = await fileToBase64(file);
      
      const res = await apiRequest("/api/ocr/analyze", "POST", {
        imageBase64: base64,
        mimeType: mimeType,
      });
      
      const response = await res.json() as { success: boolean; metrics: ExtractedMetric[] };

      if (response.success && response.metrics && response.metrics.length > 0) {
        setExtractedData(response.metrics);
        toast({
          title: "Документ оброблено!",
          description: `Знайдено ${response.metrics.length} показників`,
        });
      } else {
        throw new Error("Не вдалося розпізнати дані з документа");
      }
    } catch (error: any) {
      console.error("OCR Error:", error);
      toast({
        title: "Помилка OCR",
        description: error.message || "Не вдалося обробити документ",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6" data-testid="page-ocr">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/dashboard")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">OCR Сканування</h1>
          <p className="text-muted-foreground mt-1">
            Завантажте медичний документ для автоматичного розпізнавання
          </p>
        </div>
      </div>

      {extractedData.length === 0 ? (
        <OCRUploadZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Виберіть тварину</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="animal">Тварина *</Label>
                <Select 
                  value={selectedAnimalId} 
                  onValueChange={setSelectedAnimalId}
                  disabled={animalsLoading || !animals || animals.length === 0}
                >
                  <SelectTrigger id="animal" data-testid="select-animal">
                    <SelectValue placeholder={
                      animalsLoading 
                        ? "Завантаження..." 
                        : !animals || animals.length === 0
                        ? "Немає тварин"
                        : "Виберіть тварину"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {animals?.map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.name} ({animal.species})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {animalsLoading && (
                  <p className="text-sm text-muted-foreground mt-1">Завантаження списку тварин...</p>
                )}
                {!animalsLoading && (!animals || animals.length === 0) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Немає тварин. <button onClick={() => setLocation("/pets/add")} className="underline">Додати тварину</button>
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="date">Дата аналізу *</Label>
                <Input
                  id="date"
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  data-testid="input-record-date"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Розпізнані дані</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Перевірте та відредагуйте дані перед збереженням
            </p>
            <div className="space-y-4">
              {extractedData.map((metric, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md">
                  <div>
                    <Label htmlFor={`name-${index}`}>Показник</Label>
                    <Input
                      id={`name-${index}`}
                      value={metric.name}
                      onChange={(e) => {
                        const newData = [...extractedData];
                        newData[index].name = e.target.value;
                        setExtractedData(newData);
                      }}
                      data-testid={`input-metric-name-${index}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`value-${index}`}>Значення</Label>
                    <Input
                      id={`value-${index}`}
                      value={metric.value}
                      onChange={(e) => {
                        const newData = [...extractedData];
                        newData[index].value = e.target.value;
                        setExtractedData(newData);
                      }}
                      data-testid={`input-metric-value-${index}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`unit-${index}`}>Одиниці</Label>
                    <Input
                      id={`unit-${index}`}
                      value={metric.unit}
                      onChange={(e) => {
                        const newData = [...extractedData];
                        newData[index].unit = e.target.value;
                        setExtractedData(newData);
                      }}
                      data-testid={`input-metric-unit-${index}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`range-${index}`}>Норма</Label>
                    <Input
                      id={`range-${index}`}
                      value={metric.referenceRange}
                      onChange={(e) => {
                        const newData = [...extractedData];
                        newData[index].referenceRange = e.target.value;
                        setExtractedData(newData);
                      }}
                      data-testid={`input-metric-range-${index}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setExtractedData([])}
              disabled={saveMutation.isPending}
            >
              Скасувати
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!selectedAnimalId || saveMutation.isPending}
              data-testid="button-save-metrics"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Зберегти показники
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
