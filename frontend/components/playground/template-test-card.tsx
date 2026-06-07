'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Loader2, Play, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MethodBadge } from '@/components/api/method-badge';
import type { BusinessTemplate, OtpMappingEntry } from '@/lib/business-config-types';
import {
  buildFast2SmsPreview,
  buildResolvedVariableRows,
  buildSuiteCurl,
  buildSuiteRequestPayload,
  buildVariablesPipe,
  getDeliveryType,
  getFormVariables,
  getSuiteApiPath,
  isOtpTemplate,
  resolveDeliveryMode,
  suiteTemplateAnchorId,
  validateTemplateVariables,
  type Fast2SmsPreview,
} from '@/lib/dlt-test-utils';
import { cn } from '@/lib/utils';
import type { TemplateExecutionResult } from '@/components/playground/template-test-card.types';
import { maskDltPayloadVariables, parseApiFailureBody } from '@/components/playground/template-test-card.types';

interface TemplateTestCardProps {
  businessId: string;
  template: BusinessTemplate;
  appId: string;
  apiKey: string;
  phone: string;
  baseUrl: string;
  liveMode: boolean;
  highlighted: boolean;
  variables: Record<string, string>;
  otpMappings: OtpMappingEntry[];
  globalDltEnabled: boolean;
  onVariablesChange: (variables: Record<string, string>) => void;
  externalResult?: TemplateExecutionResult;
  onExecute?: () => Promise<TemplateExecutionResult>;
  onResult?: (result: TemplateExecutionResult) => void;
}

const idleResult: TemplateExecutionResult = {
  status: 'idle',
  httpStatus: null,
  responseJson: '',
  requestId: null,
  deliveryMode: '',
  elapsedMs: null,
  errorMessage: null,
};

function buildExecutionResult(
  ok: boolean,
  res: Response,
  body: Record<string, unknown>,
  deliveryModeLabel: string,
  elapsedMs: number,
): TemplateExecutionResult {
  const parsed = parseApiFailureBody(body);
  return {
    status: ok ? 'pass' : 'fail',
    httpStatus: res.status,
    responseJson: JSON.stringify(body, null, 2),
    requestId: parsed.requestId,
    deliveryMode: deliveryModeLabel,
    elapsedMs,
    errorMessage: ok ? null : parsed.errorMessage ?? parsed.errorCode ?? 'Request failed',
    errorCode: ok ? null : parsed.errorCode,
    provider: ok ? null : parsed.provider,
  };
}

