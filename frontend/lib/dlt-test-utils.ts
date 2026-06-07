import type { BusinessTemplate, TemplateVariable } from './business-config-types';

/** Variables populated by the server at runtime (never shown in playground forms). */
export function isServerGeneratedVariable(name: string): boolean {
  return name === 'otp';
}

export function isOtpTemplate(template: BusinessTemplate): boolean {
  return template.variables.some((variable) => variable.name === 'otp');
}

export function getDeliveryType(template: BusinessTemplate): 'OTP DLT' | 'Notify DLT' {
  return isOtpTemplate(template) ? 'OTP DLT' : 'Notify DLT';
}

export function getSuiteApiPath(template: BusinessTemplate): '/otp/send' | '/notify' {
  return isOtpTemplate(template) ? '/otp/send' : '/notify';
}

export function getFormVariables(template: BusinessTemplate): TemplateVariable[] {
  return template.variables.filter((variable) => !isServerGeneratedVariable(variable.name));
}

export function buildDefaultVariableValues(template: BusinessTemplate): Record<string, string> {
  const values: Record<string, string> = {};
  for (const variable of template.variables) {
    if (isServerGeneratedVariable(variable.name)) {
      values[variable.name] = '<generated>';
    } else {
      values[variable.name] = buildExampleVariableValue(variable);
    }
  }
  return values;
}

function buildExampleVariableValue(variable: TemplateVariable): string {
  switch (variable.type) {
    case 'numeric':
      return '1'.repeat(variable.length ?? 6);
    default:
      return buildExampleStringValue(variable.name);
  }
}

function buildExampleStringValue(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('customer')) return 'Arun';
  if (lower.includes('business')) return 'eNandi';
  if (lower.includes('order')) return 'ORD-2026-001';
  if (lower.includes('login')) return '7488';
  return 'sample-value';
}

export function buildVariablesPipe(
  template: BusinessTemplate,
  values: Record<string, string>,
  otpPlaceholder = '<generated>',
): string {
  return [...template.variables]
    .sort((a, b) => a.position - b.position)
    .map((variable) => {
      if (isServerGeneratedVariable(variable.name)) {
        return values[variable.name] && values[variable.name] !== '<generated>'
          ? values[variable.name]
          : otpPlaceholder;
      }
      return values[variable.name] ?? '';
    })
    .join('|');
}

export interface ResolvedVariableRow {
  name: string;
  position: number;
  value: string;
  masked: boolean;
}

export function buildResolvedVariableRows(
  template: BusinessTemplate,
  values: Record<string, string>,
): ResolvedVariableRow[] {
  return [...template.variables]
    .sort((a, b) => a.position - b.position)
    .map((variable) => {
      const isOtp = isServerGeneratedVariable(variable.name);
      const raw = values[variable.name] ?? '';
      const value = isOtp ? (raw && raw !== '<generated>' ? raw : '<generated>') : raw;
      return {
        name: variable.name,
        position: variable.position,
        value,
        masked: isOtp,
      };
    });
}

export interface Fast2SmsPreview {
  route: 'dlt';
  sender_id: string;
  message: string;
  messageId: string;
  entity_id: string;
  variables_values: string;
  numbers: string;
}

export function buildFast2SmsPreview(
  template: BusinessTemplate,
  values: Record<string, string>,
  phone: string,
): Fast2SmsPreview {
  const messageId = template.messageId ?? template.templateId;
  return {
    route: 'dlt',
    sender_id: template.senderId,
    message: messageId,
    messageId,
    entity_id: template.entityId,
    variables_values: buildVariablesPipe(template, values),
    numbers: phone,
  };
}

export function resolveDeliveryMode(
  appId: string,
  template: BusinessTemplate,
  otpMappings: Array<{
    appId: string;
    businessId: string;
    templateKey: string;
    deliveryMode?: string;
    legacyRouteEnabled?: boolean;
    fallbackAllowed?: boolean;
    dltEnabled?: boolean;
  }> = [],
  globalDltEnabled = false,
): string {
  if (!isOtpTemplate(template)) {
    return 'notify_dlt';
  }

  const mapping = otpMappings.find((entry) => entry.appId === appId.trim());
  if (!mapping) {
    return 'unknown';
  }

  if (globalDltEnabled && mapping.dltEnabled) {
    if (!mapping.legacyRouteEnabled && !mapping.fallbackAllowed) {
      return 'dlt_only';
    }
    if (mapping.legacyRouteEnabled || mapping.fallbackAllowed) {
      return 'hybrid';
    }
    return mapping.deliveryMode ?? 'dlt';
  }

  return 'legacy_q';
}

