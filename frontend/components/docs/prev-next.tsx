import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { PrevNextLink } from '@/lib/prev-next';

interface PrevNextProps {
  prev: PrevNextLink | null;
  next: PrevNextLink | null;
}

export function PrevNext({ prev, next }: PrevNextProps) {
  if (!prev && !next) {
    return null;
  }

  return (
    <div className="mt-12 grid gap-4 border-t pt-8 sm:grid-cols-2">
      {prev ? (
        <Link
          href={prev.href}
          className="group rounded-lg border p-4 transition-colors hover:bg-accent"
        >
          <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Previous
          </div>
          <div className="font-medium text-foreground group-hover:text-primary">{prev.title}</div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group rounded-lg border p-4 text-right transition-colors hover:bg-accent sm:col-start-2"
        >
          <div className="mb-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
            Next
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <div className="font-medium text-foreground group-hover:text-primary">{next.title}</div>
        </Link>
      ) : null}
    </div>
  );
}
