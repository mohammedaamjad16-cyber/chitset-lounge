import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, LogOut, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, emptyStatePresets } from "@/components/shared/empty-state";
import { FullScreenLoader, ButtonLoader } from "@/components/shared/loaders";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { LobbyTopBar } from "@/components/lobby/lobby-top-bar";
import { VirtualTable } from "@/components/lobby/virtual-table";
import { HostControls } from "@/components/lobby/host-controls";
import { InvitePanel } from "@/components/lobby/invite-panel";
import { RoomSettingsDialog } from "@/components/lobby/room-settings-dialog";
import { getCategory } from "@/lib/game/categories";
import {
  useRoom,
  toggleReady,
  leaveRoom,
  getMeId,
  setRoomStatus,
  getRoomSnapshot,
  isOnlineMode,
  addBots,
  removeBots,
  removePlayer,
  setHostId,
  updateRoomSettings,
  autoBalanceTeams,
} from "@/lib/game/room-store";
import { endMatch, startMatch } from "@/lib/game/match-store";
import { notify } from "@/lib/notify";
import { BotsPanel } from "@/components/lobby/bots-panel";
import { playCue } from "@/lib/audio/audio-manager";
import { ChatPanel } from "@/components/chat/chat-panel";
import { InviteDialog } from "@/components/invite/invite-dialog";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import {
  closeOnlineRoom,
  kickOnlinePlayer,
  leaveOnlineRoom,
  setOnlineReady,
  setOnlineRoomStatus,
  transferOnlineHost,
  useRoomSync,
} from "@/lib/realtime/room-sync";
import { useMatchSync } from "@/lib/realtime/match-sync";

