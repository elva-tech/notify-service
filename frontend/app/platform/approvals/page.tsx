import { ApprovalsGate } from '@/components/platform/approvals-gate';
import { ApprovalsPanel } from '@/components/platform/approvals-panel';

export const metadata = {
  title: 'Brand approvals | ELVA Notify Platform',
  description: 'Review and approve developer brand onboarding requests.',
};

export default function ApprovalsPage() {
  return (
    <ApprovalsGate>
      <article>
        <header className="mb-8 border-b pb-6">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Brand approvals</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Review pending integration requests. Approving writes an active brand to{' '}
            <code className="rounded bg-muted px-1">brand-registry.json</code> and emails the requester.
          </p>
        </header>

        <ApprovalsPanel />
      </article>
    </ApprovalsGate>
  );
}
