import Link from 'next/link';
import Image from 'next/image';
import { docsHref } from '@/lib/paths';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Image src="/elva-logo.png" alt="ELVA" width={56} height={56} className="rounded-lg" />
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        The documentation page you requested does not exist or is not part of the published navigation set.
      </p>
      <Link href={docsHref('')} className={cn(buttonVariants())}>
        Back to documentation
      </Link>
    </div>
  );
}
