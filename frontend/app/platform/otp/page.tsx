import Link from 'next/link';
import { fetchPlatformOtpMetadata } from '@/lib/platform-api';
import { OtpMappingsTable } from '@/components/platform/otp-mappings-table';
import { OtpPlatformSummary } from '@/components/platform/otp-platform-summary';
import { OtpRolloutDashboard } from '@/components/platform/otp-rollout-dashboard';
import { OtpConfigHealth } from '@/components/platform/otp-config-health';
import { OtpRetirementGate } from '@/components/platform/otp-retirement-gate';
import { OtpRunbookLinks } from '@/components/platform/otp-runbook-links';
import { OtpDeliveryPolicy } from '@/components/platform/otp-delivery-policy';
import { OtpRetirementStatus } from '@/components/platform/otp-retirement-status';
import { docsHref } from '@/lib/paths';

export const dynamic = 'force-dynamic';

export default async function PlatformOtpPage() {
  const { otpMappings, otpHealth } = await fetchPlatformOtpMetadata();

  return (
    <article>
      <header className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight">OTP DLT Operations</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Operational visibility for OTP DLT rollout — loaded from{' '}
          <code className="rounded bg-muted px-1">GET /platform/otp</code> (backend registry + health snapshot).
        </p>
        <p className="mt-2 text-sm">
          See{' '}
          <Link href={docsHref('architecture/otp-dlt-observability')} className="text-primary hover:underline">
            OTP DLT observability
          </Link>
          {' · '}
          <Link href={docsHref('architecture/otp-dlt-migration')} className="text-primary hover:underline">
            migration architecture
          </Link>
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Summary</h2>
        <OtpPlatformSummary otpMappings={otpMappings} />
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Rollout overview</h2>
        <OtpRolloutDashboard otpMappings={otpMappings} otpHealth={otpHealth} />
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Configuration health</h2>
        <OtpConfigHealth otpHealth={otpHealth} />
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Delivery policy</h2>
        <OtpDeliveryPolicy mappings={otpMappings.mappings} />
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Retirement status</h2>
        <OtpRetirementStatus otpMappings={otpMappings} retirement={otpHealth?.retirement} />
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Retirement readiness gate</h2>
        <OtpRetirementGate otpHealth={otpHealth} />
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Runbooks &amp; references</h2>
        <OtpRunbookLinks />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Mapping table</h2>
        <OtpMappingsTable mappings={otpMappings.mappings} />
      </section>
    </article>
  );
}
