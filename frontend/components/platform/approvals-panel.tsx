'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  approveIntegrationRequest,
  fetchAdminIntegrationRequests,
  getOpsAdminToken,
  rejectIntegrationRequest,
  type BrandRequestAdmin,
} from '@/lib/integration-api';

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

export function ApprovalsPanel() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [requests, setRequests] = useState<BrandRequestAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [reviewedBy, setReviewedBy] = useState('');

  const loadRequests = useCallback(async () => {
    const activeToken = getOpsAdminToken();
    if (!activeToken) return;

    setLoading(true);
    setError(null);
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const rows = await fetchAdminIntegrationRequests(activeToken, status);
      setRequests(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function handleApprove(requestId: string) {
    const activeToken = getOpsAdminToken();
    if (!activeToken) return;

    setActionId(requestId);
    setError(null);
    try {
      await approveIntegrationRequest(activeToken, requestId, {
        reviewedBy: reviewedBy.trim() || undefined,
      });
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(requestId: string) {
    const activeToken = getOpsAdminToken();
    const reason = (rejectReason[requestId] ?? '').trim();
    if (!activeToken || !reason) {
      setError('A rejection reason is required.');
      return;
    }

    setActionId(requestId);
    setError(null);
    try {
      await rejectIntegrationRequest(activeToken, requestId, {
        reason,
        reviewedBy: reviewedBy.trim() || undefined,
      });
      setRejectReason((prev) => ({ ...prev, [requestId]: '' }));
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <label className="block max-w-sm space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Reviewed by (optional)</span>
        <input
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-primary focus:ring-2"
          value={reviewedBy}
          onChange={(e) => setReviewedBy(e.target.value)}
          placeholder="Your name"
        />
      </label>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(['pending', 'approved', 'rejected', 'all'] as StatusFilter[]).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={statusFilter === value ? 'default' : 'outline'}
                onClick={() => setStatusFilter(value)}
              >
                {value}
              </Button>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={loadRequests} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {loading && requests.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading requests…
          </p>
        ) : null}

        {!loading && requests.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            No {statusFilter === 'all' ? '' : statusFilter} requests.
          </p>
        ) : null}

        <div className="space-y-4">
          {requests.map((request) => (
            <article key={request.id} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {request.status}
                    {request.source === 'registry_seed' ? (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-normal normal-case text-muted-foreground">
                        Pre-seeded
                      </span>
                    ) : null}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">
                    {request.brandName}{' '}
                    <span className="font-mono text-base text-muted-foreground">({request.brandId})</span>
                  </h3>
                </div>
                <p className="font-mono text-xs text-muted-foreground">{request.id}</p>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Requester</dt>
                  <dd>
                    {request.submittedBy.name} · {request.submittedBy.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Team</dt>
                  <dd>{request.submittedBy.team}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Submitted</dt>
                  <dd>{new Date(request.submittedAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">OTP templates</dt>
                  <dd className="font-mono">{request.templates.otp.join(', ') || 'none'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Notify templates</dt>
                  <dd className="font-mono">{request.templates.notify.join(', ') || 'none'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">OTP policy</dt>
                  <dd className="font-mono text-xs">
                    {request.otpPolicy.templateKey} · DLT {request.otpPolicy.dltEnabled ? 'on' : 'off'} · legacy{' '}
                    {request.otpPolicy.legacyRouteEnabled ? 'on' : 'off'}
                  </dd>
                </div>
              </dl>

              {request.submittedBy.notes ? (
                <p className="mt-3 rounded-md bg-muted/50 p-3 text-sm">
                  <span className="font-medium">Notes:</span> {request.submittedBy.notes}
                </p>
              ) : null}

              {request.status === 'pending' ? (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Rejection reason</span>
                    <input
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-primary focus:ring-2"
                      value={rejectReason[request.id] ?? ''}
                      onChange={(e) =>
                        setRejectReason((prev) => ({ ...prev, [request.id]: e.target.value }))
                      }
                      placeholder="Required only if rejecting"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={actionId === request.id}
                      onClick={() => handleApprove(request.id)}
                    >
                      {actionId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Approve & activate brand
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-red-500/40 text-red-700 hover:bg-red-500/10 dark:text-red-300"
                      disabled={actionId === request.id}
                      onClick={() => handleReject(request.id)}
                    >
                      {actionId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>
              ) : null}

              {request.status === 'rejected' && request.rejectionReason ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  <span className="font-medium">Rejection:</span> {request.rejectionReason}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
