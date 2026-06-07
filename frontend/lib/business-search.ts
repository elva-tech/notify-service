import type { BusinessManifest } from './business-config-types';

export interface BusinessSearchResult {
  title: string;
  href: string;
  snippet: string;
  kind: 'business' | 'template' | 'otp-mapping';
  businessId: string;
  templateKey?: string;
  appId?: string;
}

export function searchBusinessManifest(
  manifest: BusinessManifest,
  query: string,
  limit = 8,
): BusinessSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }

  const results: BusinessSearchResult[] = [];

  for (const business of manifest.businesses) {
    const businessHaystack = `${business.businessId} ${business.displayName} ${business.version} ${business.dlt.defaultSenderId} ${business.dlt.entityId} ${business.readinessStatus ?? ''} ${business.validationStatus ?? ''} production draft ready invalid missing dlt onboarding ${business.searchText}`.toLowerCase();
    if (businessHaystack.includes(q)) {
      results.push({
        title: business.displayName,
        href: `/platform/businesses/${business.businessId}`,
        snippet: `${business.businessId} · v${business.version.replace(/^v/, '')} · ${business.templates.length} templates`,
        kind: 'business',
        businessId: business.businessId,
      });
    }

    for (const template of business.templates) {
      const templateHaystack = `${template.templateKey} ${template.purpose} ${template.templateId} ${template.senderId} ${template.entityId} ${business.readinessStatus ?? ''} production draft missing dlt ${template.searchText}`.toLowerCase();
      if (templateHaystack.includes(q)) {
        results.push({
          title: `${template.templateKey}`,
          href: `/platform/businesses/${business.businessId}/${template.templateKey}`,
          snippet: `${business.displayName} · DLT ${template.templateId}`,
          kind: 'template',
          businessId: business.businessId,
          templateKey: template.templateKey,
        });
      }
    }
  }

  if (manifest.otpMappings?.mappings) {
    for (const mapping of manifest.otpMappings.mappings) {
      const haystack = `${mapping.appId} ${mapping.businessId} ${mapping.displayName} ${mapping.templateKey} ${mapping.templateId} ${mapping.senderId} ${mapping.entityId} otp ${mapping.deliveryMode} ${mapping.deliveryPolicy} ${mapping.retirementStatus} dlt_only hybrid fully retired ${mapping.dltEnabled ? 'dltEnabled' : 'legacy'} ${mapping.fallbackAllowed ? 'fallback-enabled' : 'fallback-disabled'} otp_dlt_fallback otp_dlt_hard_failure otp_delivery_completed otp_verify_outcome runbook observability rollout-ready retirement ${mapping.searchText}`.toLowerCase();
      if (haystack.includes(q)) {
        results.push({
          title: `OTP: ${mapping.appId}`,
          href: '/platform/otp',
          snippet: `${mapping.businessId} · ${mapping.templateKey} · DLT ${mapping.templateId}`,
          kind: 'otp-mapping',
          businessId: mapping.businessId,
          templateKey: mapping.templateKey,
          appId: mapping.appId,
        });
      }
    }
  }

  return results.slice(0, limit);
}
