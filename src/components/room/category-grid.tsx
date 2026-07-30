import { memo } from "react";
import { CATEGORIES } from "@/lib/game/categories";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryGridProps {
  value: string;
  onChange: (id: string) => void;
}

export const CategoryGrid = memo(function CategoryGrid({ value, onChange }: CategoryGridProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Category"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const selected = value === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={cat.name}
            disabled={cat.comingSoon}
            onClick={() => onChange(cat.id)}
            className={cn(
              "group relative min-h-[92px] rounded-2xl border p-3 text-left transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected
                ? "border-primary bg-primary/5 shadow-glow"
                : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/50",
              cat.comingSoon && "cursor-not-allowed opacity-60 hover:translate-y-0",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors",
                  selected
                    ? "bg-gradient-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:text-foreground",
                )}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 truncate text-sm font-semibold">{cat.name}</span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{cat.description}</p>
            {cat.comingSoon && (
              <Badge variant="secondary" className="mt-2 text-[10px]">
                Coming Soon
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
});
