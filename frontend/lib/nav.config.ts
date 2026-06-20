export interface NavItem {
  title: string;
  slug: string | null;
  href?: string;
  disabled?: boolean;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/** Sidebar navigation — keep in sync with scripts/generate-manifest.mjs NAV_ITEMS */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'End-to-End Integration Guide', slug: 'getting-started/end-to-end-integration-guide' },
    ],
  },
  {
    title: 'Architecture',
    items: [
      { title: 'Overview', slug: 'architecture/overview' },
      { title: 'Request Lifecycle', slug: 'architecture/request-lifecycle' },
      { title: 'DLT Layer', slug: 'architecture/dlt-layer' },
      { title: 'OTP DLT Migration', slug: 'architecture/otp-dlt-migration' },
      { title: 'OTP DLT Observability', slug: 'architecture/otp-dlt-observability' },
      { title: 'Business Governance', slug: 'architecture/business-governance' },
    ],
  },
  {
    title: 'API',
    items: [
      { title: 'Authentication', slug: 'api/authentication' },
      { title: 'OTP', slug: 'api/otp' },
      { title: 'Notify', slug: 'api/notify' },
      { title: 'Error Codes', slug: 'api/error-codes' },
      { title: 'OpenAPI Specification', slug: 'api/openapi' },
      { title: 'API Reference (docs)', slug: 'api/reference' },
      { title: 'Interactive API Reference', slug: null, href: '/api-reference' },
    ],
  },
  {
    title: 'Businesses',
    items: [
      { title: 'Business Portal', slug: null, href: '/platform/businesses' },
      { title: 'ApnaKart Templates', slug: 'businesses/apnakart' },
      { title: 'Onboarding Guide', slug: 'businesses/onboarding-guide' },
      { title: 'Configuration Reference', slug: 'businesses/configuration-reference' },
      { title: 'Validation Rules', slug: 'businesses/validation-rules' },
    ],
  },
  {
    title: 'Runbooks',
    items: [
      { title: 'OTP DLT Outage', slug: 'runbooks/otp-dlt-outage' },
      { title: 'OTP DLT Rollback', slug: 'runbooks/otp-dlt-rollback' },
      { title: 'OTP DLT Rollout', slug: 'runbooks/otp-dlt-rollout' },
      { title: 'OTP DLT Log Triage', slug: 'runbooks/otp-dlt-log-triage' },
      { title: 'OTP DLT Retirement Readiness', slug: 'runbooks/otp-dlt-retirement-readiness' },
      { title: 'Business Onboarding', slug: 'runbooks/business-onboarding' },
      { title: 'Business Validation Failure', slug: 'runbooks/business-validation-failure' },
    ],
  },
];

export const DOCS_HOME = {
  title: 'Documentation Home',
  slug: '',
};

export function getNavFlatItems(): Array<{ title: string; slug: string }> {
  const items: Array<{ title: string; slug: string }> = [
    { title: DOCS_HOME.title, slug: DOCS_HOME.slug },
  ];

  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.slug && !item.disabled) {
        items.push({ title: item.title, slug: item.slug });
      }
    }
  }

  return items;
}

export function slugToSourcePath(slug: string): string {
  if (!slug) {
    return 'README.md';
  }
  return `${slug.replace(/\//g, '/')}.md`;
}

export function findSectionTitleForSlug(slug: string): string | null {
  for (const section of NAV_SECTIONS) {
    if (section.items.some((item) => item.slug === slug)) {
      return section.title;
    }
  }

  if (slug.startsWith('runbooks/')) return 'Runbooks';
  if (slug.startsWith('architecture/')) return 'Architecture';
  if (slug.startsWith('api/')) return 'API';
  if (slug.startsWith('businesses/')) return 'Businesses';

  return null;
}
