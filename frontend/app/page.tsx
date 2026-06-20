import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Layers, Shield, Zap } from 'lucide-react';
import { readManifest } from '@/lib/manifest';
import { readOpenApiManifest } from '@/lib/openapi-loader';
import { docsHref } from '@/lib/paths';
import { SiteHeader } from '@/components/docs/site-header';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FEATURE_CARDS = [
  {
    icon: Zap,
    title: 'OTP',
    text: 'Generate, resend, and verify one-time passwords over SMS or email.',
    href: docsHref('api/otp'),
  },
  {
    icon: Layers,
    title: 'DLT SMS',
    text: 'Send India-compliant templated SMS via registered business modules.',
    href: '/platform/businesses',
  },
  {
    icon: Shield,
    title: 'Authentication',
    text: 'ELVA-issued appId and apiKey plus brandId for your approved integration.',
    href: docsHref('api/authentication'),
  },
  {
    icon: BookOpen,
    title: 'API Docs',
    text: 'Notify, OTP, error codes, and architecture lifecycle guides.',
    href: docsHref(''),
  },
] as const;

export default function LandingPage() {
  const docsManifest = readManifest();
  const openApiManifest = readOpenApiManifest();

  return (
    <div className="min-h-screen">
      <SiteHeader docsManifest={docsManifest} openApiManifest={openApiManifest} />
      <main>
        <section className="mx-auto max-w-6xl px-3 py-10 text-center sm:px-4 sm:py-16 md:py-20">
          <Image
            src="/elva-logo.png"
            alt="ELVA"
            width={72}
            height={72}
            className="mx-auto mb-6 rounded-xl shadow-sm"
            priority
          />
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">ELVA Notify Platform v2</p>
          <h1 className="mx-auto max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            OTP, SMS, DLT, and notification APIs for ELVA applications
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg">
            ELVA Notify is a production backend for Fast2SMS and email delivery. Use the playground to test
            APIs, read the docs to integrate, and use the platform dashboard for DLT operations.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/playground" className={cn(buttonVariants({ size: 'lg' }))}>
              Open API playground
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/onboard" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              Request brand access
            </Link>
            <Link
              href={docsHref('getting-started/end-to-end-integration-guide')}
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
            >
              Integration guide
            </Link>
            <Link href={docsHref('')} className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              Browse documentation
            </Link>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-10 sm:py-16">
          <div className="mx-auto grid max-w-6xl gap-4 px-3 sm:gap-6 sm:px-4 md:grid-cols-2 lg:grid-cols-4">
            {FEATURE_CARDS.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-xl border bg-card p-6 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                <item.icon className="mb-4 h-8 w-8 text-primary" />
                <h2 className="mb-2 text-lg font-semibold">{item.title}</h2>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
