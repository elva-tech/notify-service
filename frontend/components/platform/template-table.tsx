import Link from 'next/link';
import type { BusinessConfig } from '@/lib/business-config-types';

interface TemplateTableProps {
  business: BusinessConfig;
}

export function TemplateTable({ business }: TemplateTableProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-semibold">Templates</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Template</th>
              <th className="px-4 py-3 text-left font-medium">Message ID</th>
              <th className="px-4 py-3 text-left font-medium">Template ID</th>
              <th className="px-4 py-3 text-left font-medium">Variables</th>
            </tr>
          </thead>
          <tbody>
            {business.templates.map((template) => (
              <tr key={template.templateKey} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/platform/businesses/${business.businessId}/${template.templateKey}`}
                    className="font-mono font-medium text-primary hover:underline"
                  >
                    {template.templateKey}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {template.messageId ?? template.templateId}
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{template.templateId}</td>
                <td className="px-4 py-3">{template.variables.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
