import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { useRoom, toggleReady, leaveRoom, getMeId } from "@/lib/game/room-store";
import { notify } from "@/lib/notify";

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
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setMe(getMeId());
    const t = setTimeout(() => setHydrating(false), 350);
    return () => clearTimeout(t);
  }, []);

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
  const allReady = room.players.length > 1 && room.players.every((p) => p.isReady);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      notify.success("Room code copied", `${room.code} is on your clipboard.`);
    } catch {
      notify.error("Couldn't copy", "Copy the code manually from the top bar.");
    }
  };

  const start = () => {
    setStarting(true);
    setTimeout(() => {
      setStarting(false);
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
        <LobbyTopBar room={room} categoryName={category?.name ?? "Category"} onCopyCode={copyCode} />

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
                onInvite={copyCode}
                onSettings={() => setSettingsOpen(true)}
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

            <InvitePanel code={room.code} onCopyCode={copyCode} />
          </div>
        </div>

        {/* Bottom action area */}
        <GlassCard className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
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
                toggleReady(me.id);
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
      <ConfirmModal
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Leave this room?"
        description="You'll lose your seat at the table. You can rejoin with the room code."
        confirmLabel="Leave Room"
        destructive
        onConfirm={() => {
          leaveRoom();
          notify.info("You left the room");
          navigate({ to: "/" });
        }}
      />
    </div>
  );
}
