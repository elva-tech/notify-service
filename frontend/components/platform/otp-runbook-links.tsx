import Link from 'next/link';
import { docsHref } from '@/lib/paths';

const RUNBOOKS = [
  {
    title: 'DLT Outage Response',
    slug: 'runbooks/otp-dlt-outage',
    description: 'Provider outage and delivery failure escalation',
  },
  {
    title: 'DLT Rollback',
    slug: 'runbooks/otp-dlt-rollback',
    description: 'Immediate revert to route=q via OTP_DLT_ENABLED',
  },
  {
    title: 'DLT Rollout',
    slug: 'runbooks/otp-dlt-rollout',
    description: 'Staged production rollout checklist',
  },
  {
    title: 'Log Triage',
    slug: 'runbooks/otp-dlt-log-triage',
    description: 'OTP/DLT log events and query patterns',
  },
  {
    title: 'Retirement Readiness',
    slug: 'runbooks/otp-dlt-retirement-readiness',
    description: 'Phase 8D route=q removal criteria',
  },
];

const ARCHITECTURE = [
  {
    title: 'OTP DLT Observability',
    slug: 'architecture/otp-dlt-observability',
    description: 'SLIs, log taxonomy, aggregation guide',
  },
  {
    title: 'OTP DLT Migration',
    slug: 'architecture/otp-dlt-migration',
    description: 'Architecture and rollout model',
  },
];

export function OtpRunbookLinks() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Operational runbooks</h3>
        <ul className="space-y-2">
          {RUNBOOKS.map((item) => (
            <li key={item.slug}>
              <Link
                href={docsHref(item.slug)}
                className="block rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-muted/50"
              >
                <span className="font-medium text-primary">{item.title}</span>
                <p className="mt-0.5 text-muted-foreground">{item.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold">Architecture references</h3>
        <ul className="space-y-2">
          {ARCHITECTURE.map((item) => (
            <li key={item.slug}>
              <Link
                href={docsHref(item.slug)}
                className="block rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-muted/50"
              >
                <span className="font-medium text-primary">{item.title}</span>
                <p className="mt-0.5 text-muted-foreground">{item.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
