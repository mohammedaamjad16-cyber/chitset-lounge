export type RoomVisibility = "private" | "public";
export type GameMode = "classic" | "team" | "tournament" | "ranked";
export type ConnectionStatus = "connected" | "connecting" | "disconnected";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  connection: ConnectionStatus;
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
}

export interface CreateRoomInput {
  hostName: string;
  roomName: string;
  maxPlayers: number;
  categoryId: string;
  visibility: RoomVisibility;
  gameMode: GameMode;
}
