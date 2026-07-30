import {
  Apple,
  Car,
  Bike,
  PawPrint,
  Bird,
  Carrot,
  Trophy,
  Globe2,
  Clapperboard,
  Star,
  Wand2,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}

export const CATEGORIES: Category[] = [
  { id: "fruits", name: "Fruits", description: "Mango, guava and friends.", icon: Apple },
  { id: "cars", name: "Cars", description: "From hatchbacks to hypercars.", icon: Car },
  { id: "bikes", name: "Bikes", description: "Two wheels, full throttle.", icon: Bike },
  { id: "animals", name: "Animals", description: "Wild, tame and everything between.", icon: PawPrint },
  { id: "birds", name: "Birds", description: "Feathers, beaks and flight.", icon: Bird },
  { id: "vegetables", name: "Vegetables", description: "Straight from the garden.", icon: Carrot },
  { id: "sports", name: "Sports", description: "Games, leagues and legends.", icon: Trophy },
  { id: "countries", name: "Countries", description: "Travel the map from home.", icon: Globe2 },
  { id: "movies", name: "Movies", description: "Blockbusters and classics.", icon: Clapperboard },
  { id: "personalities", name: "Famous Personalities", description: "Icons everyone knows.", icon: Star },
  {
    id: "custom",
    name: "Custom Category",
    description: "Bring your own word list.",
    icon: Wand2,
    comingSoon: true,
  },
];

export const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);
