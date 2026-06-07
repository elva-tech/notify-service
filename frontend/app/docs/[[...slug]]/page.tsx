import { DocPage } from '@/components/docs/doc-page';
import { getAllManifestSlugs } from '@/lib/manifest';

interface DocSlugPageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateStaticParams() {
  return getAllManifestSlugs().map((slug) => ({
    slug: slug.length > 0 ? slug.split('/') : [],
  }));
}

export default async function DocSlugPage({ params }: DocSlugPageProps) {
  const resolved = await params;
  const slug = resolved.slug?.join('/') ?? '';
  return <DocPage slug={slug} />;
}
