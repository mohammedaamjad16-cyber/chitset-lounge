/**
 * Progression recording: persists match results to Supabase for signed-in players,
 * updates stats/XP/level, and unlocks achievements. No-op for guests.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { levelFromXp, xpForMatch } from "@/lib/game/xp";

export interface MatchResultInput {
  roomCode: string;
  categoryId: string;
  winnerName: string;
  winnerIsMe: boolean;
  winningLabel: string;
  players: string[];
  durationMs: number;
  turns: number;
}

export interface RecordMatchResultOutcome {
  xpAwarded: number;
  newLevel: number | null;
  unlocked: string[];
}

type StatsRow = Tables<"player_stats">;
type ProfileRow = Tables<"profiles">;

/** Criteria map for achievement codes seeded in the `achievements` table. */
const ACHIEVEMENT_CRITERIA: Record<string, (ctx: { stats: StatsRow; won: boolean; durationSeconds: number }) => boolean> = {
  first_victory: ({ stats }) => stats.wins >= 1,
  ten_wins: ({ stats }) => stats.wins >= 10,
  fifty_wins: ({ stats }) => stats.wins >= 50,
  hundred_matches: ({ stats }) => stats.total_matches >= 100,
  streak_five: ({ stats }) => stats.longest_streak >= 5,
  speed_winner: ({ stats, won, durationSeconds }) => won && durationSeconds > 0 && durationSeconds < 60,
  // perfect_show / category_master depend on in-match Show mechanics and per-category
  // win tracking that isn't captured by player_stats — intentionally skipped here.
};

export async function evaluateAchievements(
  stats: StatsRow,
  _profile: ProfileRow | null,
  ctx: { won: boolean; durationSeconds: number } = { won: false, durationSeconds: 0 },
): Promise<string[]> {
  try {
    const { data: achievements, error } = await supabase.from("achievements").select("code");
    if (error) throw error;
    const codes = (achievements ?? []).map((a) => a.code);
    if (codes.length === 0) return [];

    const { data: unlockedRows } = await supabase.from("user_achievements").select("code").eq("user_id", stats.user_id);
    const alreadyUnlocked = new Set((unlockedRows ?? []).map((r) => r.code));

    const toUnlock: string[] = [];
    for (const code of codes) {
      if (alreadyUnlocked.has(code)) continue;
      const criteria = ACHIEVEMENT_CRITERIA[code];
      if (!criteria) continue; // unknown code — skip rather than invent criteria
      if (criteria({ stats, won: ctx.won, durationSeconds: ctx.durationSeconds })) {
        toUnlock.push(code);
      }
    }
    return toUnlock;
  } catch (err) {
    console.error("[progression] evaluateAchievements failed", err);
    return [];
  }
}

export async function recordMatchResult(input: MatchResultInput): Promise<RecordMatchResultOutcome | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return null; // guest play — nothing to persist

    const durationSeconds = Math.max(0, Math.round(input.durationMs / 1000));
    const won = input.winnerIsMe;

    // 1. Insert the match row.
    const { data: matchRow, error: matchError } = await supabase
      .from("matches")
      .insert({
        room_code: input.roomCode,
        category_id: input.categoryId,
        winner_id: won ? user.id : null,
        winner_name: input.winnerName,
        winning_label: input.winningLabel,
        players: input.players,
        player_count: input.players.length,
        turns: input.turns,
        duration_seconds: durationSeconds,
      })
      .select("id")
      .single();
    if (matchError || !matchRow) throw matchError ?? new Error("Failed to insert match");

    // 2. Load current stats + profile before computing deltas.
    const [{ data: existingStats }, { data: profile }] = await Promise.all([
      supabase.from("player_stats").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    ]);

    const prevStats: StatsRow =
      existingStats ?? {
        user_id: user.id,
        wins: 0,
        losses: 0,
        total_matches: 0,
        current_streak: 0,
        longest_streak: 0,
        fastest_win_seconds: null,
        favorite_category: null,
        total_play_seconds: 0,
        updated_at: new Date().toISOString(),
      };

    const nextStreak = won ? prevStats.current_streak + 1 : 0;
    const nextStats: StatsRow = {
      ...prevStats,
      wins: prevStats.wins + (won ? 1 : 0),
      losses: prevStats.losses + (won ? 0 : 1),
      total_matches: prevStats.total_matches + 1,
      current_streak: nextStreak,
      longest_streak: Math.max(prevStats.longest_streak, nextStreak),
      fastest_win_seconds:
        won && (prevStats.fastest_win_seconds == null || durationSeconds < prevStats.fastest_win_seconds)
          ? durationSeconds
          : prevStats.fastest_win_seconds,
      favorite_category: input.categoryId ?? prevStats.favorite_category,
      total_play_seconds: prevStats.total_play_seconds + durationSeconds,
      updated_at: new Date().toISOString(),
    };

    const { error: statsError } = await supabase.from("player_stats").upsert(nextStats, { onConflict: "user_id" });
    if (statsError) throw statsError;

    // 3. Compute and award XP.
    const xpAwarded = xpForMatch({ won, streak: prevStats.current_streak, players: input.players.length });
    const prevXp = profile?.xp ?? 0;
    const newXp = prevXp + xpAwarded;
    const newLevel = levelFromXp(newXp);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ xp: newXp, level: newLevel })
      .eq("id", user.id);
    if (profileError) throw profileError;

    // 4. Record my match_players row.
    const { error: matchPlayerError } = await supabase.from("match_players").insert({
      match_id: matchRow.id,
      user_id: user.id,
      display_name: profile?.username ?? input.winnerName,
      is_winner: won,
      xp_awarded: xpAwarded,
    });
    if (matchPlayerError) throw matchPlayerError;

    // 5. Evaluate + persist achievement unlocks.
    const unlocked = await evaluateAchievements(nextStats, profile ?? null, { won, durationSeconds });
    if (unlocked.length > 0) {
      const { error: unlockError } = await supabase
        .from("user_achievements")
        .insert(unlocked.map((code) => ({ user_id: user.id, code })));
      // Ignore duplicate-key races — another tab/session may have unlocked concurrently.
      if (unlockError && !`${unlockError.message}`.includes("duplicate")) {
        console.error("[progression] failed to insert achievement unlocks", unlockError);
      }
    }

    return { xpAwarded, newLevel: newLevel !== levelFromXp(prevXp) ? newLevel : null, unlocked };
  } catch (err) {
    console.error("[progression] recordMatchResult failed", err);
    return null;
  }
}
