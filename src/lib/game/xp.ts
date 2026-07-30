/** XP curve and level helpers shared by profile, results and leaderboard UI. */

export const XP_PER_MATCH = 20;
export const XP_PER_WIN = 100;
export const XP_STREAK_BONUS = 25;

/** Total XP required to reach a given level (level 1 starts at 0). */
export function xpForLevel(level: number): number {
  return Math.max(0, (level - 1) * (level - 1) * 100);
}

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1);
}

export interface LevelProgress {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  intoLevel: number;
  neededForLevel: number;
  percent: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const intoLevel = xp - currentLevelXp;
  const neededForLevel = Math.max(1, nextLevelXp - currentLevelXp);
  return {
    level,
    currentLevelXp,
    nextLevelXp,
    intoLevel,
    neededForLevel,
    percent: Math.min(100, Math.round((intoLevel / neededForLevel) * 100)),
  };
}

export function xpForMatch(opts: { won: boolean; streak: number; players: number }): number {
  let xp = XP_PER_MATCH + Math.max(0, opts.players - 2) * 5;
  if (opts.won) xp += XP_PER_WIN + Math.min(opts.streak, 5) * XP_STREAK_BONUS;
  return xp;
}
