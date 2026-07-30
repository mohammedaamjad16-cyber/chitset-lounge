import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LogIn, LogOut, Pencil, Trophy } from "lucide-react";
import { Section, SectionHeader } from "@/components/shared/section";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AvatarPicker } from "@/components/profile/avatar-picker";
import { XpBar } from "@/components/profile/xp-bar";
import { StatCards } from "@/components/profile/stat-cards";
import { useAuth } from "@/lib/auth/auth-context";
import { useStats, useRecentMatches, useAchievements, useUnlockedAchievements, useUpdateProfile } from "@/lib/profile/queries";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — ChitSet" },
      { name: "description", content: "View your ChitSet stats, level, recent matches, and achievements." },
      { property: "og:title", content: "Your ChitSet Profile" },
      { property: "og:description", content: "Track your stats, level, and match history." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { loading, user, profile, signOut } = useAuth();

  if (loading) {
    return (
      <Section>
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center text-muted-foreground">
          Loading your profile…
        </div>
      </Section>
    );
  }

  if (!user || !profile) {
    return (
      <Section>
        <GlassCard className="mx-auto flex max-w-md flex-col items-center gap-4 p-10 text-center">
          <LogIn className="h-10 w-10 text-primary" />
          <h2 className="text-xl font-semibold">Sign in to see your profile</h2>
          <p className="text-sm text-muted-foreground">
            Track your stats, level up, and unlock achievements by signing in.
          </p>
          <Button asChild className="mt-2">
            <Link to="/auth">Go to sign in</Link>
          </Button>
        </GlassCard>
      </Section>
    );
  }

  return <SignedInProfile userId={user.id} profile={profile} signOut={signOut} />;
}

function SignedInProfile({
  userId,
  profile,
  signOut,
}: {
  userId: string;
  profile: NonNullable<ReturnType<typeof useAuth>["profile"]>;
  signOut: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const { data: stats } = useStats(userId);
  const { data: recentMatches } = useRecentMatches(userId, 6);
  const { data: achievements } = useAchievements();
  const { data: unlocked } = useUnlockedAchievements(userId);
  const unlockedCodes = new Set((unlocked ?? []).map((u) => u.code));

  const handleSignOut = async () => {
    await signOut();
    notify.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <Section>
      <SectionHeader eyebrow="Profile" title="Your ChitSet profile" align="left" />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <GlassCard className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary text-4xl shadow-glow">
              {profile.avatar_emoji}
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile.username}</h2>
              {profile.bio && <p className="mt-1 text-sm text-muted-foreground">{profile.bio}</p>}
            </div>
            <XpBar xp={profile.xp} />
            <EditProfileDialog profile={profile} />
            <Button variant="ghost" className="mt-2 w-full gap-2 text-muted-foreground" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </GlassCard>
        </motion.div>

        <div className="flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <StatCards stats={stats} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent matches</h3>
              </div>
              {!recentMatches || recentMatches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matches played yet — jump into a room to get started.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {recentMatches.map((m) => (
                    <li
                      key={`${m.match_id}`}
                      className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3 text-sm"
                    >
                      <span className="font-medium">{m.is_winner ? "🏆 Win" : "Loss"}</span>
                      <span className="text-muted-foreground">+{m.xp_awarded} XP</span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Achievements</h3>
                <Link to="/achievements" className="text-sm font-medium text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="flex flex-wrap gap-3">
                {(achievements ?? []).slice(0, 8).map((a) => {
                  const isUnlocked = unlockedCodes.has(a.code);
                  return (
                    <div
                      key={a.code}
                      title={a.title}
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl ${
                        isUnlocked ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-muted/40 opacity-40 grayscale"
                      }`}
                    >
                      <Trophy className="h-6 w-6" />
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

function EditProfileDialog({ profile }: { profile: { username: string; avatar_emoji: string; bio: string | null } }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [avatar, setAvatar] = useState(profile.avatar_emoji);
  const [bio, setBio] = useState(profile.bio ?? "");
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    if (open) {
      setUsername(profile.username);
      setAvatar(profile.avatar_emoji);
      setBio(profile.bio ?? "");
    }
  }, [open, profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ username: username.trim(), avatar_emoji: avatar, bio: bio.trim() || null });
      notify.success("Profile updated");
      setOpen(false);
    } catch (err) {
      notify.error("Couldn't update profile", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Pencil className="h-4 w-4" /> Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <Label className="mb-2 block">Avatar</Label>
            <AvatarPicker value={avatar} onChange={setAvatar} />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={24} />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={140} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateProfile.isPending || username.trim().length < 2}>
            {updateProfile.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
