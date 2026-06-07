export interface ProviderFailureDetails {
  name: string;
  status: number | null;
  message: string | null;
  code?: string | null;
  response?: unknown;
}

export interface TemplateExecutionResult {
  status: 'idle' | 'running' | 'pass' | 'fail' | 'skipped';
  httpStatus: number | null;
  responseJson: string;
  requestId: string | null;
  deliveryMode: string;
  elapsedMs: number | null;
  errorMessage: string | null;
  errorCode?: string | null;
  provider?: ProviderFailureDetails | null;
}

export interface ParsedApiFailure {
  errorCode: string | null;
  errorMessage: string | null;
  requestId: string | null;
  provider: ProviderFailureDetails | null;
}

export function parseApiFailureBody(body: Record<string, unknown>): ParsedApiFailure {
  const providerRaw = body.provider;
  let provider: ProviderFailureDetails | null = null;

  if (providerRaw && typeof providerRaw === 'object' && !Array.isArray(providerRaw)) {
    const record = providerRaw as Record<string, unknown>;
    provider = {
      name: typeof record.name === 'string' ? record.name : 'fast2sms',
      status: typeof record.status === 'number' ? record.status : null,
      message: typeof record.message === 'string' ? record.message : null,
      code: typeof record.code === 'string' ? record.code : null,
      response: record.response,
    };
  }

  return {
    errorCode: typeof body.error === 'string' ? body.error : null,
    errorMessage: typeof body.message === 'string' ? body.message : null,
    requestId: typeof body.requestId === 'string' ? body.requestId : null,
    provider,
  };
}

export function maskDltPayloadVariables(
  payload: Record<string, unknown>,
  maskOtp = true,
): Record<string, unknown> {
  const next = { ...payload };
  if (typeof next.variables_values === 'string' && maskOtp) {
    next.variables_values = next.variables_values
      .split('|')
      .map((segment) => (/^\d{4,8}$/.test(segment) ? '******' : segment))
      .join('|');
  }
  return next;
}
