import { API_BASE_URL } from './config';
import type {
  BusinessConfig,
  BusinessManifest,
  BusinessTemplate,
  OtpHealthSnapshot,
  OtpMappingsSection,
} from './business-config-types';

interface PlatformBusinessesResponse {
  success: boolean;
  generatedAt: string;
  stats: BusinessManifest['stats'];
  businesses: BusinessConfig[];
  businessHealth: BusinessManifest['businessHealth'];
}

interface PlatformOtpResponse {
  success: boolean;
  generatedAt: string;
  otpMappings: OtpMappingsSection;
  otpHealth: OtpHealthSnapshot | null;
}

interface PlatformBusinessResponse {
  success: boolean;
  business: BusinessConfig;
}

interface PlatformTemplateResponse {
  success: boolean;
  businessId: string;
  displayName: string;
  version: string;
  dlt: BusinessConfig['dlt'];
  template: BusinessTemplate;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Platform API ${path} failed: HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchPlatformBusinesses(): Promise<PlatformBusinessesResponse> {
  return fetchJson<PlatformBusinessesResponse>('/platform/businesses');
}

export async function fetchPlatformBusiness(businessId: string): Promise<BusinessConfig | undefined> {
  try {
    const data = await fetchJson<PlatformBusinessResponse>(`/platform/businesses/${businessId}`);
    return data.business;
  } catch {
    return undefined;
  }
}

export async function fetchPlatformTemplates(businessId: string): Promise<BusinessTemplate[]> {
  try {
    const data = await fetchJson<{ templates: BusinessTemplate[] }>(
      `/platform/businesses/${businessId}/templates`,
    );
    return data.templates;
  } catch {
    return [];
  }
}

export async function fetchPlatformTemplate(
  businessId: string,
  templateKey: string,
): Promise<BusinessTemplate | undefined> {
  try {
    const data = await fetchJson<PlatformTemplateResponse>(
      `/platform/businesses/${businessId}/templates/${templateKey}`,
    );
    return data.template;
  } catch {
    return undefined;
  }
}

export async function fetchPlatformOtpMetadata(): Promise<PlatformOtpResponse> {
  return fetchJson<PlatformOtpResponse>('/platform/otp');
}

export async function fetchPlatformManifest(): Promise<BusinessManifest> {
  const [businesses, otp] = await Promise.all([fetchPlatformBusinesses(), fetchPlatformOtpMetadata()]);

  return {
    generatedAt: businesses.generatedAt,
    stats: businesses.stats,
    businesses: businesses.businesses,
    businessHealth: businesses.businessHealth,
    otpMappings: otp.otpMappings,
    otpHealth: otp.otpHealth,
  };
}

export function formatValidationRules(variable: BusinessTemplate['variables'][number]): string[] {
  const rules: string[] = [`type: ${variable.type}`, `required: ${variable.required}`];
  if (variable.length != null) rules.push(`length: ${variable.length}`);
  if (variable.maxLength != null) rules.push(`maxLength: ${variable.maxLength}`);
  if (variable.pattern) rules.push(`pattern: ${variable.pattern}`);
  if (variable.format) rules.push(`format: ${variable.format}`);
  if (variable.digitsOnly) rules.push('digitsOnly: true');
  return rules;
}

/** Client-side fetch for interactive views (playground, search). */
export async function fetchPlatformManifestClient(): Promise<BusinessManifest> {
  return fetchPlatformManifest();
}
