import { useState, useEffect, useRef } from "react";
import { OCRUploadZone } from "@/components/OCRUploadZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Plus, X, RotateCcw, FileText, Upload } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Animal } from "@shared/schema";

interface ExtractedMetric {
  name: string;
  value: number | string;
  unit: string;
  referenceMin: number | null;
  referenceMax: number | null;
}

interface UploadedFile {
  base64: string;
  mimeType: string;
  name: string;
  size: number;
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function OCRScan() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedMetric[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>("");
  const [testDate, setTestDate] = useState<string>("");
  const [clinicName, setClinicName] = useState<string>("");
  const [testType, setTestType] = useState<string>("");
  const [isFirstScan, setIsFirstScan] = useState(true);

  // Refs for cleanup and abort control
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup memory on component unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Abort any pending OCR requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clear uploaded file from memory when leaving the page
      setUploadedFile(null);
      setExtractedData([]);
    };
  }, []);

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
      if (!testDate || testDate.trim() === "") {
        throw new Error("Введіть дату проведення аналізу");
      }
      if (!extractedData || extractedData.length === 0) {
        throw new Error("Немає розпізнаних показників для збереження");
      }

      // Create lab_test with grouped metrics via lab-tests endpoint
      const res = await apiRequest("/api/lab-tests", "POST", {
        animalId: selectedAnimalId,
        testDate: new Date(testDate).toISOString(),
        clinicName: clinicName && clinicName.trim() !== "" ? clinicName : null,
        testType: testType && testType.trim() !== "" ? testType : null,
        notes: "Додано через OCR сканування",
        metrics: extractedData.map(m => ({
          name: m.name,
          value: typeof m.value === 'number' ? m.value : parseFloat(m.value as string) || 0,
          unit: m.unit,
          referenceMin: m.referenceMin,
          referenceMax: m.referenceMax,
        })),
      });

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      toast({
        title: "Успішно збережено!",
        description: `Створено аналіз з ${extractedData.length} показників`,
      });
      // Clear memory before redirect
      setUploadedFile(null);
      setExtractedData([]);
      setSelectedAnimalId("");
      setTestDate("");
      setClinicName("");
      setTestType("");
      // Redirect to lab-tests with animal ID to auto-select the correct animal
      setLocation(`/lab-tests?animalId=${selectedAnimalId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка збереження",
        description: error.message || "Не вдалося зберегти аналіз",
        variant: "destructive",
      });
    },
  });

  const analyzeFile = async (base64: string, mimeType: string) => {
    // Create abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      const res = await fetch("/api/ocr/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: mimeType,
        }),
        signal: controller.signal,
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const response = await res.json() as { 
        success: boolean; 
        clinicName: string | null;
        testType: string | null;
        testDate: string | null;
        metrics: ExtractedMetric[] 
      };

      if (response.success && response.metrics && response.metrics.length > 0) {
        // Only update state if component is still mounted
        if (!isMountedRef.current) return;
        
        setExtractedData(response.metrics);
        
        // Auto-fill metadata ONLY on first scan, preserve user edits on re-scans
        if (isFirstScan) {
          if (response.clinicName) {
            setClinicName(response.clinicName);
          }
          if (response.testType) {
            setTestType(response.testType);
          }
          if (response.testDate) {
            setTestDate(response.testDate);
          }
        }
        
        toast({
          title: "Документ оброблено!",
          description: `Знайдено ${response.metrics.length} показників`,
        });
      } else {
        throw new Error("Не вдалося розпізнати дані з документа");
      }
    } finally {
      // Clear abort controller after request completes
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    // Reset to first scan mode when new file is uploaded
    setIsFirstScan(true);
    
    try {
      const { base64, mimeType } = await fileToBase64(file);
      
      // Only update state if still mounted
      if (!isMountedRef.current) return;
      
      // Store file for re-scanning
      setUploadedFile({
        base64,
        mimeType,
        name: file.name,
        size: file.size,
      });
      
      await analyzeFile(base64, mimeType);
      
      // Mark first scan complete after successful analysis
      if (isMountedRef.current) {
        setIsFirstScan(false);
      }
    } catch (error: any) {
      // Don't show error if request was aborted (component unmounted)
      if (error.name === 'AbortError') {
        console.log("OCR request aborted");
        return;
      }
      
      console.error("OCR Error:", error);
      if (isMountedRef.current) {
        toast({
          title: "Помилка OCR",
          description: error.message || "Не вдалося обробити документ",
          variant: "destructive",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const handleRescan = async () => {
    if (!uploadedFile) return;
    
    setIsProcessing(true);
    
    try {
      // Don't clear existing data before re-scan - only overwrite on success
      // This preserves user data if OCR fails
      // User metadata (animal, date, clinic) is preserved - not overwritten (isFirstScan=false)
      await analyzeFile(uploadedFile.base64, uploadedFile.mimeType);
    } catch (error: any) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError') {
        return;
      }
      
      console.error("OCR Re-scan Error:", error);
      if (isMountedRef.current) {
        toast({
          title: "Помилка повторного сканування",
          description: error.message || "Не вдалося обробити документ",
          variant: "destructive",
        });
      }
      // Existing data remains intact on error
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const handleUploadDifferent = () => {
    // Clear all data including uploaded file
    setUploadedFile(null);
    setExtractedData([]);
    setSelectedAnimalId("");
    setTestDate("");
    setClinicName("");
    setTestType("");
    setIsFirstScan(true); // Reset to first scan mode
    
    toast({
      title: "Готово до нового завантаження",
      description: "Завантажте інший документ для розпізнавання",
    });
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleAddMetric = () => {
    setExtractedData([
      ...extractedData,
      {
        name: "",
        value: 0,
        unit: "",
        referenceMin: null,
        referenceMax: null,
      }
    ]);
  };

  const handleRemoveMetric = (index: number) => {
    setExtractedData(extractedData.filter((_, i) => i !== index));
  };

  const handleResetOCR = () => {
    setUploadedFile(null);
    setExtractedData([]);
    setSelectedAnimalId("");
    setTestDate("");
    setClinicName("");
    setTestType("");
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

      {/* Show uploaded file info when file has been processed */}
      {uploadedFile && extractedData.length > 0 && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" data-testid="text-uploaded-filename">
                  {uploadedFile.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(uploadedFile.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRescan}
                disabled={isProcessing}
                data-testid="button-rescan"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Обробка...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Розпізнати знову
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUploadDifferent}
                disabled={isProcessing}
                data-testid="button-upload-different"
              >
                <Upload className="h-4 w-4 mr-2" />
                Завантажити інший документ
              </Button>
            </div>
          </div>
        </Card>
      )}

      {extractedData.length === 0 ? (
        <OCRUploadZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Інформація про аналіз</h2>
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
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  data-testid="input-test-date"
                />
              </div>
              <div>
                <Label htmlFor="testType">Тип аналізу</Label>
                <Input
                  id="testType"
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  placeholder="Введіть тип аналізу"
                  data-testid="input-test-type"
                />
              </div>
              <div>
                <Label htmlFor="clinic">Назва клініки *</Label>
                <Input
                  id="clinic"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Наприклад: Ветклініка 'Друг'"
                  data-testid="input-clinic-name"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Розпізнані дані</h2>
                <p className="text-sm text-muted-foreground">
                  Перевірте та відредагуйте дані перед збереженням
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAddMetric}
                data-testid="button-add-metric"
              >
                <Plus className="h-4 w-4 mr-2" />
                Додати показник
              </Button>
            </div>
            <div className="space-y-4">
              {extractedData.map((metric, index) => (
                <div key={index} className="relative grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-md">
                  <div className="md:col-span-2">
                    <Label htmlFor={`name-${index}`}>Показник</Label>
                    <Input
                      id={`name-${index}`}
                      value={metric.name || ""}
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
                      type="number"
                      step="any"
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
                      value={metric.unit || ""}
                      onChange={(e) => {
                        const newData = [...extractedData];
                        newData[index].unit = e.target.value;
                        setExtractedData(newData);
                      }}
                      data-testid={`input-metric-unit-${index}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`min-${index}`}>Мін. норма</Label>
                    <Input
                      id={`min-${index}`}
                      type="number"
                      step="any"
                      value={metric.referenceMin ?? ''}
                      onChange={(e) => {
                        const newData = [...extractedData];
                        newData[index].referenceMin = e.target.value ? parseFloat(e.target.value) : null;
                        setExtractedData(newData);
                      }}
                      placeholder="мін"
                      data-testid={`input-metric-min-${index}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`max-${index}`}>Макс. норма</Label>
                    <Input
                      id={`max-${index}`}
                      type="number"
                      step="any"
                      value={metric.referenceMax ?? ''}
                      onChange={(e) => {
                        const newData = [...extractedData];
                        newData[index].referenceMax = e.target.value ? parseFloat(e.target.value) : null;
                        setExtractedData(newData);
                      }}
                      placeholder="макс"
                      data-testid={`input-metric-max-${index}`}
                    />
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full bg-destructive/10 hover:bg-destructive/20"
                      onClick={() => handleRemoveMetric(index)}
                      data-testid={`button-remove-metric-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={handleResetOCR}
              disabled={saveMutation.isPending}
              data-testid="button-reset-ocr"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Розпізнати знову
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
