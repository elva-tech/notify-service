import { cn } from '@/lib/utils';

const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  POST: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  PUT: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  PATCH: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  DELETE: 'bg-red-500/15 text-red-700 dark:text-red-300',
};

interface MethodBadgeProps {
  method: string;
  className?: string;
}

export function MethodBadge({ method, className }: MethodBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded px-2 py-0.5 font-mono text-xs font-semibold uppercase',
        METHOD_STYLES[method] ?? 'bg-muted text-foreground',
        className,
      )}
    >
      {method}
    </span>
  );
}
