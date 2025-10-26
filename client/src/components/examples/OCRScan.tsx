import OCRScan from "../../pages/OCRScan";
import { ThemeProvider } from "../ThemeProvider";

export default function OCRScanExample() {
  return (
    <ThemeProvider>
      <div className="p-6 bg-background min-h-screen">
        <OCRScan />
      </div>
    </ThemeProvider>
  );
}
