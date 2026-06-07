import type { BusinessConfig } from '@/lib/business-config-types';

interface BusinessReadinessTableProps {
  businesses: BusinessConfig[];
}

function statusClass(status?: string) {
  switch (status) {
    case 'Production':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
    case 'Ready':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-400';
    case 'Draft':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
    case 'Invalid':
      return 'bg-red-500/15 text-red-700 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function BusinessReadinessTable({ businesses }: BusinessReadinessTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Business</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Validation</th>
            <th className="px-4 py-3 text-left font-medium">DLT</th>
            <th className="px-4 py-3 text-left font-medium">OTP</th>
          </tr>
        </thead>
        <tbody>
          {businesses.map((business) => (
            <tr key={business.businessId} className="border-b last:border-0">
              <td className="px-4 py-3">
                <div className="font-medium">{business.displayName}</div>
                <div className="font-mono text-xs text-muted-foreground">{business.businessId}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(business.readinessStatus)}`}>
                  {business.readinessStatus ?? 'Unknown'}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs">{business.validationStatus ?? '—'}</td>
              <td className="px-4 py-3 text-xs">
                {business.checklist?.dltMetadataComplete ? 'Complete' : 'Incomplete'}
              </td>
              <td className="px-4 py-3 text-xs">
                {business.checklist?.otpMappingConfigured
                  ? `${business.otpAppIds?.length ?? 0} app(s)`
                  : 'Not configured'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
