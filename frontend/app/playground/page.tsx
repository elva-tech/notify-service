import { Suspense } from 'react';
import { ApiPlayground } from '@/components/playground/api-playground';

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading playground…</div>}>
      <ApiPlayground />
    </Suspense>
  );
}
