'use client';

import { useEffect, useState } from 'react';
import { Loader2, Lock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  clearOpsAdminToken,
  getOpsAdminToken,
  setOpsAdminToken,
  verifyOpsAdminToken,
} from '@/lib/integration-api';

interface ApprovalsGateProps {
  children: React.ReactNode;
}

type GateState = 'checking' | 'locked' | 'unlocked';

export function ApprovalsGate({ children }: ApprovalsGateProps) {
  const [gateState, setGateState] = useState<GateState>('checking');
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function validateToken(token: string): Promise<boolean> {
    const trimmed = token.trim();
    if (!trimmed) return false;

    const valid = await verifyOpsAdminToken(trimmed);
    if (!valid) {
      clearOpsAdminToken();
      return false;
    }

    setOpsAdminToken(trimmed);
    return true;
  }

  useEffect(() => {
    let cancelled = false;

    async function checkStoredSession() {
      const stored = getOpsAdminToken();
      if (!stored) {
        if (!cancelled) setGateState('locked');
        return;
      }

      try {
        const valid = await validateToken(stored);
        if (!cancelled) {
          setGateState(valid ? 'unlocked' : 'locked');
          if (!valid) setError('Session expired or invalid. Enter your ops admin token.');
        }
      } catch (err) {
        if (!cancelled) {
          setGateState('locked');
          setError(err instanceof Error ? err.message : 'Unable to verify access');
        }
      }
    }

    checkStoredSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUnlock(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const valid = await validateToken(tokenInput);
      if (!valid) {
        setError('Invalid ops admin token.');
        setGateState('locked');
        return;
      }

      setTokenInput('');
      setGateState('unlocked');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setGateState('locked');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSignOut() {
    clearOpsAdminToken();
    setTokenInput('');
    setError(null);
    setGateState('locked');
  }

  if (gateState === 'checking') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying access…
        </p>
      </div>
    );
  }

  if (gateState === 'locked') {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Ops admin required</h2>
              <p className="text-sm text-muted-foreground">This page is restricted to ELVA platform operators.</p>
            </div>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">OPS_ADMIN_TOKEN</span>
              <input
                required
                type="password"
                autoComplete="off"
                className="h-10 w-full rounded-md border bg-background px-3 font-mono text-sm outline-none ring-primary focus:ring-2"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter ops admin token"
              />
            </label>

            {error ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Unlock approvals
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            Token is verified against the backend and stored in this browser session only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <span className="text-muted-foreground">Signed in as ops admin</span>
        <Button type="button" variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
      {children}
    </div>
  );
}
