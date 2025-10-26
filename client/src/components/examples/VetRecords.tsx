import VetRecords from "../../pages/VetRecords";
import { ThemeProvider } from "../ThemeProvider";

export default function VetRecordsExample() {
  return (
    <ThemeProvider>
      <div className="p-6 bg-background min-h-screen">
        <VetRecords />
      </div>
    </ThemeProvider>
  );
}
