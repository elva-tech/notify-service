'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { NAVIGATION_PROGRESS_START } from '@/lib/navigation-progress-events';
import { cn } from '@/lib/utils';

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);

  function clearTimers() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  function startProgress() {
    clearTimers();
    startedRef.current = true;
    setActive(true);
    setProgress(12);

    timerRef.current = setInterval(() => {
      setProgress((value) => {
        if (value >= 92) return value;
        const step = value < 40 ? 6 : value < 75 ? 3 : 1;
        return Math.min(value + step, 92);
      });
    }, 280);
  }

  function finishProgress() {
    clearTimers();
    setProgress(100);
    hideTimerRef.current = setTimeout(() => {
      setActive(false);
      setProgress(0);
      startedRef.current = false;
    }, 320);
  }

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor?.href) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const next = new URL(anchor.href);
      if (next.origin !== window.location.origin) return;

      const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const destination = `${next.pathname}${next.search}`;
      if (destination === current) return;

      startProgress();
    };

    document.addEventListener('click', onClick, true);
    window.addEventListener(NAVIGATION_PROGRESS_START, startProgress);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener(NAVIGATION_PROGRESS_START, startProgress);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    if (startedRef.current) {
      finishProgress();
    }
    return clearTimers;
  }, [pathname, searchParams]);

  useEffect(() => () => clearTimers(), []);

  return (
    <div
      aria-hidden={!active}
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 transition-opacity duration-200',
        active ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className="h-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.55)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