export function buildSuiteRequestPayload(
  businessId: string,
  template: BusinessTemplate,
  options: {
    appId: string;
    apiKey: string;
    phone: string;
    variables: Record<string, string>;
  },
): Record<string, unknown> {
  const { appId, apiKey, phone, variables } = options;

  if (isOtpTemplate(template)) {
    const body: Record<string, unknown> = {
      appId: appId.trim(),
      apiKey: apiKey.trim(),
      phone: phone.trim(),
    };
    for (const variable of getFormVariables(template)) {
      const value = variables[variable.name]?.trim();
      if (value) {
        body[variable.name] = value;
      }
    }
    return body;
  }

  const notifyVariables: Record<string, string> = {};
  for (const variable of getFormVariables(template)) {
    notifyVariables[variable.name] = variables[variable.name] ?? '';
  }

  return {
    appId: appId.trim(),
    apiKey: apiKey.trim(),
    channel: 'SMS',
    to: [phone.trim()],
    templateKey: template.templateKey,
    variables: notifyVariables,
  };
}

export function buildSuiteCurl(
  baseUrl: string,
  template: BusinessTemplate,
  payload: Record<string, unknown>,
): string {
  const path = getSuiteApiPath(template);
  const compact = JSON.stringify(payload);
  return `curl -X POST ${baseUrl}${path} \\
  -H "Content-Type: application/json" \\
  -d '${compact}'`;
}

function matchesPattern(value: string, pattern: string): boolean {
  try {
    return new RegExp(pattern).test(value);
  } catch {
    return true;
  }
}

export function validateTemplateVariables(
  template: BusinessTemplate,
  values: Record<string, string>,
): { ok: true } | { ok: false; message: string } {
  for (const variable of getFormVariables(template)) {
    const raw = values[variable.name];
    const value = typeof raw === 'string' ? raw.trim() : '';

    if (variable.required && !value) {
      return { ok: false, message: `Missing required variable: ${variable.name}` };
    }

    if (!value) continue;

    if (variable.maxLength != null && value.length > variable.maxLength) {
      return { ok: false, message: `Variable "${variable.name}" exceeds maxLength ${variable.maxLength}` };
    }

    if (variable.length != null && value.length !== variable.length) {
      return { ok: false, message: `Variable "${variable.name}" must be exactly ${variable.length} characters` };
    }

    if (variable.pattern && !matchesPattern(value, variable.pattern)) {
      return { ok: false, message: `Variable "${variable.name}" must match pattern ${variable.pattern}` };
    }

    if (variable.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return { ok: false, message: `Variable "${variable.name}" must match YYYY-MM-DD` };
    }

    if (variable.type === 'datetime' && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) {
      return { ok: false, message: `Variable "${variable.name}" must match YYYY-MM-DD HH:mm` };
    }

    if (variable.type === 'time' && !/^\d{2}:\d{2}$/.test(value)) {
      return { ok: false, message: `Variable "${variable.name}" must match HH:mm` };
    }

    if (variable.type === 'numeric' && variable.digitsOnly && !/^\d+$/.test(value)) {
      return { ok: false, message: `Variable "${variable.name}" must be numeric` };
    }
  }

  return { ok: true };
}

export function sortTemplatesForSuite(templates: BusinessTemplate[]): BusinessTemplate[] {
  return [...templates].sort((a, b) => {
    const aOtp = isOtpTemplate(a) ? 1 : 0;
    const bOtp = isOtpTemplate(b) ? 1 : 0;
    if (aOtp !== bOtp) {
      return aOtp - bOtp;
    }
    return a.templateKey.localeCompare(b.templateKey);
  });
}

export function searchMatchesTemplate(template: BusinessTemplate, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const messageId = template.messageId ?? template.templateId;
  return (
    template.templateKey.toLowerCase().includes(q) ||
    template.purpose.toLowerCase().includes(q) ||
    template.templateId.toLowerCase().includes(q) ||
    messageId.toLowerCase().includes(q)
  );
}

export function suiteTemplateAnchorId(businessId: string, templateKey: string): string {
  return `dlt-suite-${businessId}-${templateKey}`;
}
