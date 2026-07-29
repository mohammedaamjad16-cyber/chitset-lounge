import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { Plus, Users, Lock, Globe, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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

const schema = z.object({
  hostName: z.string().trim().min(2, "At least 2 characters").max(24, "Max 24 characters"),
  roomName: z.string().trim().min(2, "At least 2 characters").max(32, "Max 32 characters"),
  maxPlayers: z.enum(["2", "3", "4"]),
  category: z.enum(["casual", "friends", "family", "competitive"]),
  visibility: z.enum(["public", "private"]),
  gameMode: z.enum(["classic", "blitz", "tournament"]),
});

type FormState = z.infer<typeof schema>;
type Errors = Partial<Record<keyof FormState, string>>;

const initial: FormState = {
  hostName: "",
  roomName: "",
  maxPlayers: "4",
  category: "casual",
  visibility: "private",
  gameMode: "classic",
};

function CreateRoom() {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const navigate = useNavigate();

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
        const key = issue.path[0] as keyof FormState;
        errs[key] = issue.message;
      }
      setErrors(errs);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    toast.success(`Room "${form.roomName}" ready. Gameplay coming soon!`);
    // Placeholder: future navigation to lobby
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Plus className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Create a Room</h1>
          <p className="mt-2 text-muted-foreground">Set the table. Invite your friends. Start when you're ready.</p>
        </div>

        <GlassCard className="p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <Field label="Host Name" error={errors.hostName}>
              <Input
                value={form.hostName}
                onChange={(e) => set("hostName", e.target.value)}
                placeholder="e.g. Aditi"
                maxLength={24}
              />
            </Field>

            <Field label="Room Name" error={errors.roomName}>
              <Input
                value={form.roomName}
                onChange={(e) => set("roomName", e.target.value)}
                placeholder="e.g. Sunday Night Squad"
                maxLength={32}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Maximum Players" error={errors.maxPlayers}>
                <Select value={form.maxPlayers} onValueChange={(v) => set("maxPlayers", v as FormState["maxPlayers"])}>
                  <SelectTrigger>
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 players</SelectItem>
                    <SelectItem value="3">3 players</SelectItem>
                    <SelectItem value="4">4 players</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Category" error={errors.category}>
                <Select value={form.category} onValueChange={(v) => set("category", v as FormState["category"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friends">Friends</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="competitive">Competitive</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

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
              <div className="grid gap-2 sm:grid-cols-3">
                <ModeOption title="Classic" desc="The original 4 Chit rules." active={form.gameMode === "classic"} onClick={() => set("gameMode", "classic")} />
                <ModeOption title="Blitz" desc="Faster rounds, shorter timer." disabled />
                <ModeOption title="Tournament" desc="Bracket-style multi-round." disabled />
              </div>
            </Field>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setForm(initial)}>
                Reset
              </Button>
              <Button type="submit" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
                <Sparkles className="mr-1.5 h-4 w-4" /> Create Room
              </Button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">{error}</p>
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
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
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
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{title}</span>
        {disabled && <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}
