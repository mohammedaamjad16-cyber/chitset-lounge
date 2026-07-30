import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { Plus, Users, Lock, Globe, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CategoryGrid } from "@/components/room/category-grid";
import { ButtonLoader } from "@/components/shared/loaders";
import { notify } from "@/lib/notify";
import { createRoom, setMeId } from "@/lib/game/room-store";
import { CATEGORIES } from "@/lib/game/categories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/create-room")({
  head: () => ({
    meta: [
      { title: "Create a Room — ChitSet" },
      { name: "description", content: "Set up a private ChitSet room. Choose players, category, and mode, then invite your friends." },
      { property: "og:title", content: "Create a ChitSet Room" },
      { property: "og:description", content: "Set up a private room and invite your friends." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateRoom,
});

const selectableCategories = CATEGORIES.filter((c) => !c.comingSoon).map((c) => c.id) as [
  string,
  ...string[],
];

const schema = z.object({
  hostName: z.string().trim().min(2, "At least 2 characters").max(24, "Max 24 characters"),
  roomName: z.string().trim().min(2, "At least 2 characters").max(32, "Max 32 characters"),
  maxPlayers: z.enum(["2", "3", "4", "5", "6", "7", "8"]),
  categoryId: z.enum(selectableCategories),
  visibility: z.enum(["public", "private"]),
  gameMode: z.enum(["classic"]),
});

type FormState = z.infer<typeof schema>;
type Errors = Partial<Record<keyof FormState, string>>;

const initial: FormState = {
  hostName: "",
  roomName: "",
  maxPlayers: "4",
  categoryId: "fruits",
  visibility: "private",
  gameMode: "classic",
};

function CreateRoom() {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const isValid = useMemo(() => schema.safeParse(form).success, [form]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    const result = schema.shape[k].safeParse(v);
    setErrors((e) => ({ ...e, [k]: result.success ? undefined : result.error.issues[0]?.message }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const issue of parsed.error.issues) {
        errs[issue.path[0] as keyof FormState] = issue.message;
      }
      setErrors(errs);
      notify.error("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const room = createRoom({
        hostName: form.hostName.trim(),
        roomName: form.roomName.trim(),
        maxPlayers: Number(form.maxPlayers),
        categoryId: form.categoryId,
        visibility: form.visibility,
        gameMode: "classic",
      });
      setMeId(room.hostId);
      setSubmitting(false);
      notify.success("Room created", `Room code ${room.code} is ready to share.`);
      navigate({ to: "/lobby" });
    }, 900);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Plus className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Create a Room</h1>
          <p className="mt-2 text-muted-foreground">Set the table. Invite your friends. Start when you're ready.</p>
        </div>

        <GlassCard className="p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <Field label="Host Name" htmlFor="hostName" error={errors.hostName}>
              <Input
                id="hostName"
                className="min-h-11"
                value={form.hostName}
                onChange={(e) => set("hostName", e.target.value)}
                placeholder="e.g. Aditi"
                maxLength={24}
                aria-invalid={!!errors.hostName}
                aria-describedby={errors.hostName ? "hostName-error" : undefined}
              />
            </Field>

            <Field label="Room Name" htmlFor="roomName" error={errors.roomName}>
              <Input
                id="roomName"
                className="min-h-11"
                value={form.roomName}
                onChange={(e) => set("roomName", e.target.value)}
                placeholder="e.g. Sunday Night Squad"
                maxLength={32}
                aria-invalid={!!errors.roomName}
                aria-describedby={errors.roomName ? "roomName-error" : undefined}
              />
            </Field>

            <Field label="Maximum Players" htmlFor="maxPlayers" error={errors.maxPlayers}>
              <Select value={form.maxPlayers} onValueChange={(v) => set("maxPlayers", v as FormState["maxPlayers"])}>
                <SelectTrigger id="maxPlayers" className="min-h-11">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} players
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Category" error={errors.categoryId}>
              <CategoryGrid value={form.categoryId} onChange={(id) => set("categoryId", id as FormState["categoryId"])} />
            </Field>

            <Field label="Visibility">
              <RadioGroup
                value={form.visibility}
                onValueChange={(v) => set("visibility", v as FormState["visibility"])}
                className="grid gap-2 sm:grid-cols-2"
              >
                <VisibilityOption id="v-private" value="private" active={form.visibility === "private"} icon={Lock} title="Private" desc="Only players with the code." />
                <VisibilityOption id="v-public" value="public" active={form.visibility === "public"} icon={Globe} title="Public" desc="Anyone can discover and join." />
              </RadioGroup>
            </Field>

            <Field label="Game Mode">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <ModeOption title="Classic" desc="The original 4 Chit rules." active onClick={() => set("gameMode", "classic")} />
                <ModeOption title="Team Mode" desc="Play in paired squads." disabled />
                <ModeOption title="Tournament" desc="Bracket-style multi-round." disabled />
                <ModeOption title="Ranked" desc="Climb the global ladder." disabled />
              </div>
            </Field>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="min-h-11" onClick={() => { setForm(initial); setErrors({}); }}>
                Reset
              </Button>
              <Button
                type="submit"
                disabled={!isValid || submitting}
                className="min-h-11 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
              >
                {submitting ? (
                  <ButtonLoader label="Creating Room..." />
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-4 w-4" /> Create Room
                  </>
                )}
              </Button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {error && (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function VisibilityOption({
  id, value, active, icon: Icon, title, desc,
}: { id: string; value: string; active: boolean; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
      )}
    >
      <RadioGroupItem id={id} value={value} className="mt-1" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4" /> {title}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </label>
  );
}

function ModeOption({
  title, desc, active, disabled, onClick,
}: { title: string; desc: string; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative rounded-xl border p-3 text-left transition-all",
        active && "border-primary bg-primary/5 shadow-soft",
        !active && !disabled && "border-border hover:bg-muted/50",
        disabled && "cursor-not-allowed border-border/60 opacity-70",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        {disabled && <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}
