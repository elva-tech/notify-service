import type { OtpMappingEntry } from '@/lib/business-config-types';

interface OtpDeliveryPolicyProps {
  mappings: OtpMappingEntry[];
}

export function OtpDeliveryPolicy({ mappings }: OtpDeliveryPolicyProps) {
  if (!mappings.length) {
    return <p className="text-sm text-muted-foreground">No OTP mappings configured.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-4 py-3 text-left font-medium">App</th>
            <th className="px-4 py-3 text-left font-medium">DLT</th>
            <th className="px-4 py-3 text-left font-medium">Fallback</th>
            <th className="px-4 py-3 text-left font-medium">Mode</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((mapping) => (
            <tr key={mapping.appId} className="border-b last:border-0">
              <td className="px-4 py-3 font-mono">{mapping.appId}</td>
              <td className="px-4 py-3">{mapping.dltEnabled ? 'enabled' : 'disabled'}</td>
              <td className="px-4 py-3">{mapping.fallbackAllowed ? 'enabled' : 'disabled'}</td>
              <td className="px-4 py-3 font-mono text-xs">
                {mapping.deliveryPolicy === 'dlt_only' ? 'DLT Only' : mapping.deliveryPolicy === 'hybrid' ? 'Hybrid' : 'Legacy'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
