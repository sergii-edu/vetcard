import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { login, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [userType, setUserType] = useState<"owner" | "vet">("owner");

  // Register form state
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regType, setRegType] = useState<"owner" | "vet">("owner");
  
  // Vet-specific fields
  const [licenseNumber, setLicenseNumber] = useState("");
  const [clinicId, setClinicId] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; userType: string }) => {
      const res = await apiRequest("/api/auth/login", "POST", data);
      return await res.json();
    },
    onSuccess: (data) => {
      login(data);
      toast({
        title: "Успішний вхід",
        description: `Вітаємо, ${data.firstName}!`,
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Помилка входу",
        description: error.message || "Невірний email або пароль",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = regType === "owner" ? "/api/auth/register/owner" : "/api/auth/register/vet";
      const res = await apiRequest(endpoint, "POST", data);
      return await res.json();
    },
    onSuccess: (data) => {
      login(data);
      toast({
        title: "Реєстрація успішна",
        description: `Вітаємо, ${data.firstName}!`,
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Помилка реєстрації",
        description: error.message || "Не вдалося зареєструватися",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: loginEmail, password: loginPassword, userType });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    const baseData = {
      firstName: regFirstName,
      lastName: regLastName,
      email: regEmail,
      password: regPassword,
      phone: regPhone,
      addressLine1: "Not specified",
      city: "Kyiv",
      postalCode: "00000",
    };

    if (regType === "vet") {
      registerMutation.mutate({
        ...baseData,
        licenseNumber,
        clinicId: clinicId || "default-clinic",
      });
    } else {
      registerMutation.mutate(baseData);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary/10 rounded-full mb-4">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">VetCard</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Розумна медична карта для тварин
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" data-testid="tab-login">Вхід</TabsTrigger>
            <TabsTrigger value="register" data-testid="tab-register">Реєстрація</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="vet@clinic.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  data-testid="input-login-email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Пароль</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  data-testid="input-login-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Тип користувача</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="userType"
                      value="owner"
                      checked={userType === "owner"}
                      onChange={(e) => setUserType(e.target.value as "owner" | "vet")}
                      data-testid="radio-owner"
                    />
                    <span>Власник</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="userType"
                      value="vet"
                      checked={userType === "vet"}
                      onChange={(e) => setUserType(e.target.value as "owner" | "vet")}
                      data-testid="radio-vet"
                    />
                    <span>Ветеринар</span>
                  </label>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                data-testid="button-login"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Вхід..." : "Увійти"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Реєструватися як</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="regType"
                      value="owner"
                      checked={regType === "owner"}
                      onChange={(e) => setRegType(e.target.value as "owner" | "vet")}
                      data-testid="radio-reg-owner"
                    />
                    <span>Власник</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="regType"
                      value="vet"
                      checked={regType === "vet"}
                      onChange={(e) => setRegType(e.target.value as "owner" | "vet")}
                      data-testid="radio-reg-vet"
                    />
                    <span>Ветеринар</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ім'я</Label>
                  <Input
                    id="firstName"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    data-testid="input-firstname"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Прізвище</Label>
                  <Input
                    id="lastName"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    data-testid="input-lastname"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  data-testid="input-reg-email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Пароль</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  data-testid="input-reg-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  data-testid="input-phone"
                  required
                />
              </div>
              {regType === "vet" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="license">Номер ліцензії</Label>
                    <Input
                      id="license"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      data-testid="input-license"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinic">ID клініки</Label>
                    <Input
                      id="clinic"
                      value={clinicId}
                      onChange={(e) => setClinicId(e.target.value)}
                      data-testid="input-clinic"
                      placeholder="Необов'язково"
                    />
                  </div>
                </>
              )}
              <Button 
                type="submit" 
                className="w-full" 
                data-testid="button-register"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Реєстрація..." : "Зареєструватися"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
