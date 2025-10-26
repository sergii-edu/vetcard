import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dog, Cat, Bird } from "lucide-react";

interface PetCardProps {
  id: string;
  name: string;
  species: "Dog" | "Cat" | "Bird" | "Reptile" | "Rodent" | "Horse" | "Other";
  breed: string;
  age: string;
  imageUrl?: string;
  weight?: number;
  lastCheckup?: string;
  onClick?: () => void;
}

const speciesIcons = {
  Dog: Dog,
  Cat: Cat,
  Bird: Bird,
  Reptile: Dog,
  Rodent: Dog,
  Horse: Dog,
  Other: Dog,
};

export function PetCard({
  id,
  name,
  species,
  breed,
  age,
  imageUrl,
  weight,
  lastCheckup,
  onClick,
}: PetCardProps) {
  const SpeciesIcon = speciesIcons[species];

  return (
    <Card
      className="p-4 hover-elevate active-elevate-2 cursor-pointer"
      onClick={onClick}
      data-testid={`card-pet-${id}`}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={imageUrl} alt={name} />
          <AvatarFallback>
            <SpeciesIcon className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base truncate" data-testid={`text-pet-name-${id}`}>
              {name}
            </h3>
            <Badge variant="secondary" className="text-xs">{species}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{breed}</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>{age}</span>
            {weight && <span className="font-mono">{weight} кг</span>}
          </div>
          {lastCheckup && (
            <p className="text-xs text-muted-foreground mt-2">
              Останній огляд: {lastCheckup}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
