import {
  Home,
  Heart,
  FileText,
  Syringe,
  Activity,
  ScanLine,
  Settings,
  Plus,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useLocation } from "wouter";

const menuItems = [
  {
    title: "Дашборд",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Мої тварини",
    url: "/pets",
    icon: Heart,
  },
  {
    title: "Записи",
    url: "/records",
    icon: FileText,
  },
  {
    title: "Вакцинації",
    url: "/vaccinations",
    icon: Syringe,
  },
  {
    title: "Метрики здоров'я",
    url: "/health-metrics",
    icon: Activity,
  },
  {
    title: "OCR Сканування",
    url: "/ocr",
    icon: ScanLine,
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-md">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg">VetCard</h2>
            <p className="text-xs text-muted-foreground">Медична карта</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Навігація</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <a href={item.url} onClick={(e) => {
                      e.preventDefault();
                      setLocation(item.url);
                    }}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Швидкі дії</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/pets/add" onClick={(e) => {
                    e.preventDefault();
                    setLocation("/pets/add");
                  }}>
                    <Plus />
                    <span>Додати тварину</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/settings" onClick={(e) => {
                e.preventDefault();
                setLocation("/settings");
              }}>
                <Settings />
                <span>Налаштування</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
