import { ApiOperationPage } from '@/components/api/api-operation-page';
import { getAllOpenApiSlugs } from '@/lib/openapi-loader';

interface ApiSlugPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  return getAllOpenApiSlugs().map((slug) => ({
    slug: slug.split('/'),
  }));
}

export default async function ApiSlugPage({ params }: ApiSlugPageProps) {
  const resolved = await params;
  const slug = resolved.slug.join('/');
  return <ApiOperationPage slug={slug} />;
}
