import Link from 'next/link';
import type { BusinessConfig } from '@/lib/business-config-types';

interface BusinessCardProps {
  business: BusinessConfig;
}

function readinessBadgeClass(status?: string) {
  switch (status) {
    case 'Production':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
    case 'Ready':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-400';
    case 'Draft':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function BusinessCard({ business }: BusinessCardProps) {
  return (
    <Link
      href={`/platform/businesses/${business.businessId}`}
      className="block rounded-lg border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{business.displayName}</h3>
          <p className="font-mono text-sm text-muted-foreground">{business.businessId}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{business.version}</span>
          {business.readinessStatus ? (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${readinessBadgeClass(business.readinessStatus)}`}>
              {business.readinessStatus}
            </span>
          ) : null}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Templates</dt>
          <dd className="font-medium">{business.templates.length}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Sender ID</dt>
          <dd className="font-mono font-medium">{business.dlt.defaultSenderId}</dd>
        </div>
      </dl>
    </Link>
  );
}
