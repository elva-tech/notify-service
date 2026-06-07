import type { BusinessConfig, BusinessManifest, BusinessTemplate } from './business-config-types';
import {
  fetchPlatformBusiness,
  fetchPlatformManifest,
  fetchPlatformTemplate,
  formatValidationRules,
} from './platform-api';

export { formatValidationRules };

/** @deprecated Use fetchPlatformManifest from platform-api */
export async function readBusinessManifest(): Promise<BusinessManifest> {
  return fetchPlatformManifest();
}

export async function getBusinessConfig(businessId: string): Promise<BusinessConfig | undefined> {
  return fetchPlatformBusiness(businessId);
}

export async function getAllBusinessIds(): Promise<string[]> {
  const manifest = await fetchPlatformManifest();
  return manifest.businesses.map((business) => business.businessId);
}

export async function getTemplateConfig(
  businessId: string,
  templateKey: string,
): Promise<BusinessTemplate | undefined> {
  return fetchPlatformTemplate(businessId, templateKey);
}

export async function getAllTemplateParams(): Promise<Array<{ businessId: string; templateKey: string }>> {
  const manifest = await fetchPlatformManifest();
  const params: Array<{ businessId: string; templateKey: string }> = [];

  for (const business of manifest.businesses) {
    for (const template of business.templates) {
      params.push({ businessId: business.businessId, templateKey: template.templateKey });
    }
  }

  return params;
}
