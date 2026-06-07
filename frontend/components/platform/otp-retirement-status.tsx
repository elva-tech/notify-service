import type { OtpHealthRetirement, OtpMappingEntry, OtpMappingsSection } from '@/lib/business-config-types';

interface OtpRetirementStatusProps {
  otpMappings: OtpMappingsSection;
  retirement?: OtpHealthRetirement | null;
}

export function OtpRetirementStatus({ otpMappings, retirement }: OtpRetirementStatusProps) {
  const { stats, mappings } = otpMappings;
  const retired = retirement?.retiredApps ?? stats.dltOnlyCount ?? 0;
  const hybrid = retirement?.hybridApps ?? stats.hybridCount ?? 0;
  const legacy = retirement?.legacyApps ?? stats.legacyRouteCount ?? 0;
  const percent = retirement?.retirementPercent ?? stats.retirementPercent ?? 0;

  const summaryCards = [
    { label: 'Total apps', value: stats.mappingCount },
    { label: 'DLT-only (retired)', value: retired },
    { label: 'Hybrid apps', value: hybrid },
    { label: 'Legacy route=q apps', value: legacy },
    { label: 'Retired from route=q', value: `${percent}%` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-4">
            <div className="text-xl font-bold">{card.value}</div>
            <div className="text-xs text-muted-foreground">{card.label}</div>
          </div>
        ))}
      </div>
      <RetirementTable mappings={mappings} />
    </div>
  );
}

function RetirementTable({ mappings }: { mappings: OtpMappingEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-4 py-3 text-left font-medium">App</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Policy</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((mapping) => (
            <tr key={mapping.appId} className="border-b last:border-0">
              <td className="px-4 py-3 font-mono">{mapping.appId}</td>
              <td className="px-4 py-3">{mapping.retirementStatus}</td>
              <td className="px-4 py-3 font-mono text-xs">{mapping.deliveryPolicy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
