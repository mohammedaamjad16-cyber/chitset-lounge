import { AnimatePresence, motion } from "framer-motion";
import { RotateCw } from "lucide-react";
import { GameSeat } from "./game-seat";
import type { MatchState } from "@/lib/game/match-store";
import { useReducedMotionPref } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { Reaction } from "@/lib/chat/use-reactions";

interface GameTableProps {
  match: MatchState;
  meId: string | null;
  categoryName: string;
  categoryEmoji?: string;
  reactions?: Reaction[];
}

function seatPosition(index: number, total: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = 41;
  return { left: 50 + radius * Math.cos(angle), top: 50 + radius * Math.sin(angle) };
}

/** Mid-point pulled towards the table centre so the chit travels on an arc. */
function arcMidpoint(
  from: { left: number; top: number },
  to: { left: number; top: number },
) {
  const mx = (from.left + to.left) / 2;
  const my = (from.top + to.top) / 2;
  return { left: mx + (50 - mx) * 0.55, top: my + (50 - my) * 0.55 };
}

export function GameTable({ match, meId, categoryName, categoryEmoji, reactions }: GameTableProps) {
  const total = match.players.length;
  const active = match.players[match.turnIndex];
  const pass = match.pass;
  const reduced = useReducedMotionPref();
  const fromIndex = pass ? match.players.findIndex((p) => p.id === pass.fromId) : -1;
  const toIndex = pass ? match.players.findIndex((p) => p.id === pass.toId) : -1;
  const from = fromIndex >= 0 ? seatPosition(fromIndex, total) : null;
  const to = toIndex >= 0 ? seatPosition(toIndex, total) : null;
  const mid = from && to ? arcMidpoint(from, to) : null;

  return (
    <div className="relative">
      {/* Desktop / tablet: circular table */}
      <div className="relative mx-auto hidden aspect-square w-full max-w-[520px] md:block lg:max-w-[560px]">
        <div
          aria-hidden="true"
          className="absolute inset-[16%] rounded-full bg-gradient-primary opacity-20 blur-3xl"
        />
        <div className="absolute inset-[20%] rounded-full border border-border/70 bg-card/60 shadow-card backdrop-blur">
          <TableCenter
            categoryName={categoryName}
            categoryEmoji={categoryEmoji}
            activeName={active?.name}
            turns={match.turns}
          />
        </div>

        {match.players.map((player, i) => {
          const pos = seatPosition(i, total);
          return (
            <div
              key={player.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
            >
              <GameSeat
                player={player}
                handCount={match.hands[player.id]?.length ?? 0}
                isActive={active?.id === player.id && match.phase === "playing"}
                isMe={player.id === meId}
                turnStartedAt={match.turnStartedAt}
                turnDurationMs={match.turnDurationMs}
                reactions={reactions}
                receiving={pass?.toId === player.id}
              />
            </div>
          );
        })}

        {/* Chit travelling on a curve towards the next player */}
        <AnimatePresence>
          {pass && from && to && mid && (
            <motion.div
              key={pass.chit.id + pass.at}
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
              initial={{ left: `${from.left}%`, top: `${from.top}%`, scale: 0.7, rotate: -14, opacity: 0 }}
              animate={
                reduced
                  ? { left: `${to.left}%`, top: `${to.top}%`, scale: 1, opacity: 1 }
                  : {
                      left: [`${from.left}%`, `${mid.left}%`, `${to.left}%`],
                      top: [`${from.top}%`, `${mid.top}%`, `${to.top}%`],
                      scale: [0.8, 1.15, 1],
                      rotate: [-14, 8, 20],
                      opacity: [0, 1, 1],
                    }
              }
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: reduced ? 0.15 : 0.62, ease: "easeInOut" }}
            >
              <span className="chit-paper grid h-14 w-10 place-items-center rounded-xl border border-border/80 text-lg text-primary-foreground shadow-glow">
                📜
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile: compact table */}
      <div className="md:hidden">
        <div className="relative mx-auto mb-4 flex h-32 w-32 flex-col items-center justify-center rounded-full border border-border/70 bg-card/60 text-center shadow-card backdrop-blur">
          <div aria-hidden="true" className="absolute inset-2 -z-10 rounded-full bg-gradient-primary opacity-20 blur-2xl" />
          <TableCenter
            categoryName={categoryName}
            categoryEmoji={categoryEmoji}
            activeName={active?.name}
            turns={match.turns}
            compact
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {match.players.map((player) => (
            <GameSeat
              key={player.id}
              player={player}
              handCount={match.hands[player.id]?.length ?? 0}
              isActive={active?.id === player.id && match.phase === "playing"}
              isMe={player.id === meId}
              turnStartedAt={match.turnStartedAt}
              turnDurationMs={match.turnDurationMs}
              reactions={reactions}
              receiving={pass?.toId === player.id}
              compact
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TableCenter({
  categoryName,
  categoryEmoji,
  activeName,
  turns,
  compact,
}: {
  categoryName: string;
  categoryEmoji?: string;
  activeName?: string;
  turns: number;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex h-full flex-col items-center justify-center gap-1 px-4 text-center", compact && "px-2")}>
      <p className={cn("font-display font-semibold", compact ? "text-xs" : "text-base")}>
        {categoryEmoji && <span aria-hidden="true">{categoryEmoji} </span>}
        {categoryName}
      </p>
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <RotateCw className="h-3 w-3" /> Clockwise
      </p>
      {!compact && (
        <>
          <p className="mt-1 text-xs font-medium text-primary">{activeName ? `${activeName}'s turn` : "—"}</p>
          <p className="text-[11px] text-muted-foreground">{turns} passes</p>
        </>
      )}
    </div>
  );
}
