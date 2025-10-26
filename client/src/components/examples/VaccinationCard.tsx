import { VaccinationCard } from "../VaccinationCard";

export default function VaccinationCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
      <VaccinationCard
        id="1"
        vaccineName="Сказ"
        dateAdministered="15.09.2025"
        nextDueDate="15.09.2026"
        manufacturer="Nobivac Rabies"
        vetName="Др. Петренко І.В."
        status="completed"
      />
      <VaccinationCard
        id="2"
        vaccineName="Комплексна вакцина"
        dateAdministered="10.08.2025"
        nextDueDate="16.10.2025"
        manufacturer="Eurican DHPPI2-L"
        vetName="Др. Коваленко О.М."
        status="upcoming"
      />
    </div>
  );
}
