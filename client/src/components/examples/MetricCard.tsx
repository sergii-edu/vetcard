import { MetricCard } from "../MetricCard";

export default function MetricCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
      <MetricCard
        name="Вага"
        value={5.2}
        unit="кг"
        referenceRange="4.5-6.0 кг"
        status="normal"
        trend="stable"
        date="09.10.2025"
      />
      <MetricCard
        name="Глюкоза"
        value={7.8}
        unit="ммоль/л"
        referenceRange="3.3-6.1 ммоль/л"
        status="warning"
        trend="up"
        date="08.10.2025"
      />
      <MetricCard
        name="Гемоглобін"
        value={95}
        unit="г/л"
        referenceRange="110-180 г/л"
        status="critical"
        trend="down"
        date="08.10.2025"
      />
    </div>
  );
}
