import { OnboardForm } from '@/components/onboard/onboard-form';

export const metadata = {
  title: 'Request brand access | ELVA Notify',
  description: 'Submit a brand onboarding request for ELVA Notify OTP and SMS APIs.',
};

export default function OnboardPage() {
  return (
    <article>
      <header className="mb-8 border-b pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Developer onboarding</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Request brand access</h1>
        <p className="mt-3 text-muted-foreground">
          Submit your team details and choose DLT templates. The ELVA team will review your request.
          After approval, you will receive <code className="rounded bg-muted px-1">appId</code> and{' '}
          <code className="rounded bg-muted px-1">apiKey</code> by email for your approved templates, along with your{' '}
          <code className="rounded bg-muted px-1">brandId</code>.
        </p>
      </header>

      <OnboardForm />
    </article>
  );
}
