import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/shared/glass-card";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} aria-hidden="true" />;
}

export function ButtonLoader({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner />
      {label}
    </span>
  );
}

export function FullScreenLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4"
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
        <Spinner className="h-6 w-6" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function AvatarSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-12 w-12 rounded-full", className)} />;
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <GlassCard className={cn("space-y-3 p-5", className)}>
      <div className="flex items-center gap-3">
        <AvatarSkeleton />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </GlassCard>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-5" aria-hidden="true">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-xl" />
    </div>
  );
}