export const Route = createFileRoute("/lobby")({
  head: () => ({
    meta: [
      { title: "Game Lobby — ChitSet" },
      {
        name: "description",
        content:
          "Your ChitSet lobby: gather players around the virtual table, get everyone ready and start the match.",
      },
      { property: "og:title", content: "ChitSet Game Lobby" },
      { property: "og:description", content: "Gather your players around the virtual table." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Lobby,
});

function Lobby() {
  const room = useRoom();
  const navigate = useNavigate();
  const [hydrating, setHydrating] = useState(true);
  const [meId, setMe] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [closeRoomOpen, setCloseRoomOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [online, setOnline] = useState(false);
  const prevPlayerCount = useRef(room?.players.length ?? 0);

  // Ambient cues when the table gains or loses a player.
  useEffect(() => {
    if (!room) return;
    const count = room.players.length;
    if (count > prevPlayerCount.current) playCue("join");
    else if (count < prevPlayerCount.current) playCue("leave");
    prevPlayerCount.current = count;
  }, [room?.players.length, room]);
  const syncStatus = useRoomSync(room?.code ?? null, online);
  useMatchSync(room?.code ?? null, (room?.hostId ?? null) === meId, online);

  useEffect(() => {
    setMe(getMeId());
    setOnline(isOnlineMode());
    // Returning to the lobby always reopens the room.
    setRoomStatus("lobby");
    endMatch();
    const snap = getRoomSnapshot();
    if (isOnlineMode() && snap && snap.hostId === getMeId()) {
      void setOnlineRoomStatus(snap.code, "lobby");
    }
    const t = setTimeout(() => setHydrating(false), 350);
    return () => clearTimeout(t);
  }, []);

  // Guests follow the host into the match as soon as the room locks.
  useEffect(() => {
    if (!online || !room || !meId) return;
    if (room.status === "in-game" && room.hostId !== meId) {
      startMatch({ ...room, status: "in-game" }, meId);
      navigate({ to: "/game" });
    }
  }, [online, room, meId, navigate]);

  if (hydrating) return <FullScreenLoader label="Entering the room..." />;

  if (!room) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <EmptyState
          {...emptyStatePresets.roomNotFound}
          actionLabel="Create a room"
          onAction={() => navigate({ to: "/create-room" })}
        />
      </div>
    );
  }

  const me = room.players.find((p) => p.id === meId) ?? room.players[0];
  const isHost = me?.id === room.hostId;
  const category = getCategory(room.categoryId);
  const allReady = room.players.length > 0 && room.players.every((p) => p.isReady);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      notify.success("Room code copied", `${room.code} is on your clipboard.`);
    } catch {
      notify.error("Couldn't copy", "Copy the code manually from the top bar.");
    }
  };

  const joinLink =
    typeof window !== "undefined" ? `${window.location.origin}/join-room?code=${room.code}` : "";

  const copyInviteLink = async () => {
    playCue("click");
    try {
      await navigator.clipboard.writeText(joinLink);
      notify.success("Invite link copied", "Send it to friends — they'll land with the code filled in.");
    } catch {
      notify.error("Couldn't copy", "Share the room code instead.");
    }
  };

  const shareRoom = async () => {
    playCue("click");
    if (typeof navigator.share !== "undefined") {
      try {
        await navigator.share({ title: `Join my ChitSet room ${room.code}`, url: joinLink });
        return;
      } catch {
        /* user dismissed or share failed — fall through to copy */
      }
    }
    void copyInviteLink();
  };

  const kickPlayer = (playerId: string) => {
    const target = room.players.find((p) => p.id === playerId);
    if (!target) return;
    if (online) {
      void kickOnlinePlayer(room.code, playerId)
        .then(() => notify.info(`${target.name} removed`, "They can rejoin with the room code."))
        .catch(() =>
          notify.error(
            "Couldn't remove player",
            "The server denied the request — you may not have permission in this room.",
          ),
        );
    } else {
      removePlayer(playerId);
      notify.info(`${target.name} removed`, "The seat is open again.");
    }
  };

  const transferHostTo = (playerId: string) => {
    const target = room.players.find((p) => p.id === playerId);
    if (!target) return;
    if (online) {
      void transferOnlineHost(room.code, playerId)
        .then(() => notify.success("Host transferred", `${target.name} now runs the table.`))
        .catch(() =>
          notify.error(
            "Couldn't transfer host",
            "The server denied the request — you may not have permission in this room.",
          ),
        );
    } else {
      setHostId(playerId);
      notify.success("Host transferred", `${target.name} now runs the table.`);
    }
  };

  const closeRoomForEveryone = () => {
    if (online) {
      void closeOnlineRoom(room.code).catch(() => undefined);
    }
    leaveRoom();
    notify.info("Room closed", "The table has been packed up.");
    navigate({ to: "/" });
  };

  const allowBots = room.allowBots ?? true;
  const seatsOpen = Math.max(0, room.maxPlayers - room.players.length);
  const notEnoughPlayers = room.players.length < 2;

  const addBotSeats = () => {
    const added = addBots(room.maxPlayers);
    playCue(added > 0 ? "join" : "error");
    if (added > 0) {
      if (room.gameMode === "team") autoBalanceTeams();
      notify.success(
        added === 1 ? "1 bot seated" : `${added} bots seated`,
        "Bots play with the same rules and only see their own chits.",
      );
    } else {
      notify.info("No open seats", "Raise the player limit to add more bots.");
    }
  };

  const start = () => {
    if (notEnoughPlayers && !allowBots) {
      notify.error("Not enough players", "Turn on Allow Bots or wait for another player to join.");
      return;
    }
    setStarting(true);
    if (online) {
      void setOnlineRoomStatus(room.code, "in-game");
    } else if (notEnoughPlayers && allowBots) {
      addBots(Math.max(2, room.maxPlayers));
      if (room.gameMode === "team") autoBalanceTeams();
    }
    setRoomStatus("in-game");
    setTimeout(() => {
      setStarting(false);
      const live = getRoomSnapshot() ?? room;
      startMatch({ ...live, status: "in-game" }, meId);
      notify.success("Match starting", "Room locked. Chits are being shuffled.");
      navigate({ to: "/game" });
    }, 700);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <LobbyTopBar
          room={room}
          categoryName={category?.name ?? "Category"}
          onCopyCode={copyCode}
          onShare={() => void shareRoom()}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <GlassCard className="p-5 sm:p-8">
            {room.players.length === 0 ? (
              <EmptyState
                {...emptyStatePresets.noPlayers}
                actionLabel="Copy room code"
                onAction={copyCode}
              />
            ) : (
              <VirtualTable
                players={room.players}
                maxPlayers={room.maxPlayers}
                categoryName={category?.name ?? "Category"}
              />
            )}
          </GlassCard>

          <div className="space-y-6">
            {isHost ? (
              <HostControls
                canStart={allReady}
                starting={starting}
                onStart={start}
                onCopyCode={copyCode}
                onInvite={() => setInviteOpen(true)}
                onSettings={() => setSettingsOpen(true)}
                otherPlayers={room.players.filter((p) => p.id !== meId)}
                notEnoughPlayers={notEnoughPlayers}
                allowBots={allowBots}
                seatsOpen={seatsOpen}
                onAddBots={addBotSeats}
                onKickPlayer={kickPlayer}
                onTransferHost={transferHostTo}
                onCloseRoom={() => setCloseRoomOpen(true)}
              />
            ) : (
              <GlassCard className="p-5">
                <h2 className="font-display text-sm font-semibold">Waiting on the host</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mark yourself ready — the host starts the match when everyone is set.
                </p>
                <Badge variant="secondary" className="mt-3 text-[10px]">
                  Player
                </Badge>
              </GlassCard>
            )}

            {isHost && (
              <BotsPanel
                allowBots={allowBots}
                botDifficulty={room.botDifficulty ?? "normal"}
                teamMode={room.gameMode === "team"}
                playerCount={room.players.length}
                botCount={room.players.filter((p) => p.isBot).length}
                seatsOpen={seatsOpen}
                notEnoughPlayers={notEnoughPlayers}
                onToggleAllowBots={(v) => {
                  updateRoomSettings({ allowBots: v });
                  if (!v) removeBots();
                }}
                onDifficultyChange={(v) => updateRoomSettings({ botDifficulty: v })}
                onAddBots={addBotSeats}
                onRemoveBots={() => {
                  removeBots();
                  notify.info("Bots removed", "The table is waiting for human players.");
                }}
                onBalanceTeams={() => {
                  autoBalanceTeams();
                  notify.success("Teams balanced", "Players were split evenly between Team A and Team B.");
                }}
              />
            )}

            <InvitePanel code={room.code} onCopyCode={copyCode} />

            {online && me && (
              <ChatPanel roomCode={room.code} selfId={me.id} variant="lobby" />
            )}
          </div>
        </div>

        {/* Bottom action area */}
        <GlassCard className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {online && (
              <span className="inline-flex items-center gap-1 text-xs">
                {syncStatus === "connected" ? (
                  <><Wifi className="h-3.5 w-3.5 text-emerald-500" /> Live</>
                ) : syncStatus === "reconnecting" ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" /> Reconnecting</>
                ) : (
                  <><WifiOff className="h-3.5 w-3.5" /> Offline</>
                )}
              </span>
            )}
            {allReady
              ? "Everyone is ready. The host can start the match."
              : "All players must be ready before the game can start."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="min-h-11" onClick={() => setLeaveOpen(true)}>
              <LogOut className="mr-1.5 h-4 w-4" /> Leave Room
            </Button>
            <Button
              className="min-h-11"
              variant={me?.isReady ? "secondary" : "default"}
              onClick={() => {
                if (!me) return;
                if (online) void setOnlineReady(room.code, me.id, !me.isReady);
                else toggleReady(me.id);
                if (!me.isReady) notify.success("You're ready", "Waiting for the other players.");
              }}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              {me?.isReady ? "Cancel Ready" : "I'm Ready"}
            </Button>
            {!isHost && (
              <Button className="min-h-11" disabled>
                {starting ? <ButtonLoader label="Starting..." /> : (
                  <>
                    <Sparkles className="mr-1.5 h-4 w-4" /> Host starts the game
                  </>
                )}
              </Button>
            )}
          </div>
        </GlassCard>

        <p className="text-center text-xs text-muted-foreground">
          Need a different table? <Link to="/create-room" className="story-link">Create a new room</Link>
        </p>
      </motion.div>

      <RoomSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} room={room} />
      <InviteDialog roomCode={room.code} open={inviteOpen} onOpenChange={setInviteOpen} />
      <ConfirmModal
        open={closeRoomOpen}
        onOpenChange={setCloseRoomOpen}
        title="Close this room?"
        description="Everyone at the table will be sent back to the home screen. This can't be undone."
        confirmLabel="Close Room"
        destructive
        onConfirm={closeRoomForEveryone}
      />
      <ConfirmModal
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Leave this room?"
        description="You'll lose your seat at the table. You can rejoin with the room code."
        confirmLabel="Leave Room"
        destructive
        onConfirm={() => {
          if (online) void leaveOnlineRoom(room.code, me.id, isHost);
          leaveRoom();
          notify.info("You left the room");
          navigate({ to: "/" });
        }}
      />
    </div>
  );
}
