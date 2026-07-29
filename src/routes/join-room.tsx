import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { LogIn, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/join-room")({
  head: () => ({
    meta: [
      { title: "Join a Room — ChitSet" },
      { name: "description", content: "Enter a room code and your name to jump into a ChitSet match with friends." },
      { property: "og:title", content: "Join a ChitSet Room" },
      { property: "og:description", content: "Enter a room code to jump into a match." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JoinRoom,
});

const schema = z.object({
  playerName: z.string().trim().min(2, "At least 2 characters").max(24, "Max 24 characters"),
  roomCode: z.string().trim().min(4, "At least 4 characters").max(10, "Max 10 characters").regex(/^[A-Za-z0-9-]+$/, "Letters, numbers, and dashes only"),
});

type FormState = z.infer<typeof schema>;
type Errors = Partial<Record<keyof FormState, string>>;

function JoinRoom() {
  const [form, setForm] = useState<FormState>({ playerName: "", roomCode: "" });
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
      for (const issue of parsed.error.issues) errs[issue.path[0] as keyof FormState] = issue.message;
      setErrors(errs);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    toast.success(`Looking for room ${form.roomCode.toUpperCase()}...`);
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-accent text-primary-foreground shadow-glow">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Join a Room</h1>
          <p className="mt-2 text-muted-foreground">Got a room code from a friend? Drop it in.</p>
        </div>

        <GlassCard className="p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input
                value={form.playerName}
                onChange={(e) => set("playerName", e.target.value)}
                placeholder="e.g. Rahul"
                maxLength={24}
              />
              {errors.playerName && <p className="text-xs text-destructive">{errors.playerName}</p>}
            </div>
            <div className="space-y-2">
              <Label>Room Code</Label>
              <Input
                value={form.roomCode}
                onChange={(e) => set("roomCode", e.target.value.toUpperCase())}
                placeholder="e.g. CH1T-42"
                maxLength={10}
                className="font-display tracking-widest"
              />
              {errors.roomCode && <p className="text-xs text-destructive">{errors.roomCode}</p>}
            </div>
            <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
              <Sparkles className="mr-1.5 h-4 w-4" /> Join Room
            </Button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
