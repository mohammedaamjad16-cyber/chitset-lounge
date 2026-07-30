import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth/auth-context";

export type ProfileRow = Tables<"profiles">;
export type StatsRow = Tables<"player_stats">;
export type MatchRow = Tables<"matches">;
export type AchievementRow = Tables<"achievements">;

export function useProfileQuery(userId?: string | null) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useStats(userId?: string | null) {
  return useQuery({
    queryKey: ["player-stats", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stats")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useRecentMatches(userId?: string | null, limit = 10) {
  return useQuery({
    queryKey: ["recent-matches", userId, limit],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_players")
        .select("match_id, is_winner, xp_awarded, matches(*)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUnlockedAchievements(userId?: string | null) {
  return useQuery({
    queryKey: ["user-achievements", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("code, unlocked_at")
        .eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type LeaderboardScope = "xp" | "wins" | "streak";

export function useLeaderboard(scope: LeaderboardScope) {
  return useQuery({
    queryKey: ["leaderboard", scope],
    queryFn: async () => {
      if (scope === "xp") {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, avatar_emoji, level, xp")
          .order("xp", { ascending: false })
          .limit(50);
        if (error) throw error;
        return (data ?? []).map((p) => ({
          id: p.id,
          username: p.username,
          avatar_emoji: p.avatar_emoji,
          level: p.level,
          value: p.xp,
        }));
      }
      const column = scope === "wins" ? "wins" : "longest_streak";
      const { data, error } = await supabase
        .from("player_stats")
        .select(`user_id, wins, longest_streak, profiles:user_id (username, avatar_emoji, level)`)
        .order(column, { ascending: false })
        .limit(50);
      if (error) throw error;
      type Joined = {
        user_id: string;
        wins: number;
        longest_streak: number;
        profiles: { username: string; avatar_emoji: string; level: number } | null;
      };
      return ((data ?? []) as unknown as Joined[]).map((r) => ({
        id: r.user_id,
        username: r.profiles?.username ?? "Player",
        avatar_emoji: r.profiles?.avatar_emoji ?? "🎲",
        level: r.profiles?.level ?? 1,
        value: scope === "wins" ? r.wins : r.longest_streak,
      }));
    },
  });
}

export function useUpdateProfile() {
  const { user, refreshProfile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<ProfileRow, "username" | "avatar_emoji" | "bio">>) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      void qc.invalidateQueries({ queryKey: ["profile"] });
      void qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}
