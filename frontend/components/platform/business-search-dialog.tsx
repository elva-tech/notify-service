'use client';

import { useMemo, useState } from 'react';
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
import { searchBusinessManifest } from '@/lib/business-search';
import { startNavigationProgress } from '@/lib/navigation-progress-events';

interface BusinessSearchDialogProps {
  manifest: BusinessManifest;
}

export function BusinessSearchDialog({ manifest }: BusinessSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  function navigateTo(href: string) {
    startNavigationProgress();
    router.push(href);
    setOpen(false);
    setQuery('');
  }

  const results = useMemo(() => searchBusinessManifest(manifest, query, 16), [manifest, query]);

  return (
    <>
      <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => setOpen(true)}>
        <Search className="mr-2 h-4 w-4" />
        Search businesses and templates...
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <DialogTitle className="sr-only">Search platform configuration</DialogTitle>
          <DialogDescription className="sr-only">
            Search businesses, templates, DLT IDs, and sender IDs.
          </DialogDescription>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search businessId, templateKey, templateId..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {results.some((r) => r.kind === 'business') ? (
                <CommandGroup heading="Businesses">
                  {results
                    .filter((r) => r.kind === 'business')
                    .map((result) => (
                      <CommandItem
                        key={`biz-${result.businessId}`}
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
              {results.some((r) => r.kind === 'otp-mapping') ? (
                <CommandGroup heading="OTP Mappings">
                  {results
                    .filter((r) => r.kind === 'otp-mapping')
                    .map((result) => (
                      <CommandItem
                        key={`otp-${result.appId}`}
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
              {results.some((r) => r.kind === 'template') ? (
                <CommandGroup heading="Templates">
                  {results
                    .filter((r) => r.kind === 'template')
                    .map((result) => (
                      <CommandItem
                        key={`tpl-${result.businessId}-${result.templateKey}`}
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
