import { VetRecordCard } from "../VetRecordCard";

export default function VetRecordCardExample() {
  return (
    <div className="space-y-4 max-w-2xl">
      <VetRecordCard
        id="1"
        date="05.10.2025"
        type="Checkup"
        vetName="Др. Коваленко О.М."
        diagnosis="Профілактичний огляд"
        treatment="Рекомендовано продовжити дієту"
        notes="Загальний стан задовільний"
      />
      <VetRecordCard
        id="2"
        date="15.09.2025"
        type="Vaccination"
        vetName="Др. Петренко І.В."
        diagnosis="Планова вакцинація"
        treatment="Вакцина проти сказу (Nobivac Rabies)"
      />
    </div>
  );
}
