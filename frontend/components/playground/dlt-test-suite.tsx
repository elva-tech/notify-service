'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { History, PlayCircle, Search, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TemplateTestCard } from '@/components/playground/template-test-card';
import type { TemplateExecutionResult } from '@/components/playground/template-test-card.types';
import { parseApiFailureBody } from '@/components/playground/template-test-card.types';
import {
  clearDltExecutionHistory,
  loadDltExecutionHistory,
  pushDltExecutionHistory,
  type DltExecutionHistoryEntry,
} from '@/lib/dlt-execution-history';
import type { BusinessConfig } from '@/lib/business-config-types';
import {
  buildDefaultVariableValues,
  buildSuiteRequestPayload,
  getDeliveryType,
  getFormVariables,
  getSuiteApiPath,
  resolveDeliveryMode,
  searchMatchesTemplate,
  sortTemplatesForSuite,
  suiteTemplateAnchorId,
  validateTemplateVariables,
} from '@/lib/dlt-test-utils';
import { resolveBrandDisplayName } from '@/lib/playground-brand-utils';
import { cn } from '@/lib/utils';

interface DltTestSuiteProps {
  business: BusinessConfig;
  brands: Array<{
    brandId: string;
    brandName: string;
    status: string;
    otpPolicy?: { dltEnabled?: boolean; legacyRouteEnabled?: boolean };
  }>;
  globalDltEnabled: boolean;
  appId: string;
  apiKey: string;
  brandId: string;
  baseUrl: string;
  phone: string;
  onPhoneChange: (phone: string) => void;
  initialSearch?: string;
}

type SuiteRunStatus = 'pass' | 'fail' | 'skipped' | 'pending' | 'running';

