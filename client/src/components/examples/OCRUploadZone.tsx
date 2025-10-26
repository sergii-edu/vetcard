import { useState } from "react";
import { OCRUploadZone } from "../OCRUploadZone";

export default function OCRUploadZoneExample() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (file: File) => {
    console.log("File selected:", file.name);
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <OCRUploadZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />
    </div>
  );
}
