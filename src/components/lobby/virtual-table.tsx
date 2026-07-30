import { AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
import type { Player } from "@/lib/game/types";
import { PlayerSeat } from "./player-seat";

interface VirtualTableProps {
  players: Player[];
  maxPlayers: number;
  categoryName: string;
}

export function VirtualTable({ players, maxPlayers, categoryName }: VirtualTableProps) {
  const seats = Array.from({ length: maxPlayers }, (_, i) => players[i]);

  return (
    <div className="relative">
      {/* Desktop / tablet: circular arrangement */}
      <div className="relative mx-auto hidden aspect-square w-full max-w-[560px] md:block">
        <div
          aria-hidden="true"
          className="absolute inset-[18%] rounded-full bg-gradient-primary opacity-20 blur-3xl"
        />
        <div className="absolute inset-[20%] rounded-full border border-border/70 bg-card/60 shadow-card backdrop-blur">
          <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Users className="h-5 w-5" />
            </span>
            <p className="font-display text-base font-semibold">{categoryName}</p>
            <p className="text-xs text-muted-foreground">
              {players.length} of {maxPlayers} seated
            </p>
          </div>
        </div>

        <AnimatePresence>
          {seats.map((player, i) => {
            const angle = (i / maxPlayers) * 2 * Math.PI - Math.PI / 2;
            const radius = 42; // percent from center
            const left = 50 + radius * Math.cos(angle);
            const top = 50 + radius * Math.sin(angle);
            return (
              <div
                key={player?.id ?? `seat-${i}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                <PlayerSeat player={player} />
              </div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Mobile: table summary + stacked seats */}
      <div className="md:hidden">
        <div className="relative mx-auto mb-5 flex h-36 w-36 flex-col items-center justify-center rounded-full border border-border/70 bg-card/60 text-center shadow-card backdrop-blur">
          <div
            aria-hidden="true"
            className="absolute inset-2 -z-10 rounded-full bg-gradient-primary opacity-20 blur-2xl"
          />
          <p className="font-display text-sm font-semibold">{categoryName}</p>
          <p className="text-xs text-muted-foreground">
            {players.length}/{maxPlayers} seated
          </p>
        </div>
        <div className="grid grid-cols-2 justify-items-center gap-3 xs:grid-cols-2">
          <AnimatePresence>
            {seats.map((player, i) => (
              <PlayerSeat key={player?.id ?? `m-seat-${i}`} player={player} className="w-full" />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
