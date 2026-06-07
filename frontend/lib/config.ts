const DEFAULT_API_BASE_URL = 'http://localhost:4000';

/** Single source of truth for backend API origin (set via NEXT_PUBLIC_API_BASE_URL). */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/$/, '');

export type ApiEnvironmentLabel = 'Development' | 'Production';

export function getApiEnvironmentLabel(url: string = API_BASE_URL): ApiEnvironmentLabel {
  return /localhost|127\.0\.0\.1/i.test(url) ? 'Development' : 'Production';
}
