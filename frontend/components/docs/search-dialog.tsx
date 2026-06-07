'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { BusinessManifest } from '@/lib/business-config-types';
import type { DocsManifest } from '@/lib/manifest';
import type { OpenApiManifest } from '@/lib/openapi-loader';
import { startNavigationProgress } from '@/lib/navigation-progress-events';
import { searchAll } from '@/lib/unified-search';

interface SearchDialogProps {
  docsManifest: DocsManifest;
  openApiManifest: OpenApiManifest;
  businessManifest?: BusinessManifest | null;
}

export function SearchDialog({
  docsManifest,
  openApiManifest,
  businessManifest: initialManifest = null,
}: SearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [businessManifest, setBusinessManifest] = useState<BusinessManifest | null>(initialManifest);
  const router = useRouter();

  useEffect(() => {
    if (initialManifest) {
      setBusinessManifest(initialManifest);
      return;
    }

    let cancelled = false;
    import('@/lib/platform-api')
      .then(({ fetchPlatformManifestClient }) => fetchPlatformManifestClient())
      .then((manifest) => {
        if (!cancelled) {
          setBusinessManifest(manifest);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBusinessManifest(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialManifest]);

  function navigateTo(href: string) {
    startNavigationProgress();
    router.push(href);
    setOpen(false);
    setQuery('');
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const results = useMemo(() => {
    if (!businessManifest) {
      return searchAll(docsManifest, openApiManifest, {
        generatedAt: '',
        stats: {
          businessCount: 0,
          templateCount: 0,
          dltTemplateCount: 0,
          variableCount: 0,
          versionCount: 0,
        },
        businesses: [],
        otpMappings: {
          runtime: { globalDltEnabled: false },
          stats: {
            mappingCount: 0,
            businessCount: 0,
            templateCount: 0,
            dltEnabledCount: 0,
            legacyCount: 0,
            dltOnlyCount: 0,
            hybridCount: 0,
            legacyRouteCount: 0,
            retirementPercent: 0,
          },
          mappings: [],
        },
        otpHealth: null,
        businessHealth: null,
      }, query);
    }
    return searchAll(docsManifest, openApiManifest, businessManifest, query);
  }, [docsManifest, openApiManifest, businessManifest, query]);

  return (
    <>
      <Button variant="outline" className="hidden w-56 justify-start text-muted-foreground md:flex" onClick={() => setOpen(true)}>
        <Search className="mr-2 h-4 w-4" />
        Search...
        <kbd className="ml-auto rounded border bg-muted px-1.5 text-[10px]">⌘K</kbd>
      </Button>
      <Button variant="outline" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
        <Search className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <DialogTitle className="sr-only">Search documentation</DialogTitle>
          <DialogDescription className="sr-only">
            Search documentation, API endpoints, and platform configuration.
          </DialogDescription>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search docs, API, platform..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {results.some((r) => r.kind === 'doc') ? (
                <CommandGroup heading="Documentation">
                  {results
                    .filter((r) => r.kind === 'doc')
                    .map((result) => (
                      <CommandItem
                        key={`doc-${result.slug}`}
                        value={result.title}
                        onSelect={() => navigateTo(result.href)}
                      >
                        <div>
                          <div className="font-medium">{result.title}</div>
                          <div className="text-xs text-muted-foreground">{result.snippet}</div>
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              ) : null}
              {results.some((r) => r.kind === 'api') ? (
                <CommandGroup heading="API Endpoints">
                  {results
                    .filter((r) => r.kind === 'api')
                    .map((result) => (
                      <CommandItem
                        key={`api-${result.slug}`}
                        value={result.title}
                        onSelect={() => navigateTo(result.href)}
                      >
                        <div>
                          <div className="font-medium">{result.title}</div>
                          <div className="text-xs text-muted-foreground">{result.snippet}</div>
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              ) : null}
              {results.some((r) => r.kind === 'business' || r.kind === 'template' || r.kind === 'otp-mapping') ? (
                <CommandGroup heading="Platform">
                  {results
                    .filter((r) => r.kind === 'business' || r.kind === 'template' || r.kind === 'otp-mapping')
                    .map((result) => (
                      <CommandItem
                        key={`platform-${result.kind}-${result.href}`}
                        value={result.title}
                        onSelect={() => navigateTo(result.href)}
                      >
                        <div>
                          <div className="font-medium">{result.title}</div>
                          <div className="text-xs text-muted-foreground">{result.snippet}</div>
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