export function DltTestSuite({
  business,
  brands,
  globalDltEnabled,
  appId,
  apiKey,
  brandId,
  baseUrl,
  phone,
  onPhoneChange,
  initialSearch = '',
}: DltTestSuiteProps) {
  const templates = useMemo(() => sortTemplatesForSuite(business.templates), [business.templates]);
  const suiteOrder = useMemo(() => templates.map((template) => template.templateKey), [templates]);

  const brandDisplayName = useMemo(
    () => resolveBrandDisplayName(brands, brandId),
    [brands, brandId],
  );

  const [liveMode, setLiveMode] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const [history, setHistory] = useState<DltExecutionHistoryEntry[]>([]);
  const [suiteRunning, setSuiteRunning] = useState(false);
  const [suiteProgress, setSuiteProgress] = useState<Record<string, SuiteRunStatus>>({});
  const [cardVariables, setCardVariables] = useState<Record<string, Record<string, string>>>(() => {
    const map: Record<string, Record<string, string>> = {};
    for (const template of business.templates) {
      const defaults = buildDefaultVariableValues(template, resolveBrandDisplayName(brands, brandId));
      delete defaults.otp;
      map[template.templateKey] = defaults;
    }
    return map;
  });

  useEffect(() => {
    setHistory(loadDltExecutionHistory());
  }, []);

  useEffect(() => {
    const map: Record<string, Record<string, string>> = {};
    for (const template of business.templates) {
      const defaults = buildDefaultVariableValues(template, brandDisplayName);
      delete defaults.otp;
      map[template.templateKey] = defaults;
    }
    setCardVariables(map);
    setSuiteProgress({});
  }, [business.businessId, business.templates, brandDisplayName]);

  useEffect(() => {
    if (!initialSearch) return;
    setSearch(initialSearch);
    scrollToTemplate(initialSearch.trim());
  }, [initialSearch, business.businessId]);

  const filteredTemplates = useMemo(
    () => templates.filter((template) => searchMatchesTemplate(template, search)),
    [templates, search],
  );

  const suiteSummary = useMemo(() => {
    const statuses = suiteOrder.map((key) => suiteProgress[key] ?? 'pending');
    return {
      passed: statuses.filter((status) => status === 'pass').length,
      failed: statuses.filter((status) => status === 'fail').length,
      skipped: statuses.filter((status) => status === 'skipped').length,
      total: suiteOrder.length,
    };
  }, [suiteOrder, suiteProgress]);

  function scrollToTemplate(templateKey: string) {
    setHighlightKey(templateKey);
    document.getElementById(suiteTemplateAnchorId(business.businessId, templateKey))?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    setTimeout(() => setHighlightKey(null), 2500);
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    const match = templates.find(
      (template) => template.templateKey.toLowerCase() === search.trim().toLowerCase(),
    );
    if (match) scrollToTemplate(match.templateKey);
  }

  const recordHistory = useCallback(
    (templateKey: string, result: TemplateExecutionResult) => {
      const template = business.templates.find((item) => item.templateKey === templateKey);
      const entry = pushDltExecutionHistory({
        timestamp: new Date().toISOString(),
        businessId: business.businessId,
        templateKey,
        phone: phone.trim(),
        status: result.status === 'pass' ? 'PASS' : result.status === 'skipped' ? 'SKIPPED' : 'FAIL',
        httpStatus: result.httpStatus,
        requestId: result.requestId,
        deliveryMode:
          result.deliveryMode ||
          (template
            ? resolveDeliveryMode(brandId, template, brands, globalDltEnabled)
            : 'unknown'),
        liveMode,
      });
      setHistory(entry);
    },
    [brandId, business.businessId, business.templates, globalDltEnabled, liveMode, brands, phone],
  );

  async function executeTemplate(template: (typeof templates)[number]): Promise<TemplateExecutionResult> {
    const variables = cardVariables[template.templateKey] ?? buildDefaultVariableValues(template);
    const deliveryMode = resolveDeliveryMode(brandId, template, brands, globalDltEnabled);
    const validation = validateTemplateVariables(template, variables);

    if (!validation.ok) {
      return {
        status: 'fail',
        httpStatus: null,
        responseJson: JSON.stringify({ success: false, error: 'validation_error', message: validation.message }, null, 2),
        requestId: null,
        deliveryMode,
        elapsedMs: null,
        errorMessage: validation.message,
      };
    }

    if (!phone.trim()) {
      return {
        status: 'fail',
        httpStatus: null,
        responseJson: JSON.stringify({ success: false, error: 'validation_error', message: 'phone is required' }, null, 2),
        requestId: null,
        deliveryMode,
        elapsedMs: null,
        errorMessage: 'phone is required',
      };
    }

    if (!liveMode) {
      return {
        status: 'pass',
        httpStatus: null,
        responseJson: JSON.stringify({ dryRun: true, message: 'Validation passed', templateKey: template.templateKey }, null, 2),
        requestId: null,
        deliveryMode,
        elapsedMs: 0,
        errorMessage: null,
      };
    }

    if (!appId.trim() || !apiKey.trim()) {
      return {
        status: 'fail',
        httpStatus: null,
        responseJson: JSON.stringify({ success: false, error: 'validation_error', message: 'appId and apiKey required' }, null, 2),
        requestId: null,
        deliveryMode,
        elapsedMs: null,
        errorMessage: 'appId and apiKey required',
      };
    }

    if (!brandId.trim()) {
      return {
        status: 'fail',
        httpStatus: null,
        responseJson: JSON.stringify({ success: false, error: 'validation_error', message: 'brandId is required for OTP and SMS notify' }, null, 2),
        requestId: null,
        deliveryMode,
        elapsedMs: null,
        errorMessage: 'brandId is required for OTP and SMS notify',
      };
    }

    const payload = buildSuiteRequestPayload(business.businessId, template, {
      appId,
      apiKey,
      brandId,
      phone,
      variables,
      brandDisplayName,
    });
    const path = getSuiteApiPath(template);
    const start = Date.now();
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const elapsedMs = Date.now() - start;
    const body = (await res.json()) as Record<string, unknown>;
    const ok = res.ok && body.success !== false;
    const parsed = parseApiFailureBody(body);

    return {
      status: ok ? 'pass' : 'fail',
      httpStatus: res.status,
      responseJson: JSON.stringify(body, null, 2),
      requestId: parsed.requestId,
      deliveryMode,
      elapsedMs,
      errorMessage: ok ? null : parsed.errorMessage ?? parsed.errorCode ?? 'failed',
      errorCode: ok ? null : parsed.errorCode,
      provider: ok ? null : parsed.provider,
    };
  }

  async function runFullSuite() {
    setSuiteRunning(true);
    const progress: Record<string, SuiteRunStatus> = {};
    for (const key of suiteOrder) progress[key] = 'pending';
    setSuiteProgress({ ...progress });

    for (const template of templates) {
      progress[template.templateKey] = 'running';
      setSuiteProgress({ ...progress });
      scrollToTemplate(template.templateKey);

      const result = await executeTemplate(template);
      progress[template.templateKey] = result.status === 'pass' ? 'pass' : 'fail';
      setSuiteProgress({ ...progress });
      recordHistory(template.templateKey, result);

      if (result.status !== 'pass') {
        const index = suiteOrder.indexOf(template.templateKey);
        for (const remaining of suiteOrder.slice(index + 1)) progress[remaining] = 'skipped';
        setSuiteProgress({ ...progress });
        setSuiteRunning(false);
        return;
      }
    }

    setSuiteRunning(false);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-gradient-to-br from-violet-500/5 via-background to-sky-500/5 p-4 sm:p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">DLT Test Suite</p>
        <h2 className="text-2xl font-bold tracking-tight">DLT Templates — {business.displayName}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Loaded from <code className="rounded bg-muted px-1">GET /platform/businesses/{business.businessId}</code>.
          Dry Run validates locally; Live DLT calls the backend. OTP SMS/email branding uses registry brandName for{' '}
          <code className="rounded bg-muted px-1">{brandId.trim() || 'brandId'}</code>
          {brandDisplayName ? ` (${brandDisplayName})` : ''}.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border bg-muted/40 p-1">
            <button type="button" onClick={() => setLiveMode(false)} className={cn('rounded-md px-3 py-1.5 text-xs font-semibold', !liveMode ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
              Dry Run
            </button>
            <button type="button" onClick={() => setLiveMode(true)} className={cn('flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold', liveMode ? 'bg-background text-amber-700 shadow-sm dark:text-amber-300' : 'text-muted-foreground')}>
              <Zap className="h-3.5 w-3.5" />
              Live DLT
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <span className="font-medium text-muted-foreground">Test phone</span>
            <input className="h-8 w-40 rounded-md border bg-background px-2 font-mono text-xs outline-none ring-primary focus:ring-2 sm:w-48" value={phone} onChange={(event) => onPhoneChange(event.target.value)} placeholder="919876543210" spellCheck={false} />
          </label>
          <Button type="button" size="sm" onClick={runFullSuite} disabled={suiteRunning || !baseUrl}>
            <PlayCircle className="h-4 w-4" />
            Run Full Test Suite
          </Button>
        </div>

        {Object.keys(suiteProgress).length > 0 ? (
          <div className="mt-4 rounded-lg border bg-card p-3">
            <p className="mb-2 text-xs font-semibold">
              Suite progress: {suiteSummary.passed}/{suiteSummary.total} passed
            </p>
            <ul className="flex flex-wrap gap-2">
              {suiteOrder.map((key) => (
                <li key={key} className={cn('rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase', suiteProgress[key] === 'pass' && 'bg-emerald-500/15 text-emerald-700', suiteProgress[key] === 'fail' && 'bg-red-500/15 text-red-700', suiteProgress[key] === 'skipped' && 'bg-muted text-muted-foreground', suiteProgress[key] === 'running' && 'bg-primary/15 text-primary', suiteProgress[key] === 'pending' && 'border text-muted-foreground')}>
                  {key}: {suiteProgress[key] ?? 'pending'}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="border-b bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Template Key</th>
              <th className="px-3 py-2 font-medium">Purpose</th>
              <th className="px-3 py-2 font-medium">Template ID</th>
              <th className="px-3 py-2 font-medium">Sender ID</th>
              <th className="px-3 py-2 font-medium">Entity ID</th>
              <th className="px-3 py-2 font-medium">Variables</th>
              <th className="px-3 py-2 font-medium">Delivery Type</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.templateKey} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <button type="button" className="font-mono font-semibold text-primary hover:underline" onClick={() => scrollToTemplate(template.templateKey)}>
                    {template.templateKey}
                  </button>
                </td>
                <td className="max-w-[180px] px-3 py-2 text-muted-foreground">{template.purpose}</td>
                <td className="px-3 py-2 font-mono">{template.templateId}</td>
                <td className="px-3 py-2 font-mono">{template.senderId}</td>
                <td className="px-3 py-2 font-mono">{template.entityId}</td>
                <td className="px-3 py-2 font-mono">
                  {getFormVariables(template).map((variable) => variable.name).join(', ') || 'otp (server-generated)'}
                </td>
                <td className="px-3 py-2">{getDeliveryType(template)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none ring-primary focus:ring-2" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search template key…" spellCheck={false} />
        </div>
        <Button type="submit" variant="outline" size="sm">Go to template</Button>
      </form>

      <div className="space-y-6">
        {filteredTemplates.map((template) => (
          <TemplateTestCard
            key={template.templateKey}
            businessId={business.businessId}
            template={template}
            appId={appId}
            apiKey={apiKey}
            brandId={brandId}
            phone={phone}
            baseUrl={baseUrl}
            liveMode={liveMode}
            highlighted={highlightKey === template.templateKey}
            variables={cardVariables[template.templateKey] ?? {}}
            brands={brands}
            globalDltEnabled={globalDltEnabled}
            onVariablesChange={(next) => setCardVariables((prev) => ({ ...prev, [template.templateKey]: next }))}
            onResult={(result) => recordHistory(template.templateKey, result)}
          />
        ))}
      </div>

      {history.length > 0 ? (
        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Execution history (last 20)</h3>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={() => { clearDltExecutionHistory(); setHistory([]); }}>
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium">Time</th>
                  <th className="px-2 py-2 font-medium">Template Group</th>
                  <th className="px-2 py-2 font-medium">Template</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">HTTP</th>
                  <th className="px-2 py-2 font-medium">Request ID</th>
                  <th className="px-2 py-2 font-medium">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-2 py-2 font-mono text-muted-foreground">{new Date(row.timestamp).toLocaleString()}</td>
                    <td className="px-2 py-2 font-mono">{row.businessId}</td>
                    <td className="px-2 py-2 font-mono">{row.templateKey}</td>
                    <td className="px-2 py-2">{row.status}</td>
                    <td className="px-2 py-2 font-mono">{row.httpStatus ?? '—'}</td>
                    <td className="px-2 py-2 font-mono">{row.requestId ?? '—'}</td>
                    <td className="px-2 py-2 font-mono">{row.deliveryMode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
