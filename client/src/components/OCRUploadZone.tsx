import { useState } from "react";
import { Upload, FileText, Image, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OCRUploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
}

export function OCRUploadZone({ onFileSelect, isProcessing = false }: OCRUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <Card
      className={`p-8 text-center border-2 border-dashed transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-border"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="ocr-upload-zone"
    >
      <div className="flex flex-col items-center gap-4">
        {isProcessing ? (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Сканування документа...</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Upload className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Завантажте медичний документ</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Перетягніть файл сюди або натисніть кнопку нижче
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <Image className="h-4 w-4" />
              <span>JPG, PNG, WebP, PDF</span>
            </div>
            <label htmlFor="file-upload">
              <Button asChild data-testid="button-upload-file">
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Вибрати файл
                </span>
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFileInput}
              />
            </label>
          </>
        )}
      </div>
    </Card>
  );
}
