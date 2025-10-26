import { PetCard } from "../PetCard";

export default function PetCardExample() {
  return (
    <div className="space-y-4 max-w-md">
      <PetCard
        id="1"
        name="Барсик"
        species="Cat"
        breed="Британська короткошерста"
        age="3 роки"
        weight={5.2}
        lastCheckup="15.09.2025"
        onClick={() => console.log("Pet card clicked")}
      />
      <PetCard
        id="2"
        name="Рекс"
        species="Dog"
        breed="Німецька вівчарка"
        age="5 років"
        weight={32}
        lastCheckup="01.10.2025"
        onClick={() => console.log("Pet card clicked")}
      />
    </div>
  );
}
