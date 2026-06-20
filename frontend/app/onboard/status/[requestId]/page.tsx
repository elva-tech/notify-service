import { RequestStatusPanel } from '@/components/onboard/request-status-panel';

interface PageProps {
  params: Promise<{ requestId: string }>;
}

export const metadata = {
  title: 'Request status | ELVA Notify',
};

export default async function OnboardStatusPage({ params }: PageProps) {
  const { requestId } = await params;

  return (
    <article>
      <header className="mb-8 border-b pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Developer onboarding</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Request status</h1>
        <p className="mt-3 text-muted-foreground">
          Track your brand onboarding request. Bookmark this page to check approval progress.
        </p>
      </header>

      <RequestStatusPanel requestId={requestId} />
    </article>
  );
}
