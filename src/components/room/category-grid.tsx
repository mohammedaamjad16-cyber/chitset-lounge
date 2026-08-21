import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { CATEGORIES, customCategoryOptions, type Category } from "@/lib/game/categories";
import {
  CUSTOM_PREFIX,
  deleteCustomCategory,
  duplicateCustomCategory,
  useCustomCategories,
} from "@/lib/game/custom-categories";
import { CustomCategoryDialog } from "./custom-category-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { playCue } from "@/lib/audio/audio-manager";
import { useReducedMotionPref } from "@/hooks/use-reduced-motion";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

interface CategoryGridProps {
  value: string;
  onChange: (id: string) => void;
  /** Needed so custom categories can be validated against the room size. */
  playerCount?: number;
  /** Hide the "create your own" tile where custom play isn't offered. */
  allowCustom?: boolean;
}

export const CategoryGrid = memo(function CategoryGrid({
  value,
  onChange,
  playerCount = 4,
  allowCustom = true,
}: CategoryGridProps) {
  useCustomCategories(); // re-render when the local library changes
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const custom = allowCustom ? customCategoryOptions() : [];
  const reduced = useReducedMotionPref();

  const select = (id: string) => {
    playCue("select");
    onChange(id);
  };

  const openCreate = () => {
    setEditId(null);
    setDialogOpen(true);
  };

  return (
    <>
      <div role="radiogroup" aria-label="Category" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <CategoryTile
            key={cat.id}
            cat={cat}
            selected={value === cat.id}
            reduced={reduced}
            onSelect={() => select(cat.id)}
          />
        ))}

        {custom.map((cat) => (
          <CategoryTile
            key={cat.id}
            cat={cat}
            selected={value === cat.id}
            reduced={reduced}
            onSelect={() => select(cat.id)}
            actions={
              <div className="mt-2 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={`Edit ${cat.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditId(cat.id.slice(CUSTOM_PREFIX.length));
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={`Duplicate ${cat.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const copy = duplicateCustomCategory(cat.id.slice(CUSTOM_PREFIX.length));
                    if (copy) notify.success("Duplicated", `${copy.name} added to your categories.`);
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  aria-label={`Delete ${cat.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCustomCategory(cat.id.slice(CUSTOM_PREFIX.length));
                    if (value === cat.id) onChange(CATEGORIES[0].id);
                    notify.success("Category deleted", `${cat.name} was removed.`);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            }
          />
        ))}

        {allowCustom && (
          <motion.button
            type="button"
            onClick={openCreate}
            whileHover={reduced ? undefined : { y: -2 }}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            className="group flex min-h-[92px] flex-col items-start justify-center gap-1.5 rounded-2xl border border-dashed border-primary/50 p-3 text-left transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
              <Plus className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">Create your own</span>
            <span className="text-xs text-muted-foreground">Custom chit names for this room.</span>
          </motion.button>
        )}
      </div>

      <CustomCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        playerCount={playerCount}
        editId={editId}
        onSaved={(id) => onChange(id)}
      />
    </>
  );
});

function CategoryTile({
  cat,
  selected,
  reduced,
  onSelect,
  actions,
}: {
  cat: Category;
  selected: boolean;
  reduced: boolean;
  onSelect: () => void;
  actions?: React.ReactNode;
}) {
  const Icon = cat.icon;
  return (
    <motion.div
      animate={reduced ? {} : { scale: selected ? 1.03 : 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 20 }}
      className="relative"
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={cat.name}
        disabled={cat.comingSoon}
        onClick={onSelect}
        className={cn(
          "group relative flex min-h-[92px] w-full flex-col rounded-2xl border p-3 pb-3 text-left transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          selected
            ? "border-primary bg-primary/5 shadow-glow"
            : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/50",
          cat.comingSoon && "cursor-not-allowed opacity-60 hover:translate-y-0",
          actions && "pb-11",
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
          <span className="min-w-0 truncate text-sm font-semibold">
            <span aria-hidden="true">{cat.emoji} </span>
            {cat.name}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{cat.description}</p>
        {cat.isCustom && (
          <Badge variant="secondary" className="mt-2 w-fit text-[10px]">
            Yours
          </Badge>
        )}
        {cat.comingSoon && (
          <Badge variant="secondary" className="mt-2 w-fit text-[10px]">
            Coming Soon
          </Badge>
        )}
      </button>
      {actions && <div className="absolute bottom-1.5 right-1.5">{actions}</div>}

    </motion.div>
  );
}
