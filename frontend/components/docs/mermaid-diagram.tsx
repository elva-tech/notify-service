'use client';

import { useEffect, useId, useState } from 'react';
import { useTheme } from 'next-themes';
import { sanitizeMermaidChart } from '@/lib/mermaid-sanitize';

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = useId().replace(/:/g, '');
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return undefined;
    }

    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        const normalized = sanitizeMermaidChart(chart);
        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose',
        });
        const chartKey = Array.from(normalized).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
        const renderId = `mermaid-${id}-${chartKey}`;
        const { svg: rendered } = await mermaid.render(renderId, normalized);

        if (rendered.includes('Syntax error in text') || rendered.includes('aria-roledescription="error"')) {
          throw new Error('Mermaid syntax error — check diagram source in docs markdown');
        }

        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
          setSvg(null);
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart, id, mounted, resolvedTheme]);

  if (error) {
    return (
      <div className="my-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
        <p className="mb-2 text-sm font-medium text-destructive">Mermaid render error</p>
        <pre className="overflow-x-auto text-xs text-muted-foreground">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-6 h-40 animate-pulse rounded-lg border bg-muted/40" aria-hidden />
    );
  }

  return (
    <div
      className="my-6 overflow-x-auto rounded-lg border bg-background p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
