import { Loader2 } from 'lucide-react';

interface RouteLoadingProps {
  label?: string;
  hint?: string;
}

export function RouteLoading({
  label = 'Loading page…',
  hint = 'Compiling content — this can take a moment in development.',
}: RouteLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-8 px-4 py-16"
    >
      <div className="w-full max-w-lg space-y-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="route-loading-bar h-full w-2/5 rounded-full bg-primary" />
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
          <span>{label}</span>
        </div>
        {hint ? <p className="text-center text-xs text-muted-foreground">{hint}</p> : null}
      </div>

      <div className="w-full max-w-2xl animate-pulse space-y-4">
        <div className="h-9 w-2/3 rounded-lg bg-muted" />
        <div className="h-4 w-full rounded bg-muted/80" />
        <div className="h-4 w-11/12 rounded bg-muted/80" />
        <div className="h-4 w-4/5 rounded bg-muted/80" />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="h-28 rounded-xl bg-muted/70" />
          <div className="h-28 rounded-xl bg-muted/70" />
        </div>
      </div>
    </div>
  );
}
