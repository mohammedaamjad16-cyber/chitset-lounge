export type RoomVisibility = "private" | "public";
export type GameMode = "classic" | "team" | "tournament" | "ranked";
export type ConnectionStatus = "connected" | "connecting" | "disconnected";

export type TeamId = "A" | "B";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  connection: ConnectionStatus;
  /** Bots are clearly marked everywhere they appear. */
  isBot?: boolean;
  /** Only used in team mode. */
  team?: TeamId;
  /** Reserved for future profile stats (wins, streaks, rank). */
  stats?: Record<string, number>;
}

export interface RoomState {
  code: string;
  name: string;
  hostId: string;
  maxPlayers: number;
  categoryId: string;
  visibility: RoomVisibility;
  gameMode: GameMode;
  players: Player[];
  createdAt: number;
  /** Rooms lock while a match is in progress — no new players may join. */
  status?: "lobby" | "in-game";
  /** Hosts may allow bots to fill empty seats. */
  allowBots?: boolean;
  botDifficulty?: "easy" | "normal" | "hard";
}

export interface CreateRoomInput {
  hostName: string;
  roomName: string;
  maxPlayers: number;
  categoryId: string;
  visibility: RoomVisibility;
  gameMode: GameMode;
  allowBots?: boolean;
  botDifficulty?: "easy" | "normal" | "hard";
}
