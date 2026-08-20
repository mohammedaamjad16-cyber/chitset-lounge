import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { playCue } from "@/lib/audio/audio-manager";
import {
  CUSTOM_PREFIX,
  MAX_CATEGORY_NAME_LEN,
  MAX_NAMES,
  MAX_NAME_LEN,
  getCustomCategory,
  isCustomCategoryValid,
  saveCustomCategory,
  validateCustomCategory,
  type CustomCategory,
} from "@/lib/game/custom-categories";
import { CHITS_PER_PLAYER } from "@/lib/game/engine";
import { notify } from "@/lib/notify";

const EMOJI_CHOICES = ["✨", "🦸", "🎮", "🎵", "🍔", "🏙️", "📚", "🐉"];

interface CustomCategoryDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Unique names must equal the player count. */
  playerCount: number;
  editId?: string | null;
  onSaved?: (categoryId: string) => void;
}

export function CustomCategoryDialog({
  open,
  onOpenChange,
  playerCount,
  editId,
  onSaved,
}: CustomCategoryDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [names, setNames] = useState<string[]>(() => Array.from({ length: playerCount }, () => ""));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    const existing: CustomCategory | null = editId ? getCustomCategory(editId) : null;
    if (existing) {
      setName(existing.name);
      setDescription(existing.description);
      setEmoji(existing.emoji || "✨");
      setNames(
        Array.from({ length: Math.max(playerCount, existing.names.length) }, (_, i) => existing.names[i] ?? ""),
      );
    } else {
      setName("");
      setDescription("");
      setEmoji("✨");
      setNames(Array.from({ length: playerCount }, () => ""));
    }
  }, [open, editId, playerCount]);

  const draft = useMemo(() => ({ name, description, emoji, names }), [name, description, emoji, names]);
  const errors = useMemo(() => validateCustomCategory(draft, playerCount), [draft, playerCount]);
  const valid = isCustomCategoryValid(errors);
  const filled = names.filter((n) => n.trim());

  const setNameAt = (i: number, value: string) =>
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));

  const addName = () => {
    if (names.length >= MAX_NAMES) return;
    playCue("select");
    setNames((prev) => [...prev, ""]);
  };

  const removeName = (i: number) => {
    playCue("click");
    setNames((prev) => prev.filter((_, idx) => idx !== i));
  };

  const save = () => {
    setTouched(true);
    if (!valid) {
      playCue("error");
      return;
    }
    const saved = saveCustomCategory(
      { name, description, emoji, names: names.map((n) => n.trim()).filter(Boolean) },
      editId ?? undefined,
    );
    playCue("achievement");
    notify.success(editId ? "Category updated" : "Category saved", `${saved.name} is ready to play.`);
    onSaved?.(`${CUSTOM_PREFIX}${saved.id}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Wand2 className="h-4 w-4 text-primary" />
            {editId ? "Edit custom category" : "New custom category"}
          </DialogTitle>
          <DialogDescription>
            Every unique name becomes one full set of {CHITS_PER_PLAYER} chits. This room needs exactly{" "}
            {playerCount} unique names ({playerCount * CHITS_PER_PLAYER} chits in total).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="cc-name">Category name</Label>
              <Input
                id="cc-name"
                className="min-h-11"
                value={name}
                maxLength={MAX_CATEGORY_NAME_LEN}
                placeholder="e.g. Superheroes"
                onChange={(e) => setName(e.target.value)}
                aria-invalid={touched && !!errors.name}
                aria-describedby={errors.name ? "cc-name-error" : undefined}
              />
              {touched && errors.name && (
                <p id="cc-name-error" role="alert" className="text-xs text-destructive">
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Category icon">
                {EMOJI_CHOICES.map((e) => (
                  <motion.button
                    key={e}
                    type="button"
                    role="radio"
                    aria-checked={emoji === e}
                    aria-label={`Icon ${e}`}
                    onClick={() => {
                      playCue("select");
                      setEmoji(e);
                    }}
                    whileTap={{ scale: 0.9 }}
                    animate={{ scale: emoji === e ? 1.08 : 1 }}
                    transition={{ type: "spring", stiffness: 460, damping: 18 }}
                    className={`grid h-11 w-11 place-items-center rounded-xl border text-lg ${
                      emoji === e ? "border-primary bg-primary/10 shadow-glow" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    {e}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc-desc">Description (optional)</Label>
            <Input
              id="cc-desc"
              className="min-h-11"
              value={description}
              maxLength={60}
              placeholder="Marvel movie night picks"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Chit names</Label>
              <Badge variant={filled.length === playerCount ? "default" : "secondary"} className="text-[10px]">
                {filled.length}/{playerCount} names
              </Badge>
            </div>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {names.map((value, i) => (
                  <motion.div
                    key={i}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        className="min-h-11"
                        value={value}
                        maxLength={MAX_NAME_LEN}
                        placeholder={`Name ${i + 1}`}
                        aria-label={`Chit name ${i + 1}`}
                        aria-invalid={touched && !!errors.perName[i]}
                        onChange={(e) => setNameAt(i, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="min-h-11 min-w-11"
                        aria-label={`Remove chit name ${i + 1}`}
                        onClick={() => removeName(i)}
                        disabled={names.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {touched && errors.perName[i] && (
                      <p role="alert" className="text-xs text-destructive">
                        {errors.perName[i]}
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full"
              onClick={addName}
              disabled={names.length >= MAX_NAMES}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add name
            </Button>
            {touched && errors.names && (
              <p role="alert" className="text-xs text-destructive">
                {errors.names}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
            <p className="mt-1 font-display text-sm font-semibold">
              <span aria-hidden="true">{emoji} </span>
              {name || "Untitled category"}
            </p>
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {filled.length === 0 ? (
                <li className="text-xs text-muted-foreground">Add names to see the chit breakdown.</li>
              ) : (
                filled.map((n) => (
                  <li key={n} className="text-xs text-muted-foreground">
                    <span aria-hidden="true">{emoji} </span>
                    {n.trim()} ×{CHITS_PER_PLAYER}
                  </li>
                ))
              )}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Total chits: {filled.length * CHITS_PER_PLAYER}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="min-h-11 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
            onClick={save}
          >
            {editId ? "Save changes" : "Save category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
