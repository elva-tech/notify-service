import { formatValidationRules } from '@/lib/platform-api';
import type { TemplateVariable } from '@/lib/business-config-types';

interface VariableTableProps {
  variables: TemplateVariable[];
}

export function VariableTable({ variables }: VariableTableProps) {
  const sorted = [...variables].sort((a, b) => a.position - b.position);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Position</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-left font-medium">Required</th>
            <th className="px-4 py-3 text-left font-medium">Validation rules</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((variable) => (
            <tr key={`${variable.name}-${variable.position}`} className="border-b last:border-0">
              <td className="px-4 py-3 font-mono">{variable.name}</td>
              <td className="px-4 py-3">{variable.position}</td>
              <td className="px-4 py-3">{variable.type}</td>
              <td className="px-4 py-3">{variable.required ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {formatValidationRules(variable).join(' · ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
