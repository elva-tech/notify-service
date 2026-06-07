import { notFound } from 'next/navigation';
import { fetchPlatformBusiness, fetchPlatformTemplate } from '@/lib/platform-api';
import { TemplateDetails } from '@/components/platform/template-details';

export const dynamic = 'force-dynamic';

interface TemplateDetailPageProps {
  params: Promise<{ businessId: string; templateKey: string }>;
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { businessId, templateKey } = await params;
  const [business, template] = await Promise.all([
    fetchPlatformBusiness(businessId),
    fetchPlatformTemplate(businessId, templateKey),
  ]);

  if (!business || !template) {
    notFound();
  }

  return (
    <TemplateDetails
      businessId={business.businessId}
      displayName={business.displayName}
      template={template}
    />
  );
}
