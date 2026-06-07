'use client';

import { useEffect, useState } from 'react';
import type { BusinessManifest } from '@/lib/business-config-types';
import { fetchPlatformManifestClient } from '@/lib/platform-api';

export function usePlatformManifest(initial: BusinessManifest | null = null) {
  const [manifest, setManifest] = useState<BusinessManifest | null>(initial);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setManifest(initial);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchPlatformManifestClient()
      .then((data) => {
        if (!cancelled) {
          setManifest(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load platform metadata');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initial]);

  return { manifest, loading, error };
}
