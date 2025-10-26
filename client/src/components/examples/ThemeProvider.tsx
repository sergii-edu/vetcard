import { ThemeProvider } from "../ThemeProvider";
import { Button } from "@/components/ui/button";

export default function ThemeProviderExample() {
  return (
    <ThemeProvider>
      <div className="p-4">
        <p className="text-foreground">Theme provider initialized</p>
      </div>
    </ThemeProvider>
  );
}
