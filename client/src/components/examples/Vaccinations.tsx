import Vaccinations from "../../pages/Vaccinations";
import { ThemeProvider } from "../ThemeProvider";

export default function VaccinationsExample() {
  return (
    <ThemeProvider>
      <div className="p-6 bg-background min-h-screen">
        <Vaccinations />
      </div>
    </ThemeProvider>
  );
}
