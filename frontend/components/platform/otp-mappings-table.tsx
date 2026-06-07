import type { OtpMappingEntry } from '@/lib/business-config-types';
import { VariableTable } from '@/components/platform/variable-table';
import Link from 'next/link';

interface OtpMappingsTableProps {
  mappings: OtpMappingEntry[];
}

function StatusBadge({ active, ready }: { active: boolean; ready: boolean }) {
  if (active) {
    return (
      <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        Active DLT
      </span>
    );
  }
  if (ready) {
    return (
      <span className="inline-flex rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
        Rollout ready
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Legacy
    </span>
  );
}

export function OtpMappingsTable({ mappings }: OtpMappingsTableProps) {
  if (!mappings.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No OTP mappings configured in <code className="rounded bg-muted px-1">backend/config/otp-mappings.json</code>.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">App ID</th>
              <th className="px-4 py-3 text-left font-medium">Business</th>
              <th className="px-4 py-3 text-left font-medium">Template</th>
              <th className="px-4 py-3 text-left font-medium">DLT</th>
              <th className="px-4 py-3 text-left font-medium">Fallback</th>
              <th className="px-4 py-3 text-left font-medium">Mode</th>
              <th className="px-4 py-3 text-left font-medium">Retirement</th>
              <th className="px-4 py-3 text-left font-medium">Rollout</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping) => (
              <tr key={mapping.appId} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono">{mapping.appId}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/platform/businesses/${mapping.businessId}`}
                    className="text-primary hover:underline"
                  >
                    {mapping.displayName}
                  </Link>
                  <div className="font-mono text-xs text-muted-foreground">{mapping.businessId}</div>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/platform/businesses/${mapping.businessId}/${mapping.templateKey}`}
                    className="font-mono text-primary hover:underline"
                  >
                    {mapping.templateKey}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {mapping.dltEnabled ? 'enabled' : 'disabled'}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {mapping.fallbackAllowed ? 'enabled' : 'disabled'}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {mapping.deliveryPolicy === 'dlt_only'
                    ? 'DLT Only'
                    : mapping.deliveryPolicy === 'hybrid'
                      ? 'Hybrid'
                      : 'Legacy'}
                </td>
                <td className="px-4 py-3 text-xs">{mapping.retirementStatus}</td>
                <td className="px-4 py-3">
                  <StatusBadge active={mapping.activeDlt} ready={mapping.rolloutReady} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mappings.map((mapping) => (
        <section key={mapping.appId} className="rounded-lg border p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h3 className="font-mono text-lg font-semibold">{mapping.appId}</h3>
            <StatusBadge active={mapping.activeDlt} ready={mapping.rolloutReady} />
          </div>
          <p className="mb-4 text-sm text-muted-foreground">{mapping.purpose}</p>
          <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">DLT enabled</dt>
              <dd className="font-mono">{mapping.dltEnabled ? 'true' : 'false'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Legacy fallback</dt>
              <dd className="font-mono">{mapping.legacyRouteEnabled ? 'enabled' : 'disabled'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Delivery policy</dt>
              <dd className="font-mono">{mapping.deliveryPolicy}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Retirement status</dt>
              <dd className="font-mono">{mapping.retirementStatus}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Metadata complete</dt>
              <dd className="font-mono">{mapping.dltMetadataComplete ? 'yes' : 'no'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Rollout ready</dt>
              <dd className="font-mono">{mapping.rolloutReady ? 'yes' : 'no'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Message ID</dt>
              <dd className="font-mono">{mapping.messageId ?? mapping.templateId}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Template ID</dt>
              <dd className="font-mono">{mapping.templateId}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sender ID</dt>
              <dd className="font-mono">{mapping.senderId}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Entity ID</dt>
              <dd className="font-mono">{mapping.entityId}</dd>
            </div>
          </dl>
          <h4 className="mb-2 text-sm font-semibold">Variables</h4>
          <VariableTable variables={mapping.variables} />
        </section>
      ))}
    </div>
  );
}
