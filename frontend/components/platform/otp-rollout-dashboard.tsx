import type { OtpMappingsSection, OtpHealthSnapshot } from '@/lib/business-config-types';

interface OtpRolloutDashboardProps {
  otpMappings: OtpMappingsSection;
  otpHealth: OtpHealthSnapshot | null;
}

export function OtpRolloutDashboard({ otpMappings, otpHealth }: OtpRolloutDashboardProps) {
  const { stats, runtime, mappings } = otpMappings;
  const dltPercent = stats.mappingCount > 0
    ? Math.round((stats.dltEnabledCount / stats.mappingCount) * 100)
    : 0;
  const activePercent = otpHealth?.stats.dltDeliveryPercent
    ?? (stats.mappingCount > 0
      ? Math.round((mappings.filter((m) => m.activeDlt).length / stats.mappingCount) * 100)
      : 0);

  const rows = [
    { label: 'Global master switch', value: runtime.globalDltEnabled ? 'ON' : 'OFF', code: 'OTP_DLT_ENABLED' },
    { label: 'Mapped apps', value: String(stats.mappingCount) },
    { label: 'DLT-enabled apps', value: String(stats.dltEnabledCount) },
    { label: 'Legacy fallback apps', value: String(stats.legacyCount) },
    { label: 'Active DLT delivery', value: String(otpHealth?.stats.activeDltCount ?? mappings.filter((m) => m.activeDlt).length) },
    { label: 'DLT-enabled %', value: `${dltPercent}%` },
    { label: 'Active DLT %', value: `${activePercent}%` },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Effective delivery mode requires <code className="rounded bg-muted px-1">OTP_DLT_ENABLED=true</code>{' '}
        and per-app <code className="rounded bg-muted px-1">dltEnabled: true</code>.
        Snapshot source: {otpHealth?.source ?? 'manifest'} · generated{' '}
        {otpHealth?.generatedAt ? new Date(otpHealth.generatedAt).toLocaleString() : 'at build time'}.
      </p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b last:border-0">
                <td className="px-4 py-3 text-muted-foreground">{row.label}</td>
                <td className="px-4 py-3 font-mono font-medium">{row.value}</td>
                {row.code ? (
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.code}</td>
                ) : (
                  <td className="px-4 py-3" />
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {otpHealth?.deliveryBreakdown ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {otpHealth.deliveryBreakdown.dlt_only}
            </div>
            <div className="text-sm text-muted-foreground">DLT-only (retired)</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold">{otpHealth.deliveryBreakdown.hybrid}</div>
            <div className="text-sm text-muted-foreground">Hybrid (DLT + fallback)</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold">{otpHealth.deliveryBreakdown.legacy_q}</div>
            <div className="text-sm text-muted-foreground">Legacy route=q primary</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
