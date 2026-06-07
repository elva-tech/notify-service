import type { OtpHealthSnapshot } from '@/lib/business-config-types';

interface OtpConfigHealthProps {
  otpHealth: OtpHealthSnapshot | null;
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`}
      aria-hidden
    />
  );
}

export function OtpConfigHealth({ otpHealth }: OtpConfigHealthProps) {
  if (!otpHealth) {
    return (
      <p className="text-sm text-muted-foreground">
        No health snapshot available. Run{' '}
        <code className="rounded bg-muted px-1">npm run otp:health</code> or start the backend to generate{' '}
        <code className="rounded bg-muted px-1">backend/.generated/otp-health-snapshot.json</code>.
      </p>
    );
  }

  const { configHealth } = otpHealth;
  const checks = [
    { label: 'Overall status', ok: configHealth.status === 'healthy', value: configHealth.status },
    { label: 'Mappings valid', ok: configHealth.mappingsValid, value: configHealth.mappingsValid ? 'yes' : 'no' },
    { label: 'Business registry', ok: configHealth.businessRegistryHealthy, value: configHealth.businessRegistryHealthy ? 'yes' : 'no' },
    { label: 'Templates valid', ok: configHealth.templatesValid, value: configHealth.templatesValid ? 'yes' : 'no' },
    { label: 'DLT metadata complete', ok: configHealth.dltMetadataComplete, value: configHealth.dltMetadataComplete ? 'yes' : 'no' },
    { label: 'Startup validation', ok: configHealth.startupValidation === 'passed', value: configHealth.startupValidation },
  ];

  return (
    <div className="space-y-4">
      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          configHealth.status === 'healthy'
            ? 'border-emerald-500/40 bg-emerald-500/5'
            : 'border-amber-500/40 bg-amber-500/5'
        }`}
      >
        Configuration health: <strong>{configHealth.status}</strong>
      </div>
      <ul className="space-y-2">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-3 text-sm">
            <StatusDot ok={check.ok} />
            <span className="min-w-[10rem] text-muted-foreground">{check.label}</span>
            <span className="font-mono">{check.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
