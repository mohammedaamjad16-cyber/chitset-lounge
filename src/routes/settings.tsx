import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Moon, Sun, Monitor, User } from "lucide-react";
import { Section, SectionHeader } from "@/components/shared/section";
import { GlassCard } from "@/components/shared/glass-card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSettings, updateSettings, PALETTES } from "@/lib/settings/settings-store";
import { useTheme } from "@/contexts/theme-context";
import { playCue } from "@/lib/audio/audio-manager";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ChitSet" },
      { name: "description", content: "Customize your ChitSet appearance, audio, and gameplay preferences." },
      { property: "og:title", content: "ChitSet Settings" },
      { property: "og:description", content: "Personalize your theme, sound, and gameplay experience." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const THEME_OPTIONS = [
  { id: "light" as const, label: "Light", icon: Sun },
  { id: "dark" as const, label: "Dark", icon: Moon },
  { id: "system" as const, label: "System", icon: Monitor },
];

function SettingsPage() {
  const settings = useSettings();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  return (
    <Section>
      <SectionHeader eyebrow="Settings" title="Make ChitSet yours" align="left" />
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <GlassCard className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Appearance</h3>
            <Label className="mb-2 block text-sm text-muted-foreground">Theme</Label>
            <div className="mb-6 grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    playCue("select");
                    setTheme(opt.id);
                  }}
                  whileTap={{ scale: 0.96 }}
                  animate={{ scale: theme === opt.id ? 1.03 : 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 18 }}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-sm transition-colors",
                    theme === opt.id ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-muted/40 hover:bg-muted",
                  )}
                >
                  <opt.icon className="h-5 w-5" />
                  {opt.label}
                </motion.button>
              ))}
            </div>

            <Label className="mb-2 block text-sm text-muted-foreground">Colour palette</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => updateSettings({ palette: p.id })}
                  className={cn(
                    "relative flex flex-col items-center gap-2 rounded-xl border p-3 transition",
                    settings.palette === p.id ? "border-primary shadow-glow" : "border-border hover:bg-muted/40",
                  )}
                >
                  {settings.palette === p.id && (
                    <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-primary" />
                  )}
                  <div className="flex gap-1">
                    {p.swatch.map((c) => (
                      <span key={c} className="h-4 w-4 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-xs font-medium">{p.name}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
          <GlassCard className="flex flex-col gap-4 p-6">
            <h3 className="text-lg font-semibold">Audio</h3>
            <SettingRow label="Sound effects" description="Play sound cues for game actions.">
              <Switch checked={settings.soundEnabled} onCheckedChange={(v) => updateSettings({ soundEnabled: v })} />
            </SettingRow>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-sm">Volume</Label>
                <span className="text-xs text-muted-foreground">{Math.round(settings.soundVolume * 100)}%</span>
              </div>
              <Slider
                value={[settings.soundVolume * 100]}
                max={100}
                step={5}
                disabled={!settings.soundEnabled}
                onValueChange={([v]) => updateSettings({ soundVolume: v / 100 })}
                onValueCommit={() => playCue("click")}
              />
            </div>
            <SettingRow label="Music" description="Background music (coming soon).">
              <Switch checked={settings.musicEnabled} onCheckedChange={(v) => updateSettings({ musicEnabled: v })} />
            </SettingRow>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
          <GlassCard className="flex flex-col gap-4 p-6">
            <h3 className="text-lg font-semibold">Gameplay</h3>
            <SettingRow label="Reduced motion" description="Minimize animations across the app.">
              <Switch checked={settings.reducedMotion} onCheckedChange={(v) => updateSettings({ reducedMotion: v })} />
            </SettingRow>
            <SettingRow label="Confirm before leaving" description="Ask for confirmation before leaving a match.">
              <Switch checked={settings.confirmLeave} onCheckedChange={(v) => updateSettings({ confirmLeave: v })} />
            </SettingRow>
            <SettingRow label="In-game chat" description="Allow chat messages during matches.">
              <Switch checked={settings.chatEnabled} onCheckedChange={(v) => updateSettings({ chatEnabled: v })} />
            </SettingRow>
            <SettingRow label="Show reactions" description="Display emoji reactions from other players.">
              <Switch checked={settings.showReactions} onCheckedChange={(v) => updateSettings({ showReactions: v })} />
            </SettingRow>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
          <GlassCard className="flex items-center justify-between gap-4 p-6">
            <div>
              <h3 className="text-lg font-semibold">Account</h3>
              <p className="text-sm text-muted-foreground">
                {user ? "Manage your profile and stats." : "Sign in to unlock profiles, stats, and achievements."}
              </p>
            </div>
            <Button asChild variant="outline" className="gap-2">
              <Link to={user ? "/profile" : "/auth"}>
                <User className="h-4 w-4" />
                {user ? "View profile" : "Sign in"}
              </Link>
            </Button>
          </GlassCard>
        </motion.div>
      </div>
    </Section>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
