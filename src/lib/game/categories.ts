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
import { CUSTOM_PREFIX, getCustomCategories, getCustomCategory } from "./custom-categories";

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  /** Visual identity — never the only signal, always paired with icon + label. */
  emoji: string;
  comingSoon?: boolean;
  isCustom?: boolean;
}

/** Built-in, data-driven categories. Adding one = add data, not logic. */
export const CATEGORIES: Category[] = [
  { id: "fruits", name: "Fruits", description: "Mango, guava and friends.", icon: Apple, emoji: "🍎" },
  { id: "cars", name: "Cars", description: "From hatchbacks to hypercars.", icon: Car, emoji: "🚗" },
  { id: "bikes", name: "Bikes", description: "Two wheels, full throttle.", icon: Bike, emoji: "🏍️" },
  { id: "animals", name: "Animals", description: "Wild, tame and everything between.", icon: PawPrint, emoji: "🐯" },
  { id: "birds", name: "Birds", description: "Feathers, beaks and flight.", icon: Bird, emoji: "🦜" },
  { id: "vegetables", name: "Vegetables", description: "Straight from the garden.", icon: Carrot, emoji: "🥕" },
  { id: "sports", name: "Sports", description: "Games, leagues and legends.", icon: Trophy, emoji: "🏏" },
  { id: "countries", name: "Countries", description: "Travel the map from home.", icon: Globe2, emoji: "🌍" },
  { id: "movies", name: "Movies", description: "Blockbusters and classics.", icon: Clapperboard, emoji: "🎬" },
  { id: "personalities", name: "Famous Personalities", description: "Icons everyone knows.", icon: Star, emoji: "⭐" },
];

/** Saved custom categories, presented in exactly the same shape. */
export function customCategoryOptions(): Category[] {
  return getCustomCategories().map((c) => ({
    id: `${CUSTOM_PREFIX}${c.id}`,
    name: c.name,
    description: c.description || `${c.names.length} chit names · yours`,
    icon: Wand2,
    emoji: c.emoji || "✨",
    isCustom: true,
  }));
}

export const getCategory = (id: string): Category | undefined => {
  if (id.startsWith(CUSTOM_PREFIX)) {
    const custom = getCustomCategory(id);
    if (!custom) return undefined;
    return {
      id,
      name: custom.name,
      description: custom.description || "Your custom category.",
      icon: Wand2,
      emoji: custom.emoji || "✨",
      isCustom: true,
    };
  }
  return CATEGORIES.find((c) => c.id === id);
};

export const isCustomCategoryId = (id: string) => id.startsWith(CUSTOM_PREFIX);
