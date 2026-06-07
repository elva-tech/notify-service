import type { OtpMappingsSection } from '@/lib/business-config-types';

interface OtpPlatformSummaryProps {
  otpMappings: OtpMappingsSection;
}

export function OtpPlatformSummary({ otpMappings }: OtpPlatformSummaryProps) {
  const { runtime, stats } = otpMappings;
  const activeDltCount = otpMappings.mappings.filter((m) => m.activeDlt).length;

  const cards = [
    { label: 'OTP mappings', value: stats.mappingCount },
    { label: 'DLT-only (retired)', value: stats.dltOnlyCount ?? 0 },
    { label: 'Hybrid apps', value: stats.hybridCount ?? 0 },
    { label: 'Legacy route=q', value: stats.legacyRouteCount ?? stats.legacyCount },
    { label: 'Retired %', value: `${stats.retirementPercent ?? 0}%` },
    { label: 'Active DLT delivery', value: activeDltCount },
  ];

  return (
    <div className="space-y-4">
      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          runtime.globalDltEnabled
            ? 'border-emerald-500/40 bg-emerald-500/5'
            : 'border-amber-500/40 bg-amber-500/5'
        }`}
      >
        <span className="font-medium">Global master switch </span>
        <code className="rounded bg-muted px-1">OTP_DLT_ENABLED</code>
        <span className="text-muted-foreground"> — manifest default: </span>
        <span className="font-mono font-semibold">
          {runtime.globalDltEnabled ? 'true' : 'false'}
        </span>
        <p className="mt-1 text-muted-foreground">
          Per-app activation also requires <code className="rounded bg-muted px-1">dltEnabled: true</code>{' '}
          in <code className="rounded bg-muted px-1">otp-mappings.json</code>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-sm text-muted-foreground">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
