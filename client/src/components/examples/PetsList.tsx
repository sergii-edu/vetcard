import PetsList from "../../pages/PetsList";
import { ThemeProvider } from "../ThemeProvider";

export default function PetsListExample() {
  return (
    <ThemeProvider>
      <div className="p-6 bg-background min-h-screen">
        <PetsList />
      </div>
    </ThemeProvider>
  );
}
