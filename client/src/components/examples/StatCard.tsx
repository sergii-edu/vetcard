import { StatCard } from "../StatCard";
import { Heart, Calendar, AlertTriangle, Activity } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Всього тварин"
        value={12}
        icon={Heart}
        trend={{ value: "+2", isPositive: true }}
      />
      <StatCard
        title="Вакцинації"
        value={3}
        icon={Calendar}
        description="Наступні 30 днів"
      />
      <StatCard
        title="Активні алерти"
        value={2}
        icon={AlertTriangle}
      />
      <StatCard
        title="Візити цього місяця"
        value={8}
        icon={Activity}
        trend={{ value: "+3", isPositive: true }}
      />
    </div>
  );
}
