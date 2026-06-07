'use client';

import { cn } from '@/lib/utils';
import { MethodBadge } from '@/components/api/method-badge';
import type { PlaygroundEndpoint, PlaygroundTab } from '@/lib/playground-config';

interface PlaygroundSidebarProps {
  tabs: PlaygroundTab[];
  activeTab: 'sms' | 'email';
  activeEndpointId: string;
  onTabChange: (tab: 'sms' | 'email') => void;
  onEndpointSelect: (endpointId: string) => void;
  embedded?: boolean;
}

export function PlaygroundSidebar({
  tabs,
  activeTab,
  activeEndpointId,
  onTabChange,
  onEndpointSelect,
  embedded = false,
}: PlaygroundSidebarProps) {
  const tab = tabs.find((item) => item.id === activeTab) ?? tabs[0];

  return (
    <aside className={embedded ? 'space-y-4' : 'hidden space-y-4 lg:block'}>
      <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
              activeTab === item.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <nav className="space-y-5">
        {tab.sections.map((section) => (
          <div key={section.id}>
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.endpoints.map((endpoint) => (
                <SidebarItem
                  key={endpoint.id}
                  endpoint={endpoint}
                  active={activeEndpointId === endpoint.id}
                  onSelect={() => onEndpointSelect(endpoint.id)}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function SidebarItem({
  endpoint,
  active,
  onSelect,
}: {
  endpoint: PlaygroundEndpoint;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-full items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors',
          active
            ? 'border-primary/50 bg-primary/5 text-foreground'
            : 'border-transparent hover:border-border hover:bg-muted/50',
        )}
      >
        <MethodBadge method={endpoint.method} className="mt-0.5 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate font-mono text-xs font-medium">{endpoint.path}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{endpoint.title.replace(/^POST /, '')}</span>
        </span>
      </button>
    </li>
  );
}
