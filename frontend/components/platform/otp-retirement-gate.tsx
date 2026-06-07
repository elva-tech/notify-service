import type { OtpHealthSnapshot } from '@/lib/business-config-types';

interface OtpRetirementGateProps {
  otpHealth: OtpHealthSnapshot | null;
}

function CheckRow({ label, ok, note }: { label: string; ok: boolean; note?: string }) {
  return (
    <li className="flex flex-col gap-1 rounded-lg border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className={ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
          {ok ? '✓' : '○'}
        </span>
        <span>{label}</span>
      </div>
      <span className="font-mono text-xs text-muted-foreground">{ok ? 'pass' : note ?? 'pending'}</span>
    </li>
  );
}

export function OtpRetirementGate({ otpHealth }: OtpRetirementGateProps) {
  if (!otpHealth) {
    return (
      <p className="text-sm text-muted-foreground">
        Retirement readiness requires a health snapshot. Phase 8D (route=q removal) is not approved until
        config and log-based checks pass.
      </p>
    );
  }

  const { retirementReadiness, configHealth } = otpHealth;
  const labels: Record<string, string> = {
    allAppsDltEnabled: 'All mapped apps have dltEnabled: true',
    globalDltEnabled: 'OTP_DLT_ENABLED=true in production',
    allMetadataComplete: 'All mappings have complete DLT metadata',
    allCredentialAppsMapped: 'All credential apps have OTP mappings',
    allRolloutReady: 'All mappings are rollout-ready',
    allActiveDlt: 'All mappings are actively on DLT delivery',
    allProductionAppsRetired: 'All DLT-enabled apps have legacyRouteEnabled=false',
  };

  return (
    <div className="space-y-4">
      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          retirementReadiness.configReady
            ? 'border-blue-500/40 bg-blue-500/5'
            : 'border-muted bg-muted/30'
        }`}
      >
        Config retirement gate:{' '}
        <strong>{retirementReadiness.configReady ? 'READY (config only)' : 'NOT READY'}</strong>
        <p className="mt-1 text-muted-foreground">
          {retirementReadiness.note} Phase 8D cutover uses per-app <code className="rounded bg-muted px-1">legacyRouteEnabled</code>.
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Config checks (automated)</h3>
        <ul className="space-y-2">
          {Object.entries(retirementReadiness.configChecks).map(([key, ok]) => (
            <CheckRow key={key} label={labels[key] ?? key} ok={ok} />
          ))}
        </ul>
        {retirementReadiness.unmappedCredentialApps.length > 0 ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            Unmapped credential apps: {retirementReadiness.unmappedCredentialApps.join(', ')}
          </p>
        ) : null}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Log checks (manual — Phase 8D)</h3>
        <ul className="space-y-2">
          {retirementReadiness.logChecksManual.map((check) => (
            <CheckRow
              key={check.id}
              label={check.label}
              ok={false}
              note="manual verification"
            />
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Startup validation: {configHealth.startupValidation}. Route=q removal is Phase 8D — not in scope for 8C.
      </p>
    </div>
  );
}
