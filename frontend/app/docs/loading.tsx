import { RouteLoading } from '@/components/navigation/route-loading';

export default function DocsLoading() {
  return <RouteLoading label="Loading documentation…" hint="MDX pages compile on first visit in dev — please wait." />;
}
