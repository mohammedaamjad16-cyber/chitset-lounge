import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { LogIn, UserPlus, Mail, KeyRound, User as UserIcon, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ButtonLoader } from "@/components/shared/loaders";
import { notify } from "@/lib/notify";
import { useAuth } from "@/lib/auth/auth-context";

export const Route = createFileRoute("/auth")({
  // Invite flows land here as /auth?code=XXXX so sign-in can resume the join.
  // Create-room also gates guests through auth via /auth?returnTo=/create-room.
  validateSearch: (search: Record<string, unknown>): { code?: string; returnTo?: string } => ({
    code: typeof search.code === "string" ? search.code : undefined,
    returnTo: typeof search.returnTo === "string" ? search.returnTo : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or create an account — ChitSet" },
      {
        name: "description",
        content:
          "Sign in to ChitSet to save your stats, add friends, unlock achievements and climb the global leaderboard.",
      },
      { property: "og:title", content: "Sign in to ChitSet" },
      { property: "og:description", content: "Save stats, add friends and climb the ChitSet leaderboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "At least 8 characters").max(72);
const usernameSchema = z
  .string()
  .trim()
  .min(3, "At least 3 characters")
  .max(20, "Max 20 characters")
  .regex(/^[a-zA-Z0-9_ ]+$/, "Letters, numbers, spaces and underscores only");

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { code: invitedCode, returnTo } = Route.useSearch();
  const { session, signInWithEmail, signUpWithEmail, signInWithGoogle, guestName, setGuestName } = useAuth();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  // After signing in, resume an invited join or return to the requested page.
  const afterAuthNavigate = useCallback(() => {
    if (returnTo) void navigate({ to: returnTo });
    else if (invitedCode) void navigate({ to: "/join-room", search: { code: invitedCode } });
    else void navigate({ to: "/profile", replace: true });
  }, [returnTo, invitedCode, navigate]);

  useEffect(() => {
    if (session) afterAuthNavigate();
  }, [session, afterAuthNavigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) return setError(emailResult.error.issues[0].message);
    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) return setError(passResult.error.issues[0].message);

    setBusy("email");
    try {
      if (tab === "signup") {
        const nameResult = usernameSchema.safeParse(username);
        if (!nameResult.success) {
          setBusy(null);
          return setError(nameResult.error.issues[0].message);
        }
        const signedIn = await signUpWithEmail(emailResult.data, password, nameResult.data);
        if (signedIn) {
          notify.success("Welcome to ChitSet!");
          afterAuthNavigate();
        } else {
          setConfirmSent(true);
          notify.info("Check your email to confirm your account.");
        }
      } else {
        await signInWithEmail(emailResult.data, password);
        notify.success("Signed in");
        afterAuthNavigate();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(null);
    }
  }

  async function handleGoogle() {
    setBusy("google");
    try {
      await signInWithGoogle();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12 sm:py-20">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <GlassCard className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Your ChitSet account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Save stats, add friends, unlock achievements — or keep playing as a guest.
            </p>
          </div>

          {confirmSent ? (
            <div className="rounded-2xl border border-border bg-muted/40 p-5 text-center">
              <Mail className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-sm font-medium">Confirm your email</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Open it to
                activate your account, then sign in.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => { setConfirmSent(false); setTab("signin"); }}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <TabsContent value="signup" className="m-0 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <div className="relative">
                        <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="username"
                          className="pl-9"
                          placeholder="chitmaster"
                          value={username}
                          maxLength={20}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        className="pl-9"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        autoComplete={tab === "signup" ? "new-password" : "current-password"}
                        className="pl-9"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-glow" disabled={busy !== null}>
                    {busy === "email" ? (
                      <ButtonLoader label={tab === "signup" ? "Creating account…" : "Signing in…"} />
                    ) : (
                      <>
                        {tab === "signup" ? (
                          <UserPlus className="mr-2 h-4 w-4" />
                        ) : (
                          <LogIn className="mr-2 h-4 w-4" />
                        )}
                        {tab === "signup" ? "Create account" : "Sign in"}
                      </>
                    )}
                  </Button>
                </form>
              </Tabs>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy !== null}>
                {busy === "google" ? (
                  <ButtonLoader label="Connecting…" />
                ) : (
                  <>
                    <span className="mr-2"><GoogleMark /></span>
                    Continue with Google
                  </>
                )}
              </Button>
            </>
          )}

          <div className="mt-6 rounded-2xl border border-dashed border-border p-4">
            <p className="text-sm font-medium">Play as a guest</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No account needed. Stats, friends and achievements stay off until you sign in.
            </p>
            <div className="mt-3 flex gap-2">
              <Input
                aria-label="Guest name"
                value={guestName}
                maxLength={24}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Guest name"
              />
              <Button asChild variant="secondary">
                <Link to="/create-room">Play</Link>
              </Button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
