'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BusinessConfig, BusinessManifest } from '@/lib/business-config-types';
import { fetchPlatformManifestClient } from '@/lib/platform-api';
import { DltTestSuite } from '@/components/playground/dlt-test-suite';

const PHONE_KEY = 'elva-dlt-suite-phone';

interface DltTestSuiteLoaderProps {
  appId: string;
  apiKey: string;
  brandId: string;
  baseUrl: string;
  phone: string;
  onPhoneChange: (phone: string) => void;
  initialBusinessId?: string;
  initialTemplateSearch?: string;
}

export function DltTestSuiteLoader({
  appId,
  apiKey,
  brandId,
  baseUrl,
  phone,
  onPhoneChange,
  initialBusinessId = '',
  initialTemplateSearch = '',
}: DltTestSuiteLoaderProps) {
  const [manifest, setManifest] = useState<BusinessManifest | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState(initialBusinessId);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPlatformManifestClient()
      .then((data) => {
        if (cancelled) return;
        setManifest(data);
        setSelectedBusinessId((current) => {
          if (current) return current;
          if (initialBusinessId && data.businesses.some((b) => b.businessId === initialBusinessId)) {
            return initialBusinessId;
          }
          return data.businesses[0]?.businessId ?? '';
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load template groups');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialBusinessId]);

  const selectedBusiness = useMemo(
    () => manifest?.businesses.find((business) => business.businessId === selectedBusinessId),
    [manifest, selectedBusinessId],
  );

  const activeBrands = useMemo(
    () => (manifest?.brands.brands ?? []).filter((brand) => brand.status === 'active'),
    [manifest],
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading template groups from backend…</p>;
  }

  if (error || !manifest) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
        {error ?? 'Unable to load platform metadata. Is the backend running?'}
      </p>
    );
  }

  if (manifest.businesses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No template groups registered. Add <code>backend/config/businesses/&lt;id&gt;/</code> and restart the backend.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block max-w-md space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Template Group</span>
        <select
          className="h-10 w-full rounded-md border bg-background px-3 font-mono text-sm outline-none ring-primary focus:ring-2"
          value={selectedBusinessId}
          onChange={(event) => setSelectedBusinessId(event.target.value)}
        >
          {manifest.businesses.map((business: BusinessConfig) => (
            <option key={business.businessId} value={business.businessId}>
              {business.displayName} ({business.businessId})
            </option>
          ))}
        </select>
      </label>

      {selectedBusiness ? (
        <DltTestSuite
          business={selectedBusiness}
          brands={activeBrands}
          globalDltEnabled={manifest.otpMappings.runtime.globalDltEnabled}
          appId={appId}
          apiKey={apiKey}
          brandId={brandId}
          baseUrl={baseUrl}
          phone={phone}
          onPhoneChange={onPhoneChange}
          initialSearch={initialTemplateSearch}
        />
      ) : null}
    </div>
  );
}

export { PHONE_KEY as DLT_SUITE_PHONE_KEY };
