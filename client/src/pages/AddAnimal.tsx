import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { insertAnimalSchema, type InsertAnimal } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AddAnimal() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  const form = useForm<InsertAnimal>({
    resolver: zodResolver(insertAnimalSchema),
    defaultValues: {
      ownerId: user?.id || "",
      name: "",
      species: "Dog",
      breed: "",
      dateOfBirth: undefined,
      sex: "Male",
      color: undefined,
      weightKg: undefined,
      microchipId: undefined,
      passportNumber: undefined,
      imageUrl: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertAnimal) => {
      const res = await apiRequest("/api/animals", "POST", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals/owner"] });
      toast({
        title: "Успіх",
        description: "Тварину успішно додано",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAnimal) => {
    // Convert empty strings to undefined for optional fields
    const cleanData = {
      ...data,
      ownerId: user?.id || "",
      dateOfBirth: data.dateOfBirth || undefined,
    };
    mutation.mutate(cleanData);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Додати тварину</h1>
        <p className="text-muted-foreground mt-1">Заповніть інформацію про нову тварину</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Основна інформація</CardTitle>
          <CardDescription>Введіть дані про тварину</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ім'я</FormLabel>
                    <FormControl>
                      <Input placeholder="Барсик" {...field} data-testid="input-animal-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="species"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Вид</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-species">
                          <SelectValue placeholder="Виберіть вид" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Dog">Собака</SelectItem>
                        <SelectItem value="Cat">Кіт</SelectItem>
                        <SelectItem value="Bird">Птах</SelectItem>
                        <SelectItem value="Reptile">Рептилія</SelectItem>
                        <SelectItem value="Other">Інше</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Порода</FormLabel>
                    <FormControl>
                      <Input placeholder="Британська короткошерста" {...field} data-testid="input-breed" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата народження</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-dob" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Стать</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-gender">
                          <SelectValue placeholder="Виберіть стать" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Самець</SelectItem>
                        <SelectItem value="Female">Самка</SelectItem>
                        <SelectItem value="Unknown">Невідомо</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Колір (опціонально)</FormLabel>
                    <FormControl>
                      <Input placeholder="Сірий" {...field} value={field.value ?? ""} data-testid="input-color" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Вага (кг)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        placeholder="5.2" 
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        data-testid="input-weight"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="microchipId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Мікрочіп ID (опціонально)</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789" {...field} value={field.value ?? ""} data-testid="input-microchip" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={mutation.isPending} data-testid="button-save-animal">
                  {mutation.isPending ? "Збереження..." : "Зберегти"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation("/dashboard")}
                  data-testid="button-cancel"
                >
                  Скасувати
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