export function TemplateTestCard({
  businessId,
  template,
  appId,
  apiKey,
  phone,
  baseUrl,
  liveMode,
  highlighted,
  variables,
  otpMappings,
  globalDltEnabled,
  onVariablesChange,
  externalResult,
  onExecute,
  onResult,
}: TemplateTestCardProps) {
  const [result, setResult] = useState<TemplateExecutionResult>(idleResult);
  const [copied, setCopied] = useState<'payload' | 'curl' | null>(null);
  const [running, setRunning] = useState(false);

  const displayResult = externalResult ?? result;
  const deliveryType = getDeliveryType(template);
  const apiPath = getSuiteApiPath(template);
  const formVariables = getFormVariables(template);
  const deliveryModeLabel = resolveDeliveryMode(appId, template, otpMappings, globalDltEnabled);

  const payload = useMemo(
    () => buildSuiteRequestPayload(businessId, template, { appId, apiKey, phone, variables }),
    [businessId, template, appId, apiKey, phone, variables],
  );

  const payloadJson = useMemo(() => JSON.stringify(payload, null, 2), [payload]);
  const curl = useMemo(
    () => (baseUrl ? buildSuiteCurl(baseUrl, template, payload) : ''),
    [baseUrl, template, payload],
  );

  const pipePreview = useMemo(() => buildVariablesPipe(template, variables), [template, variables]);
  const resolvedVariables = useMemo(
    () => buildResolvedVariableRows(template, variables),
    [template, variables],
  );
  const fast2smsPreview = useMemo(
    (): Fast2SmsPreview => buildFast2SmsPreview(template, variables, phone.trim() || '919876543210'),
    [template, variables, phone],
  );

  async function copyText(text: string, kind: 'payload' | 'curl') {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  }

  async function runExecute() {
    if (onExecute) {
      setRunning(true);
      try {
        const next = await onExecute();
        setResult(next);
        onResult?.(next);
      } finally {
        setRunning(false);
      }
      return;
    }

    const validation = validateTemplateVariables(template, variables);
    if (!validation.ok) {
      const fail: TemplateExecutionResult = {
        status: 'fail',
        httpStatus: null,
        responseJson: JSON.stringify({ success: false, error: 'validation_error', message: validation.message }, null, 2),
        requestId: null,
        deliveryMode: deliveryModeLabel,
        elapsedMs: null,
        errorMessage: validation.message,
      };
      setResult(fail);
      onResult?.(fail);
      return;
    }

    if (!phone.trim()) {
      const fail: TemplateExecutionResult = {
        status: 'fail',
        httpStatus: null,
        responseJson: JSON.stringify({ success: false, error: 'validation_error', message: 'phone is required' }, null, 2),
        requestId: null,
        deliveryMode: deliveryModeLabel,
        elapsedMs: null,
        errorMessage: 'phone is required',
      };
      setResult(fail);
      onResult?.(fail);
      return;
    }

    if (!liveMode) {
      const pass: TemplateExecutionResult = {
        status: 'pass',
        httpStatus: null,
        responseJson: JSON.stringify(
          {
            dryRun: true,
            message: 'Validation passed — no API call in Dry Run mode',
            businessId,
            templateKey: template.templateKey,
            fast2smsPreview,
            variablesPipe: pipePreview,
          },
          null,
          2,
        ),
        requestId: null,
        deliveryMode: deliveryModeLabel,
        elapsedMs: 0,
        errorMessage: null,
      };
      setResult(pass);
      onResult?.(pass);
      return;
    }

    if (!appId.trim() || !apiKey.trim()) {
      const fail: TemplateExecutionResult = {
        status: 'fail',
        httpStatus: null,
        responseJson: JSON.stringify({ success: false, error: 'validation_error', message: 'appId and apiKey are required' }, null, 2),
        requestId: null,
        deliveryMode: deliveryModeLabel,
        elapsedMs: null,
        errorMessage: 'appId and apiKey are required',
      };
      setResult(fail);
      onResult?.(fail);
      return;
    }

    setRunning(true);
    setResult({ ...idleResult, status: 'running', deliveryMode: deliveryModeLabel });

    try {
      const start = Date.now();
      const res = await fetch(`${baseUrl}${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const elapsedMs = Date.now() - start;
      const contentType = res.headers.get('content-type') ?? '';
      let body: Record<string, unknown>;
      if (contentType.includes('application/json')) {
        body = (await res.json()) as Record<string, unknown>;
      } else {
        body = { raw: await res.text() };
      }

      const ok = res.ok && body.success !== false;
      const next = buildExecutionResult(ok, res, body, deliveryModeLabel, elapsedMs);
      setResult(next);
      onResult?.(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      const fail: TemplateExecutionResult = {
        status: 'fail',
        httpStatus: 0,
        responseJson: JSON.stringify({ success: false, error: 'network_error', message }, null, 2),
        requestId: null,
        deliveryMode: deliveryModeLabel,
        elapsedMs: null,
        errorMessage: message,
      };
      setResult(fail);
      onResult?.(fail);
    } finally {
      setRunning(false);
    }
  }

  return (
    <article
      id={suiteTemplateAnchorId(businessId, template.templateKey)}
      className={cn(
        'scroll-mt-24 rounded-xl border bg-card shadow-sm transition-shadow',
        highlighted && 'ring-2 ring-primary/60',
        displayResult.status === 'pass' && 'border-emerald-500/40',
        displayResult.status === 'fail' && 'border-red-500/40',
      )}
    >
      <header className="border-b px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-mono text-base font-bold">{template.templateKey}</h3>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  deliveryType === 'OTP DLT'
                    ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300'
                    : 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
                )}
              >
                {deliveryType}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{template.purpose}</p>
          </div>
          <div className="flex items-center gap-2">
            <MethodBadge method="POST" />
            <code className="font-mono text-xs">{apiPath}</code>
          </div>
        </div>
      </header>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-2">
        <div className="space-y-4">
          <MetadataPanel businessId={businessId} template={template} pipePreview={pipePreview} deliveryMode={deliveryModeLabel} />
          <DltPreviewPanel preview={fast2smsPreview} resolvedVariables={resolvedVariables} pipePreview={pipePreview} />
          <DltPayloadDebugPanel preview={fast2smsPreview} maskOtp={isOtpTemplate(template)} />
          <VariableForm
            variables={formVariables}
            values={variables}
            onChange={(name, value) => onVariablesChange({ ...variables, [name]: value })}
            otpTemplate={isOtpTemplate(template)}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => copyText(payloadJson, 'payload')}>
              {copied === 'payload' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copy Payload
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={!curl} onClick={() => copyText(curl, 'curl')}>
              {copied === 'curl' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copy cURL
            </Button>
            <Button type="button" size="sm" onClick={runExecute} disabled={running}>
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : liveMode ? <Zap className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {running ? 'Running…' : liveMode ? 'Execute Test (Live)' : 'Execute Test (Dry Run)'}
            </Button>
          </div>
        </div>
        <ExecutionResultPanel result={displayResult} liveMode={liveMode} />
      </div>
    </article>
  );
}

function MetadataPanel({
  businessId,
  template,
  pipePreview,
  deliveryMode,
}: {
  businessId: string;
  template: BusinessTemplate;
  pipePreview: string;
  deliveryMode: string;
}) {
  return (
    <section className="rounded-lg border bg-muted/20 p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">DLT metadata</h4>
      <dl className="grid gap-1.5 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Template Group</dt>
          <dd className="font-mono">{businessId}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Template Key</dt>
          <dd className="font-mono">{template.templateKey}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Message ID</dt>
          <dd className="font-mono">{template.messageId ?? template.templateId}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Template ID</dt>
          <dd className="font-mono">{template.templateId}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Sender ID</dt>
          <dd className="font-mono">{template.senderId}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Entity ID</dt>
          <dd className="font-mono">{template.entityId}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Variable pipe order</dt>
          <dd className="font-mono break-all">{pipePreview}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Expected delivery mode</dt>
          <dd className="font-mono">{deliveryMode}</dd>
        </div>
      </dl>
    </section>
  );
}

function VariableForm({
  variables,
  values,
  onChange,
  otpTemplate,
}: {
  variables: BusinessTemplate['variables'];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  otpTemplate: boolean;
}) {
  return (
    <section className="rounded-lg border p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Variables</h4>
      {otpTemplate && variables.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No template inputs — ELVA generates the OTP server-side on <code>POST /otp/send</code>.
        </p>
      ) : (
        <div className="space-y-3">
          {variables.map((variable) => (
            <label key={variable.name} className="block space-y-1">
              <span className="text-xs font-medium">
                {variable.name}
                {variable.required ? ' *' : ''}
                {variable.format ? <span className="ml-1 font-normal text-muted-foreground">({variable.format})</span> : null}
              </span>
              <input
                className="h-9 w-full rounded-md border bg-background px-3 font-mono text-sm outline-none ring-primary focus:ring-2"
                value={values[variable.name] ?? ''}
                onChange={(event) => onChange(variable.name, event.target.value)}
                placeholder={variable.format ?? variable.type}
                spellCheck={false}
              />
            </label>
          ))}
        </div>
      )}
    </section>
  );
}

function DltPreviewPanel({
  preview,
  resolvedVariables,
  pipePreview,
}: {
  preview: Fast2SmsPreview;
  resolvedVariables: ReturnType<typeof buildResolvedVariableRows>;
  pipePreview: string;
}) {
  return (
    <section className="rounded-lg border bg-muted/20 p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Fast2SMS Payload
      </h4>
      <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed">
        {JSON.stringify(preview, null, 2)}
      </pre>
      <div className="mt-4 space-y-2">
        <h5 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Resolved variable order
        </h5>
        <dl className="space-y-1 text-[11px]">
          {resolvedVariables.map((row) => (
            <div key={row.name} className="grid grid-cols-[auto_1fr] gap-x-3 font-mono">
              <dt className="text-muted-foreground">
                {row.name} <span className="text-[10px]">(pos {row.position})</span>
              </dt>
              <dd>{row.masked ? '******' : row.value || '—'}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[11px] text-muted-foreground">
          Pipe:{' '}
          <code className="font-mono">
            {pipePreview
              .split('|')
              .map((segment) => (segment === '<generated>' || /^\d{4,8}$/.test(segment) ? '******' : segment))
              .join('|')}
          </code>
        </p>
      </div>
    </section>
  );
}

function DltPayloadDebugPanel({
  preview,
  maskOtp,
}: {
  preview: Fast2SmsPreview;
  maskOtp: boolean;
}) {
  const maskedPayload = maskDltPayloadVariables(preview as unknown as Record<string, unknown>, maskOtp);

  return (
    <details className="rounded-lg border bg-muted/10 p-3">
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Actual DLT Payload Sent
      </summary>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Shape sent to Fast2SMS on the DLT route. OTP segments are masked when present.
      </p>
      <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-relaxed">
        {JSON.stringify(maskedPayload, null, 2)}
      </pre>
    </details>
  );
}

function ExecutionResultPanel({ result, liveMode }: { result: TemplateExecutionResult; liveMode: boolean }) {
  const providerLabel =
    result.provider?.name === 'fast2sms'
      ? 'Fast2SMS'
      : result.provider?.name ?? null;

  return (
    <section className="flex min-h-[280px] flex-col rounded-lg border">
      <div className="border-b px-3 py-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Execution result</h4>
        <p className="text-[11px] text-muted-foreground">
          {liveMode ? 'Live DLT — real backend API call' : 'Dry Run — validation and preview only'}
        </p>
      </div>
      {result.status === 'idle' ? (
        <p className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
          Run Execute Test to see results here.
        </p>
      ) : (
        <div className="space-y-3 p-3">
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-muted-foreground">HTTP Status</dt>
              <dd className={cn('font-mono font-semibold', result.status === 'fail' && 'text-red-600 dark:text-red-400')}>
                {result.httpStatus ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Delivery Mode</dt>
              <dd className="font-mono">{result.deliveryMode || '—'}</dd>
            </div>
            {result.errorCode ? (
              <div className="col-span-2">
                <dt className="text-muted-foreground">Error Code</dt>
                <dd className="font-mono text-red-600 dark:text-red-400">{result.errorCode}</dd>
              </div>
            ) : null}
            {providerLabel ? (
              <div className="col-span-2">
                <dt className="text-muted-foreground">Provider</dt>
                <dd className="font-mono">{providerLabel}</dd>
              </div>
            ) : null}
            {result.provider?.status != null ? (
              <div>
                <dt className="text-muted-foreground">Provider Status</dt>
                <dd className="font-mono">{result.provider.status}</dd>
              </div>
            ) : null}
            {result.provider?.message ? (
              <div className={result.provider?.status != null ? '' : 'col-span-2'}>
                <dt className="text-muted-foreground">Provider Response</dt>
                <dd className="font-mono text-red-600 dark:text-red-400">{result.provider.message}</dd>
              </div>
            ) : null}
            <div className="col-span-2">
              <dt className="text-muted-foreground">Request ID</dt>
              <dd className="font-mono break-all">{result.requestId ?? '—'}</dd>
            </div>
          </dl>
          {result.errorMessage && !result.provider?.message ? (
            <p className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              {result.errorMessage}
            </p>
          ) : null}
          <details className="rounded-md border">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground">
              Full API response JSON
            </summary>
            <pre className="max-h-[320px] overflow-auto border-t bg-muted/30 p-3 font-mono text-[11px]">
              {result.responseJson || '—'}
            </pre>
          </details>
        </div>
      )}
    </section>
  );
}
