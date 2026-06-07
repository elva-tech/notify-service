import type { BusinessConfig } from '@/lib/business-config-types';

interface BusinessOnboardingChecklistProps {
  businesses: BusinessConfig[];
}

const CHECKLIST_ITEMS = [
  { key: 'businessJsonValid', label: 'business.json valid' },
  { key: 'templatesJsonValid', label: 'templates.json valid' },
  { key: 'dltMetadataComplete', label: 'DLT metadata complete' },
  { key: 'otpMappingConfigured', label: 'OTP mapping configured' },
  { key: 'productionReady', label: 'Production ready' },
] as const;

function CheckIcon({ ok }: { ok: boolean }) {
  return (
    <span className={ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
      {ok ? '✓' : '○'}
    </span>
  );
}

export function BusinessOnboardingChecklist({ businesses }: BusinessOnboardingChecklistProps) {
  return (
    <div className="space-y-6">
      {businesses.map((business) => (
        <section key={business.businessId} className="rounded-lg border p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h3 className="font-semibold">{business.displayName}</h3>
            <span className="font-mono text-xs text-muted-foreground">{business.businessId}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
              {business.readinessStatus ?? 'Unknown'}
            </span>
          </div>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {CHECKLIST_ITEMS.map((item) => {
              const ok = business.checklist?.[item.key] ?? false;
              return (
                <li key={item.key} className="flex items-center gap-2">
                  <CheckIcon ok={ok} />
                  <span className={ok ? '' : 'text-muted-foreground'}>{item.label}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
