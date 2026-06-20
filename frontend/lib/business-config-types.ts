export interface BusinessDltConfig {
  entityId: string;
  defaultSenderId: string;
}

export interface TemplateVariable {
  name: string;
  position: number;
  type: string;
  required: boolean;
  pattern?: string;
  length?: number;
  digitsOnly?: boolean;
  maxLength?: number;
  format?: string;
}

export interface BusinessTemplate {
  templateKey: string;
  purpose: string;
  templateId: string;
  messageId: string;
  senderId: string;
  entityId: string;
  variables: TemplateVariable[];
  examplePayload: Record<string, unknown>;
  searchText: string;
}

export type BusinessReadinessStatus = 'Production' | 'Ready' | 'Draft' | 'Invalid';
export type BusinessValidationStatus = 'PASS' | 'WARN' | 'FAIL';

export interface BusinessOnboardingChecklist {
  businessJsonValid: boolean;
  templatesJsonValid: boolean;
  dltMetadataComplete: boolean;
  otpMappingConfigured: boolean;
  productionReady: boolean;
}

export interface BusinessConfig {
  businessId: string;
  displayName: string;
  version: string;
  dlt: BusinessDltConfig;
  templates: BusinessTemplate[];
  searchText: string;
  readinessStatus?: BusinessReadinessStatus;
  validationStatus?: BusinessValidationStatus;
  checklist?: BusinessOnboardingChecklist;
  templateCount?: number;
  otpAppIds?: string[];
}

export interface BusinessHealthEntry {
  businessId: string;
  displayName: string;
  version: string;
  validationStatus: BusinessValidationStatus;
  readinessStatus: BusinessReadinessStatus;
  checklist: BusinessOnboardingChecklist;
  templateCount: number;
  otpAppIds: string[];
  issues: Array<{ level: string; code: string; message: string }>;
  warnings: Array<{ level: string; code: string; message: string }>;
}

export interface BusinessHealthSnapshot {
  generatedAt: string;
  source: string;
  businessCount: number;
  healthyBusinesses: number;
  draftBusinesses: number;
  productionBusinesses: number;
  businesses: BusinessHealthEntry[];
  globalIssues: Array<{ level: string; code: string; message: string }>;
}

export interface BusinessManifestStats {
  businessCount: number;
  templateCount: number;
  dltTemplateCount: number;
  variableCount: number;
  versionCount: number;
}

export interface BrandRegistryEntry {
  brandId: string;
  status: 'active' | 'suspended' | 'pending';
  brandName: string;
  businessModule: string;
  templates: {
    otp: string[];
    notify: string[];
  };
  otpPolicy: {
    templateKey: string;
    dltEnabled: boolean;
    legacyRouteEnabled: boolean;
  };
  approvedAt: string | null;
  searchText: string;
}

export interface BrandRegistrySection {
  generatedAt: string;
  stats: {
    brandCount: number;
    activeCount: number;
  };
  brands: BrandRegistryEntry[];
}

export interface OtpMappingEntry {
  appId: string;
  businessId: string;
  displayName: string;
  templateKey: string;
  templateId: string;
  messageId: string;
  senderId: string;
  entityId: string;
  purpose: string;
  variables: TemplateVariable[];
  dltEnabled: boolean;
  legacyRouteEnabled: boolean;
  fallbackAllowed: boolean;
  deliveryPolicy: 'dlt_only' | 'hybrid' | 'legacy_q';
  deliveryMode: 'dlt' | 'dlt_only' | 'legacy_q';
  retirementStatus: 'Fully Retired' | 'Hybrid' | 'Legacy';
  rolloutReady: boolean;
  dltMetadataComplete: boolean;
  activeDlt: boolean;
  searchText: string;
}

export interface OtpMappingsSection {
  runtime: {
    globalDltEnabled: boolean;
  };
  stats: {
    mappingCount: number;
    businessCount: number;
    templateCount: number;
    dltEnabledCount: number;
    legacyCount: number;
    dltOnlyCount: number;
    hybridCount: number;
    legacyRouteCount: number;
    retirementPercent: number;
  };
  mappings: OtpMappingEntry[];
}

export interface OtpHealthConfigHealth {
  status: 'healthy' | 'degraded';
  mappingsValid: boolean;
  businessRegistryHealthy: boolean;
  templatesValid: boolean;
  dltMetadataComplete: boolean;
  startupValidation: string;
}

export interface OtpHealthRetirementCheck {
  id: string;
  label: string;
  verification: 'manual' | 'config';
  description?: string;
}

export interface OtpHealthRetirementReadiness {
  configChecks: Record<string, boolean>;
  configReady: boolean;
  unmappedCredentialApps: string[];
  logChecksManual: OtpHealthRetirementCheck[];
  readyForRetirement: boolean;
  note: string;
}

export interface OtpHealthRetirement {
  retiredApps: number;
  hybridApps: number;
  legacyApps: number;
  retirementPercent: number;
  retiredAppIds: string[];
  hybridAppIds: string[];
  legacyAppIds: string[];
}

export interface OtpHealthSnapshot {
  generatedAt: string;
  source: string;
  globalDltEnabled: boolean;
  stats: {
    mappingCount: number;
    dltEnabledCount: number;
    legacyCount: number;
    activeDltCount: number;
    rolloutReadyCount: number;
    dltMetadataCompleteCount: number;
    dltDeliveryPercent: number;
    credentialAppCount: number;
    dltOnlyCount?: number;
    hybridCount?: number;
  };
  configHealth: OtpHealthConfigHealth;
  retirement: OtpHealthRetirement;
  retirementReadiness: OtpHealthRetirementReadiness;
  deliveryBreakdown: {
    dlt_only: number;
    hybrid: number;
    legacy_q: number;
  };
}

export interface BusinessManifest {
  generatedAt: string;
  stats: BusinessManifestStats;
  businesses: BusinessConfig[];
  brands: BrandRegistrySection;
  otpMappings: OtpMappingsSection;
  otpHealth: OtpHealthSnapshot | null;
  businessHealth: BusinessHealthSnapshot | null;
}
