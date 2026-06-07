import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function BrandLogo({ className, showText = true, size = 36 }: BrandLogoProps) {
  return (
    <Link
      href="/"
      className={cn('flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90', className)}
    >
      <Image
        src="/elva-logo.png"
        alt="ELVA"
        width={size}
        height={size}
        className="rounded-md"
        priority
      />
      {showText ? (
        <span className="hidden font-semibold tracking-tight sm:inline">ELVA Notify</span>
      ) : null}
    </Link>
  );
}
