import type { BusinessManifestStats } from '@/lib/business-config-types';

interface PlatformOverviewProps {
  stats: BusinessManifestStats;
}

const CARDS = [
  { key: 'businessCount', label: 'Businesses' },
  { key: 'templateCount', label: 'Templates' },
  { key: 'dltTemplateCount', label: 'DLT Templates' },
  { key: 'variableCount', label: 'Variables' },
  { key: 'versionCount', label: 'Versions' },
] as const;

export function PlatformOverview({ stats }: PlatformOverviewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {CARDS.map((card) => (
        <div key={card.key} className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-2xl font-bold">{stats[card.key]}</div>
          <div className="text-sm text-muted-foreground">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
